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
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};

const updateProfile = async (req, res) => {
  try {
    const { name, fitnessGoal, age, height, weight } = req.body;

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    user.name = name ?? user.name;
    user.fitnessGoal = fitnessGoal ?? user.fitnessGoal;
    user.age = age ?? user.age;
    user.height = height ?? user.height;
    user.weight = weight ?? user.weight;

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

module.exports = {
  updateProfile
};