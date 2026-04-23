const express = require("express");
const protect = require("../middlewares/authMiddleware");
const {
  getMyWeeklyGoals,
  createWeeklyGoal,
  updateWeeklyGoal,
  updateWeeklyGoalProgress,
  deleteWeeklyGoal,
} = require("../controllers/weeklyGoalController");

const router = express.Router();

router.get("/mine", protect, getMyWeeklyGoals);
router.post("/", protect, createWeeklyGoal);
router.put("/:id", protect, updateWeeklyGoal);
router.patch("/:id/progress", protect, updateWeeklyGoalProgress);
router.delete("/:id", protect, deleteWeeklyGoal);

module.exports = router;