const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    trainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    trainee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
  },
  { timestamps: true }
);

// One trainee can review one trainer only once
reviewSchema.index({ trainer: 1, trainee: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);