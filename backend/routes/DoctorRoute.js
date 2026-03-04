const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const Department = require('../models/Department');
const QueueBooking = require('../models/QueueBooking');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authDoctor = require('../middleware/authDoctor');
// const QueueBooking = require("../models/QueueBooking");
// Update checklist for a booking
router.put("/booking/:bookingId/checklist", authDoctor, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { checklist } = req.body;
    const booking = await QueueBooking.findById(bookingId);
    if (!booking) return res.status(404).json({ msg: "Booking not found" });
    // Only allow doctor who owns the booking
    if (booking.doctor.toString() !== req.doctor.id) {
      return res.status(403).json({ msg: "Not authorized" });
    }
    booking.checklist = checklist;
    await booking.save();
    res.json({ msg: "Checklist updated" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});


// Get logged-in doctor's profile
router.get('/profile', authDoctor, async (req, res) => {
  try {
    const doctorId = req.doctor.id;
    const doctor = await Doctor.findById(doctorId)
      .select('-password')
      .populate('department', 'name');
    if (!doctor) return res.status(404).json({ msg: 'Doctor not found' });
    res.json({
      name: doctor.name,
      email: doctor.email,
      specialization: doctor.specialization,
      department: doctor.department,
      qualifications: doctor.qualifications,
      imageUrl: doctor.imageUrl || '',
      workingHours: doctor.workingHours || '',
      isAvailable: doctor.isAvailable || false
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get queue for doctor for any date
router.get('/queue', authDoctor, async (req, res) => {
  try {
    const doctorId = req.doctor?.id;
    let { date } = req.query;
    let start, end;
    if (date) {
      // Parse date string (YYYY-MM-DD)
      start = new Date(date);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(start.getDate() + 1);
    } else {
      // Default to today
      start = new Date();
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(start.getDate() + 1);
    }
    // Find bookings for this doctor on selected date
    const bookings = await QueueBooking.find({
      doctor: doctorId,
      appointmentDate: { $gte: start, $lt: end }
    }).populate('patient', 'name email phone');
    res.json({ bookings });
  } catch (err) {
    console.error('[Doctor Dashboard] Error:', err);
    res.status(500).send('Server error');
  }
});
// Doctor login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ msg: 'Email and password required' });
    }
    const doctor = await Doctor.findOne({ email });
    if (!doctor) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    if (!doctor.password) {
      return res.status(400).json({ msg: 'No password set for this doctor' });
    }
    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    // Create JWT
    const payload = {
      doctor: {
        id: doctor.id,
        name: doctor.name,
        specialization: doctor.specialization
      }
    };
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          userType: "doctor",
          doctor: {
            id: doctor.id,
            name: doctor.name,
            specialization: doctor.specialization
          }
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update doctor profile
router.put('/profile', authDoctor, async (req, res) => {
  try {
    const doctorId = req.doctor.id;
    const updateFields = (({ name, specialization, qualifications, imageUrl, workingHours }) => ({ name, specialization, qualifications, imageUrl, workingHours }))(req.body);
    const doctor = await Doctor.findByIdAndUpdate(doctorId, updateFields, { new: true });
    if (!doctor) return res.status(404).json({ msg: 'Doctor not found' });
    res.json(doctor);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Change password
router.put('/change-password', authDoctor, async (req, res) => {
  try {
    const doctorId = req.doctor.id;
    const { oldPassword, newPassword } = req.body;
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ msg: 'Doctor not found' });
    const isMatch = await bcrypt.compare(oldPassword, doctor.password);
    if (!isMatch) return res.status(400).json({ msg: 'Old password incorrect' });
    const salt = await bcrypt.genSalt(10);
    doctor.password = await bcrypt.hash(newPassword, salt);
    await doctor.save();
    res.json({ msg: 'Password changed successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});
// ...existing code...

// Register doctor
router.post('/register', async (req, res) => {
  try {
    const { name, email, specialization, departmentId, qualifications, password } = req.body;

    // Basic validation
    if (!name || !email || !specialization || !departmentId || !password) {
      return res.status(400).json({ msg: 'Please provide required fields' });
    }

    // Check if doctor already exists
    const existingDoctor = await Doctor.findOne({ email });
    if (existingDoctor) {
      return res.status(400).json({ msg: 'Doctor already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create doctor
    const doctor = new Doctor({
      name,
      email,
      specialization,
      department: departmentId,
      qualifications: qualifications ? (Array.isArray(qualifications) ? qualifications : qualifications.split(',').map(q => q.trim())) : [],
      password: hashedPassword
    });

    await doctor.save();

    // If department exists, push doctor id into department.doctors
    await Department.findByIdAndUpdate(departmentId, { $addToSet: { doctors: doctor._id } });

    res.json(doctor);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get doctor profile (public)
router.get('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate('department', 'name description');
    if (!doctor) return res.status(404).json({ msg: 'Doctor not found' });
    res.json(doctor);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get all departments
router.get('/departments/all', async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true }).select('name');
    res.json(departments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get doctors by department name
router.get('/by-department/:departmentName', async (req, res) => {
  try {
    const departmentName = req.params.departmentName;
    const department = await Department.findOne({ name: departmentName, isActive: true });
    
    if (!department) {
      return res.status(404).json({ msg: 'Department not found' });
    }

    const doctors = await Doctor.find({ department: department._id }).populate('department', 'name maxDailyQueue');
    res.json(doctors);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// List doctors (optionally filter by department)
router.get('/', async (req, res) => {
  try {
    const { departmentId } = req.query;
    const filter = { };
    if (departmentId) filter.department = departmentId;
    const doctors = await Doctor.find(filter).populate('department', 'name');
    res.json(doctors);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Toggle availability (doctor authenticates via token)
router.put('/availability', authDoctor, async (req, res) => {
  try {
    const doctorId = req.doctor.id;
    const { isAvailable } = req.body;
    const doctor = await Doctor.findByIdAndUpdate(doctorId, { isAvailable }, { new: true });
    if (!doctor) return res.status(404).json({ msg: 'Doctor not found' });
    res.json(doctor);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get doctor's bookings
router.get('/my-bookings', authDoctor, async (req, res) => {
  try {
    const doctorId = req.doctor.id;
    const bookings = await QueueBooking.find({ doctor: doctorId })
      .populate('department', 'name')
      .populate('patient', 'name email phone')
      .sort({ appointmentDate: 1, queueNumber: 1 });
    res.json(bookings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update booking status (CALL/IN_PROGRESS/COMPLETED/CANCELLED) and add checklist when completed
router.put('/booking/:bookingId/status', authDoctor, async (req, res) => {
  try {
    const doctorId = req.doctor.id;
    const { status, checklist } = req.body;

    const booking = await QueueBooking.findOne({ _id: req.params.bookingId, doctor: doctorId });
    if (!booking) return res.status(404).json({ msg: 'Booking not found' });

    booking.status = status;
    // If marking as completed, optionally set checklist (no longer required)
    if (status === "completed" && checklist !== undefined) {
      booking.checklist = checklist;
    }
    await booking.save();

    res.json(booking);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
