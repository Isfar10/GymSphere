const ProgressLog = require("../models/ProgressLog");
const User = require("../models/User");
const createNotification = require("../utils/createNotification");

const allowedRoles = ["trainee", "trainer"];

const normalizeDate = (dateString) => {
  const baseDate = dateString ? new Date(dateString) : new Date();

  if (Number.isNaN(baseDate.getTime())) {
    return null;
  }

  const year = baseDate.getFullYear();
  const month = String(baseDate.getMonth() + 1).padStart(2, "0");
  const date = String(baseDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${date}`;
};

const getCurrentUser = async (req) => {
  return User.findById(req.user.userId).select("-password");
};

const canUseProgress = (user) => {
  return user && allowedRoles.includes(user.role);
};

const numberOrNull = (value) => {
  if (value === "" || value === undefined || value === null) {
    return null;
  }

  return Number(value);
};

const numberOrZero = (value) => {
  if (value === "" || value === undefined || value === null) {
    return 0;
  }

  return Number(value);
};

const formatProgressLog = (log) => ({
  id: log._id,
  _id: log._id,
  trainee: log.trainee
    ? {
        id: log.trainee._id,
        _id: log.trainee._id,
        name: log.trainee.name,
        email: log.trainee.email,
      }
    : null,
  user: log.trainee
    ? {
        id: log.trainee._id,
        _id: log.trainee._id,
        name: log.trainee.name,
        email: log.trainee.email,
      }
    : null,
  date: log.date,
  weight: log.weight,
  bodyFat: log.bodyFat,
  chest: log.chest,
  waist: log.waist,
  arms: log.arms,
  legs: log.legs,
  workoutMinutes: log.workoutMinutes,
  workoutDuration: log.workoutMinutes,
  caloriesBurned: log.caloriesBurned,
  performanceScore: log.performanceScore,
  workoutsCompleted: log.workoutsCompleted,
  notes: log.notes,
  createdAt: log.createdAt,
  updatedAt: log.updatedAt,
});

const buildSummary = (logs) => {
  const totalLogs = logs.length;

  const totalWorkoutMinutes = logs.reduce(
    (sum, log) => sum + Number(log.workoutMinutes || 0),
    0
  );

  const totalCaloriesBurned = logs.reduce(
    (sum, log) => sum + Number(log.caloriesBurned || 0),
    0
  );

  const totalWorkoutsCompleted = logs.reduce(
    (sum, log) => sum + Number(log.workoutsCompleted || 0),
    0
  );

  const scoredLogs = logs.filter(
    (log) => Number(log.performanceScore || 0) > 0
  );

  const averagePerformanceScore =
    scoredLogs.length > 0
      ? Math.round(
          scoredLogs.reduce(
            (sum, log) => sum + Number(log.performanceScore || 0),
            0
          ) / scoredLogs.length
        )
      : 0;

  const weightLogs = logs
    .filter((log) => log.weight !== null && log.weight !== undefined)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const startingWeight = weightLogs.length > 0 ? weightLogs[0].weight : null;
  const latestWeight =
    weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : null;

  const weightChange =
    startingWeight !== null && latestWeight !== null
      ? Number((latestWeight - startingWeight).toFixed(1))
      : 0;

  return {
    totalLogs,
    totalWorkoutMinutes,
    totalCaloriesBurned,
    totalWorkoutsCompleted,
    averagePerformanceScore,
    startingWeight,
    latestWeight,
    weightChange,
  };
};

const sendSafeNotification = async (payload) => {
  try {
    await createNotification(payload);
  } catch {
    // Do not break progress saving if notification creation fails.
  }
};

const getMyProgressLogs = async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!canUseProgress(currentUser)) {
      return res.status(403).json({
        success: false,
        message: "Only trainees and trainers can access progress tracking",
      });
    }

    const { startDate, endDate } = req.query;

    const filter = {
      trainee: currentUser._id,
    };

    if (startDate || endDate) {
      filter.date = {};

      if (startDate) {
        const normalizedStartDate = normalizeDate(startDate);

        if (!normalizedStartDate) {
          return res.status(400).json({
            success: false,
            message: "Invalid startDate value",
          });
        }

        filter.date.$gte = normalizedStartDate;
      }

      if (endDate) {
        const normalizedEndDate = normalizeDate(endDate);

        if (!normalizedEndDate) {
          return res.status(400).json({
            success: false,
            message: "Invalid endDate value",
          });
        }

        filter.date.$lte = normalizedEndDate;
      }
    }

    const logs = await ProgressLog.find(filter)
      .populate("trainee", "name email")
      .sort({ date: -1, createdAt: -1 });

    const formattedLogs = logs.map(formatProgressLog);

    return res.status(200).json({
      success: true,
      summary: buildSummary(logs),
      logs: formattedLogs,
      progress: formattedLogs,
      entries: formattedLogs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllProgressLogs = async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);

    if (!currentUser || currentUser.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const logs = await ProgressLog.find()
      .populate("trainee", "name email")
      .sort({ date: -1, createdAt: -1 });

    const formattedLogs = logs.map(formatProgressLog);

    return res.status(200).json({
      success: true,
      summary: buildSummary(logs),
      logs: formattedLogs,
      progress: formattedLogs,
      entries: formattedLogs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const createProgressLog = async (req, res) => {
  try {
    const {
      date,
      weight,
      bodyFat,
      chest,
      waist,
      arms,
      legs,
      workoutMinutes,
      workoutDuration,
      caloriesBurned,
      performanceScore,
      workoutsCompleted,
      notes,
    } = req.body;

    const currentUser = await getCurrentUser(req);

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!canUseProgress(currentUser)) {
      return res.status(403).json({
        success: false,
        message: "Only trainees and trainers can create progress logs",
      });
    }

    const normalizedDate = normalizeDate(date);

    if (!normalizedDate) {
      return res.status(400).json({
        success: false,
        message: "A valid date is required",
      });
    }

    const existingLog = await ProgressLog.findOne({
      trainee: currentUser._id,
      date: normalizedDate,
    });

    if (existingLog) {
      return res.status(400).json({
        success: false,
        message:
          "A progress log already exists for this date. Delete it first or use another date.",
      });
    }

    const finalWorkoutMinutes =
      workoutMinutes !== undefined ? workoutMinutes : workoutDuration;

    const progressLog = await ProgressLog.create({
      trainee: currentUser._id,
      date: normalizedDate,
      weight: numberOrNull(weight),
      bodyFat: numberOrNull(bodyFat),
      chest: numberOrNull(chest),
      waist: numberOrNull(waist),
      arms: numberOrNull(arms),
      legs: numberOrNull(legs),
      workoutMinutes: numberOrZero(finalWorkoutMinutes),
      caloriesBurned: numberOrZero(caloriesBurned),
      performanceScore: numberOrZero(performanceScore),
      workoutsCompleted: numberOrZero(workoutsCompleted),
      notes: notes || "",
    });

    const populatedLog = await ProgressLog.findById(progressLog._id).populate(
      "trainee",
      "name email"
    );

    await sendSafeNotification({
      user: currentUser._id,
      title: "Progress logged",
      message: `Your progress for ${normalizedDate} has been saved successfully.`,
      type: "progress",
      link: "/progress",
      metadata: {
        progressLogId: progressLog._id,
        date: normalizedDate,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Progress log created successfully",
      log: formatProgressLog(populatedLog),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateProgressLog = async (req, res) => {
  try {
    const {
      date,
      weight,
      bodyFat,
      chest,
      waist,
      arms,
      legs,
      workoutMinutes,
      workoutDuration,
      caloriesBurned,
      performanceScore,
      workoutsCompleted,
      notes,
    } = req.body;

    const currentUser = await getCurrentUser(req);

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!canUseProgress(currentUser)) {
      return res.status(403).json({
        success: false,
        message: "Only trainees and trainers can update progress logs",
      });
    }

    const progressLog = await ProgressLog.findById(req.params.id);

    if (!progressLog) {
      return res.status(404).json({
        success: false,
        message: "Progress log not found",
      });
    }

    if (String(progressLog.trainee) !== String(currentUser._id)) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own progress logs",
      });
    }

    if (date !== undefined) {
      const normalizedDate = normalizeDate(date);

      if (!normalizedDate) {
        return res.status(400).json({
          success: false,
          message: "Invalid date value",
        });
      }

      const duplicateLog = await ProgressLog.findOne({
        trainee: currentUser._id,
        date: normalizedDate,
        _id: { $ne: progressLog._id },
      });

      if (duplicateLog) {
        return res.status(400).json({
          success: false,
          message: "Another progress log already exists for this date",
        });
      }

      progressLog.date = normalizedDate;
    }

    if (weight !== undefined) progressLog.weight = numberOrNull(weight);
    if (bodyFat !== undefined) progressLog.bodyFat = numberOrNull(bodyFat);
    if (chest !== undefined) progressLog.chest = numberOrNull(chest);
    if (waist !== undefined) progressLog.waist = numberOrNull(waist);
    if (arms !== undefined) progressLog.arms = numberOrNull(arms);
    if (legs !== undefined) progressLog.legs = numberOrNull(legs);

    if (workoutMinutes !== undefined || workoutDuration !== undefined) {
      progressLog.workoutMinutes = numberOrZero(
        workoutMinutes !== undefined ? workoutMinutes : workoutDuration
      );
    }

    if (caloriesBurned !== undefined) {
      progressLog.caloriesBurned = numberOrZero(caloriesBurned);
    }

    if (performanceScore !== undefined) {
      progressLog.performanceScore = numberOrZero(performanceScore);
    }

    if (workoutsCompleted !== undefined) {
      progressLog.workoutsCompleted = numberOrZero(workoutsCompleted);
    }

    if (notes !== undefined) {
      progressLog.notes = notes;
    }

    await progressLog.save();

    const updatedLog = await ProgressLog.findById(progressLog._id).populate(
      "trainee",
      "name email"
    );

    return res.status(200).json({
      success: true,
      message: "Progress log updated successfully",
      log: formatProgressLog(updatedLog),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteProgressLog = async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const progressLog = await ProgressLog.findById(req.params.id);

    if (!progressLog) {
      return res.status(404).json({
        success: false,
        message: "Progress log not found",
      });
    }

    const isOwner = String(progressLog.trainee) === String(currentUser._id);
    const isAdmin = currentUser.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this progress log",
      });
    }

    await ProgressLog.findByIdAndDelete(progressLog._id);

    return res.status(200).json({
      success: true,
      message: "Progress log deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getMyProgressLogs,
  getAllProgressLogs,
  createProgressLog,
  updateProgressLog,
  deleteProgressLog,
};