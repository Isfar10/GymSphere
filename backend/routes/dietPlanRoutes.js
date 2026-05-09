const express = require("express");
const protect = require("../middlewares/authMiddleware");

const {
  generateDietPlan,
  getMyDietPlans,
  getAllDietPlansForAdmin,
  deleteDietPlan,
  getFoodDatabaseStats,
  getFoods,
} = require("../controllers/dietPlanController");

const router = express.Router();

router.get("/foods/stats", protect, getFoodDatabaseStats);
router.get("/foods", protect, getFoods);

router.post("/generate", protect, generateDietPlan);
router.get("/my-plans", protect, getMyDietPlans);
router.get("/admin/all", protect, getAllDietPlansForAdmin);
router.delete("/:id", protect, deleteDietPlan);

module.exports = router;