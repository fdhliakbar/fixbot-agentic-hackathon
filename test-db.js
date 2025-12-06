// const { Client } = require('pg');

// const client = new Client({
//   host: '103.185.52.220',
//   port: 2922,
//   user: 'fixbot',
//   password: 'CuGgIPo?{:B6NHlTlobGp32N6T?2908M',
//   database: 'fixbot',
//   ssl: {
//     rejectUnauthorized: false
//   }
// });

// client.connect()
//   .then(() => {
//     console.log('✅ Connected to PostgreSQL!');
//     return client.query('SELECT version()');
//   })
//   .then(result => {
//     console.log('📊 Database version:', result.rows[0].version);
//     return client.query(`
//       SELECT table_name 
//       FROM information_schema.tables 
//       WHERE table_schema = 'public'
//     `);
//   })
//   .then(result => {
//     console.log('📋 Tables:', result.rows.map(r => r.table_name));
//     return client.end();
//   })
//   .then(() => {
//     console.log('✅ Connection closed');
//     process.exit(0);
//   })
//   .catch(err => {
//     console.error('❌ Error:', err.message);
//     process.exit(1);
//   });