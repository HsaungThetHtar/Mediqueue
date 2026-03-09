const mongoose = require("mongoose");

const siteConfigSchema = new mongoose.Schema({
  hospitalName: { type: String, default: "Central City Hospital" },
  queuePerSession: { type: Number, default: 15 },
  queuePerDay: { type: Number, default: 30 },
  businessHours: { type: String, default: "08:00 - 17:00" },
}, { timestamps: true });

// ใช้เอกสารเดียว (id คงที่)
siteConfigSchema.statics.SINGLETON_ID = "site";

module.exports = mongoose.model("SiteConfig", siteConfigSchema);
