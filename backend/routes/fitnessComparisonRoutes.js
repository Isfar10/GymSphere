const express = require("express");
const router = express.Router();
const protect = require("../middlewares/authMiddleware");
const {
  getBenchmarks,
  getLeaderboard,
} = require("../controllers/fitnessComparisonController");

router.use(protect);

router.get("/benchmarks", getBenchmarks);
router.get("/leaderboard", getLeaderboard);

module.exports = router;
