const express = require("express");
const router = express.Router();
const authController = require("../controller/auth.controller");
const { signupRules, signinRules, handleValidation } = require("../middleware/validate");

router.post("/signup", signupRules, handleValidation, authController.signup);
router.post("/signin", signinRules, handleValidation, authController.signin);

module.exports = router;
