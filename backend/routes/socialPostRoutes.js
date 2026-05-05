const express = require("express");
const protect = require("../middlewares/authMiddleware");

const {
  getSocialFeed,
  createSocialPost,
  toggleLikePost,
  addCommentToPost,
  deleteSocialPost,
} = require("../controllers/socialPostController");

const router = express.Router();

router.get("/", protect, getSocialFeed);
router.post("/", protect, createSocialPost);
router.patch("/:id/like", protect, toggleLikePost);
router.post("/:id/comments", protect, addCommentToPost);
router.delete("/:id", protect, deleteSocialPost);

module.exports = router;