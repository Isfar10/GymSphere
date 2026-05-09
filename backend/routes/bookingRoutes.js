const express = require("express");
const protect = require("../middlewares/authMiddleware");
const {
  createBooking,
  getMyBookings,
  getAllBookings,
  updateBookingStatus
} = require("../controllers/bookingController");

const router = express.Router();

router.post("/", protect, createBooking);
router.get("/mine", protect, getMyBookings);
router.get("/", protect, getAllBookings);
router.patch("/:id/status", protect, updateBookingStatus);

module.exports = router;