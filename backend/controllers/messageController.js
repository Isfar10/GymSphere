const mongoose = require("mongoose");
const User = require("../models/User");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  bio: user.bio,
  specializations: user.specializations,
  rating: user.rating,
});

const getChatContacts = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId);

    if (!currentUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    let allowedRole = null;

    if (currentUser.role === "trainee") allowedRole = "trainer";
    if (currentUser.role === "trainer") allowedRole = "trainee";

    if (!allowedRole) {
      return res.status(403).json({
        success: false,
        message: "Only trainers and trainees can use messaging.",
      });
    }

    const users = await User.find({ role: allowedRole })
      .select("name email role bio specializations rating")
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      contacts: users.map(formatUser),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getOrCreateConversation = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { receiverId } = req.body;

    if (!receiverId || !mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({
        success: false,
        message: "Valid receiverId is required.",
      });
    }

    if (String(receiverId) === String(currentUserId)) {
      return res.status(400).json({
        success: false,
        message: "You cannot message yourself.",
      });
    }

    const currentUser = await User.findById(currentUserId);
    const receiver = await User.findById(receiverId);

    if (!currentUser || !receiver) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const validPair =
      (currentUser.role === "trainee" && receiver.role === "trainer") ||
      (currentUser.role === "trainer" && receiver.role === "trainee");

    if (!validPair) {
      return res.status(403).json({
        success: false,
        message: "Messaging is only allowed between trainers and trainees.",
      });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, receiverId] },
    }).populate("participants", "name email role");

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [currentUserId, receiverId],
      });

      conversation = await Conversation.findById(conversation._id).populate(
        "participants",
        "name email role"
      );
    }

    return res.status(200).json({
      success: true,
      conversation,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getMyConversations = async (req, res) => {
  try {
    const currentUserId = req.user.userId;

    const conversations = await Conversation.find({
      participants: currentUserId,
    })
      .populate("participants", "name email role")
      .sort({ lastMessageAt: -1, updatedAt: -1 });

    const conversationIds = conversations.map((item) => item._id);

    const unreadCounts = await Message.aggregate([
      {
        $match: {
          conversation: { $in: conversationIds },
          receiver: new mongoose.Types.ObjectId(currentUserId),
          isRead: false,
        },
      },
      {
        $group: {
          _id: "$conversation",
          count: { $sum: 1 },
        },
      },
    ]);

    const unreadMap = unreadCounts.reduce((acc, item) => {
      acc[String(item._id)] = item.count;
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      conversations: conversations.map((conversation) => ({
        ...conversation.toObject(),
        unreadCount: unreadMap[String(conversation._id)] || 0,
      })),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found.",
      });
    }

    const isParticipant = conversation.participants.some(
      (participantId) => String(participantId) === String(currentUserId)
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view this conversation.",
      });
    }

    await Message.updateMany(
      {
        conversation: conversationId,
        receiver: currentUserId,
        isRead: false,
      },
      { isRead: true }
    );

    const messages = await Message.find({ conversation: conversationId })
      .populate("sender", "name email role")
      .populate("receiver", "name email role")
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { conversationId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message cannot be empty.",
      });
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found.",
      });
    }

    const isParticipant = conversation.participants.some(
      (participantId) => String(participantId) === String(currentUserId)
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to send messages here.",
      });
    }

    const receiverId = conversation.participants.find(
      (participantId) => String(participantId) !== String(currentUserId)
    );

    const message = await Message.create({
      conversation: conversationId,
      sender: currentUserId,
      receiver: receiverId,
      text: text.trim(),
    });

    conversation.lastMessage = text.trim();
    conversation.lastMessageAt = new Date();
    await conversation.save();

    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "name email role")
      .populate("receiver", "name email role");

    return res.status(201).json({
      success: true,
      message: populatedMessage,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getChatContacts,
  getOrCreateConversation,
  getMyConversations,
  getMessages,
  sendMessage,
};