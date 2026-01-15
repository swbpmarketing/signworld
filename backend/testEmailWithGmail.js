const dotenv = require('dotenv');
const emailService = require('./services/emailService');
const { generateToken } = require('./utils/tokenGenerator');

// Load env vars
dotenv.config({ path: __dirname + '/.env' });

const sendTestEmail = async () => {
  try {
    console.log('📧 Sending test email to Gmail address...\n');

    // Gmail address to test (change this to your Gmail)
    const testEmail = 'kristine.test.email@gmail.com'; // CHANGE THIS TO YOUR EMAIL

    console.log('Target email:', testEmail);
    console.log('SMTP Configuration:');
    console.log('  Host:', process.env.SMTP_HOST);
    console.log('  Port:', process.env.SMTP_PORT);
    console.log('  User:', process.env.SMTP_USER);
    console.log('  From Name:', process.env.SMTP_FROM_NAME);
    console.log('  From Email:', process.env.SMTP_FROM_EMAIL);
    console.log('\n');

    // Generate a test token
    const { token } = generateToken();

    // Create verification URL
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    // Send email
    const result = await emailService.sendVerificationEmail({
      to: testEmail,
      name: 'Test User',
      verificationUrl: verificationUrl,
    });

    if (result.success) {
      console.log('✅ Test email sent successfully!');
      console.log('\n📨 Email Details:');
      console.log('To:', testEmail);
      console.log('Message ID:', result.data.messageId);
      console.log('\n🔗 Verification Link (for testing):');
      console.log(verificationUrl);
      console.log('\n💡 Check your Gmail inbox for the verification email.');
      console.log('💡 Also check spam/promotions folder just in case.');
    } else {
      console.error('❌ Failed to send email:', result.error);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

sendTestEmail();
