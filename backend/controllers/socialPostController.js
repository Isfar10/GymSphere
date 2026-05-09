const SocialPost = require("../models/SocialPost");
const User = require("../models/User");
const Notification = require("../models/Notification");

const formatUser = (user) => {
  if (!user) return null;

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
};

const formatPost = (post) => ({
  id: post._id,
  author: formatUser(post.author),
  content: post.content,
  category: post.category,
  imageUrl: post.imageUrl,
  likes: post.likes.map((like) => {
    if (typeof like === "object" && like._id) {
      return {
        id: like._id,
        name: like.name,
        email: like.email,
      };
    }

    return {
      id: like,
    };
  }),
  likeCount: post.likes.length,
  comments: post.comments.map((comment) => ({
    id: comment._id,
    author: formatUser(comment.author),
    content: comment.content,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
  })),
  commentCount: post.comments.length,
  createdAt: post.createdAt,
  updatedAt: post.updatedAt,
});

const createNotificationSafely = async ({ user, title, message, link, metadata }) => {
  try {
    if (!user) return;

    await Notification.create({
      user,
      title,
      message,
      type: "system",
      link,
      metadata,
    });
  } catch (error) {
    console.error("Notification creation failed:", error.message);
  }
};

const getSocialFeed = async (req, res) => {
  try {
    const posts = await SocialPost.find({})
      .populate("author", "name email role")
      .populate("likes", "name email")
      .populate("comments.author", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: posts.length,
      posts: posts.map(formatPost),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const createSocialPost = async (req, res) => {
  try {
    const { content, category, imageUrl } = req.body;

    const currentUser = await User.findById(req.user.userId).select("-password");

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Post content is required",
      });
    }

    const post = await SocialPost.create({
      author: currentUser._id,
      content: content.trim(),
      category: category || "general",
      imageUrl: imageUrl || "",
    });

    const populatedPost = await SocialPost.findById(post._id)
      .populate("author", "name email role")
      .populate("likes", "name email")
      .populate("comments.author", "name email role");

    return res.status(201).json({
      success: true,
      message: "Post created successfully",
      post: formatPost(populatedPost),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const toggleLikePost = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId).select("-password");

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const post = await SocialPost.findById(req.params.id).populate("author", "name email role");

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const alreadyLiked = post.likes.some(
      (userId) => String(userId) === String(currentUser._id)
    );

    if (alreadyLiked) {
      post.likes = post.likes.filter(
        (userId) => String(userId) !== String(currentUser._id)
      );
    } else {
      post.likes.push(currentUser._id);

      if (String(post.author._id) !== String(currentUser._id)) {
        await createNotificationSafely({
          user: post.author._id,
          title: "New like on your post",
          message: `${currentUser.name} liked your fitness feed post.`,
          link: "/social-feed",
          metadata: {
            postId: post._id,
            actorId: currentUser._id,
            source: "social_feed_like",
          },
        });
      }
    }

    await post.save();

    const updatedPost = await SocialPost.findById(post._id)
      .populate("author", "name email role")
      .populate("likes", "name email")
      .populate("comments.author", "name email role");

    return res.status(200).json({
      success: true,
      message: alreadyLiked ? "Post unliked" : "Post liked",
      post: formatPost(updatedPost),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const addCommentToPost = async (req, res) => {
  try {
    const { content } = req.body;

    const currentUser = await User.findById(req.user.userId).select("-password");

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment content is required",
      });
    }

    const post = await SocialPost.findById(req.params.id).populate("author", "name email role");

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    post.comments.push({
      author: currentUser._id,
      content: content.trim(),
    });

    await post.save();

    if (String(post.author._id) !== String(currentUser._id)) {
      await createNotificationSafely({
        user: post.author._id,
        title: "New comment on your post",
        message: `${currentUser.name} commented on your fitness feed post.`,
        link: "/social-feed",
        metadata: {
          postId: post._id,
          actorId: currentUser._id,
          source: "social_feed_comment",
        },
      });
    }

    const updatedPost = await SocialPost.findById(post._id)
      .populate("author", "name email role")
      .populate("likes", "name email")
      .populate("comments.author", "name email role");

    return res.status(201).json({
      success: true,
      message: "Comment added successfully",
      post: formatPost(updatedPost),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteSocialPost = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId).select("-password");

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const post = await SocialPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const isOwner = String(post.author) === String(currentUser._id);
    const isAdmin = currentUser.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own posts",
      });
    }

    await SocialPost.findByIdAndDelete(post._id);

    return res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getSocialFeed,
  createSocialPost,
  toggleLikePost,
  addCommentToPost,
  deleteSocialPost,
};