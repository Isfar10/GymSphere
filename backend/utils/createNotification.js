const Notification = require("../models/Notification");

/**
 * Safely creates a notification.
 * This helper is used by controllers such as bookingController.
 *
 * Expected fields:
 * - user: user id who receives the notification
 * - title: notification title
 * - message: notification message
 * - type: booking, weekly_goal, progress, review, feedback, promotion, system
 * - link: optional frontend route
 * - metadata: optional object
 */
const createNotification = async ({
  user,
  title,
  message,
  type = "system",
  link = "",
  metadata = {},
}) => {
  try {
    if (!user || !title || !message) {
      return null;
    }

    const notification = await Notification.create({
      user,
      title,
      message,
      type,
      link,
      metadata,
      isRead: false,
    });

    return notification;
  } catch (error) {
    console.error("Notification creation failed:", error.message);
    return null;
  }
};

module.exports = createNotification;