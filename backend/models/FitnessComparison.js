const mongoose = require("mongoose");

const fitnessComparisonSchema = new mongoose.Schema(
  {
    trainee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["strength", "cardio", "endurance", "body", "overall"],
      default: "overall",
    },
    metricName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    userValue: {
      type: Number,
      required: true,
      min: 0,
    },
    benchmarkValue: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      required: true,
      trim: true,
      maxlength: 25,
    },
    benchmarkGroup: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
      default: "GymSphere Community",
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 800,
      default: "",
    },
  },
  { timestamps: true }
);

fitnessComparisonSchema.virtual("difference").get(function () {
  return Number((this.userValue - this.benchmarkValue).toFixed(2));
});

fitnessComparisonSchema.virtual("percentageDifference").get(function () {
  if (!this.benchmarkValue) return 0;
  return Number(
    (((this.userValue - this.benchmarkValue) / this.benchmarkValue) * 100).toFixed(2)
  );
});

fitnessComparisonSchema.set("toJSON", { virtuals: true });
fitnessComparisonSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("FitnessComparison", fitnessComparisonSchema);