const nodemailer = require('nodemailer');

// Create reusable transporter object
const createTransporter = () => {
  const smtpConfig = {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  };

  console.log('Creating email transporter with config:', {
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure,
    user: smtpConfig.auth.user,
  });

  return nodemailer.createTransport(smtpConfig);
};

// Send email function
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Send welcome email with credentials
const sendWelcomeEmail = async (userData) => {
  const { name, email, password, role, resetToken } = userData;
  const roleDisplay = role.charAt(0).toUpperCase() + role.slice(1);
  const resetUrl = resetToken ? `${process.env.CLIENT_URL}/reset-password?token=${resetToken}` : null;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: white;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .credentials {
            background: #f0f4f8;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
          }
          .credentials p {
            margin: 10px 0;
          }
          .credentials strong {
            color: #667eea;
          }
          .button-primary {
            display: inline-block;
            padding: 14px 32px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff;
            text-decoration: none;
            border-radius: 5px;
            margin: 10px 0;
            font-weight: bold;
            font-size: 16px;
          }
          .button-secondary {
            display: inline-block;
            padding: 10px 24px;
            background: #6b7280;
            color: #ffffff;
            text-decoration: none;
            border-radius: 5px;
            margin: 10px 0;
            font-size: 14px;
          }
          .warning {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to SignWorld Dashboard!</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>An account has been created for you on the SignWorld Dashboard. Below are your login credentials:</p>

            <div class="credentials">
              <h3 style="margin-top: 0; color: #667eea;">Your Account Details</h3>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Password:</strong> ${password}</p>
              <p><strong>Role:</strong> ${roleDisplay}</p>
            </div>

            <div class="warning">
              <p><strong>⚠️ Security Reminder:</strong></p>
              <p>For your security, please change your password right away using the button below.${resetUrl ? ' This link expires in 24 hours.' : ''}</p>
            </div>

            ${resetUrl ? `
            <div style="text-align: center; margin: 25px 0;">
              <a href="${resetUrl}" class="button-primary">Change Your Password</a>
            </div>
            ` : ''}

            <div style="text-align: center; margin: 15px 0;">
              <a href="${process.env.CLIENT_URL}/login" class="button-secondary">Login to Dashboard</a>
            </div>

            <p>You now have access to:</p>
            <ul>
              <li>Comprehensive resource library</li>
              <li>Event calendar and notifications</li>
              <li>Community forum and discussions</li>
              <li>Owner directory and networking</li>
              <li>Real-time analytics and reports</li>
            </ul>

            <p>If you have any questions or need assistance, please don't hesitate to reach out to our support team.</p>

            <p>Best regards,<br>The SignWorld Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} SignWorld. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
Welcome to SignWorld Dashboard!

Hi ${name},

An account has been created for you on the SignWorld Dashboard with the role of ${roleDisplay}.

Your Login Credentials:
Email: ${email}
Password: ${password}

IMPORTANT: For security reasons, please change your password right away.
${resetUrl ? `Change your password here (expires in 24 hours): ${resetUrl}` : ''}

Login at: ${process.env.CLIENT_URL}/login

If you have any questions or need assistance, please don't hesitate to contact your administrator.

Best regards,
The SignWorld Team
  `;

  return await sendEmail({
    to: email,
    subject: 'Welcome to SignWorld Dashboard - Your Account Details',
    html,
    text,
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
};
