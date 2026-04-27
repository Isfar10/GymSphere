const express = require("express");
const protect = require("../middlewares/authMiddleware");
const {
  createFeedback,
  getMyFeedback,
  getAllFeedback,
  updateFeedbackStatus,
  deleteFeedback,
} = require("../controllers/feedbackController");

const router = express.Router();

router.post("/", protect, createFeedback);
router.get("/mine", protect, getMyFeedback);
router.get("/", protect, getAllFeedback);
router.patch("/:id", protect, updateFeedbackStatus);
router.delete("/:id", protect, deleteFeedback);

module.exports = router;