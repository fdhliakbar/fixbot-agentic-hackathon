/**
 * Run database migrations for FixBot
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function runMigration() {
  // Database credentials
  const client = new Client({
    host: '103.185.52.220',
    port: 2922,
    user: 'fixbot',
    password: 'CuGgIPo?{:B6NHlTlobGp32N6T?2908M',
    database: 'fixbot',
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected successfully!');

    // Read migration file - use 002 for improvements
    const migrationPath = path.join(__dirname, '..', 'migrations', '002-add-improvements.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration 002-add-improvements.sql...');
    await client.query(migrationSQL);
    console.log('Migration completed successfully!');

    // Verify tables were created
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'fixbot_%'
      ORDER BY table_name;
    `);

    console.log('\nCreated tables:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\nDatabase connection closed.');
  }
}

runMigration();
