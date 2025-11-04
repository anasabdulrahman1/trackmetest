# Supabase backend

## Daily rollover scheduling (secure)

Avoid embedding service role keys and hard-coded URLs in SQL migrations. Instead:

- Store secrets in a secure store (e.g., Supabase Vault or your CI secret manager).
- Schedule the `subscription-rollover` Edge Function from outside migrations (CI/CD, Ops runbook) and inject the `Authorization: Bearer <service-role>` header at runtime.
- If you must use `pg_cron`, prefer setting config values (e.g., `app.edge_url`) and read them in the scheduling statement. Do not commit the service role JWT to the repo.

Example external scheduler POST:

```bash
curl -X POST "https://<project>.supabase.co/functions/v1/subscription-rollover" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

## RLS summary

- `public.subscriptions`: SELECT/INSERT/UPDATE/DELETE restricted to `auth.uid() = user_id`.
- `public.profiles`: SELECT restricted to `auth.uid() = id`.
- `public.devices`: All operations restricted to `auth.uid() = user_id`.

## Enums and constraints
## Push Reminders (Edge Function)

- Function: `send-reminders` (HTTP v1 FCM)
- Secrets required:
  - `GOOGLE_SERVICE_ACCOUNT_JSON` (full JSON string)
  - `SUPABASE_SERVICE_ROLE_KEY` (provided by platform)

Local test (example):

```bash
supabase functions serve send-reminders \
  --env GOOGLE_SERVICE_ACCOUNT_JSON="$(cat path/to/sa.json)" \
  --no-verify-jwt
```

Schedule hourly in Supabase Dashboard → Functions → Schedules, or use an external scheduler to POST the function endpoint.

- `billing_cycle` is an enum: `monthly | quarterly | yearly | trial`.

