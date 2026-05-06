const User = require("../models/User");
const DietPlan = require("../models/DietPlan");
const FoodItem = require("../models/FoodItem");
const { generateDatabaseDietPlan } = require("../services/databaseDietService");

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

const isAdmin = (user) => user?.role === "admin";

const createNotificationSafely = async ({ user, title, message, type, link, metadata }) => {
  try {
    if (!Notification || !user) return;

    await Notification.create({
      user,
      title,
      message,
      type: type || "system",
      link: link || "/diet-plans",
      metadata: metadata || {},
    });
  } catch (error) {
    console.error("Diet notification failed:", error.message);
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

const formatFoodItem = (food) => ({
  id: food._id,
  name: food.name,
  category: food.category,
  servingSize: food.servingSize,
  calories: food.calories,
  proteinGrams: food.proteinGrams,
  carbsGrams: food.carbsGrams,
  fatGrams: food.fatGrams,
  fiberGrams: food.fiberGrams,
  sugarGrams: food.sugarGrams,
  dietTags: food.dietTags,
  allergens: food.allergens,
  mealTags: food.mealTags,
  source: food.source,
  isActive: food.isActive,
});

const formatDietPlan = (plan) => ({
  id: plan._id,
  user: formatUser(plan.user),
  goal: plan.goal,
  age: plan.age,
  gender: plan.gender,
  heightCm: plan.heightCm,
  weightKg: plan.weightKg,
  activityLevel: plan.activityLevel,
  mealsPerDay: plan.mealsPerDay,
  dietType: plan.dietType,
  allergies: plan.allergies,
  dislikedFoods: plan.dislikedFoods,
  preferredFoods: plan.preferredFoods,
  targetCalories: plan.targetCalories,
  targetProteinGrams: plan.targetProteinGrams,
  targetCarbsGrams: plan.targetCarbsGrams,
  targetFatGrams: plan.targetFatGrams,
  planTitle: plan.planTitle,
  summary: plan.summary,
  meals: plan.meals,
  totalCalories: plan.totalCalories,
  totalProteinGrams: plan.totalProteinGrams,
  totalCarbsGrams: plan.totalCarbsGrams,
  totalFatGrams: plan.totalFatGrams,
  recommendationMethod: plan.recommendationMethod,
  disclaimer: plan.disclaimer,
  createdAt: plan.createdAt,
  updatedAt: plan.updatedAt,
});

const validateInput = (body) => {
  const required = ["goal", "age", "gender", "heightCm", "weightKg", "activityLevel"];

  const missing = required.filter((field) => body[field] === undefined || body[field] === "");

  if (missing.length > 0) {
    return `Missing required fields: ${missing.join(", ")}`;
  }

  if (Number(body.age) < 10 || Number(body.age) > 100) {
    return "Age must be between 10 and 100";
  }

  if (Number(body.heightCm) < 80 || Number(body.heightCm) > 250) {
    return "Height must be between 80 cm and 250 cm";
  }

  if (Number(body.weightKg) < 25 || Number(body.weightKg) > 300) {
    return "Weight must be between 25 kg and 300 kg";
  }

  if (Number(body.mealsPerDay || 4) < 3 || Number(body.mealsPerDay || 4) > 6) {
    return "Meals per day must be between 3 and 6";
  }

  return null;
};

const generateDietPlan = async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const validationError = validateInput(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const input = {
      goal: req.body.goal,
      age: Number(req.body.age),
      gender: req.body.gender,
      heightCm: Number(req.body.heightCm),
      weightKg: Number(req.body.weightKg),
      activityLevel: req.body.activityLevel,
      mealsPerDay: Number(req.body.mealsPerDay || 4),
      dietType: req.body.dietType || "balanced",
      allergies: req.body.allergies || "",
      dislikedFoods: req.body.dislikedFoods || "",
      preferredFoods: req.body.preferredFoods || "",
    };

    const generated = await generateDatabaseDietPlan(input);

    const dietPlan = await DietPlan.create({
      user: currentUser._id,
      goal: generated.input.goal,
      age: generated.input.age,
      gender: generated.input.gender,
      heightCm: generated.input.heightCm,
      weightKg: generated.input.weightKg,
      activityLevel: generated.input.activityLevel,
      mealsPerDay: generated.input.mealsPerDay,
      dietType: generated.input.dietType,
      allergies: generated.input.allergies,
      dislikedFoods: generated.input.dislikedFoods,
      preferredFoods: generated.input.preferredFoods,
      targetCalories: generated.targets.targetCalories,
      targetProteinGrams: generated.targets.targetProteinGrams,
      targetCarbsGrams: generated.targets.targetCarbsGrams,
      targetFatGrams: generated.targets.targetFatGrams,
      planTitle: generated.planTitle,
      summary: generated.summary,
      meals: generated.meals,
      totalCalories: Math.round(generated.totals.totalCalories),
      totalProteinGrams: Math.round(generated.totals.totalProteinGrams),
      totalCarbsGrams: Math.round(generated.totals.totalCarbsGrams),
      totalFatGrams: Math.round(generated.totals.totalFatGrams),
      recommendationMethod: "database_scoring",
    });

    const populatedPlan = await DietPlan.findById(dietPlan._id).populate(
      "user",
      "name email role"
    );

    await createNotificationSafely({
      user: currentUser._id,
      title: "Database-backed diet plan generated",
      message: "Your personalized diet plan has been generated from the food database.",
      type: "system",
      link: "/diet-plans",
      metadata: {
        dietPlanId: dietPlan._id,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Diet plan generated successfully from food database",
      dietPlan: formatDietPlan(populatedPlan),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getMyDietPlans = async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const plans = await DietPlan.find({ user: currentUser._id })
      .populate("user", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: plans.length,
      dietPlans: plans.map(formatDietPlan),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllDietPlansForAdmin = async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);

    if (!isAdmin(currentUser)) {
      return res.status(403).json({
        success: false,
        message: "Only admins can view all diet plans",
      });
    }

    const plans = await DietPlan.find({})
      .populate("user", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: plans.length,
      dietPlans: plans.map(formatDietPlan),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteDietPlan = async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const plan = await DietPlan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Diet plan not found",
      });
    }

    const ownsPlan = String(plan.user) === String(currentUser._id);

    if (!ownsPlan && !isAdmin(currentUser)) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own diet plans",
      });
    }

    await DietPlan.findByIdAndDelete(plan._id);

    return res.status(200).json({
      success: true,
      message: "Diet plan deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getFoodDatabaseStats = async (req, res) => {
  try {
    const totalFoods = await FoodItem.countDocuments({ isActive: true });

    const categories = await FoodItem.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const dietTags = await FoodItem.aggregate([
      { $match: { isActive: true } },
      { $unwind: "$dietTags" },
      { $group: { _id: "$dietTags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalFoods,
        categories,
        dietTags,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getFoods = async (req, res) => {
  try {
    const query = {};
    const search = req.query.search || "";
    const category = req.query.category || "";

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    if (category) {
      query.category = category;
    }

    query.isActive = true;

    const foods = await FoodItem.find(query).sort({ name: 1 }).limit(100);

    return res.status(200).json({
      success: true,
      count: foods.length,
      foods: foods.map(formatFoodItem),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  generateDietPlan,
  getMyDietPlans,
  getAllDietPlansForAdmin,
  deleteDietPlan,
  getFoodDatabaseStats,
  getFoods,
};