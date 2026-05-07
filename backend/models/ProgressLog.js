const mongoose = require("mongoose");

const progressLogSchema = new mongoose.Schema(
  {
    trainee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: String,
      required: true,
      trim: true,
    },
    weight: {
      type: Number,
      default: null,
    },
    bodyFat: {
      type: Number,
      default: null,
    },
    chest: {
      type: Number,
      default: null,
    },
    waist: {
      type: Number,
      default: null,
    },
    arms: {
      type: Number,
      default: null,
    },
    legs: {
      type: Number,
      default: null,
    },
    workoutMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    caloriesBurned: {
      type: Number,
      default: 0,
      min: 0,
    },
    performanceScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    workoutsCompleted: {
      type: Number,
      default: 0,
      min: 0,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

progressLogSchema.index({ trainee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("ProgressLog", progressLogSchema);