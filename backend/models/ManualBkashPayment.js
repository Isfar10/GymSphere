const mongoose = require("mongoose");

const manualBkashPaymentSchema = new mongoose.Schema(
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

    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    bkashNumber: {
      type: String,
      required: [true, "Sender bKash number is required"],
      trim: true,
    },

    transactionId: {
      type: String,
      required: [true, "bKash transaction ID is required"],
      trim: true,
      uppercase: true,
    },

    adminBkashNumber: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    adminNote: {
      type: String,
      trim: true,
      default: "",
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    activatedSubscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserSubscription",
      default: null,
    },
  },
  { timestamps: true }
);

manualBkashPaymentSchema.index({ user: 1, createdAt: -1 });
manualBkashPaymentSchema.index({ status: 1, createdAt: -1 });
manualBkashPaymentSchema.index({ transactionId: 1 }, { unique: true });

module.exports = mongoose.model("ManualBkashPayment", manualBkashPaymentSchema);