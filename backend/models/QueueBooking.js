const mongoose = require('mongoose');

const queueBookingSchema = new mongoose.Schema({
  queueNumber: {
    type: Number,
    required: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  session: {
    type: String,
    enum: ['MORNING', 'AFTERNOON'],
    required: true
  },
  status: {
    type: String,
    enum: ['WAITING', 'CALLED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    default: 'WAITING'
  },
  estimatedWaitTime: {
    type: Number, // in minutes
    default: 0
  },
  currentPosition: {
    type: Number,
    default: 0
  },
  bookingDate: {
    type: Date,
    default: Date.now
  },
  appointmentDate: {
    type: Date,
    required: true
  }
});

// Compound index to ensure unique queue numbers per day/session
queueBookingSchema.index({ appointmentDate: 1, session: 1, queueNumber: 1 }, { unique: true });

module.exports = mongoose.model('QueueBooking', queueBookingSchema);