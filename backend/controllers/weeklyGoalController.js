const WeeklyGoal = require("../models/WeeklyGoal");
const User = require("../models/User");

const getMondayOfWeek = (dateString) => {
  const baseDate = dateString ? new Date(dateString) : new Date();

  if (Number.isNaN(baseDate.getTime())) {
    return null;
  }

  const localDate = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate()
  );

  const day = localDate.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  localDate.setDate(localDate.getDate() + diff);

  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, "0");
  const date = String(localDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${date}`;
};

const formatGoal = (goal) => {
  const progressPercentage =
    goal.targetCount > 0
      ? Math.min(100, Math.round((goal.completedCount / goal.targetCount) * 100))
      : 0;

  return {
    id: goal._id,
    trainee: goal.trainee
      ? {
          id: goal.trainee._id,
          name: goal.trainee.name,
          email: goal.trainee.email,
        }
      : null,
    weekStart: goal.weekStart,
    title: goal.title,
    description: goal.description,
    category: goal.category,
    targetCount: goal.targetCount,
    completedCount: goal.completedCount,
    unit: goal.unit,
    isCompleted: goal.completedCount >= goal.targetCount,
    progressPercentage,
    createdAt: goal.createdAt,
    updatedAt: goal.updatedAt,
  };
};

const getMyWeeklyGoals = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId).select("-password");

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (currentUser.role !== "trainee") {
      return res.status(403).json({
        success: false,
        message: "Only trainees can access weekly goals",
      });
    }

    const requestedWeekStart = req.query.weekStart
      ? getMondayOfWeek(req.query.weekStart)
      : getMondayOfWeek();

    if (!requestedWeekStart) {
      return res.status(400).json({
        success: false,
        message: "Invalid weekStart value",
      });
    }

    const goals = await WeeklyGoal.find({
      trainee: currentUser._id,
      weekStart: requestedWeekStart,
    })
      .populate("trainee", "name email")
      .sort({ createdAt: -1 });

    const summary = goals.reduce(
      (acc, goal) => {
        acc.totalGoals += 1;
        acc.totalTarget += goal.targetCount;
        acc.totalCompleted += goal.completedCount;
        if (goal.completedCount >= goal.targetCount) {
          acc.completedGoals += 1;
        }
        return acc;
      },
      {
        totalGoals: 0,
        completedGoals: 0,
        totalTarget: 0,
        totalCompleted: 0,
      }
    );

    summary.progressPercentage =
      summary.totalTarget > 0
        ? Math.min(
            100,
            Math.round((summary.totalCompleted / summary.totalTarget) * 100)
          )
        : 0;

    return res.status(200).json({
      success: true,
      weekStart: requestedWeekStart,
      summary,
      goals: goals.map(formatGoal),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const createWeeklyGoal = async (req, res) => {
  try {
    const { title, description, category, targetCount, unit, weekStart } =
      req.body;

    const currentUser = await User.findById(req.user.userId).select("-password");

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (currentUser.role !== "trainee") {
      return res.status(403).json({
        success: false,
        message: "Only trainees can create weekly goals",
      });
    }

    if (!title || !targetCount) {
      return res.status(400).json({
        success: false,
        message: "title and targetCount are required",
      });
    }

    const normalizedWeekStart = weekStart
      ? getMondayOfWeek(weekStart)
      : getMondayOfWeek();

    if (!normalizedWeekStart) {
      return res.status(400).json({
        success: false,
        message: "Invalid weekStart value",
      });
    }

    const goal = await WeeklyGoal.create({
      trainee: currentUser._id,
      weekStart: normalizedWeekStart,
      title,
      description: description || "",
      category: category || "custom",
      targetCount: Number(targetCount),
      completedCount: 0,
      unit: unit || "sessions",
    });

    const populatedGoal = await WeeklyGoal.findById(goal._id).populate(
      "trainee",
      "name email"
    );

    return res.status(201).json({
      success: true,
      message: "Weekly goal created successfully",
      goal: formatGoal(populatedGoal),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateWeeklyGoal = async (req, res) => {
  try {
    const { title, description, category, targetCount, unit, weekStart } =
      req.body;

    const currentUser = await User.findById(req.user.userId).select("-password");

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (currentUser.role !== "trainee") {
      return res.status(403).json({
        success: false,
        message: "Only trainees can update weekly goals",
      });
    }

    const goal = await WeeklyGoal.findById(req.params.id).populate(
      "trainee",
      "name email"
    );

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: "Weekly goal not found",
      });
    }

    if (String(goal.trainee._id) !== String(currentUser._id)) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own weekly goals",
      });
    }

    if (title !== undefined) goal.title = title;
    if (description !== undefined) goal.description = description;
    if (category !== undefined) goal.category = category;
    if (unit !== undefined) goal.unit = unit;

    if (targetCount !== undefined) {
      goal.targetCount = Number(targetCount);
      if (goal.completedCount > goal.targetCount) {
        goal.completedCount = goal.targetCount;
      }
    }

    if (weekStart !== undefined) {
      const normalizedWeekStart = getMondayOfWeek(weekStart);

      if (!normalizedWeekStart) {
        return res.status(400).json({
          success: false,
          message: "Invalid weekStart value",
        });
      }

      goal.weekStart = normalizedWeekStart;
    }

    await goal.save();

    const updatedGoal = await WeeklyGoal.findById(goal._id).populate(
      "trainee",
      "name email"
    );

    return res.status(200).json({
      success: true,
      message: "Weekly goal updated successfully",
      goal: formatGoal(updatedGoal),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateWeeklyGoalProgress = async (req, res) => {
  try {
    const { completedCount, action } = req.body;

    const currentUser = await User.findById(req.user.userId).select("-password");

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (currentUser.role !== "trainee") {
      return res.status(403).json({
        success: false,
        message: "Only trainees can update weekly goal progress",
      });
    }

    const goal = await WeeklyGoal.findById(req.params.id).populate(
      "trainee",
      "name email"
    );

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: "Weekly goal not found",
      });
    }

    if (String(goal.trainee._id) !== String(currentUser._id)) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own weekly goals",
      });
    }

    if (completedCount !== undefined) {
      goal.completedCount = Number(completedCount);
    } else if (action === "increment") {
      goal.completedCount += 1;
    } else if (action === "decrement") {
      goal.completedCount -= 1;
    } else if (action === "complete") {
      goal.completedCount = goal.targetCount;
    } else if (action === "reset") {
      goal.completedCount = 0;
    } else {
      return res.status(400).json({
        success: false,
        message:
          "Provide completedCount or a valid action: increment, decrement, complete, reset",
      });
    }

    if (goal.completedCount < 0) {
      goal.completedCount = 0;
    }

    if (goal.completedCount > goal.targetCount) {
      goal.completedCount = goal.targetCount;
    }

    await goal.save();

    const updatedGoal = await WeeklyGoal.findById(goal._id).populate(
      "trainee",
      "name email"
    );

    return res.status(200).json({
      success: true,
      message: "Weekly goal progress updated successfully",
      goal: formatGoal(updatedGoal),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteWeeklyGoal = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId).select("-password");

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const goal = await WeeklyGoal.findById(req.params.id);

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: "Weekly goal not found",
      });
    }

    const isOwner = String(goal.trainee) === String(currentUser._id);
    const isAdmin = currentUser.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this weekly goal",
      });
    }

    await WeeklyGoal.findByIdAndDelete(goal._id);

    return res.status(200).json({
      success: true,
      message: "Weekly goal deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getMyWeeklyGoals,
  createWeeklyGoal,
  updateWeeklyGoal,
  updateWeeklyGoalProgress,
  deleteWeeklyGoal,
};