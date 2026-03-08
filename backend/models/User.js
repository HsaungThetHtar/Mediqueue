const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String },
  dateOfBirth: { type: String },
  gender: { type: String },
  identificationNumber: { type: String },
  password: { type: String, required: true },
  role: { type: String, enum: ["patient", "admin", "doctor"], default: "patient" },
  notifyNewBooking: { type: Boolean, default: true },
  notifyUrgentCall: { type: Boolean, default: true },
  notifySms: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
