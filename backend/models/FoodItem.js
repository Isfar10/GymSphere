const mongoose = require("mongoose");

const foodItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    category: {
      type: String,
      enum: ["protein", "carb", "fat", "vegetable", "fruit", "dairy", "meal", "other"],
      default: "other",
    },

    servingSize: {
      type: String,
      required: true,
      trim: true,
    },

    calories: {
      type: Number,
      required: true,
      min: 0,
    },

    proteinGrams: {
      type: Number,
      default: 0,
      min: 0,
    },

    carbsGrams: {
      type: Number,
      default: 0,
      min: 0,
    },

    fatGrams: {
      type: Number,
      default: 0,
      min: 0,
    },

    fiberGrams: {
      type: Number,
      default: 0,
      min: 0,
    },

    sugarGrams: {
      type: Number,
      default: 0,
      min: 0,
    },

    dietTags: {
      type: [String],
      default: [],
    },

    allergens: {
      type: [String],
      default: [],
    },

    mealTags: {
      type: [String],
      default: [],
    },

    source: {
      type: String,
      default: "local_csv",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

foodItemSchema.index({ category: 1 });
foodItemSchema.index({ dietTags: 1 });
foodItemSchema.index({ mealTags: 1 });
foodItemSchema.index({ calories: 1 });
foodItemSchema.index({ proteinGrams: -1 });

module.exports = mongoose.model("FoodItem", foodItemSchema);