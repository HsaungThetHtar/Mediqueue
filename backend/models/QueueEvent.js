const mongoose = require("mongoose");

const queueEventSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
  action: {
    type: String,
    enum: ["CALL", "SKIP", "COMPLETE", "CHECKIN", "CANCEL", "FINISH", "STATUS_CHANGE"],
    required: true,
  },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  performedByRole: { type: String },
  queueNumber: { type: String },
  notes: { type: String },
  timestamp: { type: Date, default: Date.now },
});

queueEventSchema.index({ bookingId: 1 });
queueEventSchema.index({ timestamp: -1 });

module.exports = mongoose.model("QueueEvent", queueEventSchema);
