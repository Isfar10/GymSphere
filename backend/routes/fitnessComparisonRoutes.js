const express = require("express");

const protect = require("../middlewares/authMiddleware");

const {
  getMyComparisons,
  getComparisonSummary,
  createComparison,
  updateComparison,
  deleteComparison,
  getDefaultBenchmarks,
} = require("../controllers/fitnessComparisonController");

const router = express.Router();

router.get("/", protect, getMyComparisons);
router.get("/mine", protect, getMyComparisons);
router.get("/summary", protect, getComparisonSummary);
router.get("/benchmarks", protect, getDefaultBenchmarks);
router.post("/", protect, createComparison);
router.put("/:id", protect, updateComparison);
router.delete("/:id", protect, deleteComparison);

module.exports = router;