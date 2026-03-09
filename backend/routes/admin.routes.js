const express = require("express");
const router = express.Router();

const adminController = require("../controller/admin.controller");
const adminQueueController = require("../controller/admin.queue.controller");
const checkinController = require("../controller/checkin.controller");
const auth = require("../middleware/auth");
const { requireRole } = require("../middleware/role");

const adminOnly = [auth, requireRole("admin")];

// login (ไม่ต้อง auth)
router.post("/login", adminController.login);

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

// system settings
router.get("/settings/config", ...adminOnly, adminController.getSiteConfig);
router.patch("/settings/config", ...adminOnly, adminController.updateSiteConfig);

module.exports = router;
