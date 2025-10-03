const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, customerInfo } = req.body;

    // Validate required fields
    if (!amount || !customerInfo) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Amount in cents
      currency: 'usd',
      metadata: {
        customer_name: customerInfo.name,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone,
        event: 'gabyghoul-halloween-party'
      },
      description: `Halloween Boat Party - ${customerInfo.name}`,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.status(200).json({ 
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id 
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ 
      error: 'Failed to create payment intent',
      details: error.message 
    });
  }
}
