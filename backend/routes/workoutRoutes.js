const express = require("express");
const router = express.Router();
const { createWorkout, getUserWorkouts } = require("../controllers/workoutController");

router.post("/create", createWorkout);
router.get("/:userId", getUserWorkouts);

module.exports = router;