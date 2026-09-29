import Stripe from 'npm:stripe@17.4.0';
import { corsHeaders } from '../_shared/cors.ts';

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');

interface CheckoutRequestBody {
  customerId: string;
  customerName: string;
  amount: number;
  currency: string;
  origin: string;
}

function isValidRequestBody(body: unknown): body is CheckoutRequestBody {
  if (!body || typeof body !== 'object') return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.customerId === 'string' && b.customerId.trim().length > 0 &&
    typeof b.customerName === 'string' && b.customerName.trim().length > 0 &&
    typeof b.amount === 'number' && Number.isFinite(b.amount) && b.amount > 0 &&
    typeof b.currency === 'string' && b.currency.trim().length === 3 &&
    typeof b.origin === 'string' && b.origin.trim().length > 0
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!stripeSecretKey) {
    console.error('create-checkout-session: STRIPE_SECRET_KEY is not configured');
    return new Response(JSON.stringify({ error: 'Payment processing is not configured.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!isValidRequestBody(body)) {
    return new Response(JSON.stringify({ error: 'Missing or invalid fields: customerId, customerName, amount, currency, origin.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { customerId, customerName, amount, currency, origin } = body;
  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2024-12-18.acacia',
    httpClient: Stripe.createFetchHttpClient(),
  });

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: { name: `Payment from ${customerName}` },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        customer_id: customerId,
        customer_name: customerName,
        amount: String(amount),
        currency: currency.toUpperCase(),
      },
      success_url: `${origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?checkout=cancelled`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('create-checkout-session: Stripe error', error);
    const message = error instanceof Error ? error.message : 'Failed to create checkout session.';
    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
