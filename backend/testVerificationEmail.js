const dotenv = require('dotenv');
const emailService = require('./services/emailService');
const { generateToken } = require('./utils/tokenGenerator');

// Load env vars
dotenv.config({ path: __dirname + '/.env' });

const sendTestVerificationEmail = async () => {
  try {
    console.log('📧 Sending test verification email...\n');

    // Generate a test token
    const { token } = generateToken();

    // Create verification URL
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    // Send email
    const result = await emailService.sendVerificationEmail({
      to: process.env.SMTP_USER, // Send to the admin email
      name: 'Test User',
      verificationUrl: verificationUrl,
    });

    if (result.success) {
      console.log('✅ Test verification email sent successfully!');
      console.log('\n📨 Email Details:');
      console.log('To:', process.env.SMTP_USER);
      console.log('Message ID:', result.data.messageId);
      console.log('\n🔗 Verification Link:');
      console.log(verificationUrl);
      console.log('\n💡 Check your email inbox (including spam/promotions folder) for the verification email.');
    } else {
      console.error('❌ Failed to send email:', result.error);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

sendTestVerificationEmail();
