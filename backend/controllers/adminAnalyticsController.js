const User = require("../models/User");
const Booking = require("../models/Booking");
const Review = require("../models/Review");
const WeeklyGoal = require("../models/WeeklyGoal");
const Notification = require("../models/Notification");

const optionalModel = (path) => {
  try {
    return require(path);
  } catch (error) {
    return null;
  }
};

const SocialPost = optionalModel("../models/SocialPost");
const Progress = optionalModel("../models/Progress");

const getDateDaysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

const getAdminAnalytics = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId).select("-password");

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (currentUser.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can view analytics",
      });
    }

    const thirtyDaysAgo = getDateDaysAgo(30);

    const [
      totalUsers,
      totalTrainees,
      totalTrainers,
      totalAdmins,
      recentUsers,
      totalBookings,
      pendingBookings,
      acceptedBookings,
      rejectedBookings,
      cancelledBookings,
      completedBookings,
      recentBookings,
      allBookings,
      totalReviews,
      allReviews,
      totalWeeklyGoals,
      allWeeklyGoals,
      totalNotifications,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "trainee" }),
      User.countDocuments({ role: "trainer" }),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),

      Booking.countDocuments(),
      Booking.countDocuments({ status: "pending" }),
      Booking.countDocuments({ status: "accepted" }),
      Booking.countDocuments({ status: "rejected" }),
      Booking.countDocuments({ status: "cancelled" }),
      Booking.countDocuments({ status: "completed" }),
      Booking.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Booking.find({}).select("price status createdAt sessionDate"),

      Review.countDocuments(),
      Review.find({}).select("rating"),

      WeeklyGoal.countDocuments(),
      WeeklyGoal.find({}).select("targetCount completedCount category createdAt"),

      Notification.countDocuments(),
    ]);

    const revenue = allBookings.reduce((sum, booking) => {
      const validRevenueStatus =
        booking.status === "accepted" || booking.status === "completed";

      if (!validRevenueStatus) {
        return sum;
      }

      return sum + Number(booking.price || 0);
    }, 0);

    const averageRating =
      allReviews.length === 0
        ? 0
        : allReviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) /
          allReviews.length;

    const totalGoalTargets = allWeeklyGoals.reduce(
      (sum, goal) => sum + Number(goal.targetCount || 0),
      0
    );

    const totalGoalCompleted = allWeeklyGoals.reduce(
      (sum, goal) => sum + Number(goal.completedCount || 0),
      0
    );

    const weeklyGoalCompletionRate =
      totalGoalTargets === 0
        ? 0
        : Math.min(100, Math.round((totalGoalCompleted / totalGoalTargets) * 100));

    let socialStats = {
      totalPosts: 0,
      totalLikes: 0,
      totalComments: 0,
      recentPosts: 0,
      enabled: false,
    };

    if (SocialPost) {
      const posts = await SocialPost.find({}).select("likes comments createdAt");

      socialStats = {
        totalPosts: posts.length,
        totalLikes: posts.reduce(
          (sum, post) => sum + Number(post.likes?.length || 0),
          0
        ),
        totalComments: posts.reduce(
          (sum, post) => sum + Number(post.comments?.length || 0),
          0
        ),
        recentPosts: posts.filter(
          (post) => new Date(post.createdAt).getTime() >= thirtyDaysAgo.getTime()
        ).length,
        enabled: true,
      };
    }

    let progressStats = {
      totalEntries: 0,
      recentEntries: 0,
      enabled: false,
    };

    if (Progress) {
      progressStats = {
        totalEntries: await Progress.countDocuments(),
        recentEntries: await Progress.countDocuments({
          createdAt: { $gte: thirtyDaysAgo },
        }),
        enabled: true,
      };
    }

    return res.status(200).json({
      success: true,
      analytics: {
        users: {
          total: totalUsers,
          trainees: totalTrainees,
          trainers: totalTrainers,
          admins: totalAdmins,
          recent: recentUsers,
        },
        bookings: {
          total: totalBookings,
          pending: pendingBookings,
          accepted: acceptedBookings,
          rejected: rejectedBookings,
          cancelled: cancelledBookings,
          completed: completedBookings,
          recent: recentBookings,
        },
        revenue: {
          total: revenue,
        },
        reviews: {
          total: totalReviews,
          averageRating: Number(averageRating.toFixed(1)),
        },
        weeklyGoals: {
          total: totalWeeklyGoals,
          totalTargets: totalGoalTargets,
          totalCompleted: totalGoalCompleted,
          completionRate: weeklyGoalCompletionRate,
        },
        notifications: {
          total: totalNotifications,
        },
        socialFeed: socialStats,
        progress: progressStats,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAdminAnalytics,
};