/**
 * ใช้หลัง auth เท่านั้น — ตรวจว่า req.user.role อยู่ในรายการที่อนุญาต
 * @param {...string} roles - เช่น requireRole('admin') หรือ requireRole('admin', 'doctor')
 */
function requireRole(...roles) {
  const set = new Set(roles);
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    if (!set.has(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
}

const jwt = require("jsonwebtoken");

/**
 * ถ้ามี Authorization header จะ verify และเซ็ต req.user ถ้าไม่มี req.user จะไม่ถูกเซ็ต (ไม่ error)
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch (_) {}
  next();
}

module.exports = { requireRole, optionalAuth };
