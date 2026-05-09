const Feedback = require("../models/Feedback");
const User = require("../models/User");

const formatFeedback = (item) => ({
  id: item._id,
  user: item.user
    ? {
        id: item.user._id,
        name: item.user.name,
        email: item.user.email,
        role: item.user.role,
      }
    : null,
  type: item.type,
  category: item.category,
  subject: item.subject,
  message: item.message,
  status: item.status,
  adminResponse: item.adminResponse,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

const createFeedback = async (req, res) => {
  try {
    const { type, category, subject, message } = req.body;

    const currentUser = await User.findById(req.user.userId).select("-password");
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!type || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "type, subject, and message are required",
      });
    }

    const feedback = await Feedback.create({
      user: currentUser._id,
      type,
      category: category || "other",
      subject,
      message,
      status: "open",
      adminResponse: "",
    });

    const populatedFeedback = await Feedback.findById(feedback._id).populate(
      "user",
      "name email role"
    );

    return res.status(201).json({
      success: true,
      message: "Feedback submitted successfully",
      feedback: formatFeedback(populatedFeedback),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getMyFeedback = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId).select("-password");
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const items = await Feedback.find({ user: currentUser._id })
      .populate("user", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: items.length,
      feedback: items.map(formatFeedback),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllFeedback = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId).select("-password");
    if (!currentUser || currentUser.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can view all feedback",
      });
    }

    const { type, status, category } = req.query;
    const query = {};

    if (type) query.type = type;
    if (status) query.status = status;
    if (category) query.category = category;

    const items = await Feedback.find(query)
      .populate("user", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: items.length,
      feedback: items.map(formatFeedback),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateFeedbackStatus = async (req, res) => {
  try {
    const { status, adminResponse } = req.body;

    const currentUser = await User.findById(req.user.userId).select("-password");
    if (!currentUser || currentUser.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can update feedback status",
      });
    }

    const item = await Feedback.findById(req.params.id).populate(
      "user",
      "name email role"
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      });
    }

    if (status !== undefined) item.status = status;
    if (adminResponse !== undefined) item.adminResponse = adminResponse;

    await item.save();

    const updatedItem = await Feedback.findById(item._id).populate(
      "user",
      "name email role"
    );

    return res.status(200).json({
      success: true,
      message: "Feedback updated successfully",
      feedback: formatFeedback(updatedItem),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteFeedback = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId).select("-password");
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const item = await Feedback.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      });
    }

    const isOwner = String(item.user) === String(currentUser._id);
    const isAdmin = currentUser.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this feedback",
      });
    }

    await Feedback.findByIdAndDelete(item._id);

    return res.status(200).json({
      success: true,
      message: "Feedback deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createFeedback,
  getMyFeedback,
  getAllFeedback,
  updateFeedbackStatus,
  deleteFeedback,
};