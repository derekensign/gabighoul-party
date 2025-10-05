const { Client } = require("pg");
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function query(text, params) {
  const client = new Client({
    connectionString:
      process.env.POSTGRES_URL || process.env.POSTGRES_URL_NO_SSL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    const result = await client.query(text, params);
    return result;
  } finally {
    await client.end();
  }
}

// Ensure we have the right environment variable
if (!process.env.POSTGRES_URL && process.env.POSTGRES_URL_NO_SSL) {
  process.env.POSTGRES_URL = process.env.POSTGRES_URL_NO_SSL;
}

async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { rsvpId } = req.body;

  if (!rsvpId) {
    return res.status(400).json({ message: 'RSVP ID is required' });
  }

  try {
    // Get RSVP details
    const { rows } = await query(
      "SELECT * FROM rsvps WHERE id = $1",
      [rsvpId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'RSVP not found' });
    }
    
    const rsvp = rows[0];
    
    if (!rsvp.stripe_payment_intent_id) {
      return res.status(400).json({ message: 'No payment found for this RSVP' });
    }
    
    // Create refund
    const refund = await stripe.refunds.create({
      payment_intent: rsvp.stripe_payment_intent_id,
      reason: 'requested_by_customer'
    });
    
    // Update RSVP status in database
    await query(
      "UPDATE rsvps SET payment_status = 'refunded', stripe_refund_id = $1, refund_amount = $2, updated_at = NOW() WHERE id = $3",
      [refund.id, refund.amount, rsvpId]
    );
    
    res.status(200).json({
      message: 'Refund processed successfully',
      refundId: refund.id,
      amount: refund.amount,
      status: refund.status
    });
    
  } catch (error) {
    console.error('Refund error:', error);
    
    if (error.type === 'StripeInvalidRequestError') {
      res.status(400).json({ 
        error: 'Invalid refund request',
        details: error.message 
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to process refund',
        details: error.message 
      });
    }
  }
}

export default handler;
