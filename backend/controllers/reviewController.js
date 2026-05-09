const Review = require("../models/Review");
const User = require("../models/User");

const formatReview = (review) => ({
  id: review._id,
  trainer: review.trainer
    ? {
        id: review.trainer._id,
        name: review.trainer.name,
      }
    : null,
  trainee: review.trainee
    ? {
        id: review.trainee._id,
        name: review.trainee.name,
        email: review.trainee.email,
      }
    : null,
  rating: review.rating,
  comment: review.comment,
  createdAt: review.createdAt,
  updatedAt: review.updatedAt,
});

const recalculateTrainerRating = async (trainerId) => {
  const result = await Review.aggregate([
    {
      $match: {
        trainer: trainerId,
      },
    },
    {
      $group: {
        _id: "$trainer",
        averageRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  const averageRating = result.length ? Number(result[0].averageRating.toFixed(1)) : 0;
  const reviewCount = result.length ? result[0].reviewCount : 0;

  await User.findByIdAndUpdate(trainerId, {
    rating: averageRating,
    reviewCount,
  });
};

const getTrainerReviews = async (req, res) => {
  try {
    const { trainerId } = req.params;

    const trainer = await User.findById(trainerId).select("-password");
    if (!trainer || trainer.role !== "trainer") {
      return res.status(404).json({
        success: false,
        message: "Trainer not found",
      });
    }

    const reviews = await Review.find({ trainer: trainerId })
      .populate("trainer", "name")
      .populate("trainee", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: reviews.length,
      reviews: reviews.map(formatReview),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const createReview = async (req, res) => {
  try {
    const { trainerId } = req.params;
    const { rating, comment } = req.body;

    if (!rating) {
      return res.status(400).json({
        success: false,
        message: "Rating is required",
      });
    }

    const trainee = await User.findById(req.user.userId).select("-password");
    if (!trainee) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (trainee.role !== "trainee") {
      return res.status(403).json({
        success: false,
        message: "Only trainees can create reviews",
      });
    }

    const trainer = await User.findById(trainerId).select("-password");
    if (!trainer || trainer.role !== "trainer") {
      return res.status(404).json({
        success: false,
        message: "Trainer not found",
      });
    }

    if (String(trainer._id) === String(trainee._id)) {
      return res.status(400).json({
        success: false,
        message: "You cannot review yourself",
      });
    }

    const existingReview = await Review.findOne({
      trainer: trainer._id,
      trainee: trainee._id,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this trainer",
      });
    }

    const review = await Review.create({
      trainer: trainer._id,
      trainee: trainee._id,
      rating: Number(rating),
      comment: comment || "",
    });

    await recalculateTrainerRating(trainer._id);

    const populatedReview = await Review.findById(review._id)
      .populate("trainer", "name")
      .populate("trainee", "name email");

    return res.status(201).json({
      success: true,
      message: "Review created successfully",
      review: formatReview(populatedReview),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this trainer",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const review = await Review.findById(req.params.id)
      .populate("trainer", "name")
      .populate("trainee", "name email");

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    if (String(review.trainee._id) !== String(req.user.userId)) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own review",
      });
    }

    if (rating !== undefined) {
      review.rating = Number(rating);
    }

    if (comment !== undefined) {
      review.comment = comment;
    }

    await review.save();
    await recalculateTrainerRating(review.trainer._id);

    const updatedReview = await Review.findById(review._id)
      .populate("trainer", "name")
      .populate("trainee", "name email");

    return res.status(200).json({
      success: true,
      message: "Review updated successfully",
      review: formatReview(updatedReview),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteReview = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId).select("-password");
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const review = await Review.findById(req.params.id)
      .populate("trainer", "name")
      .populate("trainee", "name email");

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    const isOwner = String(review.trainee._id) === String(currentUser._id);
    const isAdmin = currentUser.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this review",
      });
    }

    const trainerId = review.trainer._id;

    await Review.findByIdAndDelete(review._id);
    await recalculateTrainerRating(trainerId);

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getTrainerReviews,
  createReview,
  updateReview,
  deleteReview,
};