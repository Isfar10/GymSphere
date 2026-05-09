const ChatMessage = require("../models/ChatMessage");
const User = require("../models/User");

// GET /api/chat/conversations  — list unique conversation partners
const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const messages = await ChatMessage.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .sort({ createdAt: -1 })
      .populate("sender", "name role")
      .populate("receiver", "name role");

    // Build unique partners map
    const partnerMap = new Map();

    for (const msg of messages) {
      const partner =
        msg.sender._id.toString() === userId ? msg.receiver : msg.sender;
      const partnerId = partner._id.toString();

      if (!partnerMap.has(partnerId)) {
        const unreadCount = await ChatMessage.countDocuments({
          sender: partnerId,
          receiver: userId,
          isRead: false,
        });

        partnerMap.set(partnerId, {
          partnerId,
          partnerName: partner.name,
          partnerRole: partner.role,
          lastMessage: msg.message,
          lastMessageTime: msg.createdAt,
          unreadCount,
        });
      }
    }

    return res.status(200).json({
      success: true,
      conversations: Array.from(partnerMap.values()),
    });
  } catch (error) {
    console.error("getConversations error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/chat/messages/:partnerId  — fetch messages between two users
const getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { partnerId } = req.params;

    const partner = await User.findById(partnerId).select("name role");
    if (!partner) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const messages = await ChatMessage.find({
      $or: [
        { sender: userId, receiver: partnerId },
        { sender: partnerId, receiver: userId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate("sender", "name role")
      .populate("receiver", "name role");

    // Mark incoming messages as read
    await ChatMessage.updateMany(
      { sender: partnerId, receiver: userId, isRead: false },
      { isRead: true }
    );

    return res.status(200).json({
      success: true,
      partner: { _id: partner._id, name: partner.name, role: partner.role },
      messages,
    });
  } catch (error) {
    console.error("getMessages error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/chat/send  — send a message
const sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId, message } = req.body;

    if (!receiverId || !message || !message.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "receiverId and message are required" });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res
        .status(404)
        .json({ success: false, message: "Receiver not found" });
    }

    const newMsg = await ChatMessage.create({
      sender: senderId,
      receiver: receiverId,
      message: message.trim(),
    });

    const populated = await newMsg.populate([
      { path: "sender", select: "name role" },
      { path: "receiver", select: "name role" },
    ]);

    return res.status(201).json({ success: true, message: populated });
  } catch (error) {
    console.error("sendMessage error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/chat/contacts  — list people the current user can chat with
const getContacts = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    let query = { _id: { $ne: userId } };

    // Trainees can chat with trainers; trainers can chat with trainees; admins see all
    if (role === "trainee") {
      query.role = "trainer";
    } else if (role === "trainer") {
      query.role = "trainee";
    }

    const contacts = await User.find(query).select("name role specializations");

    return res.status(200).json({ success: true, contacts });
  } catch (error) {
    console.error("getContacts error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getConversations, getMessages, sendMessage, getContacts };
