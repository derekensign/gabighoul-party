const { sql } = require('@vercel/postgres');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { id } = req.query;

  try {
    if (req.method === 'GET') {
      // Get specific RSVP
      const { rows } = await sql`
        SELECT * FROM rsvps WHERE id = ${id}
      `;
      
      if (rows.length === 0) {
        res.status(404).json({ message: 'RSVP not found' });
        return;
      }
      
      res.status(200).json(rows[0]);
    } else if (req.method === 'PUT') {
      // Update RSVP
      const { name, email, phone, guests, paymentStatus } = req.body;
      
      const { rows } = await sql`
        UPDATE rsvps 
        SET name = ${name}, email = ${email}, phone = ${phone}, 
            guests = ${guests}, payment_status = ${paymentStatus}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;
      
      if (rows.length === 0) {
        res.status(404).json({ message: 'RSVP not found' });
        return;
      }
      
      res.status(200).json(rows[0]);
    } else if (req.method === 'DELETE') {
      // Get RSVP first to check for Stripe payment
      const { rows: rsvpRows } = await sql`
        SELECT * FROM rsvps WHERE id = ${id}
      `;
      
      if (rsvpRows.length === 0) {
        res.status(404).json({ message: 'RSVP not found' });
        return;
      }
      
      const rsvp = rsvpRows[0];
      let refundStatus = 'no_payment';
      
      // Process Stripe refund if payment exists
      if (rsvp.stripe_payment_intent_id) {
        try {
          const refund = await stripe.refunds.create({
            payment_intent: rsvp.stripe_payment_intent_id,
            reason: 'requested_by_customer'
          });
          
          console.log('Refund processed successfully:', refund.id);
          refundStatus = 'refunded';
          
          // Update RSVP with refund details before deletion
          await sql`
            UPDATE rsvps 
            SET payment_status = 'refunded',
                stripe_refund_id = ${refund.id},
                refund_amount = ${refund.amount},
                updated_at = NOW()
            WHERE id = ${id}
          `;
        } catch (refundError) {
          console.error('Refund failed:', refundError.message);
          refundStatus = 'refund_failed';
          
          // Continue with deletion even if refund fails
          // You might want to handle this differently in production
        }
      }
      
      // Delete RSVP from database
      await sql`DELETE FROM rsvps WHERE id = ${id}`;
      
      res.status(200).json({ 
        message: 'RSVP deleted successfully',
        refundStatus: refundStatus
      });
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
