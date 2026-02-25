const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  doctors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  maxDailyQueue: {
    type: Number,
    default: 30
  }
});

module.exports = mongoose.model('Department', departmentSchema);