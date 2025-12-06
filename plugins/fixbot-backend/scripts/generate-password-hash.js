const bcrypt = require('bcrypt');

async function generateHash() {
  const password = 'fixbot2025hack';
  const saltRounds = 10;
  
  const hash = await bcrypt.hash(password, saltRounds);
  console.log('Password:', password);
  console.log('Bcrypt hash:', hash);
  
  // Verify it works
  const isValid = await bcrypt.compare(password, hash);
  console.log('Verification:', isValid ? 'SUCCESS' : 'FAILED');
}

generateHash();
