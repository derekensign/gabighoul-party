const { sql } = require('@vercel/postgres');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Ensure we have the right environment variable
if (!process.env.POSTGRES_URL && process.env.POSTGRES_URL_NO_SSL) {
  process.env.POSTGRES_URL = process.env.POSTGRES_URL_NO_SSL;
}

export default async function handler(req, res) {
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

  const { id } = req.query;
  const { amount, reason } = req.body; // Optional partial refund amount and reason

  try {
    // Get RSVP details
    const { rows } = await sql`
      SELECT * FROM rsvps WHERE id = ${id}
    `;
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'RSVP not found' });
    }
    
    const rsvp = rows[0];
    
    if (!rsvp.stripe_payment_intent_id) {
      return res.status(400).json({ message: 'No payment found for this RSVP' });
    }
    
    // Create refund
    const refundData = {
      payment_intent: rsvp.stripe_payment_intent_id,
      reason: reason || 'requested_by_customer'
    };
    
    // Add amount if specified (for partial refunds)
    if (amount) {
      refundData.amount = Math.round(amount * 100); // Convert to cents
    }
    
    const refund = await stripe.refunds.create(refundData);
    
    // Update RSVP status in database
    await sql`
      UPDATE rsvps 
      SET payment_status = 'refunded', 
          stripe_refund_id = ${refund.id},
          refund_amount = ${refund.amount},
          updated_at = NOW()
      WHERE id = ${id}
    `;
    
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
