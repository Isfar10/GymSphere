const Workout = require("../models/WorkoutPlan");

exports.createWorkout = async (req, res) => {
  try {
    const workout = new Workout(req.body);
    await workout.save();
    res.json(workout);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserWorkouts = async (req, res) => {
  const workouts = await Workout.find({ userId: req.params.userId });
  res.json(workouts);
};