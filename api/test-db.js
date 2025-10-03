const { sql } = require('@vercel/postgres');

// Use the available environment variable
const connectionString = process.env.POSTGRES_URL_NO_SSL || process.env.POSTGRES_URL;

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const result = await sql`SELECT NOW() as current_time`;
    console.log('Database connection successful!');
    
    res.status(200).json({
      success: true,
      message: 'Database connection successful!',
      currentTime: result.rows[0].current_time,
      environment: {
        hasPostgresUrl: !!process.env.POSTGRES_URL,
        hasPostgresPrismaUrl: !!process.env.POSTGRES_PRISMA_URL,
        hasPostgresUser: !!process.env.POSTGRES_USER,
        hasPostgresHost: !!process.env.POSTGRES_HOST,
        hasPostgresPassword: !!process.env.POSTGRES_PASSWORD,
        hasPostgresDatabase: !!process.env.POSTGRES_DATABASE
      }
    });
    
  } catch (error) {
    console.error('Database test failed:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
      environment: {
        hasPostgresUrl: !!process.env.POSTGRES_URL,
        hasPostgresPrismaUrl: !!process.env.POSTGRES_PRISMA_URL,
        hasPostgresUser: !!process.env.POSTGRES_USER,
        hasPostgresHost: !!process.env.POSTGRES_HOST,
        hasPostgresPassword: !!process.env.POSTGRES_PASSWORD,
        hasPostgresDatabase: !!process.env.POSTGRES_DATABASE
      }
    });
  }
}
