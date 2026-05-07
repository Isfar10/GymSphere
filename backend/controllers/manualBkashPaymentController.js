const mongoose = require("mongoose");
const ManualBkashPayment = require("../models/ManualBkashPayment");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const MembershipSubscription = require("../models/MembershipSubscription");
const User = require("../models/User");

const ADMIN_BKASH_NUMBER = "01799089557";

const DEFAULT_BKASH_PLANS = [
  {
    key: "default-1-month",
    aliases: ["1 Month", "1 month", "Monthly", "Basic"],
    name: "1 Month",
    description: "1 month GymSphere membership plan",
    price: 3000,
    durationDays: 30,
    features: [
      "30 days membership access",
      "Book trainer sessions",
      "Access membership features",
    ],
    isActive: true,
    isPopular: false,
  },
  {
    key: "default-3-month",
    aliases: ["3 Months", "3 Month", "3 months", "3 month", "Pro"],
    name: "3 Months",
    description: "3 months GymSphere membership plan",
    price: 6500,
    durationDays: 90,
    features: [
      "90 days membership access",
      "Book trainer sessions",
      "Access membership features",
      "Save more than monthly plan",
    ],
    isActive: true,
    isPopular: true,
  },
  {
    key: "default-6-month",
    aliases: ["6 Months", "6 Month", "6 months", "6 month"],
    name: "6 Months",
    description: "6 months GymSphere membership plan",
    price: 11000,
    durationDays: 180,
    features: [
      "180 days membership access",
      "Book trainer sessions",
      "Access membership features",
      "Best value for regular users",
    ],
    isActive: true,
    isPopular: false,
  },
  {
    key: "default-1-year",
    aliases: ["1 Year", "1 year", "Yearly", "Annual", "Elite"],
    name: "1 Year",
    description: "1 year GymSphere membership plan",
    price: 20000,
    durationDays: 365,
    features: [
      "365 days membership access",
      "Book trainer sessions",
      "Access membership features",
      "Maximum savings",
    ],
    isActive: true,
    isPopular: false,
  },
];

const getCurrentUser = async (req) => {
  return User.findById(req.user.userId).select("-password");
};

const normalizePlan = (plan) => {
  if (!plan) return null;

  return {
    id: plan._id,
    _id: plan._id,
    name: plan.name,
    description: plan.description,
    price: plan.price,
    durationDays: plan.durationDays,
    features: plan.features || [],
    isActive: plan.isActive,
    isPopular: plan.isPopular,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
  };
};

const formatPayment = (payment) => {
  return {
    id: payment._id,
    _id: payment._id,
    user: payment.user,
    plan: payment.plan,
    amount: payment.amount,
    bkashNumber: payment.bkashNumber,
    adminBkashNumber: payment.adminBkashNumber || ADMIN_BKASH_NUMBER,
    transactionId: payment.transactionId,
    status: payment.status,
    adminNote: payment.adminNote,
    reviewedBy: payment.reviewedBy,
    reviewedAt: payment.reviewedAt,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  };
};

const ensureDefaultSubscriptionPlans = async () => {
  const savedPlans = [];

  for (const defaultPlan of DEFAULT_BKASH_PLANS) {
    const existingPlan = await SubscriptionPlan.findOne({
      name: { $in: defaultPlan.aliases },
    });

    if (existingPlan) {
      existingPlan.name = defaultPlan.name;
      existingPlan.description =
        existingPlan.description || defaultPlan.description;
      existingPlan.price = Number(existingPlan.price || defaultPlan.price);
      existingPlan.durationDays = Number(
        existingPlan.durationDays || defaultPlan.durationDays
      );
      existingPlan.features =
        existingPlan.features && existingPlan.features.length > 0
          ? existingPlan.features
          : defaultPlan.features;
      existingPlan.isActive = true;
      existingPlan.isPopular = Boolean(
        existingPlan.isPopular || defaultPlan.isPopular
      );

      await existingPlan.save();
      savedPlans.push(existingPlan);
    } else {
      const createdPlan = await SubscriptionPlan.create({
        name: defaultPlan.name,
        description: defaultPlan.description,
        price: defaultPlan.price,
        durationDays: defaultPlan.durationDays,
        features: defaultPlan.features,
        isActive: defaultPlan.isActive,
        isPopular: defaultPlan.isPopular,
      });

      savedPlans.push(createdPlan);
    }
  }

  return savedPlans;
};

const findOrCreatePlanForBkash = async (planId) => {
  if (!planId) {
    return null;
  }

  const cleanPlanId = String(planId).trim();

  if (mongoose.Types.ObjectId.isValid(cleanPlanId)) {
    const planById = await SubscriptionPlan.findOne({
      _id: cleanPlanId,
      isActive: true,
    });

    if (planById) {
      return planById;
    }
  }

  const defaultPlan = DEFAULT_BKASH_PLANS.find((plan) => {
    return (
      plan.key === cleanPlanId ||
      plan.aliases.some(
        (alias) => alias.toLowerCase() === cleanPlanId.toLowerCase()
      )
    );
  });

  if (!defaultPlan) {
    return null;
  }

  const plan = await SubscriptionPlan.findOneAndUpdate(
    {
      name: { $in: defaultPlan.aliases },
    },
    {
      name: defaultPlan.name,
      description: defaultPlan.description,
      price: defaultPlan.price,
      durationDays: defaultPlan.durationDays,
      features: defaultPlan.features,
      isActive: true,
      isPopular: defaultPlan.isPopular,
    },
    {
      upsert: true,
      new: true,
      runValidators: true,
    }
  );

  return plan;
};

const submitManualBkashPayment = async (req, res) => {
  try {
    const { planId, bkashNumber, transactionId } = req.body;

    const currentUser = await getCurrentUser(req);

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (currentUser.role !== "trainee") {
      return res.status(403).json({
        success: false,
        message: "Only trainees can submit membership payments",
      });
    }

    if (!planId || !bkashNumber || !transactionId) {
      return res.status(400).json({
        success: false,
        message: "Plan, bKash number, and transaction ID are required",
      });
    }

    const plan = await findOrCreatePlanForBkash(planId);

    if (!plan || !plan.isActive) {
      return res.status(404).json({
        success: false,
        message: "Membership plan not found or inactive",
      });
    }

    const existingTransaction = await ManualBkashPayment.findOne({
      transactionId: String(transactionId).trim().toUpperCase(),
    });

    if (existingTransaction) {
      return res.status(400).json({
        success: false,
        message: "This transaction ID has already been submitted",
      });
    }

    const payment = await ManualBkashPayment.create({
      user: currentUser._id,
      plan: plan._id,
      amount: plan.price,
      bkashNumber: String(bkashNumber).trim(),
      adminBkashNumber: ADMIN_BKASH_NUMBER,
      transactionId: String(transactionId).trim().toUpperCase(),
      status: "pending",
    });

    const populatedPayment = await ManualBkashPayment.findById(payment._id)
      .populate("user", "name email role")
      .populate("plan", "name price durationDays");

    return res.status(201).json({
      success: true,
      message: "bKash payment submitted. Please wait for admin approval.",
      adminBkashNumber: ADMIN_BKASH_NUMBER,
      payment: formatPayment(populatedPayment),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      adminBkashNumber: ADMIN_BKASH_NUMBER,
    });
  }
};

const getMyManualBkashPayments = async (req, res) => {
  try {
    await ensureDefaultSubscriptionPlans();

    const payments = await ManualBkashPayment.find({
      user: req.user.userId,
    })
      .populate("plan", "name price durationDays")
      .populate("reviewedBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      adminBkashNumber: ADMIN_BKASH_NUMBER,
      payments: payments.map(formatPayment),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      adminBkashNumber: ADMIN_BKASH_NUMBER,
    });
  }
};

const getAllManualBkashPayments = async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);

    if (!currentUser || currentUser.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
        adminBkashNumber: ADMIN_BKASH_NUMBER,
      });
    }

    await ensureDefaultSubscriptionPlans();

    const status = req.query.status;
    const filter = {};

    if (status && ["pending", "approved", "rejected"].includes(status)) {
      filter.status = status;
    }

    const payments = await ManualBkashPayment.find(filter)
      .populate("user", "name email role")
      .populate("plan", "name price durationDays")
      .populate("reviewedBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      adminBkashNumber: ADMIN_BKASH_NUMBER,
      payments: payments.map(formatPayment),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      adminBkashNumber: ADMIN_BKASH_NUMBER,
    });
  }
};

const approveManualBkashPayment = async (req, res) => {
  try {
    const { adminNote } = req.body;

    const currentUser = await getCurrentUser(req);

    if (!currentUser || currentUser.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
        adminBkashNumber: ADMIN_BKASH_NUMBER,
      });
    }

    const payment = await ManualBkashPayment.findById(req.params.id).populate(
      "plan"
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
        adminBkashNumber: ADMIN_BKASH_NUMBER,
      });
    }

    if (payment.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending payments can be approved",
        adminBkashNumber: ADMIN_BKASH_NUMBER,
      });
    }

    if (!payment.plan) {
      return res.status(404).json({
        success: false,
        message: "Payment plan not found",
        adminBkashNumber: ADMIN_BKASH_NUMBER,
      });
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + Number(payment.plan.durationDays || 30));

    await MembershipSubscription.updateMany(
      {
        user: payment.user,
        status: "active",
      },
      {
        status: "cancelled",
      }
    );

    await MembershipSubscription.create({
      user: payment.user,
      plan: payment.plan._id,
      status: "active",
      paymentStatus: "paid",
      paymentMethod: "manual_bkash",
      amountPaid: payment.amount,
      startDate,
      endDate,
    });

    payment.status = "approved";
    payment.adminNote = adminNote || "Payment verified and approved.";
    payment.reviewedBy = currentUser._id;
    payment.reviewedAt = new Date();

    if (!payment.adminBkashNumber) {
      payment.adminBkashNumber = ADMIN_BKASH_NUMBER;
    }

    await payment.save();

    const populatedPayment = await ManualBkashPayment.findById(payment._id)
      .populate("user", "name email role")
      .populate("plan", "name price durationDays")
      .populate("reviewedBy", "name email");

    return res.status(200).json({
      success: true,
      message: "Payment approved and membership activated.",
      adminBkashNumber: ADMIN_BKASH_NUMBER,
      payment: formatPayment(populatedPayment),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      adminBkashNumber: ADMIN_BKASH_NUMBER,
    });
  }
};

const rejectManualBkashPayment = async (req, res) => {
  try {
    const { adminNote } = req.body;

    const currentUser = await getCurrentUser(req);

    if (!currentUser || currentUser.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
        adminBkashNumber: ADMIN_BKASH_NUMBER,
      });
    }

    const payment = await ManualBkashPayment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
        adminBkashNumber: ADMIN_BKASH_NUMBER,
      });
    }

    if (payment.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending payments can be rejected",
        adminBkashNumber: ADMIN_BKASH_NUMBER,
      });
    }

    payment.status = "rejected";
    payment.adminNote =
      adminNote ||
      "Payment could not be verified. Please check your transaction ID.";
    payment.reviewedBy = currentUser._id;
    payment.reviewedAt = new Date();

    if (!payment.adminBkashNumber) {
      payment.adminBkashNumber = ADMIN_BKASH_NUMBER;
    }

    await payment.save();

    const populatedPayment = await ManualBkashPayment.findById(payment._id)
      .populate("user", "name email role")
      .populate("plan", "name price durationDays")
      .populate("reviewedBy", "name email");

    return res.status(200).json({
      success: true,
      message: "Payment rejected.",
      adminBkashNumber: ADMIN_BKASH_NUMBER,
      payment: formatPayment(populatedPayment),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      adminBkashNumber: ADMIN_BKASH_NUMBER,
    });
  }
};

const getManualBkashPlans = async (req, res) => {
  try {
    await ensureDefaultSubscriptionPlans();

    const plans = await SubscriptionPlan.find({
      isActive: true,
    }).sort({
      price: 1,
    });

    return res.status(200).json({
      success: true,
      adminBkashNumber: ADMIN_BKASH_NUMBER,
      plans: plans.map(normalizePlan),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      adminBkashNumber: ADMIN_BKASH_NUMBER,
      plans: [],
    });
  }
};

module.exports = {
  submitManualBkashPayment,
  getMyManualBkashPayments,
  getAllManualBkashPayments,
  approveManualBkashPayment,
  rejectManualBkashPayment,
  getManualBkashPlans,
};