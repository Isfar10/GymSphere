const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    trainee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    trainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    sessionDate: {
      type: String,
      required: true
    },
    day: {
      type: String,
      required: true,
      trim: true
    },
    start: {
      type: String,
      required: true,
      trim: true
    },
    end: {
      type: String,
      required: true,
      trim: true
    },
    notes: {
      type: String,
      default: "",
      trim: true
    },
    price: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "cancelled", "completed"],
      default: "pending"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);