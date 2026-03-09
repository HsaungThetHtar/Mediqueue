const { body, validationResult } = require("express-validator");

// Run after validator chains — returns 400 with error details if validation failed
function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    return res.status(400).json({ message: firstError.msg || "Validation failed", errors: errors.array() });
  }
  next();
}

// POST /auth/signup
const signupRules = [
  body("fullName").trim().notEmpty().withMessage("fullName is required"),
  body("email").trim().isEmail().normalizeEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
];

// POST /auth/signin  &  POST /admin/login
const signinRules = [
  body("email").trim().isEmail().normalizeEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("password is required"),
];

// POST /bookings
const createBookingRules = [
  body("doctorId").notEmpty().withMessage("doctorId is required"),
  body("date")
    .notEmpty().withMessage("date is required")
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage("date must be YYYY-MM-DD")
    .isISO8601().withMessage("date must be a valid calendar date"),
  body("timeSlot")
    .notEmpty().withMessage("timeSlot is required")
    .isIn(["morning", "afternoon"]).withMessage("timeSlot must be 'morning' or 'afternoon'"),
];

// PATCH /admin/settings/config
const updateConfigRules = [
  body("queuePerSession")
    .optional()
    .isInt({ min: 1 }).withMessage("queuePerSession must be a positive integer"),
  body("queuePerDay")
    .optional()
    .isInt({ min: 1 }).withMessage("queuePerDay must be a positive integer"),
];

module.exports = {
  handleValidation,
  signupRules,
  signinRules,
  createBookingRules,
  updateConfigRules,
};
