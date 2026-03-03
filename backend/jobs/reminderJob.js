// backend/jobs/reminderJob.js
const { sendRemindersForUpcomingBookings } = require('../controllers/notificationController');

// Run every minute
setInterval(async () => {
  try {
    await sendRemindersForUpcomingBookings();
    console.log('Checked and sent reminders for upcoming bookings.');
  } catch (err) {
    console.error('Error sending reminders:', err);
  }
}, 60000);
