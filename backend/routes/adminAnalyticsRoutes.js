const express = require("express");
const protect = require("../middlewares/authMiddleware");
const { getAdminAnalytics } = require("../controllers/adminAnalyticsController");

const router = express.Router();

router.get("/", protect, getAdminAnalytics);

module.exports = router;