/**
 * Auto-skip queue: if a patient was called (in-progress) and calledAt was more than 10 minutes ago,
 * mark that booking as canceled and call the next waiting patient.
 * Run this job periodically (e.g. every 1 minute) after server start.
 */
const Booking = require("../models/Booking");
const Doctor = require("../models/Doctor");
const Notification = require("../models/Notification");

const MINUTES_BEFORE_AUTO_SKIP = 10;
const JOB_INTERVAL_MS = 60 * 1000; // 1 minute

const populateDoctorAndDepartment = (q) =>
  q.populate({ path: "doctor", select: "name department", populate: { path: "department", select: "name" } }).populate("department", "name");

async function runAutoSkip(io) {
  if (!io) return;
  const cutoff = new Date(Date.now() - MINUTES_BEFORE_AUTO_SKIP * 60 * 1000);
  const stale = await Booking.find({
    status: "in-progress",
    calledAt: { $exists: true, $lte: cutoff },
  }).lean();

  for (const b of stale) {
    try {
      const booking = await populateDoctorAndDepartment(
        Booking.findByIdAndUpdate(b._id, { status: "canceled" }, { new: true })
      );
      if (!booking) continue;

      let nextBooking = await Booking.findOneAndUpdate(
        {
          doctor: booking.doctor._id,
          date: booking.date,
          timeSlot: booking.timeSlot,
          status: "waiting",
        },
        { status: "in-progress", calledAt: new Date() },
        { new: true, sort: { createdAt: 1 } }
      );
      if (nextBooking) nextBooking = await populateDoctorAndDepartment(Booking.findById(nextBooking._id)).exec();

      const queueNumberToInt = (q) => {
        const parts = String(q || "").split("-");
        return parts.length === 2 ? parseInt(parts[1], 10) || 0 : 0;
      };
      await Doctor.findByIdAndUpdate(booking.doctor._id, {
        currentQueueServing: nextBooking ? queueNumberToInt(nextBooking.queueNumber) : 0,
      });

      const skippedNotif = await Notification.create({
        userId: booking.patientId,
        title: "Queue Skipped",
        message: "Your queue was skipped because there was no response within 10 minutes. Please check in again if you still need to see the doctor.",
        type: "status",
        relatedBookingId: booking._id,
      });

      io.emit("queue-update", { type: "skipped", booking, nextBooking: nextBooking || null });
      io.emit("notification", {
        userId: String(booking.patientId),
        notification: {
          _id: skippedNotif._id,
          title: skippedNotif.title,
          message: skippedNotif.message,
          type: "status",
          relatedBookingId: booking._id,
          isRead: false,
          createdAt: skippedNotif.createdAt,
        },
      });

      if (nextBooking) {
        const notifDoc = await Notification.create({
          userId: nextBooking.patientId,
          title: "Your Queue is Called!",
          message: "Please proceed to the consultation room immediately.",
          type: "status",
          relatedBookingId: nextBooking._id,
        });
        const departmentName = nextBooking.department?.name || "";
        io.emit("queue-update", { type: "called", booking: nextBooking });
        io.emit("notification", {
          userId: String(nextBooking.patientId),
          notification: {
            _id: notifDoc._id,
            title: notifDoc.title,
            message: notifDoc.message,
            type: "status",
            relatedBookingId: nextBooking._id,
            isRead: false,
            createdAt: notifDoc.createdAt,
            queueNumber: nextBooking.queueNumber,
            doctorName: nextBooking.doctorName,
            departmentName,
          },
        });
        console.log("[AUTO-SKIP] Skipped:", booking.patientName, "-", booking.queueNumber, "| Next:", nextBooking.patientName, "-", nextBooking.queueNumber);
      } else {
        console.log("[AUTO-SKIP] Skipped:", booking.patientName, "-", booking.queueNumber, "| No next queue");
      }
    } catch (err) {
      console.error("[AUTO-SKIP] Error for booking", b._id, err.message);
    }
  }
}

function startAutoSkipJob(io) {
  runAutoSkip(io);
  const interval = setInterval(() => runAutoSkip(io), JOB_INTERVAL_MS);
  return () => clearInterval(interval);
}

module.exports = { runAutoSkip, startAutoSkipJob, MINUTES_BEFORE_AUTO_SKIP };
