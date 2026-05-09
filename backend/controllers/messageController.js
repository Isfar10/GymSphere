const mongoose = require("mongoose");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");

const formatUser = (user) => {
  if (!user) return null;

  return {
    id: user._id?.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  };
};

const formatConversation = (conversation, currentUserId, unreadCount = 0) => {
  const currentId = currentUserId.toString();

  const otherParticipants = conversation.participants.filter(
    (participant) => participant._id.toString() !== currentId
  );

  return {
    id: conversation._id.toString(),
    participants: conversation.participants.map(formatUser),
    otherUser: formatUser(otherParticipants[0]),
    lastMessage: conversation.lastMessage,
    lastMessageAt: conversation.lastMessageAt,
    lastSender: conversation.lastSender
      ? conversation.lastSender.toString()
      : null,
    unreadCount,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
};

const formatMessage = (message) => {
  return {
    id: message._id.toString(),
    conversation: message.conversation.toString(),
    sender: formatUser(message.sender),
    receiver: formatUser(message.receiver),
    content: message.content,
    isRead: message.isRead,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  };
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const getCurrentUserId = (req) => {
  return req.user?.userId;
};

const ensureConversationMember = async (conversationId, userId) => {
  if (!isValidObjectId(conversationId)) {
    return null;
  }

  return Conversation.findOne({
    _id: conversationId,
    participants: userId,
  }).populate("participants", "name email role");
};

const getAvailableChatUsers = async (req, res) => {
  try {
    const currentUserId = getCurrentUserId(req);
    const currentUser = await User.findById(currentUserId).select("-password");

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "Current user not found",
      });
    }

    const query = {
      _id: { $ne: currentUser._id },
    };

    if (currentUser.role === "trainee") {
      query.role = { $in: ["trainer", "admin"] };
    } else if (currentUser.role === "trainer") {
      query.role = { $in: ["trainee", "admin"] };
    } else if (currentUser.role === "admin") {
      query.role = { $in: ["trainee", "trainer", "admin"] };
    }

    const users = await User.find(query)
      .select("name email role")
      .sort({ role: 1, name: 1 });

    return res.status(200).json({
      success: true,
      users: users.map(formatUser),
    });
  } catch (error) {
    console.error("Get available chat users error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load chat users",
    });
  }
};

const getConversations = async (req, res) => {
  try {
    const currentUserId = getCurrentUserId(req);

    const conversations = await Conversation.find({
      participants: currentUserId,
    })
      .populate("participants", "name email role")
      .sort({ lastMessageAt: -1, updatedAt: -1 });

    const conversationIds = conversations.map(
      (conversation) => conversation._id
    );

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

    const unreadMap = unreadCounts.reduce((map, item) => {
      map[item._id.toString()] = item.count;
      return map;
    }, {});

    return res.status(200).json({
      success: true,
      conversations: conversations.map((conversation) =>
        formatConversation(
          conversation,
          currentUserId,
          unreadMap[conversation._id.toString()] || 0
        )
      ),
    });
  } catch (error) {
    console.error("Get conversations error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load conversations",
    });
  }
};

const startConversation = async (req, res) => {
  try {
    const currentUserId = getCurrentUserId(req);
    const { participantId } = req.body;

    if (!participantId || !isValidObjectId(participantId)) {
      return res.status(400).json({
        success: false,
        message: "Valid participantId is required",
      });
    }

    if (participantId === currentUserId) {
      return res.status(400).json({
        success: false,
        message: "You cannot start a conversation with yourself",
      });
    }

    const participant = await User.findById(participantId).select(
      "name email role"
    );

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: "Selected user not found",
      });
    }

    let conversation = await Conversation.findOne({
      participants: {
        $all: [currentUserId, participantId],
        $size: 2,
      },
    }).populate("participants", "name email role");

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [currentUserId, participantId],
        lastMessage: "",
        lastMessageAt: null,
        lastSender: null,
      });

      conversation = await Conversation.findById(conversation._id).populate(
        "participants",
        "name email role"
      );
    }

    return res.status(200).json({
      success: true,
      conversation: formatConversation(conversation, currentUserId, 0),
    });
  } catch (error) {
    console.error("Start conversation error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to start conversation",
    });
  }
};

const getMessages = async (req, res) => {
  try {
    const currentUserId = getCurrentUserId(req);
    const { conversationId } = req.params;

    const conversation = await ensureConversationMember(
      conversationId,
      currentUserId
    );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    await Message.updateMany(
      {
        conversation: conversationId,
        receiver: currentUserId,
        isRead: false,
      },
      {
        isRead: true,
      }
    );

    const messages = await Message.find({
      conversation: conversationId,
    })
      .populate("sender", "name email role")
      .populate("receiver", "name email role")
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      conversation: formatConversation(conversation, currentUserId, 0),
      messages: messages.map(formatMessage),
    });
  } catch (error) {
    console.error("Get messages error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load messages",
    });
  }
};

const sendMessage = async (req, res) => {
  try {
    const currentUserId = getCurrentUserId(req);
    const { conversationId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message content is required",
      });
    }

    if (content.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Message cannot be longer than 1000 characters",
      });
    }

    const conversation = await ensureConversationMember(
      conversationId,
      currentUserId
    );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const receiver = conversation.participants.find(
      (participant) => participant._id.toString() !== currentUserId.toString()
    );

    if (!receiver) {
      return res.status(400).json({
        success: false,
        message: "Receiver not found",
      });
    }

    let message = await Message.create({
      conversation: conversationId,
      sender: currentUserId,
      receiver: receiver._id,
      content: content.trim(),
    });

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: content.trim(),
      lastMessageAt: new Date(),
      lastSender: currentUserId,
    });

    message = await Message.findById(message._id)
      .populate("sender", "name email role")
      .populate("receiver", "name email role");

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      chatMessage: formatMessage(message),
    });
  } catch (error) {
    console.error("Send message error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send message",
    });
  }
};

const markConversationRead = async (req, res) => {
  try {
    const currentUserId = getCurrentUserId(req);
    const { conversationId } = req.params;

    const conversation = await ensureConversationMember(
      conversationId,
      currentUserId
    );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    await Message.updateMany(
      {
        conversation: conversationId,
        receiver: currentUserId,
        isRead: false,
      },
      {
        isRead: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Conversation marked as read",
    });
  } catch (error) {
    console.error("Mark conversation read error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to mark conversation as read",
    });
  }
};

module.exports = {
  getAvailableChatUsers,
  getConversations,
  startConversation,
  getMessages,
  sendMessage,
  markConversationRead,
};