const { Resend } = require('resend');

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Default sender email
const DEFAULT_FROM = process.env.EMAIL_FROM || 'SignWorld <noreply@signworld.com>';

class EmailService {
  /**
   * Send email verification email
   */
  async sendVerificationEmail({ to, name, verificationUrl }) {
    try {
      const { data, error } = await resend.emails.send({
        from: DEFAULT_FROM,
        to: [to],
        subject: 'Verify Your Email Address - Sign World Business Partners',
        html: this.getVerificationTemplate(name, verificationUrl),
      });

      if (error) {
        console.error('Failed to send verification email:', error);
        return { success: false, error: error.message };
      }

      console.log('Verification email sent successfully:', data.id);
      return { success: true, data };
    } catch (error) {
      console.error('Failed to send verification email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send a welcome email to new users
   */
  async sendWelcomeEmail({ to, name }) {
    try {
      const { data, error } = await resend.emails.send({
        from: DEFAULT_FROM,
        to: [to],
        subject: 'Welcome to SignWorld Dashboard',
        html: this.getWelcomeTemplate(name),
      });

      if (error) {
        console.error('Failed to send welcome email:', error);
        return { success: false, error: error.message };
      }

      console.log('Welcome email sent successfully:', data.id);
      return { success: true, data };
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send welcome email with credentials (for admin-created users)
   */
  async sendWelcomeEmailWithCredentials({ to, name, password, role }) {
    try {
      const { data, error } = await resend.emails.send({
        from: DEFAULT_FROM,
        to: [to],
        subject: 'Welcome to SignWorld Dashboard - Your Account Details',
        html: this.getWelcomeWithCredentialsTemplate(name, to, password, role),
      });

      if (error) {
        console.error('Failed to send welcome email with credentials:', error);
        return { success: false, error: error.message };
      }

      console.log('Welcome email with credentials sent successfully:', data.id);
      return { success: true, data };
    } catch (error) {
      console.error('Failed to send welcome email with credentials:', error);
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
        to: [to],
        subject: `Reminder: ${event.title} - ${reminderTime}`,
        html: this.getEventReminderTemplate(name, event, reminderTime),
      });

      if (error) {
        console.error('Failed to send event reminder:', error);
        return { success: false, error: error.message };
      }

      console.log('Event reminder sent successfully:', data.id);
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
        to: [adminEmail],
        replyTo: email,
        subject: `New Contact Form Submission from ${name}`,
        html: this.getContactFormTemplate(name, email, message),
      });

      if (error) {
        console.error('Failed to send contact form email:', error);
        return { success: false, error: error.message };
      }

      console.log('Contact form email sent successfully:', data.id);
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
        to: [to],
        subject: 'Password Reset Request - SignWorld Dashboard',
        html: this.getPasswordResetTemplate(name, resetUrl),
      });

      if (error) {
        console.error('Failed to send password reset email:', error);
        return { success: false, error: error.message };
      }

      console.log('Password reset email sent successfully:', data.id);
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
        to: [to],
        subject: `New reply in: ${thread.title}`,
        html: this.getForumNotificationTemplate(name, thread, post, threadUrl),
      });

      if (error) {
        console.error('Failed to send forum notification:', error);
        return { success: false, error: error.message };
      }

      console.log('Forum notification sent successfully:', data.id);
      return { success: true, data };
    } catch (error) {
      console.error('Failed to send forum notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send convention registration confirmation email
   */
  async sendConventionRegistrationEmail({ to, name, convention }) {
    try {
      const { data, error } = await resend.emails.send({
        from: DEFAULT_FROM,
        to: [to],
        subject: `Registration Confirmed: ${convention.title}`,
        html: this.getConventionRegistrationTemplate(name, convention),
      });

      if (error) {
        console.error('Failed to send convention registration email:', error);
        return { success: false, error: error.message };
      }

      console.log('Convention registration email sent successfully:', data.id);
      return { success: true, data };
    } catch (error) {
      console.error('Failed to send convention registration email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send convention date change notification email
   */
  async sendConventionDateChangeEmail({ to, name, convention, oldStartDate, oldEndDate }) {
    try {
      const { data, error } = await resend.emails.send({
        from: DEFAULT_FROM,
        to: [to],
        subject: `Schedule Change: ${convention.title}`,
        html: this.getConventionDateChangeTemplate(name, convention, oldStartDate, oldEndDate),
      });

      if (error) {
        console.error('Failed to send convention date change email:', error);
        return { success: false, error: error.message };
      }

      console.log('Convention date change email sent successfully:', data.id);
      return { success: true, data };
    } catch (error) {
      console.error('Failed to send convention date change email:', error);
      return { success: false, error: error.message };
    }
  }

  // EMAIL TEMPLATES

  getVerificationTemplate(name, verificationUrl) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .info-box { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 4px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Sign World Business Partners!</h1>
            </div>
            <div class="content">
              <p>Hi ${name},</p>
              <p>Thank you for signing up! To complete your registration, please verify your email address by clicking the button below:</p>
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
              <div class="info-box">
                <p><strong>Important:</strong></p>
                <ul>
                  <li>This verification link will expire in 1 hour</li>
                  <li>If you didn't create this account, please ignore this email</li>
                  <li>Never share your verification link with anyone</li>
                </ul>
              </div>
              <p style="margin-top: 30px;">If the button above doesn't work, you can also copy and paste this link in your browser:</p>
              <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 4px; font-size: 12px;">
                ${verificationUrl}
              </p>
              <p>Best regards,<br>The Sign World Business Partners Team</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Sign World Business Partners. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

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

  getWelcomeWithCredentialsTemplate(name, email, password, role) {
    const roleDisplay = role.charAt(0).toUpperCase() + role.slice(1);
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .credentials { background: #f0f4f8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
            .credentials p { margin: 10px 0; }
            .credentials strong { color: #667eea; }
            .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
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
              <p>An account has been created for you on the SignWorld Dashboard. Below are your login credentials:</p>

              <div class="credentials">
                <h3 style="margin-top: 0; color: #667eea;">Your Account Details</h3>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Password:</strong> ${password}</p>
                <p><strong>Role:</strong> ${roleDisplay}</p>
              </div>

              <div class="warning">
                <p><strong>⚠️ Security Reminder:</strong></p>
                <p>For your security, please change your password after logging in for the first time.</p>
              </div>

              <a href="${process.env.CLIENT_URL}/login" class="button">Login to Dashboard</a>

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

  getConventionRegistrationTemplate(name, convention) {
    const convUrl = `${process.env.CLIENT_URL}/conventions/${convention._id}`;
    const startDate = new Date(convention.startDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const endDate = new Date(convention.endDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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
            .convention-details { background: white; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0; border-radius: 4px; }
            .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Registration Confirmed!</h1>
            </div>
            <div class="content">
              <p>Hi ${name},</p>
              <p>Thank you for registering for ${convention.title}. We're excited to have you join us!</p>
              <div class="convention-details">
                <h2>${convention.title}</h2>
                <p><strong>Date:</strong> ${startDate}${startDate !== endDate ? ` to ${endDate}` : ''}</p>
                ${convention.location?.venue ? `<p><strong>Venue:</strong> ${convention.location.venue}</p>` : ''}
                ${convention.location?.address ? `<p><strong>Address:</strong> ${convention.location.address}</p>` : ''}
                <p><strong>Status:</strong> Registration Complete</p>
              </div>
              <p>Please follow up with the event organizers regarding payment as instructed. Your registration is confirmed and pending payment completion.</p>
              <a href="${convUrl}" class="button">View Convention Details</a>
              <p>If you have any questions, please contact the event organizer.</p>
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

  getConventionDateChangeTemplate(name, convention, oldStartDate, oldEndDate) {
    const convUrl = `${process.env.CLIENT_URL}/conventions/${convention._id}`;
    const newStartDate = new Date(convention.startDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const newEndDate = new Date(convention.endDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const oldStartDateFormatted = new Date(oldStartDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const oldEndDateFormatted = new Date(oldEndDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .schedule-box { background: white; padding: 20px; border-left: 4px solid #f59e0b; margin: 20px 0; border-radius: 4px; }
            .old-date { color: #dc2626; text-decoration: line-through; }
            .new-date { color: #059669; font-weight: bold; }
            .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Schedule Change Notice</h1>
            </div>
            <div class="content">
              <p>Hi ${name},</p>
              <p>We wanted to notify you that the schedule for ${convention.title} has been updated.</p>
              <div class="schedule-box">
                <h2>${convention.title}</h2>
                <p><strong>Previous Date:</strong> <span class="old-date">${oldStartDateFormatted}${oldStartDateFormatted !== oldEndDateFormatted ? ` to ${oldEndDateFormatted}` : ''}</span></p>
                <p><strong>New Date:</strong> <span class="new-date">${newStartDate}${newStartDate !== newEndDate ? ` to ${newEndDate}` : ''}</span></p>
              </div>
              <p>Please update your calendar accordingly. If you have any concerns or questions about this change, please contact the event organizers.</p>
              <a href="${convUrl}" class="button">View Updated Details</a>
              <p>We look forward to seeing you at the event!</p>
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
