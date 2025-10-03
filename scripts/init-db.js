const { sql } = require('@vercel/postgres');

async function initDatabase() {
  try {
    console.log('Initializing database...');
    
    // Create RSVPs table
    await sql`
      CREATE TABLE IF NOT EXISTS rsvps (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        guests INTEGER NOT NULL DEFAULT 1,
        payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
        stripe_payment_intent_id VARCHAR(255),
        stripe_refund_id VARCHAR(255),
        refund_amount INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // Create index on email for faster lookups
    await sql`
      CREATE INDEX IF NOT EXISTS idx_rsvps_email ON rsvps(email)
    `;

    // Create index on payment status
    await sql`
      CREATE INDEX IF NOT EXISTS idx_rsvps_payment_status ON rsvps(payment_status)
    `;

    console.log('✅ Database initialized successfully!');
    console.log('Tables created: rsvps');
    console.log('Indexes created: idx_rsvps_email, idx_rsvps_payment_status');
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
}

initDatabase();
