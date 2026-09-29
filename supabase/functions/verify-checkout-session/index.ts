import Stripe from 'npm:stripe@17.4.0';
import { corsHeaders } from '../_shared/cors.ts';

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');

function jsonResponse(payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!stripeSecretKey) {
    console.error('verify-checkout-session: STRIPE_SECRET_KEY is not configured');
    return jsonResponse({ error: 'Payment processing is not configured.' }, 500);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body.' }, 400);
  }

  const sessionId = (body as Record<string, unknown> | null)?.sessionId;
  if (typeof sessionId !== 'string' || !sessionId.trim()) {
    return jsonResponse({ error: 'Missing sessionId.' }, 400);
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2024-12-18.acacia',
    httpClient: Stripe.createFetchHttpClient(),
  });

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paid = session.status === 'complete' && session.payment_status === 'paid';

    if (!paid) {
      return jsonResponse({ paid: false }, 200);
    }

    return jsonResponse(
      {
        paid: true,
        customerId: session.metadata?.customer_id ?? null,
        customerName: session.metadata?.customer_name ?? null,
        amount: session.amount_total != null ? session.amount_total / 100 : null,
        currency: session.currency ? session.currency.toUpperCase() : null,
      },
      200
    );
  } catch (error) {
    console.error('verify-checkout-session: Stripe error', error);
    const message = error instanceof Error ? error.message : 'Failed to verify checkout session.';
    return jsonResponse({ error: message }, 502);
  }
});
