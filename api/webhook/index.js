const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Client } = require('pg');

async function query(text, params) {
  const client = new Client({
    connectionString: process.env.POSTGRES_URL || process.env.POSTGRES_URL_NO_SSL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    const result = await client.query(text, params);
    return result;
  } finally {
    await client.end();
  }
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object;
      console.log("Payment succeeded:", paymentIntent.id);

      // Save RSVP to database
      try {
        const metadata = paymentIntent.metadata;

        await query(
          'INSERT INTO rsvps (name, email, phone, guests, payment_status, stripe_payment_intent_id, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
          [metadata.customer_name, metadata.customer_email, metadata.customer_phone, 1, 'completed', paymentIntent.id]
        );

        console.log("RSVP saved to database successfully");
      } catch (dbError) {
        console.error("Failed to save RSVP to database:", dbError);
      }

      break;

    case "payment_intent.payment_failed":
      const failedPayment = event.data.object;
      console.log("Payment failed:", failedPayment.id);

      // Here you could:
      // - Send failure notification
      // - Log the failed payment
      // - Update database status

      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.status(200).json({ received: true });
}

export default handler;
