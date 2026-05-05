const Notification = require("../models/Notification");

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
    });

    return notification;
  } catch (error) {
    console.error("Notification creation failed:", error.message);
    return null;
  }
};

module.exports = createNotification;