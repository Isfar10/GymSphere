const express = require("express");
const protect = require("../middlewares/authMiddleware");

const {
  getMyProgressLogs,
  createProgressLog,
  updateProgressLog,
  deleteProgressLog,
} = require("../controllers/progressController");

const router = express.Router();

router.get("/mine", protect, getMyProgressLogs);
router.post("/", protect, createProgressLog);
router.put("/:id", protect, updateProgressLog);
router.delete("/:id", protect, deleteProgressLog);

module.exports = router;