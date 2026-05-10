const express = require("express");
const protect = require("../middlewares/authMiddleware");

const {
  getChatContacts,
  getOrCreateConversation,
  getMyConversations,
  getMessages,
  sendMessage,
} = require("../controllers/messageController");

const router = express.Router();

router.get("/contacts", protect, getChatContacts);
router.get("/conversations", protect, getMyConversations);
router.post("/conversations", protect, getOrCreateConversation);
router.get("/conversations/:conversationId/messages", protect, getMessages);
router.post("/conversations/:conversationId/messages", protect, sendMessage);

module.exports = router;