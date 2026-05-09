const express = require("express");
const protect = require("../middlewares/authMiddleware");
const {
  getAvailableChatUsers,
  getConversations,
  startConversation,
  getMessages,
  sendMessage,
  markConversationRead,
} = require("../controllers/messageController");

const router = express.Router();

router.get("/users", protect, getAvailableChatUsers);
router.get("/conversations", protect, getConversations);
router.post("/conversations/start", protect, startConversation);
router.get("/conversations/:conversationId/messages", protect, getMessages);
router.post("/conversations/:conversationId/messages", protect, sendMessage);
router.patch("/conversations/:conversationId/read", protect, markConversationRead);

module.exports = router;