const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env") });

const FoodItem = require("../models/FoodItem");

const csvPath = path.join(__dirname, "../data/foods.csv");

const splitList = (value) => {
  if (!value) return [];

  return value
    .split("|")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
};

const parseCsvLine = (line) => {
  const result = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
};

const importFoods = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing in backend/.env");
    }

    await mongoose.connect(process.env.MONGO_URI);

    if (!fs.existsSync(csvPath)) {
      throw new Error(`foods.csv not found at ${csvPath}`);
    }

    const fileContent = fs.readFileSync(csvPath, "utf8").trim();
    const lines = fileContent.split(/\r?\n/);

    const headers = parseCsvLine(lines[0]);

    const foods = lines.slice(1).map((line) => {
      const values = parseCsvLine(line);
      const row = {};

      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });

      return {
        name: row.name,
        category: row.category || "other",
        servingSize: row.servingSize,
        calories: Number(row.calories || 0),
        proteinGrams: Number(row.proteinGrams || 0),
        carbsGrams: Number(row.carbsGrams || 0),
        fatGrams: Number(row.fatGrams || 0),
        fiberGrams: Number(row.fiberGrams || 0),
        sugarGrams: Number(row.sugarGrams || 0),
        dietTags: splitList(row.dietTags),
        allergens: splitList(row.allergens),
        mealTags: splitList(row.mealTags),
        source: "local_csv",
        isActive: true,
      };
    });

    let created = 0;
    let updated = 0;

    for (const food of foods) {
      const existing = await FoodItem.findOne({ name: food.name });

      if (existing) {
        await FoodItem.updateOne({ _id: existing._id }, food);
        updated += 1;
      } else {
        await FoodItem.create(food);
        created += 1;
      }
    }

    console.log(`Food import completed.`);
    console.log(`Created: ${created}`);
    console.log(`Updated: ${updated}`);
    console.log(`Total in CSV: ${foods.length}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Food import failed:", error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

importFoods();