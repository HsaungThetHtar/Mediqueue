const express = require("express");
const router = express.Router();
const bookingController = require("../controller/booking.controller");
const auth = require("../middleware/auth");
const { createBookingRules, handleValidation } = require("../middleware/validate");

// สาธารณะ — ใช้ใน flow เลือกหมอ/วันที่
router.get("/slot-counts", bookingController.getSlotCounts);

// ต้อง login
router.post("/", auth, createBookingRules, handleValidation, bookingController.createBooking);
router.get("/", auth, bookingController.getBookings);

// :id routes (ต้องอยู่หลัง / และ /slot-counts)
router.get("/:id/queue-status", bookingController.getQueueStatus);
router.patch("/:id/cancel", auth, bookingController.cancelBooking);
router.patch("/:id", auth, bookingController.updateBooking);

module.exports = router;
