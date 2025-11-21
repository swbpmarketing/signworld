import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

export interface EventReminderData {
  eventId: string;
  reminderTime: string;
}

class EmailService {
  /**
   * Send contact form email
   */
  async sendContactForm(data: ContactFormData) {
    try {
      const response = await axios.post(`${API_URL}/email/contact`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to send message. Please try again.'
      );
    }
  }

  /**
   * Send event reminder email
   */
  async sendEventReminder(data: EventReminderData) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/email/event-reminder`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to send event reminder'
      );
    }
  }

  /**
   * Send welcome email (admin only)
   */
  async sendWelcomeEmail(userId: string) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/email/welcome`,
        { userId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to send welcome email'
      );
    }
  }

  /**
   * Test email configuration (admin only)
   */
  async testEmail() {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/email/test`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Email test failed'
      );
    }
  }
}

export default new EmailService();
