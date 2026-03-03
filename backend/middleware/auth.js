const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Get token from header
  const token = req.header('Authorization')?.replace('Bearer ', '') || req.header('x-auth-token');

  // Check if no token
  if (!token) {
   console.warn('[auth middleware] No token found in request headers:', req.headers);
   return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.patient) {
      console.error('[auth middleware] Token is valid but not a patient token:', decoded);
      return res.status(401).json({ msg: 'Token is not for a patient. Please sign in as a patient.' });
    }
    req.patient = decoded.patient;
    next();
  } catch (err) {
    console.error('[auth middleware] Token verification failed:', err.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};