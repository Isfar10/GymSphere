const express = require("express");
const protect = require("../middlewares/authMiddleware");

const {
  submitManualBkashPayment,
  getMyManualBkashPayments,
  getAllManualBkashPayments,
  approveManualBkashPayment,
  rejectManualBkashPayment,
} = require("../controllers/manualBkashPaymentController");

const router = express.Router();

router.post("/", protect, submitManualBkashPayment);
router.get("/my-payments", protect, getMyManualBkashPayments);
router.get("/admin", protect, getAllManualBkashPayments);
router.patch("/:id/approve", protect, approveManualBkashPayment);
router.patch("/:id/reject", protect, rejectManualBkashPayment);

module.exports = router;