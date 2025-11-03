import { createClient } from 'npm:@supabase/supabase-js@2';
import { serve } from 'npm:std/server';

// Helper function to calculate the next date
function getNextPaymentDate(currentDate: string, cycle: string): string {
  const date = new Date(currentDate);

  if (cycle === 'monthly') {
    date.setMonth(date.getMonth() + 1);
  } else if (cycle === 'yearly') {
    date.setFullYear(date.getFullYear() + 1);
  } else if (cycle === 'quarterly') {
    date.setMonth(date.getMonth() + 3);
  } else {
    // Default: add a month if unknown
    date.setMonth(date.getMonth() + 1);
  }

  // Return in 'YYYY-MM-DD' format
  return date.toISOString().split('T')[0];
}


serve(async (req) => {
  try {
    // 1. Create a Supabase client with SERVICE_ROLE permissions
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 2. Get today's date in 'YYYY-MM-DD' format
    const today = new Date().toISOString().split('T')[0];

    // 3. Find all 'active' subscriptions where the payment date is in the past
    const { data: subscriptionsToUpdate, error: selectError } = await supabaseAdmin
      .from('subscriptions')
      .select('id, next_payment_date, billing_cycle')
      .eq('status', 'active')
      .lt('next_payment_date', today); // 'lt' means "less than"

    if (selectError) {
      throw selectError;
    }

    if (!subscriptionsToUpdate || subscriptionsToUpdate.length === 0) {
      return new Response(JSON.stringify({ message: 'No subscriptions to update.' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 4. Create an array of all the updates we need to make
    const updates = subscriptionsToUpdate.map(sub => {
      // Keep rolling over until the date is in the future
      let newDate = sub.next_payment_date;
      while (newDate < today) {
        newDate = getNextPaymentDate(newDate, sub.billing_cycle);
      }

      return {
        id: sub.id, // The row to update
        next_payment_date: newDate, // The new future date
      };
    });

    // 5. Send all updates to the database in one go (upsert)
    const { error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .upsert(updates);

    if (updateError) {
      throw updateError;
    }

    // 6. Return a success message
    return new Response(JSON.stringify({ message: `Successfully updated ${updates.length} subscriptions.` }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});