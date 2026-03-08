const express = require("express");
const router = express.Router();
const checkinController = require("../controller/checkin.controller");
const auth = require("../middleware/auth");

router.post("/", auth, checkinController.createCheckIn);
router.get("/validate", auth, checkinController.validateBookingCode);
router.get("/:bookingId", auth, checkinController.getCheckInStatus);

module.exports = router;