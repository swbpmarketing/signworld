const nodemailer = require('nodemailer');

// Create reusable transporter object
const createTransporter = () => {
  console.log('Creating email transporter with config:', {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    user: process.env.EMAIL_USER,
    from: process.env.EMAIL_FROM,
  });

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

// Send email function
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM,
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
  const { name, email, password, role } = userData;

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
          }
          .credentials p {
            margin: 10px 0;
          }
          .credentials strong {
            color: #667eea;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 20px;
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
            <h1>Welcome to Sign Company Dashboard!</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>Your account has been created successfully. You now have access to the Sign Company Dashboard with the role of <strong>${role}</strong>.</p>

            <div class="credentials">
              <h3>Your Login Credentials:</h3>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Password:</strong> ${password}</p>
            </div>

            <p><strong>Important:</strong> For security reasons, we recommend changing your password after your first login.</p>

            <a href="${process.env.FRONTEND_URL}/login" class="button">Login to Dashboard</a>

            <p style="margin-top: 30px;">If you have any questions or need assistance, please don't hesitate to contact your administrator.</p>

            <p>Best regards,<br>Sign Company Dashboard Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
Welcome to Sign Company Dashboard!

Hi ${name},

Your account has been created successfully. You now have access to the Sign Company Dashboard with the role of ${role}.

Your Login Credentials:
Email: ${email}
Password: ${password}

Important: For security reasons, we recommend changing your password after your first login.

Login at: ${process.env.FRONTEND_URL}/login

If you have any questions or need assistance, please don't hesitate to contact your administrator.

Best regards,
Sign Company Dashboard Team
  `;

  return await sendEmail({
    to: email,
    subject: 'Welcome to Sign Company Dashboard - Your Account Details',
    html,
    text,
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
};
