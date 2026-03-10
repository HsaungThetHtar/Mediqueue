const Booking = require("../models/Booking");
const Doctor = require("../models/Doctor");
const CheckIn = require("../models/CheckIn");
const Notification = require("../models/Notification");
const QueueEvent = require("../models/QueueEvent");

const populateDoctorAndDepartment = (q) =>
  q.populate({ path: "doctor", select: "name department", populate: { path: "department", select: "name" } }).populate("department", "name");

function sanitizeBooking(booking) {
  if (!booking) return null;
  const b = booking.toObject ? booking.toObject() : booking;
  return { _id: b._id, queueNumber: b.queueNumber, status: b.status, timeSlot: b.timeSlot, date: b.date, doctor: b.doctor ? { _id: b.doctor._id, name: b.doctor.name, currentQueueServing: b.doctor.currentQueueServing } : null, department: b.department ? { name: b.department.name } : null };
}

function queueNumberToServingInt(queueNumber) {
  const parts = String(queueNumber || "").split("-");
  return parts.length === 2 ? parseInt(parts[1], 10) || 0 : 0;
}

async function logQueueEvent({ bookingId, action, performedBy, performedByRole, queueNumber, notes }) {
  try { await QueueEvent.create({ bookingId, action, performedBy, performedByRole, queueNumber, notes }); }
  catch (err) { console.error("[QueueEvent] Failed to log:", err.message); }
}

async function notifyAlmostThere(io, doctorId, date, timeSlot, afterBooking) {
  try {
    const next = await Booking.findOne({
      doctor: doctorId, date, timeSlot,
      status: { $in: ["waiting", "checked-in"] },
      createdAt: { $gt: afterBooking.createdAt },
    }).sort({ createdAt: 1 });
    if (!next) return;
    const notif = await Notification.create({
      userId: next.patientId,
      title: "Almost Your Turn!",
      message: `Queue ${next.queueNumber}: Only 1 more patient ahead of you. Please be ready and stay near the consultation room.`,
      type: "status", relatedBookingId: next._id,
    });
    io.to("user:" + next.patientId).emit("notification", {
      userId: String(next.patientId),
      notification: { _id: notif._id, title: notif.title, message: notif.message, type: "status", relatedBookingId: next._id, isRead: false, createdAt: notif.createdAt, queueNumber: next.queueNumber, statusType: "almost-there" },
    });
  } catch (err) { console.error("[notifyAlmostThere] Failed:", err.message); }
}

exports.getQueueById = async function (req, res) {
  try {
    const booking = await populateDoctorAndDepartment(Booking.findById(req.params.id).populate("patientId", "fullName email phone dateOfBirth"));
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.json(booking);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getQueues = async function (req, res) {
  try {
    const filter = {};
    if (req.query.date) filter.date = req.query.date;
    if (req.query.timeSlot) filter.timeSlot = req.query.timeSlot;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.doctor) filter.doctor = req.query.doctor;
    const queues = await populateDoctorAndDepartment(Booking.find(filter).populate("patientId", "fullName dateOfBirth gender").sort({ createdAt: 1 }));
    res.json(queues);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /admin/queues/:id/call  TC15: Call Next -> status=CALLED, event logged
exports.callQueue = async function (req, res) {
  try {
    const existing = await Booking.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Queue not found" });
    let newStatus;
    if (existing.status === "checked-in") {
      newStatus = "in-progress";
    } else if (["waiting", "skipped"].includes(existing.status)) {
      newStatus = "called";
    } else {
      return res.status(400).json({ message: "Cannot call a booking with status: " + existing.status });
    }
    const booking = await populateDoctorAndDepartment(
      Booking.findByIdAndUpdate(req.params.id, { status: newStatus, calledAt: new Date() }, { returnDocument: 'after' })
    );
    await Doctor.findByIdAndUpdate(booking.doctor._id, { currentQueueServing: queueNumberToServingInt(booking.queueNumber) });
    await logQueueEvent({ bookingId: booking._id, action: "CALL", performedBy: req.user && req.user.userId, performedByRole: req.user && req.user.role, queueNumber: booking.queueNumber });
    const isInProgress = newStatus === "in-progress";
    const notifDoc = await Notification.create({ userId: booking.patientId, title: isInProgress ? "Consultation Started" : "Your Queue is Called!", message: isInProgress ? "Your consultation is now in progress. Please stay with the doctor." : "Please proceed to the consultation room immediately.", type: "status", relatedBookingId: booking._id });
    const departmentName = (booking.department && booking.department.name) || "";
    const io = req.app.get("io");
    io.to("role:admin").to("role:doctor").emit("queue-update", { type: "called", booking: sanitizeBooking(booking) });
    io.to("user:" + booking.patientId).emit("booking-update", { bookingId: booking._id, status: newStatus });
    io.to("user:" + booking.patientId).emit("notification", { userId: String(booking.patientId), notification: { _id: notifDoc._id, title: notifDoc.title, message: notifDoc.message, type: "status", relatedBookingId: booking._id, isRead: false, createdAt: notifDoc.createdAt, queueNumber: booking.queueNumber, doctorName: booking.doctorName, departmentName, statusType: newStatus } });
    await notifyAlmostThere(io, booking.doctor._id, booking.date, booking.timeSlot, booking);
    res.json(booking);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /admin/queues/:id/skip  TC16: Status=SKIPPED, event logged, next patient called
exports.skipQueue = async function (req, res) {
  try {
    const booking = await populateDoctorAndDepartment(
      Booking.findByIdAndUpdate(req.params.id, { status: "skipped", skippedAt: new Date() }, { returnDocument: 'after' })
    );
    if (!booking) return res.status(404).json({ message: "Queue not found" });
    await logQueueEvent({ bookingId: booking._id, action: "SKIP", performedBy: req.user && req.user.userId, performedByRole: req.user && req.user.role, queueNumber: booking.queueNumber });
    let nextBooking = await Booking.findOneAndUpdate(
      { doctor: booking.doctor._id, date: booking.date, timeSlot: booking.timeSlot, status: "checked-in" },
      { status: "in-progress", calledAt: new Date() }, { new: true, sort: { createdAt: 1 } }
    );
    if (!nextBooking) {
      nextBooking = await Booking.findOneAndUpdate(
        { doctor: booking.doctor._id, date: booking.date, timeSlot: booking.timeSlot, status: "waiting" },
        { status: "called", calledAt: new Date() }, { new: true, sort: { createdAt: 1 } }
      );
    }
    if (nextBooking) {
      await logQueueEvent({ bookingId: nextBooking._id, action: "CALL", performedBy: req.user && req.user.userId, performedByRole: req.user && req.user.role, queueNumber: nextBooking.queueNumber, notes: "auto-called after skip" });
    }
    await Doctor.findByIdAndUpdate(booking.doctor._id, { currentQueueServing: nextBooking ? queueNumberToServingInt(nextBooking.queueNumber) : 0 });
    const notif = await Notification.create({ userId: booking.patientId, title: "Your Queue Was Skipped", message: "Your queue " + booking.queueNumber + " was skipped. You have 10 minutes to re-check-in at the counter before your slot is permanently canceled.", type: "status", relatedBookingId: booking._id });
    const io = req.app.get("io");
    io.to("role:admin").to("role:doctor").emit("queue-update", { type: "skipped", booking: sanitizeBooking(booking), nextBooking: sanitizeBooking(nextBooking) });
    io.to("user:" + booking.patientId).emit("booking-update", { bookingId: booking._id, status: "skipped" });
    io.to("user:" + booking.patientId).emit("notification", { userId: String(booking.patientId), notification: { _id: notif._id, title: notif.title, message: notif.message, type: "status", relatedBookingId: booking._id, isRead: false, createdAt: notif.createdAt, queueNumber: booking.queueNumber, statusType: "skipped" } });
    if (nextBooking) {
      const nextStatus = nextBooking.status;
      const nextIsInProgress = nextBooking.status === "in-progress";
      const notifNext = await Notification.create({ userId: nextBooking.patientId, title: nextIsInProgress ? "Consultation Started" : "Your Queue is Called!", message: nextIsInProgress ? "Your consultation is now in progress. Please stay with the doctor." : "Please proceed to the consultation room immediately.", type: "status", relatedBookingId: nextBooking._id });
      io.to("role:admin").to("role:doctor").emit("queue-update", { type: "called", booking: sanitizeBooking(nextBooking) });
      io.to("user:" + nextBooking.patientId).emit("booking-update", { bookingId: nextBooking._id, status: nextStatus });
      io.to("user:" + nextBooking.patientId).emit("notification", { userId: String(nextBooking.patientId), notification: { _id: notifNext._id, title: notifNext.title, message: notifNext.message, type: "status", relatedBookingId: nextBooking._id, isRead: false, createdAt: notifNext.createdAt, queueNumber: nextBooking.queueNumber, doctorName: nextBooking.doctorName, statusType: nextBooking.status } });
      await notifyAlmostThere(io, booking.doctor._id, booking.date, booking.timeSlot, nextBooking);
    }
    res.json({ skippedQueue: booking, nextQueue: nextBooking || null });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /admin/queues/:id/complete  TC20: Status=COMPLETED, event logged
exports.completeQueue = async function (req, res) {
  try {
    const booking = await populateDoctorAndDepartment(
      Booking.findByIdAndUpdate(req.params.id, { status: "completed" }, { returnDocument: 'after' })
    );
    if (!booking) return res.status(404).json({ message: "Queue not found" });
    await logQueueEvent({ bookingId: booking._id, action: "COMPLETE", performedBy: req.user && req.user.userId, performedByRole: req.user && req.user.role, queueNumber: booking.queueNumber });
    let nextBooking = await Booking.findOneAndUpdate(
      { doctor: booking.doctor._id, date: booking.date, timeSlot: booking.timeSlot, status: "checked-in" },
      { status: "in-progress", calledAt: new Date() }, { new: true, sort: { createdAt: 1 } }
    );
    if (!nextBooking) {
      nextBooking = await Booking.findOneAndUpdate(
        { doctor: booking.doctor._id, date: booking.date, timeSlot: booking.timeSlot, status: "waiting" },
        { status: "called", calledAt: new Date() }, { new: true, sort: { createdAt: 1 } }
      );
    }
    if (nextBooking) {
      await logQueueEvent({ bookingId: nextBooking._id, action: "CALL", performedBy: req.user && req.user.userId, performedByRole: req.user && req.user.role, queueNumber: nextBooking.queueNumber, notes: "auto-called after complete" });
    }
    await Doctor.findByIdAndUpdate(booking.doctor._id, { currentQueueServing: nextBooking ? queueNumberToServingInt(nextBooking.queueNumber) : queueNumberToServingInt(booking.queueNumber) });
    const io = req.app.get("io");
    io.to("role:admin").to("role:doctor").emit("queue-update", { type: "completed", booking: sanitizeBooking(booking), nextBooking: sanitizeBooking(nextBooking) });
    if (nextBooking) {
      const nextStatus = nextBooking.status;
      const nextIsInProgress2 = nextBooking.status === "in-progress";
      const notifDoc = await Notification.create({ userId: nextBooking.patientId, title: nextIsInProgress2 ? "Consultation Started" : "Your Queue is Called!", message: nextIsInProgress2 ? "Your consultation is now in progress. Please stay with the doctor." : "Please proceed to the consultation room immediately.", type: "status", relatedBookingId: nextBooking._id });
      io.to("role:admin").to("role:doctor").emit("queue-update", { type: "called", booking: sanitizeBooking(nextBooking) });
      io.to("user:" + nextBooking.patientId).emit("booking-update", { bookingId: nextBooking._id, status: nextStatus });
      io.to("user:" + nextBooking.patientId).emit("notification", { userId: String(nextBooking.patientId), notification: { _id: notifDoc._id, title: notifDoc.title, message: notifDoc.message, type: "status", relatedBookingId: nextBooking._id, isRead: false, createdAt: notifDoc.createdAt, queueNumber: nextBooking.queueNumber, doctorName: nextBooking.doctorName, statusType: nextBooking.status } });
      await notifyAlmostThere(io, booking.doctor._id, booking.date, booking.timeSlot, nextBooking);
    }
    res.json({ completedQueue: booking, nextQueue: nextBooking || null });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// PATCH /admin/queues/:id/status
const ALLOWED_STATUSES = ["waiting", "checked-in", "confirmed", "called", "in-progress", "completed", "canceled", "skipped"];
exports.updateQueueStatus = async function (req, res) {
  try {
    const { status } = req.body || {};
    if (!status || !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Valid status required: " + ALLOWED_STATUSES.join(", ") });
    }
    const booking = await populateDoctorAndDepartment(Booking.findByIdAndUpdate(req.params.id, { status }, { returnDocument: 'after' }));
    if (!booking) return res.status(404).json({ message: "Queue not found" });
    await logQueueEvent({ bookingId: booking._id, action: "STATUS_CHANGE", performedBy: req.user && req.user.userId, performedByRole: req.user && req.user.role, queueNumber: booking.queueNumber, notes: "status set to " + status });
    const io = req.app.get("io");
    io.to("role:admin").to("role:doctor").emit("queue-update", { type: "status", booking: sanitizeBooking(booking) });
    io.to("user:" + booking.patientId).emit("booking-update", { bookingId: booking._id, status: booking.status });
    res.json(booking);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /admin/queues/:id/checkin  TC17: Staff scans QR -> CHECKIN + status=IN_PROGRESS
exports.manualCheckIn = async function (req, res) {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    const bookingId = req.params.id;
    const { notes } = req.body || {};
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (!booking.patientId) return res.status(400).json({ message: "Booking has no patient bound" });
    const allowedForCheckIn = ["called", "waiting", "skipped"];
    if (!allowedForCheckIn.includes(booking.status)) {
      return res.status(400).json({ message: "Only called, waiting, or skipped bookings can be checked in by staff (current: " + booking.status + ")" });
    }
    const existingCheckIn = await CheckIn.findOne({ bookingId: booking._id });
    if (existingCheckIn) {
      if (booking.status === "skipped") {
        await CheckIn.deleteOne({ _id: existingCheckIn._id });
      } else {
        return res.status(409).json({ message: "Patient is already checked in" });
      }
    }
    const checkIn = await CheckIn.create({ bookingId: booking._id, patientId: booking.patientId, method: "manual", notes, status: "confirmed" });
    await Booking.findByIdAndUpdate(bookingId, { status: "in-progress", calledAt: null, skippedAt: null });
    await logQueueEvent({ bookingId: booking._id, action: "CHECKIN", performedBy: req.user && req.user.userId, performedByRole: req.user && req.user.role, queueNumber: booking.queueNumber, notes: "staff QR check-in" });
    const notifDoc = await Notification.create({ userId: booking.patientId, title: "Consultation Started", message: "Staff has confirmed your check-in. Your consultation with " + booking.doctorName + " is now in progress.", type: "status", relatedBookingId: bookingId });
    const io = req.app.get("io");
    io.to("user:" + booking.patientId).to("role:admin").emit("checkin-update", { bookingId, status: "in-progress" });
    io.to("user:" + booking.patientId).emit("notification", { userId: String(booking.patientId), notification: { _id: notifDoc._id, title: notifDoc.title, message: notifDoc.message, type: "status", relatedBookingId: bookingId, isRead: false, createdAt: notifDoc.createdAt, queueNumber: booking.queueNumber, doctorName: booking.doctorName, statusType: "in-progress" } });
    res.status(201).json(checkIn);
  } catch (err) { res.status(500).json({ message: err.message }); }
};
