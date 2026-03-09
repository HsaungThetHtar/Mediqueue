const Booking = require("../models/Booking");
const Doctor = require("../models/Doctor");
const { calculateETA } = require("../utils/eta");

// Generate queue number: M-001 (morning) or A-001 (afternoon)
async function generateQueueNumber(doctorId, date, timeSlot) {
  const prefix = timeSlot === "morning" ? "M" : "A";
  const count = await Booking.countDocuments({
    doctor: doctorId,
    date,
    timeSlot,
    status: { $ne: "canceled" },
  });
  const num = String(count + 1).padStart(3, "0");
  return `${prefix}-${num}`;
}

// POST /bookings
exports.createBooking = async function (req, res) {
  try {
    let { doctorId, date, timeSlot, patientName, patientId } = req.body;

    if (!doctorId || !date || !timeSlot) {
      return res.status(400).json({ message: "doctorId, date, and timeSlot are required" });
    }

    if (req.user.role !== "admin") {
      patientId = req.user.userId;
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    const existingCount = await Booking.countDocuments({
      doctor: doctorId,
      date,
      timeSlot,
      status: { $ne: "canceled" },
    });

    if (existingCount >= 15) {
      return res.status(409).json({ message: "This session is full" });
    }

    const position = existingCount + 1;
    const queueNumber = await generateQueueNumber(doctorId, date, timeSlot);
    const estimatedTime = calculateETA(position, timeSlot);

    const prefix = timeSlot === "morning" ? "M" : "A";
    const currentlyServing = `${prefix}-000`;

    const booking = await Booking.create({
      queueNumber,
      hospital: "Central City Hospital",
      department: doctor.department,
      doctor: doctorId,
      doctorName: doctor.name,
      date,
      timeSlot,
      estimatedTime,
      currentlyServing,
      patientId: patientId || req.user.userId,
      patientName: patientName || "Guest",
      status: "waiting",
    });
    await booking.populate("department", "name");

    doctor.currentQueue = doctor.currentQueue + 1;
    await doctor.save();

    const io = req.app.get("io");
    io.emit("doctor-update", doctor.toObject());

    res.status(201).json({
      ...booking.toObject(),
      currentlyServing,
    });
  } catch (err) {
    console.error("Error in createBooking:", err);
    res.status(500).json({ message: err.message });
  }
};

// GET /bookings/slot-counts
exports.getSlotCounts = async function (req, res) {
  try {
    const { doctorId, date } = req.query;
    if (!doctorId || !date) {
      return res.status(400).json({ message: "doctorId and date are required" });
    }
    const filter = { doctor: doctorId, date, status: { $ne: "canceled" } };
    const [morning, afternoon] = await Promise.all([
      Booking.countDocuments({ ...filter, timeSlot: "morning" }),
      Booking.countDocuments({ ...filter, timeSlot: "afternoon" }),
    ]);
    res.json({ morning, afternoon });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /bookings
exports.getBookings = async function (req, res) {
  try {
    const filter = {};
    if (req.query.patientId) filter.patientId = req.query.patientId;
    if (req.query.doctor) filter.doctor = req.query.doctor;
    if (req.query.date) filter.date = req.query.date;

    if (req.user.role !== "admin") {
      // FIX #2: Instead of blocking doctor/date filters for patients, just ignore them
      // and always scope to the logged-in user
      filter.patientId = req.user.userId;
      delete filter.doctor;
      delete filter.date;
    }

    const bookings = await Booking.find(filter).populate("department", "name").populate("doctor", "currentQueueServing").sort({ createdAt: -1 });
    const list = bookings.map((b) => {
      const obj = b.toObject ? b.toObject() : b;
      if (b.doctor && b.status !== "canceled" && b.status !== "completed") {
        const serving = servingToNumber(b.doctor.currentQueueServing);
        const parts = (b.queueNumber || "").split("-");
        const prefix = parts[0] || "Q";
        const myNum = parseInt(parts[1], 10) || 0;
        const positionAhead = Math.max(0, myNum - serving);
        obj.queueStatus = {
          currentlyServing: `${prefix}-${String(serving).padStart(3, "0")}`,
          positionAhead,
          estimatedWaitMinutes: positionAhead * 15,
        };
      }
      return obj;
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

function servingToNumber(val) {
  if (val == null) return 0;
  if (typeof val === "number" && !Number.isNaN(val)) return val;
  const s = String(val).trim();
  const parts = s.split("-");
  if (parts.length >= 2) return parseInt(parts[parts.length - 1], 10) || 0;
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? 0 : n;
}

// GET /bookings/:id/queue-status
exports.getQueueStatus = async function (req, res) {
  try {
    const booking = await Booking.findById(req.params.id).populate("doctor", "currentQueueServing");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const serving = servingToNumber(booking.doctor?.currentQueueServing);
    const parts = (booking.queueNumber || "").split("-");
    const prefix = parts[0] || "Q";
    const myNum = parseInt(parts[1], 10) || 0;
    const positionAhead = Math.max(0, myNum - serving);
    res.json({
      queueNumber: booking.queueNumber,
      currentlyServing: `${prefix}-${String(serving).padStart(3, "0")}`,
      positionAhead,
      estimatedWaitMinutes: positionAhead * 15,
      status: booking.status,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /bookings/:id
exports.updateBooking = async function (req, res) {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.status === "canceled") {
      return res.status(400).json({ message: "Cannot update a canceled booking" });
    }

    const isOwner = booking.patientId && booking.patientId.toString() === req.user.userId;
    if (req.user.role !== "admin" && !isOwner) {
      return res.status(403).json({ message: "Not allowed to update this booking" });
    }

    const { doctorId, date, timeSlot } = req.body;
    const newDoctorId = doctorId ? doctorId : booking.doctor?.toString?.() || booking.doctor;
    const newDate = date || booking.date;
    const newTimeSlot = timeSlot || booking.timeSlot;

    const doctor = await Doctor.findById(newDoctorId);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    const newSlotCount = await Booking.countDocuments({
      doctor: newDoctorId,
      date: newDate,
      timeSlot: newTimeSlot,
      status: { $ne: "canceled" },
      _id: { $ne: booking._id },
    });
    if (newSlotCount >= 15) {
      return res.status(409).json({ message: "This session is full" });
    }

    const oldDoctorId = booking.doctor?.toString?.() || booking.doctor;
    const doctorChanged = oldDoctorId !== newDoctorId;

    if (doctorChanged) {
      const oldDoctor = await Doctor.findById(oldDoctorId);
      if (oldDoctor && oldDoctor.currentQueue > 0) {
        oldDoctor.currentQueue = oldDoctor.currentQueue - 1;
        await oldDoctor.save();
        const io = req.app.get("io");
        if (io) io.emit("doctor-update", oldDoctor.toObject());
      }
    }

    const position = newSlotCount + 1;
    const queueNumber = await generateQueueNumber(newDoctorId, newDate, newTimeSlot);
    const estimatedTime = calculateETA(position, newTimeSlot);

    booking.doctor = newDoctorId;
    booking.doctorName = doctor.name;
    booking.department = doctor.department;
    booking.date = newDate;
    booking.timeSlot = newTimeSlot;
    booking.queueNumber = queueNumber;
    booking.estimatedTime = estimatedTime;
    await booking.save();

    if (doctorChanged) {
      doctor.currentQueue = (doctor.currentQueue || 0) + 1;
      await doctor.save();
      const io = req.app.get("io");
      if (io) io.emit("doctor-update", doctor.toObject());
    }

    await booking.populate("department", "name");

    const io = req.app.get("io");
    if (io) io.emit("queue-update", { type: "status", booking: booking.toObject() });

    res.json(booking);
  } catch (err) {
    console.error("Error in updateBooking:", err);
    res.status(500).json({ message: err.message });
  }
};

// PATCH /bookings/:id/cancel
exports.cancelBooking = async function (req, res) {
  try {
    const existing = await Booking.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Booking not found" });

    const isOwner = existing.patientId && existing.patientId.toString() === req.user.userId;
    if (req.user.role !== "admin" && !isOwner) {
      return res.status(403).json({ message: "Not allowed to cancel this booking" });
    }

    // FIX #3: Patient cannot cancel after check-in
    // Only "waiting" status can be cancelled by patient
    // Admin can cancel waiting or checked-in (but not in-progress/completed)
    const cancellableByPatient = ["waiting"];
    const cancellableByAdmin = ["waiting", "checked-in", "confirmed"];

    if (req.user.role !== "admin" && !cancellableByPatient.includes(existing.status)) {
      return res.status(400).json({
        message: "Cannot cancel booking after check-in. Please contact hospital staff.",
      });
    }

    if (req.user.role === "admin" && !cancellableByAdmin.includes(existing.status)) {
      return res.status(400).json({
        message: `Cannot cancel a booking with status "${existing.status}"`,
      });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: "canceled" },
      { new: true }
    ).populate("department", "name");

    const doctor = await Doctor.findById(booking.doctor);
    if (doctor && doctor.currentQueue > 0) {
      doctor.currentQueue = doctor.currentQueue - 1;
      await doctor.save();
      const io = req.app.get("io");
      io.emit("doctor-update", doctor.toObject());
    }

    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};