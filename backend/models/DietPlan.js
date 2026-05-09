const mongoose = require("mongoose");

const dietPlanFoodSchema = new mongoose.Schema(
  {
    food: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FoodItem",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    servingSize: {
      type: String,
      required: true,
      trim: true,
    },

    calories: {
      type: Number,
      default: 0,
    },

    proteinGrams: {
      type: Number,
      default: 0,
    },

    carbsGrams: {
      type: Number,
      default: 0,
    },

    fatGrams: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const dietPlanMealSchema = new mongoose.Schema(
  {
    mealName: {
      type: String,
      required: true,
      trim: true,
    },

    time: {
      type: String,
      trim: true,
      default: "",
    },

    foods: {
      type: [dietPlanFoodSchema],
      default: [],
    },

    totalCalories: {
      type: Number,
      default: 0,
    },

    totalProteinGrams: {
      type: Number,
      default: 0,
    },

    totalCarbsGrams: {
      type: Number,
      default: 0,
    },

    totalFatGrams: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const dietPlanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    goal: {
      type: String,
      enum: ["weight_loss", "muscle_gain", "maintenance", "general_fitness"],
      required: true,
    },

    age: {
      type: Number,
      required: true,
      min: 10,
      max: 100,
    },

    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },

    heightCm: {
      type: Number,
      required: true,
      min: 80,
      max: 250,
    },

    weightKg: {
      type: Number,
      required: true,
      min: 25,
      max: 300,
    },

    activityLevel: {
      type: String,
      enum: ["sedentary", "light", "moderate", "active", "very_active"],
      required: true,
    },

    mealsPerDay: {
      type: Number,
      default: 4,
      min: 3,
      max: 6,
    },

    dietType: {
      type: String,
      enum: ["balanced", "high_protein", "vegetarian", "vegan", "low_carb"],
      default: "balanced",
    },

    allergies: {
      type: [String],
      default: [],
    },

    dislikedFoods: {
      type: [String],
      default: [],
    },

    preferredFoods: {
      type: [String],
      default: [],
    },

    targetCalories: {
      type: Number,
      required: true,
    },

    targetProteinGrams: {
      type: Number,
      required: true,
    },

    targetCarbsGrams: {
      type: Number,
      required: true,
    },

    targetFatGrams: {
      type: Number,
      required: true,
    },

    planTitle: {
      type: String,
      required: true,
      trim: true,
    },

    summary: {
      type: String,
      required: true,
      trim: true,
    },

    meals: {
      type: [dietPlanMealSchema],
      default: [],
    },

    totalCalories: {
      type: Number,
      default: 0,
    },

    totalProteinGrams: {
      type: Number,
      default: 0,
    },

    totalCarbsGrams: {
      type: Number,
      default: 0,
    },

    totalFatGrams: {
      type: Number,
      default: 0,
    },

    recommendationMethod: {
      type: String,
      default: "database_scoring",
    },

    disclaimer: {
      type: String,
      default:
        "This diet plan is for general fitness guidance only and is not medical advice. Consult a doctor or dietitian for medical conditions, allergies, pregnancy, or eating disorders.",
    },
  },
  { timestamps: true }
);

dietPlanSchema.index({ user: 1, createdAt: -1 });
dietPlanSchema.index({ goal: 1 });

module.exports = mongoose.model("DietPlan", dietPlanSchema);