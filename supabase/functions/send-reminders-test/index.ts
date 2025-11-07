// TEST VERSION: send-reminders without time window restriction
// This version will send reminders at any time for testing purposes

import { createClient } from 'npm:@supabase/supabase-js@2';
import { SignJWT, importPKCS8 } from 'npm:jose';
import { DateTime } from 'npm:luxon';

type ServiceAccount = {
  type: 'service_account';
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
};

async function getGoogleAccessToken(sa: ServiceAccount, scope: string): Promise<string> {
  const privateKey = await importPKCS8(sa.private_key, 'RS256');
  const now = Math.floor(Date.now() / 1000);
  const jwt = await new SignJWT({ scope })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(sa.client_email)
    .setSubject(sa.client_email)
    .setAudience(sa.token_uri)
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(privateKey);

  const body = new URLSearchParams();
  body.append('grant_type', 'urn:ietf:params:oauth:grant-type:jwt-bearer');
  body.append('assertion', jwt);

  const res = await fetch(sa.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return json.access_token as string;
}

function parseOffsets(reminderPeriod?: string | null): number[] {
  if (!reminderPeriod) return [1, 3, 7];
  return reminderPeriod
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n >= 0 && n <= 365)
    .slice(0, 12);
}

Deno.serve(async (_req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON') ?? '';
    if (!supabaseUrl || !supabaseServiceKey) throw new Error('Missing Supabase env');
    if (!serviceAccountJson) throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_JSON secret');

    const sa = JSON.parse(serviceAccountJson) as ServiceAccount;
    const accessToken = await getGoogleAccessToken(
      sa,
      'https://www.googleapis.com/auth/firebase.messaging'
    );

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1) Load candidate subscriptions with user timezones
    const { data: subs, error: subsError } = await supabase
      .from('subscriptions')
      .select(
        'id, user_id, name, next_payment_date, reminder_period, profiles!inner(id, timezone)'
      )
      .eq('status', 'active');
    if (subsError) throw subsError;

    console.log(`Found ${subs?.length ?? 0} active subscriptions`);

    // Group by user
    const userIds = Array.from(new Set((subs ?? []).map((s: any) => s.user_id)));
    const { data: devices, error: devErr } = await supabase
      .from('devices')
      .select('id, user_id, device_token')
      .in('user_id', userIds)
      .eq('logged_in', true);
    if (devErr) throw devErr;

    console.log(`Found ${devices?.length ?? 0} logged-in devices`);

    const userIdToTokens = new Map<string, { id: string; token: string }[]>();
    (devices ?? []).forEach((d) => {
      const list = userIdToTokens.get(d.user_id) ?? [];
      list.push({ id: d.id, token: d.device_token });
      userIdToTokens.set(d.user_id, list);
    });

    // 2) For each subscription, decide if it should be notified now
    const toSend: Array<{
      userId: string;
      subscriptionId: string;
      deviceId: string;
      token: string;
      title: string;
      body: string;
      scheduledFor: string;
      offsetDays: number;
    }> = [];

    for (const s of subs ?? []) {
      const tz = s.profiles?.timezone || 'UTC';
      const nowTz = DateTime.now().setZone(tz);
      
      // TEST VERSION: Remove time window check - send anytime
      console.log(`Checking subscription: ${s.name}, timezone: ${tz}, current hour: ${nowTz.hour}`);

      const todayLocal = nowTz.startOf('day');
      const nextPayment = DateTime.fromISO(String(s.next_payment_date), { zone: tz });
      const daysUntil = Math.floor(nextPayment.diff(todayLocal, 'days').days);
      
      console.log(`  Days until payment: ${daysUntil}`);
      
      const offsets = parseOffsets(s.reminder_period);
      console.log(`  Reminder offsets: ${offsets.join(', ')}`);
      
      if (!offsets.includes(daysUntil)) {
        console.log(`  Skipping - ${daysUntil} not in reminder offsets`);
        continue;
      }

      const tokens = userIdToTokens.get(s.user_id) ?? [];
      if (tokens.length === 0) {
        console.log(`  Skipping - no devices for user`);
        continue;
      }

      // Dedup: check notification_events for same sub+offset+today
      const scheduledFor = todayLocal.plus({ hours: 8 }).toUTC().toISO();
      const { data: existing } = await supabase
        .from('notification_events')
        .select('id')
        .eq('subscription_id', s.id)
        .eq('offset_days', daysUntil)
        .gte('scheduled_for', todayLocal.toUTC().toISO())
        .lte('scheduled_for', todayLocal.plus({ days: 1 }).toUTC().toISO())
        .limit(1)
        .maybeSingle();
      
      if (existing) {
        console.log(`  Skipping - already sent today`);
        continue;
      }

      const title = 'Subscription Reminder';
      const body = `${s.name} is due in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`;

      console.log(`  Will send: "${body}"`);

      for (const t of tokens) {
        toSend.push({
          userId: s.user_id,
          subscriptionId: s.id,
          deviceId: t.id,
          token: t.token,
          title,
          body,
          scheduledFor: scheduledFor!,
          offsetDays: daysUntil,
        });
      }
    }

    console.log(`Total notifications to send: ${toSend.length}`);

    // 3) Send in small batches
    const projectId = sa.project_id;
    const endpoint = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
    let sent = 0, failed = 0;

    for (const job of toSend) {
      const payload = {
        message: {
          token: job.token,
          notification: { title: job.title, body: job.body },
          data: { subscription_id: job.subscriptionId },
        },
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const ok = res.ok;
      const errText = ok ? null : await res.text();

      if (!ok) {
        console.error(`FCM send failed: ${errText}`);
      }

      const { error: insErr } = await supabase.from('notification_events').insert({
        user_id: job.userId,
        subscription_id: job.subscriptionId,
        device_id: job.deviceId,
        scheduled_for: job.scheduledFor,
        sent_at: ok ? new Date().toISOString() : null,
        offset_days: job.offsetDays,
        status: ok ? 'sent' : 'failed',
        error: errText,
      });
      if (insErr) console.error('Log insert error', insErr.message);

      if (ok) sent++; else failed++;
    }

    return new Response(JSON.stringify({ 
      candidates: toSend.length, 
      sent, 
      failed,
      message: 'Test version - no time window restriction'
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (e: any) {
    console.error('Error:', e.message);
    return new Response(JSON.stringify({ error: e.message, stack: e.stack }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
