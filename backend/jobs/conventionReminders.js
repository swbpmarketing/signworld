const cron = require('node-cron');
const Convention = require('../models/Convention');
const emailService = require('../services/emailService');

/**
 * Send email reminders to attendees 24 hours before convention starts
 * Runs daily at 9:00 AM
 */
const sendConventionReminders = async () => {
  try {
    console.log('Running convention reminder job...');

    // Calculate tomorrow's date range
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tomorrowStart = new Date(tomorrow);
    tomorrowStart.setHours(0, 0, 0, 0);

    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(23, 59, 59, 999);

    // Find conventions starting tomorrow
    const upcomingConventions = await Convention.find({
      startDate: {
        $gte: tomorrowStart,
        $lt: tomorrowEnd
      },
      isActive: true
    });

    console.log(`Found ${upcomingConventions.length} conventions starting tomorrow`);

    // Send reminders to all registered attendees
    for (const convention of upcomingConventions) {
      if (!convention.attendees || convention.attendees.length === 0) {
        console.log(`Skipping ${convention.title} - no attendees`);
        continue;
      }

      console.log(`Sending reminders for ${convention.title} to ${convention.attendees.length} attendee(s)`);

      for (const attendee of convention.attendees) {
        try {
          await emailService.sendEventReminder({
            to: attendee.email,
            name: `${attendee.firstName} ${attendee.lastName}`,
            event: {
              title: convention.title,
              start: convention.startDate,
              end: convention.endDate,
              location: convention.location?.venue || '',
              description: convention.description || ''
            },
            reminderTime: '24 hours'
          });

          console.log(`✓ Reminder sent to ${attendee.email}`);
        } catch (emailError) {
          console.error(`✗ Failed to send reminder to ${attendee.email}:`, emailError.message);
          // Continue to next attendee - don't stop batch
        }
      }
    }

    console.log('Convention reminder job completed');
  } catch (error) {
    console.error('Error in convention reminder job:', error);
  }
};

/**
 * Initialize convention reminder cron job
 * Runs every day at 9:00 AM
 */
const initConventionReminderJob = () => {
  // Cron pattern: '0 9 * * *' = At 9:00 AM every day
  cron.schedule('0 9 * * *', sendConventionReminders);

  console.log('✓ Convention reminder job scheduled (runs daily at 9:00 AM)');
};

module.exports = { initConventionReminderJob, sendConventionReminders };
