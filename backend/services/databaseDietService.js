const FoodItem = require("../models/FoodItem");

const activityMultipliers = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const goalLabels = {
  weight_loss: "Weight Loss",
  muscle_gain: "Muscle Gain",
  maintenance: "Maintenance",
  general_fitness: "General Fitness",
};

const normalizeTextList = (value) => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .flatMap((item) => String(item).split(","))
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
  }

  return String(value)
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
};

const calculateNutritionTargets = ({
  goal,
  age,
  gender,
  heightCm,
  weightKg,
  activityLevel,
}) => {
  const bmr =
    gender === "female"
      ? 10 * weightKg + 6.25 * heightCm - 5 * age - 161
      : 10 * weightKg + 6.25 * heightCm - 5 * age + 5;

  const maintenanceCalories = Math.round(
    bmr * (activityMultipliers[activityLevel] || 1.55)
  );

  let targetCalories = maintenanceCalories;

  if (goal === "weight_loss") {
    targetCalories -= 400;
  }

  if (goal === "muscle_gain") {
    targetCalories += 300;
  }

  targetCalories = Math.max(1200, targetCalories);

  let proteinPerKg = 1.6;

  if (goal === "muscle_gain") {
    proteinPerKg = 2;
  }

  if (goal === "weight_loss") {
    proteinPerKg = 1.8;
  }

  const targetProteinGrams = Math.round(weightKg * proteinPerKg);
  const proteinCalories = targetProteinGrams * 4;

  const targetFatGrams = Math.round((targetCalories * 0.25) / 9);
  const fatCalories = targetFatGrams * 9;

  const targetCarbsGrams = Math.max(
    70,
    Math.round((targetCalories - proteinCalories - fatCalories) / 4)
  );

  return {
    targetCalories,
    targetProteinGrams,
    targetCarbsGrams,
    targetFatGrams,
  };
};

const foodContainsAny = (food, words) => {
  const name = food.name.toLowerCase();
  const allergens = food.allergens || [];

  return words.some((word) => {
    return name.includes(word) || allergens.includes(word);
  });
};

const scoreFood = ({ food, input, targetPerMeal, mealTag }) => {
  let score = 0;

  if (food.mealTags.includes(mealTag)) score += 20;
  if (food.dietTags.includes(input.dietType)) score += 25;

  if (input.dietType === "balanced" && food.dietTags.includes("balanced")) {
    score += 15;
  }

  if (input.goal === "muscle_gain") {
    score += food.proteinGrams * 3;
    if (food.category === "protein") score += 25;
    if (food.calories >= 150 && food.calories <= 350) score += 10;
  }

  if (input.goal === "weight_loss") {
    score += food.proteinGrams * 3;
    score += food.fiberGrams * 2;
    if (food.calories <= 180) score += 20;
    if (food.sugarGrams <= 5) score += 10;
  }

  if (input.goal === "maintenance" || input.goal === "general_fitness") {
    if (food.calories >= 80 && food.calories <= 300) score += 15;
    if (food.proteinGrams >= 5) score += 10;
  }

  const calorieDistance = Math.abs(food.calories - targetPerMeal.calories / 3);
  score += Math.max(0, 20 - calorieDistance / 20);

  const preferredHit = input.preferredFoods.some((preferred) =>
    food.name.toLowerCase().includes(preferred)
  );

  if (preferredHit) score += 35;

  const dislikedHit = input.dislikedFoods.some((disliked) =>
    food.name.toLowerCase().includes(disliked)
  );

  if (dislikedHit) score -= 100;

  return score;
};

const chooseFoodByCategory = ({
  foods,
  category,
  input,
  targetPerMeal,
  mealTag,
  usedFoodIds,
}) => {
  const candidates = foods
    .filter((food) => food.category === category)
    .filter((food) => !usedFoodIds.has(String(food._id)))
    .map((food) => ({
      food,
      score: scoreFood({ food, input, targetPerMeal, mealTag }),
    }))
    .sort((a, b) => b.score - a.score);

  return candidates[0]?.food || null;
};

const buildMeal = ({ mealName, time, mealTag, foods, input, targetPerMeal, usedFoodIds }) => {
  const selectedFoods = [];

  const addFood = (food) => {
    if (!food) return;
    selectedFoods.push(food);
    usedFoodIds.add(String(food._id));
  };

  if (input.dietType === "low_carb") {
    addFood(
      chooseFoodByCategory({
        foods,
        category: "protein",
        input,
        targetPerMeal,
        mealTag,
        usedFoodIds,
      })
    );

    addFood(
      chooseFoodByCategory({
        foods,
        category: "vegetable",
        input,
        targetPerMeal,
        mealTag,
        usedFoodIds,
      })
    );

    addFood(
      chooseFoodByCategory({
        foods,
        category: "fat",
        input,
        targetPerMeal,
        mealTag,
        usedFoodIds,
      })
    );
  } else {
    addFood(
      chooseFoodByCategory({
        foods,
        category: "protein",
        input,
        targetPerMeal,
        mealTag,
        usedFoodIds,
      })
    );

    addFood(
      chooseFoodByCategory({
        foods,
        category: "carb",
        input,
        targetPerMeal,
        mealTag,
        usedFoodIds,
      })
    );

    addFood(
      chooseFoodByCategory({
        foods,
        category: mealTag === "snack" ? "fruit" : "vegetable",
        input,
        targetPerMeal,
        mealTag,
        usedFoodIds,
      })
    );
  }

  if (selectedFoods.length < 3) {
    const backup = foods
      .filter((food) => !usedFoodIds.has(String(food._id)))
      .map((food) => ({
        food,
        score: scoreFood({ food, input, targetPerMeal, mealTag }),
      }))
      .sort((a, b) => b.score - a.score)[0]?.food;

    addFood(backup);
  }

  const mappedFoods = selectedFoods.map((food) => ({
    food: food._id,
    name: food.name,
    servingSize: food.servingSize,
    calories: food.calories,
    proteinGrams: food.proteinGrams,
    carbsGrams: food.carbsGrams,
    fatGrams: food.fatGrams,
  }));

  const totals = mappedFoods.reduce(
    (sum, food) => {
      sum.totalCalories += food.calories;
      sum.totalProteinGrams += food.proteinGrams;
      sum.totalCarbsGrams += food.carbsGrams;
      sum.totalFatGrams += food.fatGrams;
      return sum;
    },
    {
      totalCalories: 0,
      totalProteinGrams: 0,
      totalCarbsGrams: 0,
      totalFatGrams: 0,
    }
  );

  return {
    mealName,
    time,
    foods: mappedFoods,
    ...totals,
  };
};

const getMealTemplates = (mealsPerDay) => {
  const templates = [
    { mealName: "Breakfast", time: "8:00 AM", mealTag: "breakfast" },
    { mealName: "Lunch", time: "1:30 PM", mealTag: "lunch" },
    { mealName: "Dinner", time: "8:00 PM", mealTag: "dinner" },
    { mealName: "Snack", time: "5:00 PM", mealTag: "snack" },
    { mealName: "Morning Snack", time: "11:00 AM", mealTag: "snack" },
    { mealName: "Light Night Snack", time: "10:00 PM", mealTag: "snack" },
  ];

  if (Number(mealsPerDay) === 3) {
    return [templates[0], templates[1], templates[2]];
  }

  if (Number(mealsPerDay) === 4) {
    return [templates[0], templates[1], templates[3], templates[2]];
  }

  if (Number(mealsPerDay) === 5) {
    return [templates[0], templates[4], templates[1], templates[3], templates[2]];
  }

  return templates;
};

const generateDatabaseDietPlan = async (input) => {
  const normalizedInput = {
    ...input,
    allergies: normalizeTextList(input.allergies),
    dislikedFoods: normalizeTextList(input.dislikedFoods),
    preferredFoods: normalizeTextList(input.preferredFoods),
  };

  const targets = calculateNutritionTargets(normalizedInput);

  const allFoods = await FoodItem.find({
    isActive: true,
  });

  if (allFoods.length < 10) {
    throw new Error(
      "Food database is too small or empty. Run: node scripts/importFoods.js"
    );
  }

  const safeFoods = allFoods.filter((food) => {
    if (foodContainsAny(food, normalizedInput.allergies)) {
      return false;
    }

    if (normalizedInput.dietType === "vegan") {
      if (food.allergens.includes("milk") || food.allergens.includes("egg")) {
        return false;
      }
    }

    if (normalizedInput.dietType === "vegetarian") {
      const nonVegetarianWords = ["chicken", "fish", "beef", "tuna"];
      if (foodContainsAny(food, nonVegetarianWords)) {
        return false;
      }
    }

    return true;
  });

  if (safeFoods.length < 10) {
    throw new Error("Not enough foods match this user's allergy and diet filters.");
  }

  const mealTemplates = getMealTemplates(normalizedInput.mealsPerDay);
  const usedFoodIds = new Set();

  const targetPerMeal = {
    calories: targets.targetCalories / mealTemplates.length,
    proteinGrams: targets.targetProteinGrams / mealTemplates.length,
    carbsGrams: targets.targetCarbsGrams / mealTemplates.length,
    fatGrams: targets.targetFatGrams / mealTemplates.length,
  };

  const meals = mealTemplates.map((template) =>
    buildMeal({
      ...template,
      foods: safeFoods,
      input: normalizedInput,
      targetPerMeal,
      usedFoodIds,
    })
  );

  const totals = meals.reduce(
    (sum, meal) => {
      sum.totalCalories += meal.totalCalories;
      sum.totalProteinGrams += meal.totalProteinGrams;
      sum.totalCarbsGrams += meal.totalCarbsGrams;
      sum.totalFatGrams += meal.totalFatGrams;
      return sum;
    },
    {
      totalCalories: 0,
      totalProteinGrams: 0,
      totalCarbsGrams: 0,
      totalFatGrams: 0,
    }
  );

  const planTitle = `${goalLabels[normalizedInput.goal]} Database-Matched Diet Plan`;

  const summary =
    `This plan was generated by matching your goal, body metrics, diet type, allergies, and food preferences against the local MongoDB food database. ` +
    `Target: ${targets.targetCalories} kcal, ${targets.targetProteinGrams}g protein, ${targets.targetCarbsGrams}g carbs, ${targets.targetFatGrams}g fat.`;

  return {
    input: normalizedInput,
    targets,
    planTitle,
    summary,
    meals,
    totals,
  };
};

module.exports = {
  calculateNutritionTargets,
  generateDatabaseDietPlan,
};