const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const token =
    req.header("Authorization")?.replace("Bearer ", "") ||
    req.header("x-auth-token");

  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // If token contains user object, set req.user to user, else set to decoded
    if (decoded.user) {
      req.user = decoded.user;
    } else if (decoded.patient) {
      req.user = decoded.patient;
    } else {
      req.user = decoded;
    }
    next();
  } catch (err) {
    res.status(401).json({ msg: "Token is not valid" });
  }
};