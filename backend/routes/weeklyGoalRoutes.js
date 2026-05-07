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

router.get("/", protect, getMyWeeklyGoals);
router.get("/mine", protect, getMyWeeklyGoals);

router.post("/", protect, createWeeklyGoal);

router.put("/:id", protect, updateWeeklyGoal);

router.patch("/:id/progress", protect, updateWeeklyGoalProgress);

router.patch("/:id/increment", protect, (req, res, next) => {
  req.body.action = "increment";
  next();
}, updateWeeklyGoalProgress);

router.patch("/:id/complete", protect, (req, res, next) => {
  req.body.action = "complete";
  next();
}, updateWeeklyGoalProgress);

router.patch("/:id/reset", protect, (req, res, next) => {
  req.body.action = "reset";
  next();
}, updateWeeklyGoalProgress);

router.delete("/:id", protect, deleteWeeklyGoal);

module.exports = router;