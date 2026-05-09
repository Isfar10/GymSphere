const express = require("express");
const router = express.Router();
const protect = require("../middlewares/authMiddleware");
const {
  getConversations,
  getMessages,
  sendMessage,
  getContacts,
} = require("../controllers/chatController");

router.use(protect);

router.get("/conversations", getConversations);
router.get("/contacts", getContacts);
router.get("/messages/:partnerId", getMessages);
router.post("/send", sendMessage);

module.exports = router;
