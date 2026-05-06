const User = require("../models/User");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const UserSubscription = require("../models/UserSubscription");
const ManualBkashPayment = require("../models/ManualBkashPayment");

const optionalModel = (path) => {
  try {
    return require(path);
  } catch (error) {
    return null;
  }
};

const Notification = optionalModel("../models/Notification");

const ADMIN_BKASH_NUMBER = process.env.ADMIN_BKASH_NUMBER || "01XXXXXXXXX";

const getCurrentUser = async (req) => {
  return User.findById(req.user.userId).select("-password");
};

const isAdmin = (user) => user?.role === "admin";

const addDays = (date, days) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + Number(days));
  return nextDate;
};

const createNotificationSafely = async ({ user, title, message, type, link, metadata }) => {
  try {
    if (!Notification || !user) return;

    await Notification.create({
      user,
      title,
      message,
      type: type || "system",
      link: link || "/manual-bkash-payments",
      metadata: metadata || {},
    });
  } catch (error) {
    console.error("Notification creation failed:", error.message);
  }
};

const formatUser = (user) => {
  if (!user) return null;

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
};

const formatPlan = (plan) => {
  if (!plan) return null;

  return {
    id: plan._id,
    name: plan.name,
    description: plan.description,
    price: plan.price,
    durationDays: plan.durationDays,
    features: plan.features || [],
    isActive: plan.isActive,
    isPopular: plan.isPopular,
  };
};

const formatPayment = (payment) => {
  if (!payment) return null;

  return {
    id: payment._id,
    user: formatUser(payment.user),
    plan: formatPlan(payment.plan),
    amount: payment.amount,
    bkashNumber: payment.bkashNumber,
    transactionId: payment.transactionId,
    adminBkashNumber: payment.adminBkashNumber,
    status: payment.status,
    adminNote: payment.adminNote,
    reviewedBy: formatUser(payment.reviewedBy),
    reviewedAt: payment.reviewedAt,
    activatedSubscription: payment.activatedSubscription,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  };
};

const submitManualBkashPayment = async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const { planId, bkashNumber, transactionId } = req.body;

    if (!planId || !bkashNumber || !transactionId) {
      return res.status(400).json({
        success: false,
        message: "Plan, sender bKash number, and transaction ID are required",
      });
    }

    const plan = await SubscriptionPlan.findOne({
      _id: planId,
      isActive: true,
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Active membership plan not found",
      });
    }

    const existingPayment = await ManualBkashPayment.findOne({
      transactionId: transactionId.trim().toUpperCase(),
    });

    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: "This transaction ID has already been submitted",
      });
    }

    const payment = await ManualBkashPayment.create({
      user: currentUser._id,
      plan: plan._id,
      amount: plan.price,
      bkashNumber: bkashNumber.trim(),
      transactionId: transactionId.trim().toUpperCase(),
      adminBkashNumber: ADMIN_BKASH_NUMBER,
      status: "pending",
    });

    const populatedPayment = await ManualBkashPayment.findById(payment._id)
      .populate("user", "name email role")
      .populate("plan")
      .populate("reviewedBy", "name email role");

    await createNotificationSafely({
      user: currentUser._id,
      title: "bKash payment submitted",
      message: `Your payment for the ${plan.name} plan is pending admin verification.`,
      type: "system",
      link: "/manual-bkash-payments",
      metadata: {
        paymentId: payment._id,
        planId: plan._id,
        transactionId: payment.transactionId,
      },
    });

    return res.status(201).json({
      success: true,
      message: "bKash payment submitted successfully. Please wait for admin approval.",
      payment: formatPayment(populatedPayment),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "This transaction ID has already been submitted",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getMyManualBkashPayments = async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const payments = await ManualBkashPayment.find({
      user: currentUser._id,
    })
      .populate("user", "name email role")
      .populate("plan")
      .populate("reviewedBy", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: payments.length,
      payments: payments.map(formatPayment),
      adminBkashNumber: ADMIN_BKASH_NUMBER,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllManualBkashPayments = async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);

    if (!isAdmin(currentUser)) {
      return res.status(403).json({
        success: false,
        message: "Only admins can view all bKash payments",
      });
    }

    const statusFilter = req.query.status;
    const filter = {};

    if (statusFilter && ["pending", "approved", "rejected"].includes(statusFilter)) {
      filter.status = statusFilter;
    }

    const payments = await ManualBkashPayment.find(filter)
      .populate("user", "name email role")
      .populate("plan")
      .populate("reviewedBy", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: payments.length,
      payments: payments.map(formatPayment),
      adminBkashNumber: ADMIN_BKASH_NUMBER,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const approveManualBkashPayment = async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);

    if (!isAdmin(currentUser)) {
      return res.status(403).json({
        success: false,
        message: "Only admins can approve bKash payments",
      });
    }

    const payment = await ManualBkashPayment.findById(req.params.id)
      .populate("user", "name email role")
      .populate("plan");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    if (payment.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Payment is already ${payment.status}`,
      });
    }

    await UserSubscription.updateMany(
      {
        user: payment.user._id,
        status: "active",
      },
      {
        status: "expired",
      }
    );

    const startDate = new Date();
    const endDate = addDays(startDate, payment.plan.durationDays);

    const subscription = await UserSubscription.create({
      user: payment.user._id,
      plan: payment.plan._id,
      status: "active",
      paymentStatus: "paid",
      paymentMethod: "bkash",
      transactionId: payment.transactionId,
      amountPaid: payment.amount,
      startDate,
      endDate,
    });

    payment.status = "approved";
    payment.adminNote = req.body.adminNote || "Payment approved";
    payment.reviewedBy = currentUser._id;
    payment.reviewedAt = new Date();
    payment.activatedSubscription = subscription._id;

    await payment.save();

    const updatedPayment = await ManualBkashPayment.findById(payment._id)
      .populate("user", "name email role")
      .populate("plan")
      .populate("reviewedBy", "name email role");

    await createNotificationSafely({
      user: payment.user._id,
      title: "bKash payment approved",
      message: `Your ${payment.plan.name} membership has been activated.`,
      type: "promotion",
      link: "/memberships",
      metadata: {
        paymentId: payment._id,
        subscriptionId: subscription._id,
        planId: payment.plan._id,
        transactionId: payment.transactionId,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Payment approved and membership activated",
      payment: formatPayment(updatedPayment),
      subscription,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const rejectManualBkashPayment = async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);

    if (!isAdmin(currentUser)) {
      return res.status(403).json({
        success: false,
        message: "Only admins can reject bKash payments",
      });
    }

    const payment = await ManualBkashPayment.findById(req.params.id)
      .populate("user", "name email role")
      .populate("plan");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    if (payment.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Payment is already ${payment.status}`,
      });
    }

    payment.status = "rejected";
    payment.adminNote =
      req.body.adminNote || "Payment rejected. Please contact support.";
    payment.reviewedBy = currentUser._id;
    payment.reviewedAt = new Date();

    await payment.save();

    const updatedPayment = await ManualBkashPayment.findById(payment._id)
      .populate("user", "name email role")
      .populate("plan")
      .populate("reviewedBy", "name email role");

    await createNotificationSafely({
      user: payment.user._id,
      title: "bKash payment rejected",
      message: payment.adminNote,
      type: "system",
      link: "/manual-bkash-payments",
      metadata: {
        paymentId: payment._id,
        planId: payment.plan._id,
        transactionId: payment.transactionId,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Payment rejected",
      payment: formatPayment(updatedPayment),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  submitManualBkashPayment,
  getMyManualBkashPayments,
  getAllManualBkashPayments,
  approveManualBkashPayment,
  rejectManualBkashPayment,
};