const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Doctor = require('../models/Doctor');
const Department = require('../models/Department');
const QueueBooking = require('../models/QueueBooking');
const authDoctor = require('../middleware/authDoctor');

// Register doctor
router.post('/register', async (req, res) => {
  try {
    const { name, specialization, departmentId, qualifications, password } = req.body;

    // Basic validation
    if (!name || !specialization || !departmentId || !password) {
      return res.status(400).json({ msg: 'Please provide required fields' });
    }

    // Create doctor
    const doctor = new Doctor({
      name,
      specialization,
      department: departmentId,
      qualifications: qualifications || []
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

// Update booking status (CALL/IN_PROGRESS/COMPLETED/CANCELLED)
router.put('/booking/:bookingId/status', authDoctor, async (req, res) => {
  try {
    const doctorId = req.doctor.id;
    const { status } = req.body;

    const booking = await QueueBooking.findOne({ _id: req.params.bookingId, doctor: doctorId });
    if (!booking) return res.status(404).json({ msg: 'Booking not found' });

    booking.status = status;
    await booking.save();

    res.json(booking);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
