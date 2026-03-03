const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Patient = require('../models/patient');
const Department = require('../models/Department');
const Doctor = require('../models/Doctor');
const QueueBooking = require('../models/QueueBooking');
const auth = require('../middleware/auth');
// ...existing code...

// QR code check-in endpoint
router.post('/checkin', async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      console.error('[checkin] Missing bookingId in request body:', req.body);
      return res.status(400).json({ msg: 'Missing bookingId. Please scan a valid QR code.' });
    }
    const booking = await QueueBooking.findById(bookingId);
    if (!booking) {
      console.error('[checkin] Booking not found for bookingId:', bookingId);
      return res.status(404).json({ msg: 'Booking not found. Please check your queue slip.' });
    }
    if (booking.status === 'IN_PROGRESS' || booking.status === 'COMPLETED') {
      console.error('[checkin] Booking already checked in or completed:', bookingId, booking.status);
      return res.status(400).json({ msg: 'Already checked in or completed. Please contact the registration desk if you need help.' });
    }
    booking.status = 'IN_PROGRESS';
    await booking.save();
    res.json({ msg: 'Check-in successful', queueNumber: booking.queueNumber, status: booking.status });
  } catch (err) {
    console.error('[checkin] Server error:', err.message);
    res.status(500).json({ msg: 'Server error during check-in. Please try again or ask for help.' });
  }
});
// ...existing code...

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
    const departments = await Department.find({});
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
    console.log('[check-availability] departmentId:', departmentId, 'doctorId:', doctorId, 'appointmentDate:', appointmentDate);
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
    console.log('[book-queue] Incoming body:', req.body);

    // Validate required fields
    if (!departmentId || !doctorId || !session || !appointmentDate) {
      console.error('[book-queue] Missing required field:', { departmentId, doctorId, session, appointmentDate });
      return res.status(400).json({ msg: 'Missing required booking information.' });
    }
    if (!req.patient || !req.patient.id) {
      console.error('[book-queue] Missing patient authentication:', req.patient);
      return res.status(400).json({ msg: 'Authentication error. Please sign in again.' });
    }

    // Validate session times
    const date = new Date(appointmentDate);
    if (isNaN(date.getTime())) {
      console.error('[book-queue] Invalid appointmentDate:', appointmentDate);
      return res.status(400).json({ msg: 'Invalid appointment date.' });
    }
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
      console.error('[book-queue] Duplicate booking for patient:', req.patient.id);
      return res.status(400).json({ msg: 'You already have an active booking for this date.' });
    }

    // Get count of bookings for the selected session
    const sessionBookings = await QueueBooking.countDocuments({
      appointmentDate: { $gte: date, $lt: nextDay },
      session: session,
      status: { $ne: 'CANCELLED' }
    });

    if (sessionBookings >= 20) {
      console.error('[book-queue] Session full:', session, appointmentDate);
      return res.status(400).json({ msg: 'No slots available for this session.' });
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
    console.error('[book-queue] Error:', err);
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