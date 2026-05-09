const mongoose = require("mongoose");
require("dotenv").config();

const SubscriptionPlan = require("../models/SubscriptionPlan");

const plans = [
  {
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

const run = async () => {
  try {
    const mongoUri =
      process.env.MONGO_URI ||
      process.env.MONGODB_URI ||
      process.env.DB_URI;

    if (!mongoUri) {
      throw new Error("MONGO_URI / MONGODB_URI / DB_URI is missing in backend .env");
    }

    await mongoose.connect(mongoUri);

    for (const plan of plans) {
      await SubscriptionPlan.findOneAndUpdate(
        { name: plan.name },
        plan,
        {
          upsert: true,
          new: true,
          runValidators: true,
        }
      );
    }

    const savedPlans = await SubscriptionPlan.find(
      {},
      {
        name: 1,
        price: 1,
        durationDays: 1,
        isActive: 1,
      }
    ).lean();

    console.log("Membership plans fixed successfully");
    console.table(savedPlans);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Failed to fix membership plans:", error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

run();