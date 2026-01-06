// Mimic the backend startup sequence
const dotenv = require('dotenv');
const path = require('path');

// Load env vars exactly like backend/index.js does
dotenv.config({ path: path.join(__dirname, 'backend', '.env'), override: true });

console.log('=== BACKEND SIMULATION ===');
console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASSWORD length:', process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.length : 'NOT SET');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM);

// Now load the email service
const emailService = require('./backend/services/emailService');
console.log('\n=== TESTING EMAIL SERVICE ===');

emailService.sendContactFormEmail({
  name: 'Test User',
  email: 'testuser@example.com',
  message: 'This is a test'
}).then(result => {
  console.log('Result:', result);
  process.exit(0);
}).catch(error => {
  console.log('Error:', error.message);
  process.exit(1);
});
