# Email Integration with Resend

This document explains how the email functionality is integrated into the SignWorld Dashboard using [Resend](https://resend.com/).

## Setup

### 1. Install Dependencies

The Resend package is already installed. If you need to reinstall:

```bash
npm install resend
```

### 2. Environment Configuration

Add the following environment variables to your `.env` file:

```env
# Email Configuration (Resend)
RESEND_API_KEY=re_your_resend_api_key_here
EMAIL_FROM=SignWorld <noreply@yourdomain.com>
ADMIN_EMAIL=admin@yourdomain.com
CLIENT_URL=http://localhost:5173
```

**Getting Your API Key:**
1. Sign up at [https://resend.com](https://resend.com)
2. Verify your domain (or use Resend's test domain for development)
3. Navigate to [API Keys](https://resend.com/api-keys)
4. Create a new API key and copy it to your `.env` file

## Available Email Types

### 1. Contact Form Email
Sends contact form submissions to the admin email.

**Endpoint:** `POST /api/email/contact`

**Access:** Public (rate-limited: 5 requests per 15 minutes)

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "I would like to know more about..."
}
```

**Frontend Usage:**
```typescript
import emailService from '../services/emailService';

await emailService.sendContactForm({
  name: 'John Doe',
  email: 'john@example.com',
  message: 'Message content'
});
```

### 2. Welcome Email
Sends a welcome email to new users.

**Endpoint:** `POST /api/email/welcome`

**Access:** Private (Admin only)

**Request Body:**
```json
{
  "userId": "user_id_here"
}
```

**Frontend Usage:**
```typescript
await emailService.sendWelcomeEmail('user_id_here');
```

### 3. Event Reminder Email
Sends event reminder to users.

**Endpoint:** `POST /api/email/event-reminder`

**Access:** Private (authenticated users)

**Request Body:**
```json
{
  "eventId": "event_id_here",
  "reminderTime": "24 hours before"
}
```

**Frontend Usage:**
```typescript
await emailService.sendEventReminder({
  eventId: 'event_id_here',
  reminderTime: '24 hours before'
});
```

### 4. Test Email
Tests the email configuration (admin only).

**Endpoint:** `POST /api/email/test`

**Access:** Private (Admin only)

**Frontend Usage:**
```typescript
await emailService.testEmail();
```

## Email Templates

All email templates are defined in `backend/services/emailService.js`:

1. **Welcome Email** - Sent to new users upon registration
2. **Event Reminder** - Sent before scheduled events
3. **Contact Form** - Sent when someone submits the contact form
4. **Password Reset** - Sent when a user requests password reset (planned)
5. **Forum Notification** - Sent for forum activity (planned)

Each template is:
- Fully responsive
- Styled with inline CSS for email client compatibility
- Branded with SignWorld colors and gradients
- Dark mode friendly

## Customizing Templates

Edit the template methods in `backend/services/emailService.js`:

```javascript
getWelcomeTemplate(name) {
  return `
    <!DOCTYPE html>
    <html>
      <!-- Your custom HTML template -->
    </html>
  `;
}
```

## Rate Limiting

The contact form endpoint is rate-limited to prevent spam:
- **Limit:** 5 requests per 15 minutes per IP address
- **Response when exceeded:** 429 Too Many Requests

## Error Handling

The email service handles errors gracefully:

```javascript
try {
  await emailService.sendContactForm({...});
} catch (error) {
  // Error is caught and displayed to user
  toast.error(error.message);
}
```

## Testing

### Development Testing

During development, you can use Resend's test domain:
- Emails will be sent but not delivered
- You can view them in the Resend dashboard

### Production Testing

1. Verify your domain in Resend
2. Add DNS records (SPF, DKIM, DMARC)
3. Use the admin test endpoint to verify configuration:

```bash
curl -X POST http://localhost:5000/api/email/test \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## Integration Points

The email service is integrated at:

1. **Contact Form** (`frontend/src/pages/Landing.tsx`)
   - Form submission triggers contact email

2. **Event Notifications** (can be integrated)
   - Calendar events can trigger reminder emails

3. **User Registration** (can be integrated)
   - New users can receive welcome emails

4. **Forum Activity** (can be integrated)
   - Forum replies can trigger notification emails

## Future Enhancements

Potential features to add:

1. **Email Preferences** - Let users control which emails they receive
2. **Scheduled Emails** - Use node-cron to send scheduled reminders
3. **Email Analytics** - Track open rates and engagement
4. **Transactional Emails** - Password resets, account verification
5. **Bulk Emails** - Announcements to all users (with unsubscribe)
6. **Email Templates Management** - Admin UI to edit templates

## Troubleshooting

### Emails not sending

1. Check if `RESEND_API_KEY` is set in `.env`
2. Verify API key is valid in Resend dashboard
3. Check server logs for error messages
4. Ensure domain is verified (for production)

### Rate limit errors

Wait 15 minutes or increase the rate limit in `backend/routes/email.js`

### Email deliverability issues

1. Verify your domain in Resend
2. Add proper DNS records (SPF, DKIM, DMARC)
3. Use a professional "from" email address
4. Avoid spam trigger words in templates

## Security Considerations

1. **API Key Protection** - Never commit `.env` file
2. **Rate Limiting** - Prevents spam and abuse
3. **Input Validation** - All inputs are validated
4. **Email Validation** - Email format is checked
5. **Authentication** - Sensitive endpoints require auth

## Support

For Resend support:
- Documentation: [https://resend.com/docs](https://resend.com/docs)
- Support: [https://resend.com/support](https://resend.com/support)

For SignWorld Dashboard support:
- Check server logs: `npm run server`
- Review API responses in browser DevTools
- Test endpoints with Postman or cURL
