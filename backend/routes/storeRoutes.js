const express = require("express");
const protect = require("../middlewares/authMiddleware");
const {
  requireAdmin,
  requireBuyer,
} = require("../middlewares/storeMiddleware");

const {
  getProducts,
  createProduct,
  updateProduct,
  toggleProduct,
  placeOrder,
  getMyOrders,
  getAllOrders,
  updatePaymentStatus,
  updateOrderStatus,
} = require("../controllers/storeController");

const router = express.Router();

router.get("/products", protect, getProducts);
router.post("/products", protect, requireAdmin, createProduct);
router.put("/products/:id", protect, requireAdmin, updateProduct);
router.patch("/products/:id/toggle", protect, requireAdmin, toggleProduct);

router.post("/orders", protect, requireBuyer, placeOrder);
router.get("/orders/me", protect, getMyOrders);
router.get("/orders", protect, requireAdmin, getAllOrders);
router.patch("/orders/:id/payment", protect, requireAdmin, updatePaymentStatus);
router.patch("/orders/:id/status", protect, requireAdmin, updateOrderStatus);

module.exports = router;