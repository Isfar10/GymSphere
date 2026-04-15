const mongoose = require("mongoose");

const workoutSchema = new mongoose.Schema({
  trainerId: String,
  userId: String,
  title: String,
  exercises: [String],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("WorkoutPlan", workoutSchema);