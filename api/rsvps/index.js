const { Client } = require("pg");

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

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === "GET") {
      // Get all RSVPs
      const { rows } = await query(
        "SELECT *, payment_status as \"paymentStatus\", created_at as timestamp FROM rsvps ORDER BY created_at DESC"
      );
      res.status(200).json(rows);
    } else if (req.method === "POST") {
      // Create new RSVP
      const { name, email, phone, guests, paymentStatus } = req.body;

      const { rows } = await query(
        "INSERT INTO rsvps (name, email, phone, guests, payment_status, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *, payment_status as \"paymentStatus\", created_at as timestamp",
        [name, email, phone, guests, paymentStatus]
      );

      res.status(201).json(rows[0]);
    } else {
      res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
