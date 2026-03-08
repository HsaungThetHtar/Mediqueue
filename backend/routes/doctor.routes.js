const express = require("express");
const router = express.Router();
const doctorController = require("../controller/doctor.controller");
const auth = require("../middleware/auth");
const { requireRole } = require("../middleware/role");

// สาธารณะ — ใช้ใน flow จอง
router.get("/", doctorController.getDoctors);
router.get("/departments", doctorController.getDepartments);
// หมอดูคิวของตัวเอง (ต้อง auth + role doctor)
router.get("/me/queues", auth, requireRole("doctor"), doctorController.getMyQueues);
router.get("/:id", doctorController.getDoctorById);

// จัดการหมอ — เฉพาะ admin
router.post("/", auth, requireRole("admin"), doctorController.createDoctor);
router.patch("/:id", auth, requireRole("admin"), doctorController.updateDoctor);
router.delete("/:id", auth, requireRole("admin"), doctorController.deleteDoctor);

// หมอเรียกคิว / บันทึกหมายเหตุ — admin หรือ doctor
router.patch("/:id/status", auth, requireRole("admin", "doctor"), doctorController.updatePatientStatus);
router.patch("/:id/booking-notes", auth, requireRole("admin", "doctor"), doctorController.saveBookingNotes);

module.exports = router;
