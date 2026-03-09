const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  queueNumber: { type: String, required: true },
  hospital: { type: String, default: "Central City Hospital" },
  department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
  doctorName: { type: String, required: true },
  date: { type: String, required: true },
  timeSlot: { type: String, enum: ["morning", "afternoon"], required: true },
  estimatedTime: { type: String, required: true },
  currentlyServing: { type: String, default: "Q-000" },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  patientName: { type: String },
  status: {
    type: String,
    // FIX #1: Added "skipped" to enum (was missing — skipQueue was storing "canceled" instead)
    enum: ["waiting", "checked-in", "confirmed", "in-progress", "completed", "canceled", "skipped"],
    default: "waiting",
  },
  /** Set when status is set to in-progress (queue called); used for auto-skip after 10 min */
  calledAt: { type: Date },
  doctorNotes: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Booking", bookingSchema);