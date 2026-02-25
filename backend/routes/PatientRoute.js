const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Patient = require('../models/patient');
const Department = require('../models/Department');
const Doctor = require('../models/Doctor');
const QueueBooking = require('../models/QueueBooking');
const auth = require('../middleware/auth');

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, dateOfBirth } = req.body;

    // Check if user already exists
    let patient = await Patient.findOne({ email });
    if (patient) {
      return res.status(400).json({ msg: 'Patient already exists' });
    }

    // Create new patient
    patient = new Patient({
      name,
      email,
      password,
      phone,
      dateOfBirth
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    patient.password = await bcrypt.hash(password, salt);

    await patient.save();

    // Create JWT
    const payload = {
      patient: {
        id: patient.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if patient exists
    const patient = await Patient.findOne({ email });
    if (!patient) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, patient.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Create JWT
    const payload = {
      patient: {
        id: patient.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          patient: {
            id: patient.id,
            name: patient.name,
            email: patient.email
          }
        });
      }
    );

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get patient profile
router.get('/profile', auth, async (req, res) => {
  try {
    const patient = await Patient.findById(req.patient.id).select('-password');
    res.json(patient);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get all departments
router.get('/departments', auth, async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true });
    res.json(departments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get doctors by department
router.get('/departments/:departmentId/doctors', auth, async (req, res) => {
  try {
    const doctors = await Doctor.find({ 
      department: req.params.departmentId,
      isAvailable: true 
    });
    res.json(doctors);
    console.log(`Fetched ${doctors.length} doctors for department ${req.params.departmentId}:`, doctors);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Check queue availability
router.post('/check-availability', auth, async (req, res) => {
  try {
    const { departmentId, doctorId, appointmentDate } = req.body;
    
    const date = new Date(appointmentDate);
    date.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);

    // Count bookings for the day
    const morningBookings = await QueueBooking.countDocuments({
      appointmentDate: { $gte: date, $lt: nextDay },
      session: 'MORNING',
      status: { $ne: 'CANCELLED' }
    });

    const afternoonBookings = await QueueBooking.countDocuments({
      appointmentDate: { $gte: date, $lt: nextDay },
      session: 'AFTERNOON',
      status: { $ne: 'CANCELLED' }
    });

    const maxSlots = 20; // 20 per session as per project scope

    res.json({
      morning: {
        available: morningBookings < maxSlots,
        booked: morningBookings,
        total: maxSlots,
        nextQueueNumber: morningBookings + 1
      },
      afternoon: {
        available: afternoonBookings < maxSlots,
        booked: afternoonBookings,
        total: maxSlots,
        nextQueueNumber: afternoonBookings + 1
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Create queue booking
router.post('/book-queue', auth, async (req, res) => {
  try {
    const { departmentId, doctorId, session, appointmentDate } = req.body;

    // Validate session times
    const date = new Date(appointmentDate);
    date.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);

    // Check if patient already has a booking for this day
    const existingBooking = await QueueBooking.findOne({
      patient: req.patient.id,
      appointmentDate: { $gte: date, $lt: nextDay },
      status: { $nin: ['COMPLETED', 'CANCELLED'] }
    });

    if (existingBooking) {
      return res.status(400).json({ msg: 'You already have an active booking for this date' });
    }

    // Get count of bookings for the selected session
    const sessionBookings = await QueueBooking.countDocuments({
      appointmentDate: { $gte: date, $lt: nextDay },
      session: session,
      status: { $ne: 'CANCELLED' }
    });

    if (sessionBookings >= 20) {
      return res.status(400).json({ msg: 'No slots available for this session' });
    }

    // Calculate queue number (1-20 for each session)
    const queueNumber = sessionBookings + 1;

    // Calculate estimated wait time (15 mins per patient)
    const patientsAhead = sessionBookings; // People ahead in queue
    const estimatedWaitTime = patientsAhead * 15; // 15 mins per patient
    const currentPosition = patientsAhead + 1;

    // Create booking
    const booking = new QueueBooking({
      queueNumber,
      patient: req.patient.id,
      department: departmentId,
      doctor: doctorId || null,
      session,
      appointmentDate: date,
      estimatedWaitTime,
      currentPosition
    });

    await booking.save();

    // Populate booking details
    await booking.populate('department', 'name');
    await booking.populate('doctor', 'name specialization');
    await booking.populate('patient', 'name email phone');

    res.json(booking);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get patient's bookings
router.get('/my-bookings', auth, async (req, res) => {
  try {
    const bookings = await QueueBooking.find({ patient: req.patient.id })
      .populate('department', 'name')
      .populate('doctor', 'name specialization')
      .sort({ appointmentDate: -1, createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get single booking details (digital slip)
router.get('/booking/:bookingId', auth, async (req, res) => {
  try {
    const booking = await QueueBooking.findOne({
      _id: req.params.bookingId,
      patient: req.patient.id
    })
    .populate('department', 'name description')
    .populate('doctor', 'name specialization qualifications')
    .populate('patient', 'name email phone');

    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }

    res.json(booking);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Cancel booking
router.put('/booking/:bookingId/cancel', auth, async (req, res) => {
  try {
    const booking = await QueueBooking.findOne({
      _id: req.params.bookingId,
      patient: req.patient.id
    });

    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }

    if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED') {
      return res.status(400).json({ msg: 'Cannot cancel this booking' });
    }

    booking.status = 'CANCELLED';
    await booking.save();

    res.json({ msg: 'Booking cancelled successfully', booking });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get real-time queue status
router.get('/queue-status/:bookingId', auth, async (req, res) => {
  try {
    const booking = await QueueBooking.findOne({
      _id: req.params.bookingId,
      patient: req.patient.id
    });

    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }

    const date = new Date(booking.appointmentDate);
    date.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);

    // Get all waiting bookings for the same session
    const waitingBookings = await QueueBooking.find({
      appointmentDate: { $gte: date, $lt: nextDay },
      session: booking.session,
      status: { $in: ['WAITING', 'CALLED'] },
      queueNumber: { $lt: booking.queueNumber }
    }).sort('queueNumber');

    const patientsAhead = waitingBookings.length;
    const estimatedWaitTime = patientsAhead * 15;

    res.json({
      queueNumber: booking.queueNumber,
      currentPosition: patientsAhead + 1,
      totalAhead: patientsAhead,
      estimatedWaitTime,
      status: booking.status,
      session: booking.session
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;