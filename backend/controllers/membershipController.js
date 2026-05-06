const User = require("../models/User");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const UserSubscription = require("../models/UserSubscription");

const optionalModel = (path) => {
  try {
    return require(path);
  } catch (error) {
    return null;
  }
};

const Notification = optionalModel("../models/Notification");

const getCurrentUser = async (req) => {
  return User.findById(req.user.userId).select("-password");
};

const isAdminUser = (user) => user && user.role === "admin";

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
      link: link || "/memberships",
      metadata: metadata || {},
    });
  } catch (error) {
    console.error("Membership notification failed:", error.message);
  }
};

const formatPlan = (plan) => ({
  id: plan._id,
  name: plan.name,
  description: plan.description,
  price: plan.price,
  durationDays: plan.durationDays,
  features: plan.features || [],
  isActive: plan.isActive,
  isPopular: plan.isPopular,
  createdAt: plan.createdAt,
  updatedAt: plan.updatedAt,
});

const formatSubscription = (subscription) => {
  if (!subscription) return null;

  return {
    id: subscription._id,
    user: subscription.user
      ? {
          id: subscription.user._id,
          name: subscription.user.name,
          email: subscription.user.email,
          role: subscription.user.role,
        }
      : null,
    plan: subscription.plan ? formatPlan(subscription.plan) : null,
    status: subscription.status,
    paymentStatus: subscription.paymentStatus,
    paymentMethod: subscription.paymentMethod,
    transactionId: subscription.transactionId,
    amountPaid: subscription.amountPaid,
    startDate: subscription.startDate,
    endDate: subscription.endDate,
    cancelledAt: subscription.cancelledAt,
    createdAt: subscription.createdAt,
    updatedAt: subscription.updatedAt,
  };
};

const seedDefaultPlans = async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);

    if (!isAdminUser(currentUser)) {
      return res.status(403).json({
        success: false,
        message: "Only admins can seed membership plans",
      });
    }

    const existingCount = await SubscriptionPlan.countDocuments();

    if (existingCount > 0) {
      return res.status(200).json({
        success: true,
        message: "Membership plans already exist",
      });
    }

    const defaultPlans = [
      {
        name: "Basic",
        description: "Good for beginners who want access to core GymSphere features.",
        price: 499,
        durationDays: 30,
        features: [
          "Book trainer sessions",
          "Track weekly goals",
          "Access progress tracking",
          "Receive notifications",
        ],
        isPopular: false,
      },
      {
        name: "Pro",
        description: "Best for active trainees who want more guidance and community access.",
        price: 999,
        durationDays: 30,
        features: [
          "Everything in Basic",
          "Priority trainer booking",
          "Social fitness feed access",
          "Advanced progress insights",
          "Trainer matching support",
        ],
        isPopular: true,
      },
      {
        name: "Elite",
        description: "Premium plan for users who want maximum trainer support.",
        price: 1999,
        durationDays: 30,
        features: [
          "Everything in Pro",
          "Premium trainer recommendations",
          "Exclusive promotions",
          "Priority support",
          "Monthly fitness review",
        ],
        isPopular: false,
      },
    ];

    await SubscriptionPlan.insertMany(defaultPlans);

    return res.status(201).json({
      success: true,
      message: "Default membership plans created successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find({ isActive: true }).sort({
      price: 1,
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: plans.length,
      plans: plans.map(formatPlan),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllPlansForAdmin = async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);

    if (!isAdminUser(currentUser)) {
      return res.status(403).json({
        success: false,
        message: "Only admins can view all plans",
      });
    }

    const plans = await SubscriptionPlan.find({}).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: plans.length,
      plans: plans.map(formatPlan),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const createPlan = async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);

    if (!isAdminUser(currentUser)) {
      return res.status(403).json({
        success: false,
        message: "Only admins can create membership plans",
      });
    }

    const { name, description, price, durationDays, features, isActive, isPopular } =
      req.body;

    if (!name || !description || price === undefined || !durationDays) {
      return res.status(400).json({
        success: false,
        message: "Name, description, price, and duration are required",
      });
    }

    const plan = await SubscriptionPlan.create({
      name,
      description,
      price,
      durationDays,
      features: Array.isArray(features) ? features : [],
      isActive: isActive !== undefined ? isActive : true,
      isPopular: Boolean(isPopular),
    });

    return res.status(201).json({
      success: true,
      message: "Membership plan created successfully",
      plan: formatPlan(plan),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updatePlan = async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);

    if (!isAdminUser(currentUser)) {
      return res.status(403).json({
        success: false,
        message: "Only admins can update membership plans",
      });
    }

    const allowedFields = [
      "name",
      "description",
      "price",
      "durationDays",
      "features",
      "isActive",
      "isPopular",
    ];

    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const plan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Membership plan not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Membership plan updated successfully",
      plan: formatPlan(plan),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deactivatePlan = async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);

    if (!isAdminUser(currentUser)) {
      return res.status(403).json({
        success: false,
        message: "Only admins can deactivate membership plans",
      });
    }

    const plan = await SubscriptionPlan.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Membership plan not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Membership plan deactivated successfully",
      plan: formatPlan(plan),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const subscribeToPlan = async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const { planId, paymentMethod, transactionId } = req.body;

    if (!planId) {
      return res.status(400).json({
        success: false,
        message: "Plan ID is required",
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

    await UserSubscription.updateMany(
      {
        user: currentUser._id,
        status: "active",
      },
      {
        status: "expired",
      }
    );

    const startDate = new Date();
    const endDate = addDays(startDate, plan.durationDays);

    const subscription = await UserSubscription.create({
      user: currentUser._id,
      plan: plan._id,
      status: "active",
      paymentStatus: "paid",
      paymentMethod: paymentMethod || "mock",
      transactionId: transactionId || `MOCK-${Date.now()}`,
      amountPaid: plan.price,
      startDate,
      endDate,
    });

    const populatedSubscription = await UserSubscription.findById(subscription._id)
      .populate("user", "name email role")
      .populate("plan");

    await createNotificationSafely({
      user: currentUser._id,
      title: "Membership activated",
      message: `Your ${plan.name} membership is now active.`,
      type: "promotion",
      link: "/memberships",
      metadata: {
        subscriptionId: subscription._id,
        planId: plan._id,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Membership subscribed successfully",
      subscription: formatSubscription(populatedSubscription),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getMySubscription = async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const now = new Date();

    await UserSubscription.updateMany(
      {
        user: currentUser._id,
        status: "active",
        endDate: { $lt: now },
      },
      {
        status: "expired",
      }
    );

    const subscription = await UserSubscription.findOne({
      user: currentUser._id,
      status: "active",
    })
      .populate("user", "name email role")
      .populate("plan")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      subscription: formatSubscription(subscription),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getMySubscriptionHistory = async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const subscriptions = await UserSubscription.find({
      user: currentUser._id,
    })
      .populate("user", "name email role")
      .populate("plan")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: subscriptions.length,
      subscriptions: subscriptions.map(formatSubscription),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const cancelMySubscription = async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const subscription = await UserSubscription.findOne({
      user: currentUser._id,
      status: "active",
    }).populate("plan");

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "No active subscription found",
      });
    }

    subscription.status = "cancelled";
    subscription.cancelledAt = new Date();
    await subscription.save();

    await createNotificationSafely({
      user: currentUser._id,
      title: "Membership cancelled",
      message: `Your ${subscription.plan.name} membership has been cancelled.`,
      type: "system",
      link: "/memberships",
      metadata: {
        subscriptionId: subscription._id,
        planId: subscription.plan._id,
      },
    });

    const populatedSubscription = await UserSubscription.findById(subscription._id)
      .populate("user", "name email role")
      .populate("plan");

    return res.status(200).json({
      success: true,
      message: "Membership cancelled successfully",
      subscription: formatSubscription(populatedSubscription),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllSubscriptionsForAdmin = async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);

    if (!isAdminUser(currentUser)) {
      return res.status(403).json({
        success: false,
        message: "Only admins can view all subscriptions",
      });
    }

    const subscriptions = await UserSubscription.find({})
      .populate("user", "name email role")
      .populate("plan")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: subscriptions.length,
      subscriptions: subscriptions.map(formatSubscription),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  seedDefaultPlans,
  getPlans,
  getAllPlansForAdmin,
  createPlan,
  updatePlan,
  deactivatePlan,
  subscribeToPlan,
  getMySubscription,
  getMySubscriptionHistory,
  cancelMySubscription,
  getAllSubscriptionsForAdmin,
};