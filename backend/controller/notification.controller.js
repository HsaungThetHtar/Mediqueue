const Notification = require("../models/Notification");

// GET /notifications
exports.getNotifications = async function (req, res) {
  try {
    const userId = req.user.userId;
    const notifications = await Notification.find({ userId })
      .populate("relatedBookingId", "queueNumber doctorName date")
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /notifications/:id/read
exports.markAsRead = async function (req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /notifications
exports.createNotification = async function (req, res) {
  try {
    const { userId, title, message, type, relatedBookingId } = req.body;

    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      relatedBookingId,
    });

    const io = req.app.get("io");
    io.emit("notification", { userId, notification });

    res.status(201).json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /notifications/:id — ลบรายการเดียว (เฉพาะของ user ที่ login)
exports.deleteNotification = async function (req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const notification = await Notification.findOneAndDelete({ _id: id, userId });
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.json({ success: true, _id: id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /notifications — ลบทั้งหมดของ user ที่ login
exports.deleteAllNotifications = async function (req, res) {
  try {
    const userId = req.user.userId;
    const result = await Notification.deleteMany({ userId });
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};