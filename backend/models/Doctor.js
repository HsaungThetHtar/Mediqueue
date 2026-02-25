const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  specialization: {
    type: String,
    required: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  qualifications: [String],
  isAvailable: {
    type: Boolean,
    default: true
  },
  availability: {
    type: String,
    enum: ['available', 'nearlyFull', 'full'],
    default: 'available'
  },
  workingHours: {
    type: String,
    default: '08.00-17.00'
  },
  currentQueueServing: {
    type: Number,
    default: 0
  },
  imageUrl: {
    type: String,
    default: ''
  }
});

module.exports = mongoose.model('Doctor', doctorSchema);