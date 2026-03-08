const express = require("express");
const router = express.Router();
const notificationController = require("../controller/notification.controller");
const auth = require("../middleware/auth");

router.get("/", auth, notificationController.getNotifications);
router.patch("/:id/read", auth, notificationController.markAsRead);
router.post("/", auth, notificationController.createNotification);
router.delete("/", auth, notificationController.deleteAllNotifications);
router.delete("/:id", auth, notificationController.deleteNotification);

module.exports = router;