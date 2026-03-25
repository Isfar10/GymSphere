const express = require("express");
const protect = require("../middlewares/authMiddleware");
const { updateProfile } = require("../controllers/userController");

const router = express.Router();

router.put("/profile", protect, updateProfile);

module.exports = router;