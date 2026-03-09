const express = require("express");
const router = express.Router();
const userController = require("../controller/user.controller");
const auth = require("../middleware/auth");

router.get("/profile", auth, userController.getProfile);
router.patch("/profile", auth, userController.updateProfile);
router.post("/change-password", auth, userController.changePassword);

module.exports = router;
