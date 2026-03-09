const Booking = require("../models/Booking");
const Doctor = require("../models/Doctor");
const CheckIn = require("../models/CheckIn");
const Notification = require("../models/Notification");

const populateDoctorAndDepartment = (q) =>
  q.populate({ path: "doctor", select: "name department", populate: { path: "department", select: "name" } }).populate("department", "name");

function queueNumberToServingInt(queueNumber) {
  const parts = String(queueNumber || "").split("-");
  return parts.length === 2 ? parseInt(parts[1], 10) || 0 : 0;
}

// GET /admin/queues/:id
exports.getQueueById = async function (req, res) {
  try {
    const booking = await populateDoctorAndDepartment(
      Booking.findById(req.params.id).populate("patientId", "fullName email phone dateOfBirth")
    );
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /admin/queues
exports.getQueues = async function (req, res) {
  try {
    const filter = {};
    if (req.query.date) filter.date = req.query.date;
    if (req.query.timeSlot) filter.timeSlot = req.query.timeSlot;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.doctor) filter.doctor = req.query.doctor;

    const queues = await populateDoctorAndDepartment(
      Booking.find(filter).populate("patientId", "fullName dateOfBirth gender").sort({ createdAt: 1 })
    );

    res.json(queues);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /admin/queues/:id/call
exports.callQueue = async function (req, res) {
  try {
    const booking = await populateDoctorAndDepartment(
      Booking.findByIdAndUpdate(req.params.id, { status: "in-progress", calledAt: new Date() }, { new: true })
    );

    if (!booking) return res.status(404).json({ message: "Queue not found" });

    await Doctor.findByIdAndUpdate(booking.doctor._id, {
      currentQueueServing: queueNumberToServingInt(booking.queueNumber),
    });

    const notifDoc = await Notification.create({
      userId: booking.patientId,
      title: "Your Queue is Called!",
      message: "Please proceed to the consultation room immediately.",
      type: "status",
      relatedBookingId: booking._id,
    });

    const departmentName = booking.department?.name || "";
    const io = req.app.get("io");
    io.emit("queue-update", { type: "called", booking });
    io.emit("notification", {
      userId: String(booking.patientId),
      notification: {
        _id: notifDoc._id,
        title: notifDoc.title,
        message: notifDoc.message,
        type: "status",
        relatedBookingId: booking._id,
        isRead: false,
        createdAt: notifDoc.createdAt,
        queueNumber: booking.queueNumber,
        doctorName: booking.doctorName,
        departmentName,
      },
    });

    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /admin/queues/:id/skip
exports.skipQueue = async function (req, res) {
  try {
    // FIX #5: Use "skipped" status instead of "canceled" so skipped vs cancelled can be distinguished
    const booking = await populateDoctorAndDepartment(
      Booking.findByIdAndUpdate(req.params.id, { status: "skipped" }, { new: true })
    );

    if (!booking) return res.status(404).json({ message: "Queue not found" });

    // FIX #6: Prioritize "checked-in" patients first when finding next in queue
    let nextBooking = await Booking.findOneAndUpdate(
      {
        doctor: booking.doctor._id,
        date: booking.date,
        timeSlot: booking.timeSlot,
        status: "checked-in",
      },
      { status: "in-progress", calledAt: new Date() },
      { new: true, sort: { createdAt: 1 } }
    );

    // If no checked-in patients, fall back to waiting
    if (!nextBooking) {
      nextBooking = await Booking.findOneAndUpdate(
        {
          doctor: booking.doctor._id,
          date: booking.date,
          timeSlot: booking.timeSlot,
          status: "waiting",
        },
        { status: "in-progress", calledAt: new Date() },
        { new: true, sort: { createdAt: 1 } }
      );
    }

    await Doctor.findByIdAndUpdate(booking.doctor._id, {
      currentQueueServing: nextBooking ? queueNumberToServingInt(nextBooking.queueNumber) : 0,
    });

    const io = req.app.get("io");
    io.emit("queue-update", { type: "skipped", booking, nextBooking: nextBooking || null });

    res.json({ skippedQueue: booking, nextQueue: nextBooking || null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /admin/queues/:id/complete
exports.completeQueue = async function (req, res) {
  try {
    const booking = await populateDoctorAndDepartment(
      Booking.findByIdAndUpdate(req.params.id, { status: "completed" }, { new: true })
    );

    if (!booking) return res.status(404).json({ message: "Queue not found" });

    await Doctor.findByIdAndUpdate(booking.doctor._id, {
      currentQueueServing: queueNumberToServingInt(booking.queueNumber),
    });

    const io = req.app.get("io");
    io.emit("queue-update", { type: "completed", booking });

    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /admin/queues/:id/status
const ALLOWED_STATUSES = ["waiting", "checked-in", "confirmed", "in-progress", "completed", "canceled", "skipped"];
exports.updateQueueStatus = async function (req, res) {
  try {
    const { status } = req.body || {};
    if (!status || !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Valid status required: " + ALLOWED_STATUSES.join(", ") });
    }
    const booking = await populateDoctorAndDepartment(
      Booking.findByIdAndUpdate(req.params.id, { status }, { new: true })
    );
    if (!booking) return res.status(404).json({ message: "Queue not found" });

    const io = req.app.get("io");
    io.emit("queue-update", { type: "status", booking });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /admin/queues/:id/checkin (manual check-in by staff/admin)
exports.manualCheckIn = async function (req, res) {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const bookingId = req.params.id;
    const { notes } = req.body || {};

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (!booking.patientId) {
      return res.status(400).json({ message: "Booking has no patient bound" });
    }

    if (booking.status !== "waiting") {
      return res.status(400).json({ message: "Only waiting bookings can be checked-in manually" });
    }

    // FIX #4 (admin side): Also prevent duplicate check-in
    const existingCheckIn = await CheckIn.findOne({ bookingId: booking._id });
    if (existingCheckIn) {
      return res.status(409).json({ message: "Patient is already checked in" });
    }

    const checkIn = await CheckIn.create({
      bookingId: booking._id,
      patientId: booking.patientId,
      method: "manual",
      notes,
      status: "confirmed",
    });

    await Booking.findByIdAndUpdate(bookingId, { status: "checked-in" });

    const notifDoc = await Notification.create({
      userId: booking.patientId,
      title: "Check-in Confirmed by Staff",
      message: `Staff has checked you in for your appointment with ${booking.doctorName}.`,
      type: "status",
      relatedBookingId: bookingId,
    });

    const io = req.app.get("io");
    io.emit("checkin-update", { bookingId, status: "checked-in" });
    io.emit("notification", {
      userId: String(booking.patientId),
      notification: { _id: notifDoc._id, title: notifDoc.title, message: notifDoc.message, type: "status", relatedBookingId: bookingId, isRead: false, createdAt: notifDoc.createdAt },
    });

    res.status(201).json(checkIn);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};