const { Client } = require('pg');

async function checkSchema() {
  const client = new Client({
    host: '103.185.52.220',
    port: 2922,
    user: 'fixbot',
    password: 'CuGgIPo?{:B6NHlTlobGp32N6T?2908M',
    database: 'fixbot',
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    
    // Check fixbot_chat_messages columns
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'fixbot_chat_messages'
      ORDER BY ordinal_position
    `);
    
    console.log('fixbot_chat_messages columns:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkSchema();
