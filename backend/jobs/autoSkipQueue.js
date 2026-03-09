/**
 * Auto-cancel job:
 *
 * Admin manually skips a queue → status = "skipped" → skippedAt is recorded.
 * Patient has 10 minutes to re-check-in at the counter.
 * If no re-check-in within 10 min → status = "canceled" + slot released.
 *
 * Note: "in-progress" has NO auto-timeout. Only admin can trigger skip.
 */
const Booking = require("../models/Booking");
const Doctor = require("../models/Doctor");
const Notification = require("../models/Notification");
const QueueEvent = require("../models/QueueEvent");

async function logQueueEvent({ bookingId, action, performedByRole, queueNumber, notes }) {
  try { await QueueEvent.create({ bookingId, action, performedByRole: performedByRole || "system", queueNumber, notes }); }
  catch (err) { console.error("[QueueEvent/auto] Failed to log:", err.message); }
}

const MINUTES_BEFORE_AUTO_CANCEL = 10;
const JOB_INTERVAL_MS = 60 * 1000; // run every 1 minute

const populateDoctorAndDepartment = (q) =>
  q.populate({ path: "doctor", select: "name department", populate: { path: "department", select: "name" } }).populate("department", "name");

// called → skipped after 10 min with no QR check-in
async function runAutoSkipCalled(io) {
  if (!io) return;
  const cutoff = new Date(Date.now() - MINUTES_BEFORE_AUTO_CANCEL * 60 * 1000);
  const staleCalled = await Booking.find({
    status: "called",
    calledAt: { $exists: true, $lte: cutoff },
  }).lean();

  for (const b of staleCalled) {
    try {
      const booking = await Booking.findByIdAndUpdate(
        b._id,
        { status: "skipped", skippedAt: new Date() },
        { returnDocument: 'after' }
      ).lean();
      if (!booking) continue;

      await logQueueEvent({ bookingId: booking._id, action: "SKIP", performedByRole: "system", queueNumber: booking.queueNumber, notes: "auto-skipped: no check-in within 10 min of call" });

      const notif = await Notification.create({
        userId: booking.patientId,
        title: "Your Queue Was Auto-Skipped",
        message: `Your queue ${booking.queueNumber} was skipped because you did not check in within 10 minutes. You have 10 more minutes to re-check-in.`,
        type: "status",
        relatedBookingId: booking._id,
      });

      io.to("role:admin").to("role:doctor").emit("queue-update", { type: "skipped", booking: { _id: booking._id, queueNumber: booking.queueNumber, status: "skipped" } });
      io.to(`user:${booking.patientId}`).emit("booking-update", { bookingId: booking._id, status: "skipped" });
      io.to(`user:${booking.patientId}`).emit("notification", { userId: String(booking.patientId), notification: { _id: notif._id, title: notif.title, message: notif.message, type: "status", relatedBookingId: booking._id, isRead: false, createdAt: notif.createdAt } });

      console.log("[AUTO-SKIP] Skipped called booking:", booking.patientName || booking.patientId, "-", booking.queueNumber);
    } catch (err) {
      console.error("[AUTO-SKIP] Error for booking", b._id, err.message);
    }
  }
}

// skipped → canceled after 10 min with no re-check-in
async function runAutoCancel(io) {
  if (!io) return;
  const cutoff = new Date(Date.now() - MINUTES_BEFORE_AUTO_CANCEL * 60 * 1000);

  const stale = await Booking.find({
    status: "skipped",
    skippedAt: { $exists: true, $lte: cutoff },
  }).lean();

  for (const b of stale) {
    try {
      const booking = await populateDoctorAndDepartment(
        Booking.findByIdAndUpdate(b._id, { status: "canceled" }, { returnDocument: 'after' })
      );
      if (!booking) continue;

      // Release the slot
      const doctor = await Doctor.findById(booking.doctor._id);
      if (doctor && doctor.currentQueue > 0) {
        doctor.currentQueue = doctor.currentQueue - 1;
        await doctor.save();
      }

      const notif = await Notification.create({
        userId: booking.patientId,
        title: "Queue Canceled",
        message: `Your queue ${booking.queueNumber} has been automatically canceled. No re-check-in was received within 10 minutes.`,
        type: "status",
        relatedBookingId: booking._id,
      });

      io.to("role:admin").to("role:doctor").emit("queue-update", { type: "canceled", booking: { _id: booking._id, queueNumber: booking.queueNumber, status: booking.status } });
      io.to(`user:${booking.patientId}`).emit("booking-update", { bookingId: booking._id, status: "canceled" });
      io.to(`user:${booking.patientId}`).emit("notification", {
        userId: String(booking.patientId),
        notification: {
          _id: notif._id,
          title: notif.title,
          message: notif.message,
          type: "status",
          relatedBookingId: booking._id,
          isRead: false,
          createdAt: notif.createdAt,
        },
      });

      console.log("[AUTO-CANCEL] Canceled skipped booking:", booking.patientName, "-", booking.queueNumber);
    } catch (err) {
      console.error("[AUTO-CANCEL] Error for booking", b._id, err.message);
    }
  }
}

function startAutoSkipJob(io) {
  runAutoSkipCalled(io);
  runAutoCancel(io);
  const interval = setInterval(() => {
    runAutoSkipCalled(io);
    runAutoCancel(io);
  }, JOB_INTERVAL_MS);
  return () => clearInterval(interval);
}

module.exports = { runAutoCancel, startAutoSkipJob, MINUTES_BEFORE_AUTO_CANCEL };