const express = require("express");
const protect = require("../middlewares/authMiddleware");

const {
  getMyProgressLogs,
  createProgressLog,
  updateProgressLog,
  deleteProgressLog,
  getFitnessComparison,
} = require("../controllers/progressController");

const router = express.Router();

router.get("/mine", protect, getMyProgressLogs);
router.get("/comparison", protect, getFitnessComparison);
router.post("/", protect, createProgressLog);
router.put("/:id", protect, updateProgressLog);
router.delete("/:id", protect, deleteProgressLog);

module.exports = router;