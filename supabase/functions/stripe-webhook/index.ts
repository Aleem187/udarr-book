import Stripe from 'npm:stripe@17.4.0';
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const resendApiKey = Deno.env.get('RESEND_API_KEY');
const RESEND_FROM = 'onboarding@resend.dev';

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  if (!stripeSecretKey || !webhookSecret) {
    console.error('stripe-webhook: STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET is not configured');
    return new Response('Webhook not configured', { status: 500 });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  const rawBody = await req.text();
  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2024-12-18.acacia',
    httpClient: Stripe.createFetchHttpClient(),
  });
  const cryptoProvider = Stripe.createSubtleCryptoProvider();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret, undefined, cryptoProvider);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    console.error('stripe-webhook: signature verification failed', message);
    return new Response(`Webhook signature verification failed: ${message}`, { status: 400 });
  }

  if (event.type !== 'checkout.session.completed') {
    return new Response(JSON.stringify({ received: true, ignored: event.type }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const customerName = session.metadata?.customer_name || 'A customer';
  const amount = session.amount_total != null ? session.amount_total / 100 : 0;
  const currency = session.currency ? session.currency.toUpperCase() : '';
  const paymentTime = new Date(event.created * 1000).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('stripe-webhook: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured — cannot notify staff');
    return new Response(JSON.stringify({ received: true, error: 'Supabase admin credentials missing' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  let recipients: { id: string; name: string; email: string }[] = [];
  try {
    const { data, error: recipientsError } = await supabaseAdmin
      .from('staff_recipients')
      .select('id, name, email');

    if (recipientsError) {
      console.error('stripe-webhook: failed to load staff_recipients', recipientsError);
      return new Response(JSON.stringify({ received: true, error: 'Failed to load staff_recipients' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    recipients = data ?? [];
  } catch (err) {
    console.error('stripe-webhook: staff_recipients query threw', err);
    return new Response(JSON.stringify({ received: true, error: 'staff_recipients query threw' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const title = 'Payment received';
  const message = `${customerName} paid ${currency} ${amount.toFixed(2)} on ${paymentTime}.`;

  for (const recipient of recipients ?? []) {
    let notificationInserted = false;

    try {
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from('notifications')
        .upsert(
          {
            recipient_id: recipient.id,
            title,
            message,
            type: 'payment_received',
            related_payment_id: session.id,
          },
          { onConflict: 'recipient_id,related_payment_id', ignoreDuplicates: true }
        )
        .select('id');

      if (insertError) {
        console.error(`stripe-webhook: DB insert failed for ${recipient.email}`, insertError);
      } else if (!inserted || inserted.length === 0) {
        console.log(`stripe-webhook: notification for ${recipient.email} / session ${session.id} already exists, skipping`);
        continue;
      } else {
        notificationInserted = true;
        console.log(`stripe-webhook: notification row inserted for ${recipient.email}`);
      }
    } catch (dbErr) {
      console.error(`stripe-webhook: DB insert threw for ${recipient.email}`, dbErr);
    }

    if (!notificationInserted) continue;

    if (!resendApiKey) {
      console.error(`stripe-webhook: RESEND_API_KEY not configured, skipping email to ${recipient.email}`);
      continue;
    }

    try {
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: RESEND_FROM,
          to: [recipient.email],
          subject: title,
          html: `<p>Hi ${recipient.name},</p><p>${message}</p>`,
        }),
      });

      if (!emailRes.ok) {
        const errText = await emailRes.text();
        console.error(`stripe-webhook: Resend email failed for ${recipient.email}: ${emailRes.status} ${errText}`);
      } else {
        console.log(`stripe-webhook: email sent to ${recipient.email}`);
      }
    } catch (emailErr) {
      console.error(`stripe-webhook: email send threw for ${recipient.email}`, emailErr);
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
