const { Client } = require('pg');

async function updateAdminPassword() {
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
    console.log('Connected to database');
    
    // Update admin password with correct bcrypt hash
    const result = await client.query(`
      UPDATE fixbot_admin_users 
      SET password_hash = '$2b$10$hAIoJEcFjsoryvKL0aN6n.WPxDpWvJ.t/joW/6ptHNuaMhwTksiTK' 
      WHERE username = 'fixbot'
    `);
    
    console.log(`Updated ${result.rowCount} admin user(s)`);
    console.log('Admin credentials: username=fixbot, password=fixbot2025hack');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

updateAdminPassword();
