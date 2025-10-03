const { sql } = require('@vercel/postgres');

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const result = await sql`SELECT NOW() as current_time`;
    console.log('✅ Database connection successful!');
    console.log('Current time:', result.rows[0].current_time);
    
    // Test table existence
    const tableCheck = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'rsvps'
    `;
    
    if (tableCheck.rows.length > 0) {
      console.log('✅ RSVPs table exists');
      
      // Count existing RSVPs
      const countResult = await sql`SELECT COUNT(*) as count FROM rsvps`;
      console.log(`📊 Total RSVPs in database: ${countResult.rows[0].count}`);
    } else {
      console.log('❌ RSVPs table does not exist - need to initialize database');
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    console.error('Make sure Vercel Postgres is set up and environment variables are configured');
    process.exit(1);
  }
}

testDatabase();
