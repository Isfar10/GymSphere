const express = require("express");
const protect = require("../middlewares/authMiddleware");
const {
  getTrainerReviews,
  createReview,
  updateReview,
  deleteReview,
} = require("../controllers/reviewController");

const router = express.Router();

router.get("/trainer/:trainerId", protect, getTrainerReviews);
router.post("/trainer/:trainerId", protect, createReview);
router.put("/:id", protect, updateReview);
router.delete("/:id", protect, deleteReview);

module.exports = router;