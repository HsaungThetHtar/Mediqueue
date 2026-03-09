const Doctor = require("../models/Doctor");
const Department = require("../models/Department");
const Booking = require("../models/Booking");
const Notification = require("../models/Notification");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const QueueEvent = require("../models/QueueEvent");

async function logQueueEvent({ bookingId, action, performedBy, performedByRole, queueNumber, notes }) {
  try { await QueueEvent.create({ bookingId, action, performedBy, performedByRole, queueNumber, notes }); }
  catch (err) { console.error("[QueueEvent] Failed to log:", err.message); }
}

exports.getDepartments = async function (req, res) {
  try {
    const list = await Department.find().sort({ displayOrder: 1 }).lean();
    const names = (list || []).map((d) => d.name).filter(Boolean);
    res.json(names);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getDoctors = async function (req, res) {
  try {
    const filter = {};
    if (req.query.departmentId) {
      filter.department = req.query.departmentId;
    } else if (req.query.department) {
      const dept = await Department.findOne({ name: req.query.department }).lean();
      if (dept) filter.department = dept._id;
    }
    if (req.query.userId) {
      filter.userId = req.query.userId;
    }
    const doctors = await Doctor.find(filter)
      .populate("department", "name displayOrder")
      .populate("userId", "email")
      .lean();
    const date = req.query.date;
    if (date && doctors.length > 0) {
      const ids = doctors.map((d) => d._id);
      const counts = await Booking.aggregate([
        { $match: { doctor: { $in: ids }, date: String(date), status: { $nin: ["canceled", "skipped"] } } },
        { $group: { _id: "$doctor", total: { $sum: 1 } } },
      ]);
      const countByDoctor = Object.fromEntries(counts.map((c) => [String(c._id), c.total]));
      doctors.forEach((d) => {
        d.dateQueueCount = countByDoctor[String(d._id)] ?? 0;
      });
    }
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyQueues = async function (req, res) {
  try {
    // Admin can pass ?doctorId= to view any doctor's queues; doctor finds by linked userId
    let doctor;
    if (req.query.doctorId) {
      doctor = await Doctor.findById(req.query.doctorId).lean();
    } else {
      doctor = await Doctor.findOne({ userId: req.user.userId }).lean();
    }
    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found for this account" });
    }
    const date = req.query.date;
    if (!date) {
      return res.status(400).json({ message: "Query date is required (YYYY-MM-DD)" });
    }

    // BUG-08 FIX: Support optional ?timeSlot=morning|afternoon so doctor can view each session separately
    const filter = {
      doctor: doctor._id,
      date: String(date),
      status: { $nin: ["canceled", "skipped"] },
    };
    if (req.query.timeSlot) {
      filter.timeSlot = req.query.timeSlot;
    }

    const queues = await Booking.find(filter)
      .populate({ path: "doctor", select: "name department", populate: { path: "department", select: "name" } })
      .populate("department", "name")
      .populate("patientId", "fullName dateOfBirth gender")
      .sort({ createdAt: 1 })
      .lean();
    res.json(queues);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getDoctorById = async function (req, res) {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate("department", "name displayOrder")
      .populate("userId", "email");
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    res.json(doctor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

async function ensureDoctorUser(doctorName, email, password, excludeDoctorId = null) {
  if (!email || !password) return null;
  const existing = await User.findOne({ email: email.toLowerCase().trim(), role: "doctor" });
  if (existing) {
    const alreadyLinked = await Doctor.findOne({ userId: existing._id, _id: { $ne: excludeDoctorId } });
    if (alreadyLinked) {
      throw new Error("อีเมลนี้ผูกกับหมออื่นแล้ว");
    }
    return existing._id;
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({
    fullName: doctorName || "Doctor",
    email: email.toLowerCase().trim(),
    password: hashed,
    role: "doctor",
  });
  return user._id;
}

exports.createDoctor = async function (req, res) {
  try {
    const { name, departmentId, workingHours, imageUrl, email, password } = req.body;
    if (!name || !departmentId) {
      return res.status(400).json({ message: "name and departmentId are required" });
    }
    const dept = await Department.findById(departmentId);
    if (!dept) return res.status(404).json({ message: "Department not found" });

    let userId = null;
    if (email && password) {
      userId = await ensureDoctorUser(name.trim(), email, password, null);
    }

    const doc = await Doctor.create({
      name: name.trim(),
      department: departmentId,
      workingHours: workingHours || "08:00 - 17:00",
      imageUrl: imageUrl || "",
      currentQueue: 0,
      currentQueueServing: 0,
      maxQueue: 30,
      userId: userId || undefined,
    });
    const populated = await Doctor.findById(doc._id)
      .populate("department", "name displayOrder")
      .populate("userId", "email")
      .lean();
    res.status(201).json(populated);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: "อีเมลนี้ถูกใช้งานแล้ว" });
    res.status(400).json({ message: err.message || err.toString() });
  }
};

exports.updateDoctor = async function (req, res) {
  try {
    const { name, departmentId, workingHours, imageUrl, email, password, unlinkUser } = req.body;
    const update = {};
    if (name != null) update.name = String(name).trim();
    if (departmentId != null) {
      const dept = await Department.findById(departmentId);
      if (!dept) return res.status(404).json({ message: "Department not found" });
      update.department = departmentId;
    }
    if (workingHours != null) update.workingHours = String(workingHours);
    if (imageUrl != null) update.imageUrl = String(imageUrl);

    if (unlinkUser === true || unlinkUser === "true") {
      update.userId = null;
    } else if (email && password) {
      const doctorName = name != null ? String(name).trim() : (await Doctor.findById(req.params.id).select("name").lean())?.name;
      update.userId = await ensureDoctorUser(doctorName, email, password, req.params.id);
    }

    const doc = await Doctor.findByIdAndUpdate(req.params.id, update, { returnDocument: 'after' })
      .populate("department", "name displayOrder")
      .populate("userId", "email")
      .lean();
    if (!doc) return res.status(404).json({ message: "Doctor not found" });
    res.json(doc);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: "อีเมลนี้ถูกใช้งานแล้ว" });
    res.status(400).json({ message: err.message || err.toString() });
  }
};

exports.deleteDoctor = async function (req, res) {
  try {
    const active = await Booking.countDocuments({ doctor: req.params.id, status: { $nin: ["canceled", "skipped"] } });
    if (active > 0) {
      return res.status(409).json({ message: "Cannot delete: this doctor has active bookings" });
    }
    const doc = await Doctor.findById(req.params.id).select("userId").lean();
    if (!doc) return res.status(404).json({ message: "Doctor not found" });
    const linkedUserId = doc.userId;
    await Doctor.findByIdAndDelete(req.params.id);
    if (linkedUserId) {
      await User.findOneAndDelete({ _id: linkedUserId, role: "doctor" });
    }
    res.json({ deleted: true, id: doc._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /doctors/:id/status
exports.updatePatientStatus = async function (req, res) {
  try {
    const { bookingId, status } = req.body;
    const doctorId = req.params.id;

    if (!bookingId || !status) {
      return res.status(400).json({ message: "bookingId and status are required" });
    }

    // C4 FIX: Doctors may only update patients in their own queue
    if (req.user.role === "doctor") {
      const linkedDoctor = await Doctor.findOne({ userId: req.user.userId });
      if (!linkedDoctor || String(linkedDoctor._id) !== String(doctorId)) {
        return res.status(403).json({ message: "You can only update patients in your own queue" });
      }
    }

    const booking = await Booking.findOne({ _id: bookingId, doctor: doctorId });
    if (!booking) {
      return res.status(404).json({ message: "Booking not found for this doctor" });
    }

    // FIX #8: Doctor can only mark "completed" on a booking that is currently "in-progress"
    // This enforces: หมอกด completed ได้เฉพาะคนที่หมอรับบริการอยู่เท่านั้น
    if (status === "completed" && booking.status !== "in-progress") {
      return res.status(400).json({
        message: "Can only complete a booking that is currently in-progress",
      });
    }

    const update = status === "in-progress" ? { status, calledAt: new Date() } : { status };
    const updatedBooking = await Booking.findByIdAndUpdate(bookingId, update, { returnDocument: 'after' })
      .populate({ path: "doctor", select: "name department", populate: { path: "department", select: "name" } })
      .populate("department", "name");

    // When doctor completes: log FINISH event; advance queue to next patient
    let nextBooking = null;
    if (status === "completed") {
      // TC21: Log QUEUE_EVENT FINISH (NFR-AUD-01)
      await logQueueEvent({
        bookingId,
        action: "FINISH",
        performedBy: req.user && req.user.userId,
        performedByRole: req.user && req.user.role,
        queueNumber: booking.queueNumber,
      });

      // Prioritize "checked-in" => in-progress; else "waiting" => "called"
      nextBooking = await Booking.findOneAndUpdate(
        { doctor: booking.doctor, date: booking.date, timeSlot: booking.timeSlot, status: "checked-in", _id: { $ne: bookingId } },
        { status: "in-progress", calledAt: new Date() },
        { new: true, sort: { createdAt: 1 } }
      );

      if (!nextBooking) {
        nextBooking = await Booking.findOneAndUpdate(
          { doctor: booking.doctor, date: booking.date, timeSlot: booking.timeSlot, status: "waiting", _id: { $ne: bookingId } },
          { status: "called", calledAt: new Date() },
          { new: true, sort: { createdAt: 1 } }
        );
      }

      if (nextBooking) {
        const parts = String(nextBooking.queueNumber || "").split("-");
        const currentNumber = parts.length === 2 ? parseInt(parts[1], 10) || 0 : 0;
        await Doctor.findByIdAndUpdate(doctorId, { currentQueueServing: currentNumber });
        await logQueueEvent({
          bookingId: nextBooking._id,
          action: "CALL",
          performedBy: req.user && req.user.userId,
          performedByRole: req.user && req.user.role,
          queueNumber: nextBooking.queueNumber,
          notes: "auto-called after doctor FINISH",
        });
      }
    }

    let notificationTitle = "";
    let notificationMessage = "";

    switch (status) {
      case "in-progress":
        notificationTitle = "Appointment Started";
        notificationMessage = `Your appointment with ${booking.doctorName} has started.`;
        break;
      case "completed":
        notificationTitle = "Appointment Completed";
        notificationMessage = `Your appointment with ${booking.doctorName} has been completed.`;
        break;
      default:
        notificationTitle = "Appointment Status Updated";
        notificationMessage = `Your appointment status has been updated to ${status}.`;
    }

    const notifDoc = await Notification.create({
      userId: booking.patientId,
      title: notificationTitle,
      message: notificationMessage,
      type: "status",
      relatedBookingId: bookingId,
    });

    const departmentName = updatedBooking.department?.name || "";
    const io = req.app.get("io");
    // Patient gets their own booking-update; admins/doctors see the queue dashboard update
    io.to(`user:${booking.patientId}`).to("role:admin").to("role:doctor").emit("booking-update", { bookingId, status, booking: updatedBooking });
    io.to(`user:${booking.patientId}`).emit("notification", {
      userId: String(booking.patientId),
      notification: {
        _id: notifDoc._id,
        title: notificationTitle,
        message: notificationMessage,
        type: "status",
        relatedBookingId: bookingId,
        isRead: false,
        createdAt: notifDoc.createdAt,
        queueNumber: updatedBooking.queueNumber,
        doctorName: updatedBooking.doctorName,
        departmentName,
      },
    });

    if (nextBooking) {
      // Notify next patient too
      const nextNotif = await Notification.create({
        userId: nextBooking.patientId,
        title: "Your Queue is Called!",
        message: "Please proceed to the consultation room immediately.",
        type: "status",
        relatedBookingId: nextBooking._id,
      });
      io.to("role:admin").to("role:doctor").emit("queue-update", {
        type: "doctor-completed",
        completedBooking: updatedBooking,
        nextBooking,
      });
      io.to(`user:${nextBooking.patientId}`).emit("booking-update", { bookingId: nextBooking._id, status: nextBooking.status });
      io.to(`user:${nextBooking.patientId}`).emit("notification", {
        userId: String(nextBooking.patientId),
        notification: {
          _id: nextNotif._id,
          title: nextNotif.title,
          message: nextNotif.message,
          type: "status",
          relatedBookingId: nextBooking._id,
          isRead: false,
          createdAt: nextNotif.createdAt,
          queueNumber: nextBooking.queueNumber,
          doctorName: nextBooking.doctorName,
        },
      });
    }

    res.json(updatedBooking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.saveBookingNotes = async function (req, res) {
  try {
    const { bookingId, doctorNotes } = req.body;
    const doctorId = req.params.id;

    if (!bookingId) {
      return res.status(400).json({ message: "bookingId is required" });
    }

    // C4 FIX: Doctors may only add notes to their own patients
    if (req.user.role === "doctor") {
      const linkedDoctor = await Doctor.findOne({ userId: req.user.userId });
      if (!linkedDoctor || String(linkedDoctor._id) !== String(doctorId)) {
        return res.status(403).json({ message: "You can only add notes to your own patients" });
      }
    }

    const booking = await Booking.findOne({ _id: bookingId, doctor: doctorId });
    if (!booking) {
      return res.status(404).json({ message: "Booking not found for this doctor" });
    }

    const updated = await Booking.findByIdAndUpdate(
      bookingId,
      { doctorNotes: doctorNotes != null ? String(doctorNotes) : "" },
      { returnDocument: 'after' }
    )
      .populate({ path: "doctor", select: "name department", populate: { path: "department", select: "name" } })
      .populate("department", "name");

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};