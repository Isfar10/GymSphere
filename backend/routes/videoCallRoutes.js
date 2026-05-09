const express = require("express");
const router = express.Router();
const protect = require("../middlewares/authMiddleware");
const {
  initiateCall,
  updateCallStatus,
  getCallHistory,
} = require("../controllers/videoCallController");

router.use(protect);

router.post("/initiate", initiateCall);
router.patch("/:callId/status", updateCallStatus);
router.get("/history", getCallHistory);

module.exports = router;
