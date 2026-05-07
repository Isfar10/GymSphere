const express = require("express");
const protect = require("../middlewares/authMiddleware");

const {
  getMyProgressLogs,
  getAllProgressLogs,
  createProgressLog,
  updateProgressLog,
  deleteProgressLog,
} = require("../controllers/progressController");

const router = express.Router();

router.get("/mine", protect, getMyProgressLogs);
router.get("/my-progress", protect, getMyProgressLogs);

router.get("/admin/all", protect, getAllProgressLogs);

router.post("/", protect, createProgressLog);
router.put("/:id", protect, updateProgressLog);
router.delete("/:id", protect, deleteProgressLog);

module.exports = router;