const express = require("express");
const protect = require("../middlewares/authMiddleware");

const {
  seedDefaultPlans,
  getPlans,
  getAllPlansForAdmin,
  createPlan,
  updatePlan,
  deactivatePlan,
  subscribeToPlan,
  getMySubscription,
  getMySubscriptionHistory,
  cancelMySubscription,
  getAllSubscriptionsForAdmin,
} = require("../controllers/membershipController");

const router = express.Router();

router.get("/plans", protect, getPlans);
router.get("/plans/admin", protect, getAllPlansForAdmin);
router.post("/plans/seed", protect, seedDefaultPlans);
router.post("/plans", protect, createPlan);
router.put("/plans/:id", protect, updatePlan);
router.patch("/plans/:id/deactivate", protect, deactivatePlan);

router.post("/subscribe", protect, subscribeToPlan);
router.get("/me", protect, getMySubscription);
router.get("/history", protect, getMySubscriptionHistory);
router.patch("/cancel", protect, cancelMySubscription);

router.get("/admin/subscriptions", protect, getAllSubscriptionsForAdmin);

module.exports = router;