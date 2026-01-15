const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: __dirname + '/.env' });

const testSMTP = async () => {
  console.log('🔧 Testing SMTP Configuration...\n');

  console.log('Environment Variables:');
  console.log('SMTP_HOST:', process.env.SMTP_HOST);
  console.log('SMTP_PORT:', process.env.SMTP_PORT);
  console.log('SMTP_USER:', process.env.SMTP_USER);
  console.log('SMTP_SECURE:', process.env.SMTP_SECURE);
  console.log('SMTP_FROM_NAME:', process.env.SMTP_FROM_NAME);
  console.log('SMTP_FROM_EMAIL:', process.env.SMTP_FROM_EMAIL);
  console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
  console.log('\n');

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    console.log('✅ Creating transporter...');

    // Verify connection
    console.log('✅ Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!\n');

    // Send test email
    console.log('📧 Sending test email...');
    const testEmail = process.env.SMTP_USER; // Send to the same email address

    const info = await transporter.sendMail({
      from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_EMAIL}>`,
      to: testEmail,
      subject: 'SMTP Test Email - Sign World Dashboard',
      html: `
        <h2>SMTP Test Successful!</h2>
        <p>If you received this email, your SMTP configuration is working correctly.</p>
        <p><strong>Test Details:</strong></p>
        <ul>
          <li>SMTP Host: ${process.env.SMTP_HOST}</li>
          <li>SMTP Port: ${process.env.SMTP_PORT}</li>
          <li>From: ${process.env.SMTP_FROM_EMAIL}</li>
          <li>To: ${testEmail}</li>
        </ul>
        <p>Timestamp: ${new Date().toISOString()}</p>
      `
    });

    console.log('✅ Test email sent successfully!');
    console.log('📨 Message ID:', info.messageId);
    console.log('📧 Sent to:', testEmail);
    console.log('\n✨ Your SMTP configuration is working correctly!');
    console.log('Check your email inbox for the test message.');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ SMTP Test Failed:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    console.error('\n🔍 Troubleshooting:');
    console.error('1. Check SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS are correct');
    console.error('2. Verify SMTP_SECURE matches your SMTP provider (465=true, 587=false)');
    console.error('3. Check if your SMTP provider requires special authentication');
    console.error('4. Ensure firewall/network allows outbound SMTP connections');

    process.exit(1);
  }
};

testSMTP();
