const express = require("express");
const router = express.Router();
const notificationController = require("../controller/notification.controller");
const auth = require("../middleware/auth");
const { requireRole } = require("../middleware/role");

router.get("/", auth, notificationController.getNotifications);
router.patch("/:id/read", auth, notificationController.markAsRead);
// C5 FIX: Only admins can create notifications via API; internal creation goes through controllers directly
router.post("/", auth, requireRole("admin"), notificationController.createNotification);
// M8 FIX: DELETE / must come before DELETE /:id to avoid routing ambiguity
router.delete("/", auth, notificationController.deleteAllNotifications);
router.delete("/:id", auth, notificationController.deleteNotification);

module.exports = router;