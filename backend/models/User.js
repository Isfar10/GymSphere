const mongoose = require("mongoose");

const availabilitySchema = new mongoose.Schema(
  {
    day: {
      type: String,
      trim: true,
      default: ""
    },
    start: {
      type: String,
      trim: true,
      default: ""
    },
    end: {
      type: String,
      trim: true,
      default: ""
    }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6
    },
    role: {
      type: String,
      enum: ["trainee", "trainer", "admin"],
      default: "trainee"
    },

    // Existing trainee/general profile fields
    fitnessGoal: {
      type: String,
      default: ""
    },
    age: {
      type: Number,
      default: null
    },
    height: {
      type: Number,
      default: null
    },
    weight: {
      type: Number,
      default: null
    },

    // New trainer profile fields
    bio: {
      type: String,
      default: ""
    },
    specializations: {
      type: [String],
      default: []
    },
    certifications: {
      type: [String],
      default: []
    },
    experienceYears: {
      type: Number,
      default: null
    },
    hourlyRate: {
      type: Number,
      default: null
    },
    availability: {
      type: [availabilitySchema],
      default: []
    },
    rating: {
      type: Number,
      default: 0
    },
    reviewCount: {
      type: Number,
      default: 0
    },
    isProfileComplete: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);