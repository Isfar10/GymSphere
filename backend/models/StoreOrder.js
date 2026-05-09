const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StoreProduct",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    subtotal: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const storeOrderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: {
      type: [orderItemSchema],
      default: [],
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },

    paymentMethod: {
      type: String,
      enum: ["manual_bkash"],
      default: "manual_bkash",
    },
    bkashNumber: {
      type: String,
      required: true,
      trim: true,
    },
    transactionId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    adminPaymentNote: {
      type: String,
      default: "",
      trim: true,
    },
    paymentVerifiedAt: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "delivered", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StoreOrder", storeOrderSchema);