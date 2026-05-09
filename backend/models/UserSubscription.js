const mongoose = require("mongoose");

const userSubscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "expired", "cancelled"],
      default: "active",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "paid",
    },
    paymentMethod: {
      type: String,
      enum: ["mock", "cash", "card", "bkash", "nagad", "sslcommerz"],
      default: "mock",
    },
    transactionId: {
      type: String,
      trim: true,
      default: "",
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

userSubscriptionSchema.index({ user: 1, status: 1 });
userSubscriptionSchema.index({ endDate: 1 });

module.exports = mongoose.model("UserSubscription", userSubscriptionSchema);