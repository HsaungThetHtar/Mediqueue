// backend/controllers/notificationController.js
const nodemailer = require('nodemailer');
const QueueBooking = require('../models/QueueBooking');

// Configure your email transport (example: Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Send email to patient
async function sendPatientReminderEmail(email, patientName, queueNumber, hospital, department, doctor, estimatedTime) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'MediQueue Reminder: Your turn is soon!',
    html: `<p>Dear ${patientName},</p>
      <p>This is a reminder that your queue number <b>${queueNumber}</b> at <b>${hospital}</b> (${department}, Dr. ${doctor}) is expected in <b>30 minutes</b> at ${estimatedTime}.</p>
      <p>Please arrive at least 15 minutes early.</p>
      <p>Thank you for using MediQueue!</p>`
  };
  await transporter.sendMail(mailOptions);
}

// Cron job: check bookings and send reminders
async function sendRemindersForUpcomingBookings() {
  const now = new Date();
  const thirtyMinsLater = new Date(now.getTime() + 30 * 60000);

  // Find bookings with estimatedTime within 30-31 minutes from now
  const bookings = await QueueBooking.find({
    estimatedTime: {
      $gte: thirtyMinsLater,
      $lt: new Date(thirtyMinsLater.getTime() + 60000)
    },
    reminderSent: { $ne: true }
  });

  for (const booking of bookings) {
    await sendPatientReminderEmail(
      booking.email,
      booking.patientName,
      booking.queueNumber,
      booking.hospital,
      booking.department,
      booking.doctor,
      booking.estimatedTime
    );
    booking.reminderSent = true;
    await booking.save();
  }
}

module.exports = {
  sendRemindersForUpcomingBookings,
};
