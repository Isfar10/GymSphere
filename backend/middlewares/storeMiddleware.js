const User = require("../models/User");

const getCurrentUser = async (req) => {
  return User.findById(req.user.userId).select("-password");
};

exports.requireAdmin = async (req, res, next) => {
  const user = await getCurrentUser(req);

  if (!user || user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }

  req.currentUser = user;
  next();
};

exports.requireBuyer = async (req, res, next) => {
  const user = await getCurrentUser(req);

  if (!user || !["trainee", "trainer"].includes(user.role)) {
    return res.status(403).json({
      success: false,
      message: "Only trainees and trainers can buy store products",
    });
  }

  req.currentUser = user;
  next();
};