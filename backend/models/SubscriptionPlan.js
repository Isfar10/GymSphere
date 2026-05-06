const mongoose = require("mongoose");

const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Plan name is required"],
      trim: true,
      maxlength: 80,
    },
    description: {
      type: String,
      required: [true, "Plan description is required"],
      trim: true,
      maxlength: 500,
    },
    price: {
      type: Number,
      required: [true, "Plan price is required"],
      min: 0,
    },
    durationDays: {
      type: Number,
      required: [true, "Duration is required"],
      min: 1,
    },
    features: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

subscriptionPlanSchema.index({ isActive: 1, price: 1 });

module.exports = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);