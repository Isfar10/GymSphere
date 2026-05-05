const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: [true, "Comment content is required"],
      trim: true,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

const socialPostSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: [true, "Post content is required"],
      trim: true,
      maxlength: 1000,
    },
    category: {
      type: String,
      enum: ["achievement", "progress", "workout", "nutrition", "motivation", "general"],
      default: "general",
    },
    imageUrl: {
      type: String,
      trim: true,
      default: "",
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comments: {
      type: [commentSchema],
      default: [],
    },
  },
  { timestamps: true }
);

socialPostSchema.index({ createdAt: -1 });
socialPostSchema.index({ author: 1, createdAt: -1 });

module.exports = mongoose.model("SocialPost", socialPostSchema);