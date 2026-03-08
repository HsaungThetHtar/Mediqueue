const express = require("express");
const router = express.Router();
const departmentController = require("../controller/department.controller");
const auth = require("../middleware/auth");
const { requireRole } = require("../middleware/role");

// สาธารณะ — ใช้ใน flow จอง
router.get("/", departmentController.getDepartments);

// จัดการแผนก — เฉพาะ admin
router.post("/", auth, requireRole("admin"), departmentController.createDepartment);
router.patch("/:id", auth, requireRole("admin"), departmentController.updateDepartment);
router.delete("/:id", auth, requireRole("admin"), departmentController.deleteDepartment);

module.exports = router;
