const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const SiteConfig = require("../models/SiteConfig");

exports.login = async function (req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email, role: "admin" });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const DEFAULT_CONFIG = {
  hospitalName: "Central City Hospital",
  queuePerSession: 15,
  queuePerDay: 30,
  businessHours: "08:00 - 17:00",
};

exports.getSiteConfig = async function (req, res) {
  try {
    const doc = await SiteConfig.findOne().lean();
    res.json(doc || DEFAULT_CONFIG);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateSiteConfig = async function (req, res) {
  try {
    const { hospitalName, queuePerSession, queuePerDay, businessHours } = req.body;
    const update = {};
    if (hospitalName != null) update.hospitalName = String(hospitalName);
    if (queuePerSession != null) update.queuePerSession = Number(queuePerSession);
    if (queuePerDay != null) update.queuePerDay = Number(queuePerDay);
    if (businessHours != null) update.businessHours = String(businessHours);

    const doc = await SiteConfig.findOneAndUpdate({}, update, { new: true, upsert: true }).lean();
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};