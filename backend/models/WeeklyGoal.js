const mongoose = require("mongoose");

const weeklyGoalSchema = new mongoose.Schema(
  {
    trainee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    weekStart: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },
    category: {
      type: String,
      enum: ["workout", "cardio", "nutrition", "weight", "habit", "custom"],
      default: "custom",
    },
    targetCount: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    completedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    unit: {
      type: String,
      default: "sessions",
      trim: true,
      maxlength: 40,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WeeklyGoal", weeklyGoalSchema);