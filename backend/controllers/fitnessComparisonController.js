const FitnessComparison = require("../models/FitnessComparison");

const getUserId = (req) => {
  return req.user?._id || req.user?.id || req.user?.userId;
};

const buildResult = (item) => {
  const plain = item.toObject ? item.toObject({ virtuals: true }) : item;

  const difference = Number((plain.userValue - plain.benchmarkValue).toFixed(2));
  const percentageDifference = plain.benchmarkValue
    ? Number(((difference / plain.benchmarkValue) * 100).toFixed(2))
    : 0;

  let status = "On Track";
  if (percentageDifference >= 10) status = "Above Benchmark";
  if (percentageDifference <= -10) status = "Below Benchmark";

  return {
    ...plain,
    difference,
    percentageDifference,
    status,
  };
};

exports.getMyComparisons = async (req, res) => {
  try {
    const trainee = getUserId(req);

    const comparisons = await FitnessComparison.find({ trainee }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      count: comparisons.length,
      data: comparisons.map(buildResult),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch fitness comparisons",
      error: error.message,
    });
  }
};

exports.getComparisonSummary = async (req, res) => {
  try {
    const trainee = getUserId(req);

    const comparisons = await FitnessComparison.find({ trainee }).sort({
      createdAt: -1,
    });

    const results = comparisons.map(buildResult);

    const total = results.length;
    const above = results.filter((item) => item.status === "Above Benchmark").length;
    const below = results.filter((item) => item.status === "Below Benchmark").length;
    const onTrack = results.filter((item) => item.status === "On Track").length;

    const averagePerformance =
      total === 0
        ? 0
        : Number(
            (
              results.reduce((sum, item) => {
                if (!item.benchmarkValue) return sum;
                return sum + (item.userValue / item.benchmarkValue) * 100;
              }, 0) / total
            ).toFixed(2)
          );

    res.json({
      success: true,
      data: {
        total,
        above,
        below,
        onTrack,
        averagePerformance,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch comparison summary",
      error: error.message,
    });
  }
};

exports.createComparison = async (req, res) => {
  try {
    const trainee = getUserId(req);

    const {
      category,
      metricName,
      userValue,
      benchmarkValue,
      unit,
      benchmarkGroup,
      notes,
    } = req.body;

    if (!metricName || userValue === undefined || benchmarkValue === undefined || !unit) {
      return res.status(400).json({
        success: false,
        message: "metricName, userValue, benchmarkValue, and unit are required",
      });
    }

    const comparison = await FitnessComparison.create({
      trainee,
      category: category || "overall",
      metricName,
      userValue,
      benchmarkValue,
      unit,
      benchmarkGroup: benchmarkGroup || "GymSphere Community",
      notes: notes || "",
    });

    res.status(201).json({
      success: true,
      message: "Fitness comparison created successfully",
      data: buildResult(comparison),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create fitness comparison",
      error: error.message,
    });
  }
};

exports.updateComparison = async (req, res) => {
  try {
    const trainee = getUserId(req);

    const comparison = await FitnessComparison.findOneAndUpdate(
      {
        _id: req.params.id,
        trainee,
      },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!comparison) {
      return res.status(404).json({
        success: false,
        message: "Fitness comparison not found",
      });
    }

    res.json({
      success: true,
      message: "Fitness comparison updated successfully",
      data: buildResult(comparison),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update fitness comparison",
      error: error.message,
    });
  }
};

exports.deleteComparison = async (req, res) => {
  try {
    const trainee = getUserId(req);

    const comparison = await FitnessComparison.findOneAndDelete({
      _id: req.params.id,
      trainee,
    });

    if (!comparison) {
      return res.status(404).json({
        success: false,
        message: "Fitness comparison not found",
      });
    }

    res.json({
      success: true,
      message: "Fitness comparison deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete fitness comparison",
      error: error.message,
    });
  }
};

exports.getDefaultBenchmarks = async (req, res) => {
  try {
    res.json({
      success: true,
      data: [
        {
          category: "strength",
          metricName: "Bench Press",
          benchmarkValue: 60,
          unit: "kg",
          benchmarkGroup: "Beginner Community Average",
        },
        {
          category: "strength",
          metricName: "Squat",
          benchmarkValue: 80,
          unit: "kg",
          benchmarkGroup: "Beginner Community Average",
        },
        {
          category: "cardio",
          metricName: "5K Run Time",
          benchmarkValue: 30,
          unit: "minutes",
          benchmarkGroup: "General Community Average",
        },
        {
          category: "endurance",
          metricName: "Push-ups",
          benchmarkValue: 25,
          unit: "reps",
          benchmarkGroup: "General Community Average",
        },
        {
          category: "body",
          metricName: "Body Fat",
          benchmarkValue: 18,
          unit: "%",
          benchmarkGroup: "Fitness Community Average",
        },
        {
          category: "overall",
          metricName: "Performance Score",
          benchmarkValue: 70,
          unit: "score",
          benchmarkGroup: "GymSphere Community",
        },
      ],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch default benchmarks",
      error: error.message,
    });
  }
};