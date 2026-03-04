const mongoose = require('mongoose');

const QueueBookingSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: true,
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
    required: true,
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
    required: true,
  },
  appointmentDate: {
    type: Date,
    required: true,
  },
  session: {
    type: String,
    required: true,
  },
  queueNumber: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "completed", "cancelled"],
    default: "pending",
  },
  checklist: {
    type: String,
    default: "",
  },
});

// Compound index to ensure unique queue numbers per day/session
QueueBookingSchema.index({ appointmentDate: 1, session: 1, queueNumber: 1 }, { unique: true });

module.exports = mongoose.model('QueueBooking', QueueBookingSchema);