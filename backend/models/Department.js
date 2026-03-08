const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  displayOrder: { type: Number, required: true, default: 0 },
});

module.exports = mongoose.model("Department", departmentSchema);
