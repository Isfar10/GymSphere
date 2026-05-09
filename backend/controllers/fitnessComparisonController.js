const ProgressLog = require("../models/ProgressLog");
const User = require("../models/User");

// GET /api/fitness-comparison/benchmarks
// Returns community averages and current user's latest stats for comparison
const getBenchmarks = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch all progress logs for community stats (last entry per user)
    const allUsers = await User.find({ role: { $in: ["trainee", "trainer"] } }).select("_id");
    const userIds = allUsers.map((u) => u._id);

    // Get the most recent log per user
    const latestPerUser = await ProgressLog.aggregate([
      { $match: { trainee: { $in: userIds } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$trainee",
          weight: { $first: "$weight" },
          bodyFat: { $first: "$bodyFat" },
          chest: { $first: "$chest" },
          waist: { $first: "$waist" },
          arms: { $first: "$arms" },
          legs: { $first: "$legs" },
          workoutMinutes: { $first: "$workoutMinutes" },
          caloriesBurned: { $first: "$caloriesBurned" },
          performanceScore: { $first: "$performanceScore" },
        },
      },
    ]);

    const avg = (field) => {
      const vals = latestPerUser
        .map((u) => u[field])
        .filter((v) => v != null && v > 0);
      if (!vals.length) return null;
      return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
    };

    const communityBenchmarks = {
      weight: avg("weight"),
      bodyFat: avg("bodyFat"),
      chest: avg("chest"),
      waist: avg("waist"),
      arms: avg("arms"),
      legs: avg("legs"),
      workoutMinutes: avg("workoutMinutes"),
      caloriesBurned: avg("caloriesBurned"),
      performanceScore: avg("performanceScore"),
      totalParticipants: latestPerUser.length,
    };

    // User's own latest log
    const userLatest = await ProgressLog.findOne({ trainee: userId }).sort({
      createdAt: -1,
    });

    // Percentile ranks for user
    const percentile = (field, userVal) => {
      if (userVal == null) return null;
      const vals = latestPerUser
        .map((u) => u[field])
        .filter((v) => v != null && v > 0);
      if (!vals.length) return null;
      const below = vals.filter((v) => v < userVal).length;
      return Math.round((below / vals.length) * 100);
    };

    const userRanks = userLatest
      ? {
          weight: percentile("weight", userLatest.weight),
          bodyFat: percentile("bodyFat", userLatest.bodyFat),
          chest: percentile("chest", userLatest.chest),
          waist: percentile("waist", userLatest.waist),
          arms: percentile("arms", userLatest.arms),
          legs: percentile("legs", userLatest.legs),
          workoutMinutes: percentile("workoutMinutes", userLatest.workoutMinutes),
          caloriesBurned: percentile("caloriesBurned", userLatest.caloriesBurned),
          performanceScore: percentile(
            "performanceScore",
            userLatest.performanceScore
          ),
        }
      : null;

    return res.status(200).json({
      success: true,
      communityBenchmarks,
      userStats: userLatest,
      userRanks,
    });
  } catch (error) {
    console.error("getBenchmarks error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/fitness-comparison/leaderboard?metric=performanceScore&limit=10
const getLeaderboard = async (req, res) => {
  try {
    const metric = req.query.metric || "performanceScore";
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    const validMetrics = [
      "performanceScore",
      "workoutMinutes",
      "caloriesBurned",
      "weight",
      "bodyFat",
    ];
    if (!validMetrics.includes(metric)) {
      return res.status(400).json({ success: false, message: "Invalid metric" });
    }

    const topLogs = await ProgressLog.aggregate([
      { $match: { [metric]: { $gt: 0 } } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: "$trainee", value: { $first: `$${metric}` } } },
      { $sort: { value: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 0,
          userId: "$_id",
          name: "$user.name",
          role: "$user.role",
          value: 1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      metric,
      leaderboard: topLogs,
    });
  } catch (error) {
    console.error("getLeaderboard error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getBenchmarks, getLeaderboard };
