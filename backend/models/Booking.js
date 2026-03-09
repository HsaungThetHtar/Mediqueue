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
    enum: ["waiting", "checked-in", "confirmed", "called", "in-progress", "completed", "canceled", "skipped"],
    default: "waiting",
  },
  /** Set when status is set to "called"; used for auto-skip after 10 min of no response */
  calledAt: { type: Date },
  /** Set when status becomes "skipped"; used for auto-cancel after another 10 min if no re-check-in */
  skippedAt: { type: Date },
  /** Set when booking is canceled */
  cancelledAt: { type: Date },
  doctorNotes: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

bookingSchema.index({ doctor: 1, date: 1, timeSlot: 1, status: 1 });
bookingSchema.index({ patientId: 1 });

module.exports = mongoose.model("Booking", bookingSchema);