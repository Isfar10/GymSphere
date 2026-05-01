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
    createdAt: user.createdAt,
  };
};

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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
        end: String(slot.end || "").trim(),
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

const tokenize = (value = "") => {
  return String(value)
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3);
};

const unique = (items = []) => [...new Set(items)];

const getGoalKeywords = (fitnessGoal = "") => {
  const baseTokens = tokenize(fitnessGoal);

  const expandedTokens = [...baseTokens];

  const goalText = fitnessGoal.toLowerCase();

  if (goalText.includes("weight loss") || goalText.includes("lose weight")) {
    expandedTokens.push("fat", "loss", "cardio", "weight");
  }

  if (
    goalText.includes("muscle") ||
    goalText.includes("gain muscle") ||
    goalText.includes("bodybuilding")
  ) {
    expandedTokens.push("strength", "hypertrophy", "muscle", "weights");
  }

  if (
    goalText.includes("strength") ||
    goalText.includes("powerlifting") ||
    goalText.includes("stronger")
  ) {
    expandedTokens.push("strength", "power", "lifting");
  }

  if (
    goalText.includes("endurance") ||
    goalText.includes("stamina") ||
    goalText.includes("running")
  ) {
    expandedTokens.push("endurance", "cardio", "stamina", "running");
  }

  if (
    goalText.includes("flexibility") ||
    goalText.includes("mobility") ||
    goalText.includes("yoga")
  ) {
    expandedTokens.push("flexibility", "mobility", "stretching", "yoga");
  }

  return unique(expandedTokens);
};

const buildTrainerMatch = (trainer, traineeGoalKeywords) => {
  const specializationText = (trainer.specializations || []).join(" ").toLowerCase();
  const certificationText = (trainer.certifications || []).join(" ").toLowerCase();
  const bioText = String(trainer.bio || "").toLowerCase();
  const searchableText = `${specializationText} ${certificationText} ${bioText}`;

  let score = 0;
  const reasons = [];

  const matchedKeywords = traineeGoalKeywords.filter((keyword) =>
    searchableText.includes(keyword)
  );

  if (matchedKeywords.length > 0) {
    score += matchedKeywords.length * 30;
    reasons.push(
      `Matches your goal through: ${matchedKeywords.slice(0, 4).join(", ")}`
    );
  }

  if ((trainer.specializations || []).length > 0) {
    score += 10;
  }

  if (trainer.isProfileComplete) {
    score += 10;
    reasons.push("Trainer profile is complete");
  }

  if (typeof trainer.rating === "number") {
    score += trainer.rating * 8;
    if (trainer.rating >= 4) {
      reasons.push(`Highly rated (${trainer.rating.toFixed(1)})`);
    }
  }

  if (typeof trainer.reviewCount === "number") {
    score += Math.min(trainer.reviewCount, 20);
    if (trainer.reviewCount > 0) {
      reasons.push(`${trainer.reviewCount} review(s)`);
    }
  }

  if (typeof trainer.experienceYears === "number" && trainer.experienceYears > 0) {
    score += Math.min(trainer.experienceYears * 2, 20);
    reasons.push(`${trainer.experienceYears} year(s) experience`);
  }

  if (typeof trainer.hourlyRate === "number") {
    const affordabilityBoost = Math.max(0, 20 - Math.round(trainer.hourlyRate / 5));
    score += affordabilityBoost;
    reasons.push(`Rate: $${trainer.hourlyRate}/session`);
  }

  return {
    ...formatUserResponse(trainer),
    matchScore: Math.round(score),
    matchReasons: unique(reasons).slice(0, 4),
  };
};

const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
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
      availability,
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
      user.hourlyRate = hourlyRate !== undefined ? hourlyRate : user.hourlyRate;
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
      user: formatUserResponse(user),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getTrainers = async (req, res) => {
  try {
    const { search, specialization, minRating, maxPrice, day } = req.query;
    const query = { role: "trainer", isProfileComplete: true };

    if (specialization) {
      query.specializations = {
        $in: [new RegExp(`^${escapeRegex(specialization)}$`, "i")],
      };
    }

    if (minRating) {
      query.rating = { $gte: Number(minRating) };
    }

    if (maxPrice) {
      query.hourlyRate = { ...(query.hourlyRate || {}), $lte: Number(maxPrice) };
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
        { certifications: searchRegex },
      ];
    }

    const trainers = await User.find(query)
      .select("-password")
      .sort({ rating: -1, reviewCount: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: trainers.length,
      trainers: trainers.map(formatUserResponse),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getMatchedTrainers = async (req, res) => {
  try {
    const { day, maxPrice } = req.query;

    const currentUser = await User.findById(req.user.userId).select("-password");

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (currentUser.role !== "trainee") {
      return res.status(403).json({
        success: false,
        message: "Only trainees can access trainer matching",
      });
    }

    const query = { role: "trainer", isProfileComplete: true };

    if (day) {
      query["availability.day"] = new RegExp(`^${escapeRegex(day)}$`, "i");
    }

    if (maxPrice) {
      query.hourlyRate = { $lte: Number(maxPrice) };
    }

    const trainers = await User.find(query).select("-password");

    const goalKeywords = getGoalKeywords(currentUser.fitnessGoal);

    const matchedTrainers = trainers
      .map((trainer) => buildTrainerMatch(trainer, goalKeywords))
      .sort((a, b) => {
        if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
        if ((b.rating || 0) !== (a.rating || 0)) return (b.rating || 0) - (a.rating || 0);
        if ((b.reviewCount || 0) !== (a.reviewCount || 0)) {
          return (b.reviewCount || 0) - (a.reviewCount || 0);
        }
        return (a.hourlyRate || 0) - (b.hourlyRate || 0);
      });

    return res.status(200).json({
      success: true,
      fitnessGoal: currentUser.fitnessGoal,
      goalKeywords,
      count: matchedTrainers.length,
      trainers: matchedTrainers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getTrainerById = async (req, res) => {
  try {
    const trainer = await User.findOne({
      _id: req.params.id,
      role: "trainer",
    }).select("-password");

    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: "Trainer not found",
      });
    }

    return res.status(200).json({
      success: true,
      trainer: formatUserResponse(trainer),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  updateProfile,
  getTrainers,
  getMatchedTrainers,
  getTrainerById,
};