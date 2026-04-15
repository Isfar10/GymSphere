const Booking = require("../models/Booking");
const User = require("../models/User");

const formatBooking = (booking) => ({
  id: booking._id,
  trainee: booking.trainee
    ? {
        id: booking.trainee._id,
        name: booking.trainee.name,
        email: booking.trainee.email
      }
    : null,
  trainer: booking.trainer
    ? {
        id: booking.trainer._id,
        name: booking.trainer.name,
        email: booking.trainer.email,
        hourlyRate: booking.trainer.hourlyRate
      }
    : null,
  sessionDate: booking.sessionDate,
  day: booking.day,
  start: booking.start,
  end: booking.end,
  notes: booking.notes,
  price: booking.price,
  status: booking.status,
  createdAt: booking.createdAt,
  updatedAt: booking.updatedAt
});

const createBooking = async (req, res) => {
  try {
    const { trainerId, sessionDate, day, start, end, notes } = req.body;

    if (!trainerId || !sessionDate || !day || !start || !end) {
      return res.status(400).json({
        success: false,
        message: "trainerId, sessionDate, day, start, and end are required"
      });
    }

    const trainee = await User.findById(req.user.userId).select("-password");

    if (!trainee) {
      return res.status(404).json({
        success: false,
        message: "Trainee not found"
      });
    }

    if (trainee.role !== "trainee") {
      return res.status(403).json({
        success: false,
        message: "Only trainees can create bookings"
      });
    }

    const trainer = await User.findById(trainerId).select("-password");

    if (!trainer || trainer.role !== "trainer") {
      return res.status(404).json({
        success: false,
        message: "Trainer not found"
      });
    }

    if (!trainer.isProfileComplete) {
      return res.status(400).json({
        success: false,
        message: "Trainer profile is not complete yet"
      });
    }

    const matchingAvailability = trainer.availability.find(
      (slot) =>
        slot.day.toLowerCase() === String(day).toLowerCase() &&
        slot.start === start &&
        slot.end === end
    );

    if (!matchingAvailability) {
      return res.status(400).json({
        success: false,
        message: "Selected slot is not available for this trainer"
      });
    }

    const alreadyBooked = await Booking.findOne({
      trainer: trainer._id,
      sessionDate,
      day,
      start,
      end,
      status: { $in: ["pending", "accepted"] }
    });

    if (alreadyBooked) {
      return res.status(400).json({
        success: false,
        message: "This slot is already booked"
      });
    }

    const booking = await Booking.create({
      trainee: trainee._id,
      trainer: trainer._id,
      sessionDate,
      day,
      start,
      end,
      notes: notes || "",
      price: trainer.hourlyRate || 0
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate("trainee", "name email")
      .populate("trainer", "name email hourlyRate");

    return res.status(201).json({
      success: true,
      message: "Booking created successfully",
      booking: formatBooking(populatedBooking)
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getMyBookings = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId);

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    let query = {};

    if (currentUser.role === "trainee") {
      query.trainee = currentUser._id;
    } else if (currentUser.role === "trainer") {
      query.trainer = currentUser._id;
    }

    const bookings = await Booking.find(query)
      .populate("trainee", "name email")
      .populate("trainer", "name email hourlyRate")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings: bookings.map(formatBooking)
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getAllBookings = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId);

    if (!currentUser || currentUser.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can view all bookings"
      });
    }

    const bookings = await Booking.find({})
      .populate("trainee", "name email")
      .populate("trainer", "name email hourlyRate")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings: bookings.map(formatBooking)
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required"
      });
    }

    const booking = await Booking.findById(req.params.id)
      .populate("trainee", "name email")
      .populate("trainer", "name email hourlyRate");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    const currentUser = await User.findById(req.user.userId);

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (currentUser.role === "trainer") {
      const isOwnBooking =
        String(booking.trainer._id) === String(currentUser._id);

      if (!isOwnBooking) {
        return res.status(403).json({
          success: false,
          message: "You can only manage your own bookings"
        });
      }

      const allowedTrainerStatuses = ["accepted", "rejected", "completed"];

      if (!allowedTrainerStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Trainer can only set accepted, rejected, or completed"
        });
      }

      if (status === "completed" && booking.status !== "accepted") {
        return res.status(400).json({
          success: false,
          message: "Only accepted bookings can be completed"
        });
      }
    } else if (currentUser.role === "trainee") {
      const isOwnBooking =
        String(booking.trainee._id) === String(currentUser._id);

      if (!isOwnBooking) {
        return res.status(403).json({
          success: false,
          message: "You can only manage your own bookings"
        });
      }

      if (status !== "cancelled") {
        return res.status(400).json({
          success: false,
          message: "Trainee can only cancel bookings"
        });
      }

      if (!["pending", "accepted"].includes(booking.status)) {
        return res.status(400).json({
          success: false,
          message: "Only pending or accepted bookings can be cancelled"
        });
      }
    } else if (currentUser.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized"
      });
    }

    booking.status = status;
    await booking.save();

    const updatedBooking = await Booking.findById(booking._id)
      .populate("trainee", "name email")
      .populate("trainer", "name email hourlyRate");

    return res.status(200).json({
      success: true,
      message: "Booking status updated successfully",
      booking: formatBooking(updatedBooking)
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getAllBookings,
  updateBookingStatus
};