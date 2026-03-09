const CheckIn = require("../models/CheckIn");
const Booking = require("../models/Booking");
const Notification = require("../models/Notification");

// POST /checkin
exports.createCheckIn = async function (req, res) {
  try {
    const { bookingId, method, notes } = req.body;
    const patientId = req.user.userId;

    if (!bookingId || !method) {
      return res.status(400).json({ message: "bookingId and method are required" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (!booking.patientId || booking.patientId.toString() !== patientId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Accept check-in for "waiting" (first time) OR "skipped" (re-check-in after timeout)
    if (booking.status !== "waiting" && booking.status !== "skipped") {
      return res.status(400).json({ message: "Booking is not available for check-in" });
    }

    // FIX #4: Prevent duplicate check-in — but for skipped, delete old CheckIn record first to allow re-checkin
    const existingCheckIn = await CheckIn.findOne({ bookingId });
    if (existingCheckIn) {
      if (booking.status === "skipped") {
        // Re-checkin after timeout — remove old record and allow new one
        await CheckIn.deleteOne({ _id: existingCheckIn._id });
      } else {
        return res.status(409).json({ message: "Already checked in for this booking" });
      }
    }

    const checkIn = await CheckIn.create({
      bookingId,
      patientId,
      method,
      notes,
      status: "confirmed",
    });

    await Booking.findByIdAndUpdate(bookingId, {
      status: "checked-in",
      calledAt: null,     // clear call timestamp
      skippedAt: null,    // stop the 10-min auto-cancel countdown
    });

    const notifDoc = await Notification.create({
      userId: patientId,
      title: "Check-in Confirmed",
      message: `You have successfully checked in for your appointment with ${booking.doctorName}`,
      type: "status",
      relatedBookingId: bookingId,
    });

    const io = req.app.get("io");
    io.to(`user:${patientId}`).to("role:admin").emit("checkin-update", { bookingId, status: "checked-in" });
    io.to(`user:${patientId}`).emit("notification", {
      userId: String(patientId),
      notification: { _id: notifDoc._id, title: notifDoc.title, message: notifDoc.message, type: "status", relatedBookingId: bookingId, isRead: false, createdAt: notifDoc.createdAt },
    });

    res.status(201).json(checkIn);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /checkin/validate
exports.validateBookingCode = async function (req, res) {
  try {
    const code = (req.query.code || "").trim();
    const userId = req.user.userId;

    if (!code) {
      return res.status(400).json({ message: "code is required" });
    }

    const mongoose = require("mongoose");
    const isObjectId = mongoose.Types.ObjectId.isValid(code) && String(new mongoose.Types.ObjectId(code)) === code;
    const filter = isObjectId ? { _id: code } : { queueNumber: code };
    const booking = await Booking.findOne(filter)
      .populate("doctor", "name")
      .populate("department", "name")
      .lean();

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.patientId && booking.patientId.toString() !== userId) {
      return res.status(403).json({ message: "This booking does not belong to your account" });
    }

    // Allow check-in for "waiting" (first time) OR "skipped" (re-checkin after timeout)
    if (booking.status !== "waiting" && booking.status !== "skipped") {
      return res.status(400).json({
        message: "Booking is not available for check-in",
        status: booking.status,
      });
    }

    const timeLabel = booking.timeSlot === "morning" ? "08.00-12.00" : "13.00-17.00";
    res.json({
      id: booking._id,
      queueNumber: booking.queueNumber,
      doctor: booking.doctorName || (booking.doctor && booking.doctor.name),
      doctorName: booking.doctorName || (booking.doctor && booking.doctor.name),
      department: booking.department && booking.department.name,
      hospital: booking.hospital || "Central City Hospital",
      date: booking.date,
      time: timeLabel,
      timeSlot: booking.timeSlot,
      estimatedTime: booking.estimatedTime,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /checkin/:bookingId
exports.getCheckInStatus = async function (req, res) {
  try {
    const { bookingId } = req.params;
    const patientId = req.user.userId;

    const booking = await Booking.findById(bookingId);
    if (!booking || !booking.patientId || booking.patientId.toString() !== patientId) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const checkIn = await CheckIn.findOne({ bookingId });
    res.json(checkIn);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /admin/checkins
exports.getCheckInsByPatient = async function (req, res) {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { patientId, date } = req.query;

    if (date) {
      const bookingsForDate = await Booking.find({ date }).select("_id");
      const bookingIds = bookingsForDate.map((b) => b._id);
      const checkIns = await CheckIn.find({ bookingId: { $in: bookingIds } })
        .populate({ path: "bookingId", select: "queueNumber doctorName date timeSlot status department patientName estimatedTime", populate: { path: "department", select: "name" } })
        .sort({ checkInTime: -1 });
      return res.json(checkIns);
    }

    if (!patientId) {
      return res.status(400).json({ message: "patientId or date is required" });
    }

    const checkIns = await CheckIn.find({ patientId })
      .populate("bookingId", "queueNumber doctorName date timeSlot status")
      .sort({ checkInTime: -1 });

    res.json(checkIns);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};