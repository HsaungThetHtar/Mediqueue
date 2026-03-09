const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true },
  availability: {
    type: String,
    enum: ["available", "nearlyFull", "full"],
    default: "available",
  },
  workingHours: { type: String, default: "08:00 - 17:00" },
  currentQueueServing: { type: Number, default: 0 },
  imageUrl: { type: String, default: "" },
  currentQueue: { type: Number, default: 0 }, // total booked today
  maxQueue: { type: Number, default: 30 },
  // Optional link to the login user (role: doctor) for this doctor
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

// Auto-update availability based on currentQueue / maxQueue
doctorSchema.pre("save", async function () {
  const ratio = this.currentQueue / this.maxQueue;
  if (ratio >= 1) this.availability = "full";
  else if (ratio >= 0.8) this.availability = "nearlyFull";
  else this.availability = "available";
});

module.exports = mongoose.model("Doctor", doctorSchema);
