const express = require("express");
const router = express.Router();

const adminController = require("../controller/admin.controller");
const adminQueueController = require("../controller/admin.queue.controller");
const auth = require("../middleware/auth");

// login
router.post("/login", adminController.login);

// queue (protected)
router.get("/queues", auth, adminQueueController.getQueues);
router.post("/queues/:id/call", auth, adminQueueController.callQueue);
router.post("/queues/:id/skip", auth, adminQueueController.skipQueue);

module.exports = router;