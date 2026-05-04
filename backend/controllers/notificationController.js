const Notification = require("../models/Notification");
const User = require("../models/User");

const formatNotification = (notification) => ({
  id: notification._id,
  user: notification.user,
  title: notification.title,
  message: notification.message,
  type: notification.type,
  link: notification.link,
  isRead: notification.isRead,
  metadata: notification.metadata,
  createdAt: notification.createdAt,
  updatedAt: notification.updatedAt,
});

const getMyNotifications = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId).select("-password");

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const filter = {
      user: currentUser._id,
    };

    if (req.query.unread === "true") {
      filter.isRead = false;
    }

    const notifications = await Notification.find(filter).sort({
      createdAt: -1,
    });

    const unreadCount = await Notification.countDocuments({
      user: currentUser._id,
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      notifications: notifications.map(formatNotification),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getUnreadNotificationCount = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId).select("-password");

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const unreadCount = await Notification.countDocuments({
      user: currentUser._id,
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const markNotificationAsRead = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId).select("-password");

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    if (String(notification.user) !== String(currentUser._id)) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own notifications",
      });
    }

    notification.isRead = true;
    await notification.save();

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification: formatNotification(notification),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const markAllNotificationsAsRead = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId).select("-password");

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await Notification.updateMany(
      {
        user: currentUser._id,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId).select("-password");

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    if (String(notification.user) !== String(currentUser._id)) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own notifications",
      });
    }

    await Notification.findByIdAndDelete(notification._id);

    return res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const createTestNotification = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId).select("-password");

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const notification = await Notification.create({
      user: currentUser._id,
      title: "GymSphere notification test",
      message: "Your notification system is working correctly.",
      type: "system",
      link: "/notifications",
      metadata: {
        source: "test_button",
      },
    });

    return res.status(201).json({
      success: true,
      message: "Test notification created",
      notification: formatNotification(notification),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getMyNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  createTestNotification,
};