const { Resend } = require('resend');

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Default sender email
const DEFAULT_FROM = process.env.EMAIL_FROM || 'SignWorld <noreply@signworld.com>';

class EmailService {
  /**
   * Send a welcome email to new users
   */
  async sendWelcomeEmail({ to, name }) {
    try {
      const { data, error } = await resend.emails.send({
        from: DEFAULT_FROM,
        to,
        subject: 'Welcome to SignWorld Dashboard',
        html: this.getWelcomeTemplate(name),
      });

      if (error) {
        console.error('Error sending welcome email:', error);
        throw error;
      }

      console.log('Welcome email sent successfully:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send event reminder email
   */
  async sendEventReminder({ to, name, event, reminderTime }) {
    try {
      const { data, error } = await resend.emails.send({
        from: DEFAULT_FROM,
        to,
        subject: `Reminder: ${event.title} - ${reminderTime}`,
        html: this.getEventReminderTemplate(name, event, reminderTime),
      });

      if (error) {
        console.error('Error sending event reminder:', error);
        throw error;
      }

      console.log('Event reminder sent successfully:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Failed to send event reminder:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send contact form submission email
   */
  async sendContactFormEmail({ name, email, message }) {
    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@signworld.com';

      const { data, error } = await resend.emails.send({
        from: DEFAULT_FROM,
        to: adminEmail,
        replyTo: email,
        subject: `New Contact Form Submission from ${name}`,
        html: this.getContactFormTemplate(name, email, message),
      });

      if (error) {
        console.error('Error sending contact form email:', error);
        throw error;
      }

      console.log('Contact form email sent successfully:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Failed to send contact form email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail({ to, name, resetToken }) {
    try {
      const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

      const { data, error } = await resend.emails.send({
        from: DEFAULT_FROM,
        to,
        subject: 'Password Reset Request - SignWorld Dashboard',
        html: this.getPasswordResetTemplate(name, resetUrl),
      });

      if (error) {
        console.error('Error sending password reset email:', error);
        throw error;
      }

      console.log('Password reset email sent successfully:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send notification email for new forum posts
   */
  async sendForumNotification({ to, name, thread, post }) {
    try {
      const threadUrl = `${process.env.CLIENT_URL}/forum/thread/${thread._id}`;

      const { data, error } = await resend.emails.send({
        from: DEFAULT_FROM,
        to,
        subject: `New reply in: ${thread.title}`,
        html: this.getForumNotificationTemplate(name, thread, post, threadUrl),
      });

      if (error) {
        console.error('Error sending forum notification:', error);
        throw error;
      }

      console.log('Forum notification sent successfully:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Failed to send forum notification:', error);
      return { success: false, error: error.message };
    }
  }

  // EMAIL TEMPLATES

  getWelcomeTemplate(name) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0066cc 0%, #004499 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to SignWorld Dashboard!</h1>
            </div>
            <div class="content">
              <p>Hi ${name},</p>
              <p>Welcome to the SignWorld Dashboard! We're excited to have you join our community of franchise owners.</p>
              <p>Your account has been successfully created and you now have access to:</p>
              <ul>
                <li>Comprehensive resource library</li>
                <li>Event calendar and notifications</li>
                <li>Community forum and discussions</li>
                <li>Owner directory and networking</li>
                <li>Real-time analytics and reports</li>
              </ul>
              <a href="${process.env.CLIENT_URL}/dashboard" class="button">Go to Dashboard</a>
              <p>If you have any questions, feel free to reach out to our support team.</p>
              <p>Best regards,<br>The SignWorld Team</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} SignWorld. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  getEventReminderTemplate(name, event, reminderTime) {
    const eventDate = new Date(event.start).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .event-details { background: white; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0; border-radius: 4px; }
            .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Event Reminder</h1>
            </div>
            <div class="content">
              <p>Hi ${name},</p>
              <p>This is a reminder that you have an upcoming event:</p>
              <div class="event-details">
                <h2>${event.title}</h2>
                <p><strong>When:</strong> ${eventDate}</p>
                ${event.location ? `<p><strong>Location:</strong> ${event.location}</p>` : ''}
                ${event.description ? `<p><strong>Description:</strong> ${event.description}</p>` : ''}
              </div>
              <a href="${process.env.CLIENT_URL}/calendar" class="button">View Calendar</a>
              <p>See you there!</p>
              <p>Best regards,<br>The SignWorld Team</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} SignWorld. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  getContactFormTemplate(name, email, message) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #333; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .message-box { background: white; padding: 20px; border-left: 4px solid #0066cc; margin: 20px 0; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Contact Form Submission</h1>
            </div>
            <div class="content">
              <p><strong>From:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <div class="message-box">
                <h3>Message:</h3>
                <p>${message}</p>
              </div>
              <p><small>Submitted on ${new Date().toLocaleString()}</small></p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  getPasswordResetTemplate(name, resetUrl) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .warning { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hi ${name},</p>
              <p>We received a request to reset your password for your SignWorld Dashboard account.</p>
              <p>Click the button below to reset your password:</p>
              <a href="${resetUrl}" class="button">Reset Password</a>
              <div class="warning">
                <p><strong>Important:</strong></p>
                <ul>
                  <li>This link will expire in 1 hour</li>
                  <li>If you didn't request this, please ignore this email</li>
                  <li>Never share this link with anyone</li>
                </ul>
              </div>
              <p>Best regards,<br>The SignWorld Team</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} SignWorld. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  getForumNotificationTemplate(name, thread, post, threadUrl) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .post-box { background: white; padding: 20px; border-left: 4px solid #8b5cf6; margin: 20px 0; border-radius: 4px; }
            .button { display: inline-block; background: #8b5cf6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Forum Reply</h1>
            </div>
            <div class="content">
              <p>Hi ${name},</p>
              <p>There's a new reply in a thread you're following:</p>
              <h3>${thread.title}</h3>
              <div class="post-box">
                <p><strong>${post.author?.name || 'Anonymous'}:</strong></p>
                <p>${post.content?.substring(0, 200)}${post.content?.length > 200 ? '...' : ''}</p>
              </div>
              <a href="${threadUrl}" class="button">View Thread</a>
              <p>Best regards,<br>The SignWorld Team</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} SignWorld. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

module.exports = new EmailService();
