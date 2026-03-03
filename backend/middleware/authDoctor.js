const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  let token = req.header('x-auth-token');
  if (!token && req.header('authorization')) {
    // Support Bearer token
    const authHeader = req.header('authorization');
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.doctor = decoded.doctor;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
