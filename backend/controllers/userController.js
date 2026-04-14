const User = require("../models/User");

const formatUserResponse = (user) => {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    fitnessGoal: user.fitnessGoal,
    age: user.age,
    height: user.height,
    weight: user.weight,
    bio: user.bio,
    specializations: user.specializations,
    certifications: user.certifications,
    experienceYears: user.experienceYears,
    hourlyRate: user.hourlyRate,
    availability: user.availability,
    rating: user.rating,
    reviewCount: user.reviewCount,
    isProfileComplete: user.isProfileComplete,
    createdAt: user.createdAt
  };
};

const escapeRegex = (value = "") =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeStringArray = (value) => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const normalizeAvailability = (value) => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((slot) => ({
        day: String(slot.day || "").trim(),
        start: String(slot.start || "").trim(),
        end: String(slot.end || "").trim()
      }))
      .filter((slot) => slot.day && slot.start && slot.end);
  }

  return [];
};

const buildTrainerProfileComplete = (user) => {
  return Boolean(
    user.role === "trainer" &&
      user.name &&
      user.bio &&
      user.specializations.length > 0 &&
      user.experienceYears !== null &&
      user.hourlyRate !== null &&
      user.availability.length > 0
  );
};

const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const {
      name,
      fitnessGoal,
      age,
      height,
      weight,
      bio,
      specializations,
      certifications,
      experienceYears,
      hourlyRate,
      availability
    } = req.body;

    user.name = name ?? user.name;
    user.fitnessGoal = fitnessGoal ?? user.fitnessGoal;
    user.age = age ?? user.age;
    user.height = height ?? user.height;
    user.weight = weight ?? user.weight;

    if (user.role === "trainer") {
      user.bio = bio ?? user.bio;
      user.specializations =
        specializations !== undefined
          ? normalizeStringArray(specializations)
          : user.specializations;

      user.certifications =
        certifications !== undefined
          ? normalizeStringArray(certifications)
          : user.certifications;

      user.experienceYears =
        experienceYears !== undefined ? experienceYears : user.experienceYears;

      user.hourlyRate =
        hourlyRate !== undefined ? hourlyRate : user.hourlyRate;

      user.availability =
        availability !== undefined
          ? normalizeAvailability(availability)
          : user.availability;

      user.isProfileComplete = buildTrainerProfileComplete(user);
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: formatUserResponse(user)
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getTrainers = async (req, res) => {
  try {
    const { search, specialization, minRating, maxPrice, day } = req.query;

    const query = {
      role: "trainer",
      isProfileComplete: true
    };

    if (specialization) {
      query.specializations = {
        $in: [new RegExp(`^${escapeRegex(specialization)}$`, "i")]
      };
    }

    if (minRating) {
      query.rating = { $gte: Number(minRating) };
    }

    if (maxPrice) {
      query.hourlyRate = {
        ...(query.hourlyRate || {}),
        $lte: Number(maxPrice)
      };
    }

    if (day) {
      query["availability.day"] = new RegExp(`^${escapeRegex(day)}$`, "i");
    }

    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), "i");
      query.$or = [
        { name: searchRegex },
        { bio: searchRegex },
        { specializations: searchRegex },
        { certifications: searchRegex }
      ];
    }

    const trainers = await User.find(query)
      .select("-password")
      .sort({ rating: -1, reviewCount: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: trainers.length,
      trainers: trainers.map(formatUserResponse)
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getTrainerById = async (req, res) => {
  try {
    const trainer = await User.findOne({
      _id: req.params.id,
      role: "trainer"
    }).select("-password");

    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: "Trainer not found"
      });
    }

    return res.status(200).json({
      success: true,
      trainer: formatUserResponse(trainer)
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  updateProfile,
  getTrainers,
  getTrainerById
};