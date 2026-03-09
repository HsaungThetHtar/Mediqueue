const Department = require("../models/Department");
const Doctor = require("../models/Doctor");

// GET /departments — รายการแผนก เรียงตาม displayOrder
// ?full=1 — คืนค่าเต็ม { _id, name, displayOrder } สำหรับแอดมิน
exports.getDepartments = async function (req, res) {
  try {
    const list = await Department.find().sort({ displayOrder: 1 }).lean();
    if (req.query.full === "1" || req.query.full === "true") {
      const full = (list || []).map((d) => ({
        _id: d._id ? String(d._id) : d._id,
        name: d.name,
        displayOrder: d.displayOrder,
      }));
      return res.json(full);
    }
    const names = (list || []).map((d) => d.name).filter(Boolean);
    res.json(names);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /departments — เพิ่มแผนก
exports.createDepartment = async function (req, res) {
  try {
    const { name, displayOrder } = req.body;
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "name is required" });
    }
    const maxOrder = await Department.findOne().sort({ displayOrder: -1 }).select("displayOrder").lean();
    const order = typeof displayOrder === "number" ? displayOrder : ((maxOrder?.displayOrder ?? -1) + 1);
    const doc = await Department.create({ name: name.trim(), displayOrder: order });
    res.status(201).json(doc);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: "Department name already exists" });
    res.status(500).json({ message: err.message });
  }
};

// PATCH /departments/:id — แก้ไขแผนก
exports.updateDepartment = async function (req, res) {
  try {
    const { name, displayOrder } = req.body;
    const doc = await Department.findByIdAndUpdate(
      req.params.id,
      { ...(name != null && { name: String(name).trim() }), ...(typeof displayOrder === "number" && { displayOrder }) },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: "Department not found" });
    res.json(doc);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: "Department name already exists" });
    res.status(500).json({ message: err.message });
  }
};

// DELETE /departments/:id — ลบแผนก (ไม่ได้ถ้ามีหมอใช้อยู่)
exports.deleteDepartment = async function (req, res) {
  try {
    const used = await Doctor.findOne({ department: req.params.id });
    if (used) return res.status(409).json({ message: "Cannot delete: some doctors use this department" });
    const doc = await Department.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: "Department not found" });
    res.json({ deleted: true, id: doc._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
