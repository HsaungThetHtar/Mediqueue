const mongoose = require("mongoose");

const checkInSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  checkInTime: { type: Date, default: Date.now },
  method: { type: String, enum: ["qr", "manual"], required: true },
  status: { type: String, enum: ["pending", "confirmed", "completed"], default: "pending" },
  notes: { type: String },
});

module.exports = mongoose.model("CheckIn", checkInSchema);