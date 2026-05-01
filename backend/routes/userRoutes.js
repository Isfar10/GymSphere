const express = require("express");
const protect = require("../middlewares/authMiddleware");
const {
  updateProfile,
  getTrainers,
  getMatchedTrainers,
  getTrainerById,
} = require("../controllers/userController");

const router = express.Router();

router.put("/profile", protect, updateProfile);
router.get("/trainers", protect, getTrainers);
router.get("/trainers/matches/me", protect, getMatchedTrainers);
router.get("/trainers/:id", protect, getTrainerById);

module.exports = router;