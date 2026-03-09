const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ["booking", "reminder", "status", "system"], default: "system" },
  isRead: { type: Boolean, default: false },
  relatedBookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Notification", notificationSchema);