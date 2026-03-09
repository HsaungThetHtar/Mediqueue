const express = require("express");
const router = express.Router();

const adminController = require("../controller/admin.controller");
const adminQueueController = require("../controller/admin.queue.controller");
const checkinController = require("../controller/checkin.controller");
const auth = require("../middleware/auth");
const { requireRole } = require("../middleware/role");
const { signinRules, updateConfigRules, handleValidation } = require("../middleware/validate");

const adminOnly = [auth, requireRole("admin")];

// login (ไม่ต้อง auth)
router.post("/login", signinRules, handleValidation, adminController.login);

// queue — เฉพาะ admin
router.get("/queues", ...adminOnly, adminQueueController.getQueues);
router.get("/queues/:id", ...adminOnly, adminQueueController.getQueueById);
router.post("/queues/:id/call", ...adminOnly, adminQueueController.callQueue);
router.post("/queues/:id/skip", ...adminOnly, adminQueueController.skipQueue);
router.post("/queues/:id/complete", ...adminOnly, adminQueueController.completeQueue);
router.patch("/queues/:id/status", ...adminOnly, adminQueueController.updateQueueStatus);
router.post("/queues/:id/checkin", ...adminOnly, adminQueueController.manualCheckIn);

// check-in logs
router.get("/checkins", ...adminOnly, checkinController.getCheckInsByPatient);

// audit log — NFR-AUD-01
router.get("/queue-events", ...adminOnly, async (req, res) => {
  try {
    const QueueEvent = require("../models/QueueEvent");
    const filter = {};
    if (req.query.bookingId) filter.bookingId = req.query.bookingId;
    const events = await QueueEvent.find(filter).sort({ timestamp: -1 }).limit(200).lean();
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// system settings
router.get("/settings/config", ...adminOnly, adminController.getSiteConfig);
router.patch("/settings/config", ...adminOnly, updateConfigRules, handleValidation, adminController.updateSiteConfig);

module.exports = router;
