const { sql } = require('@vercel/postgres');

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      // Get all RSVPs
      const { rows } = await sql`SELECT * FROM rsvps ORDER BY created_at DESC`;
      res.status(200).json(rows);
    } else if (req.method === 'POST') {
      // Create new RSVP
      const { name, email, phone, guests, paymentStatus } = req.body;
      
      const { rows } = await sql`
        INSERT INTO rsvps (name, email, phone, guests, payment_status, created_at)
        VALUES (${name}, ${email}, ${phone}, ${guests}, ${paymentStatus}, NOW())
        RETURNING *
      `;
      
      res.status(201).json(rows[0]);
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
