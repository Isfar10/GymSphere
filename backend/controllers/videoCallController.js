const VideoCall = require("../models/VideoCall");
const User = require("../models/User");
const crypto = require("crypto");

// POST /api/video-calls/initiate  — create a call room
const initiateCall = async (req, res) => {
  try {
    const initiatorId = req.user.id;
    const { partnerId } = req.body;

    if (!partnerId) {
      return res
        .status(400)
        .json({ success: false, message: "partnerId is required" });
    }

    const partner = await User.findById(partnerId).select("name role");
    if (!partner) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const initiator = await User.findById(initiatorId).select("name role");

    // Determine trainer / trainee
    let trainerId, traineeId;
    if (initiator.role === "trainer") {
      trainerId = initiatorId;
      traineeId = partnerId;
    } else {
      trainerId = partnerId;
      traineeId = initiatorId;
    }

    // Generate a unique room ID
    const roomId = `gs-room-${crypto.randomBytes(8).toString("hex")}`;

    const call = await VideoCall.create({
      trainer: trainerId,
      trainee: traineeId,
      roomId,
      initiatedBy: initiatorId,
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      call: {
        _id: call._id,
        roomId: call.roomId,
        status: call.status,
        partner: { _id: partner._id, name: partner.name, role: partner.role },
      },
    });
  } catch (error) {
    console.error("initiateCall error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// PATCH /api/video-calls/:callId/status  — update call status
const updateCallStatus = async (req, res) => {
  try {
    const { callId } = req.params;
    const { status } = req.body;

    const validStatuses = ["active", "ended", "missed"];
    if (!validStatuses.includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status value" });
    }

    const call = await VideoCall.findById(callId);
    if (!call) {
      return res
        .status(404)
        .json({ success: false, message: "Call not found" });
    }

    call.status = status;

    if (status === "active") {
      call.startedAt = new Date();
    }

    if (status === "ended" || status === "missed") {
      call.endedAt = new Date();
      if (call.startedAt) {
        call.durationSeconds = Math.round(
          (call.endedAt - call.startedAt) / 1000
        );
      }
    }

    await call.save();

    return res.status(200).json({ success: true, call });
  } catch (error) {
    console.error("updateCallStatus error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/video-calls/history  — get call history for current user
const getCallHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const calls = await VideoCall.find({
      $or: [{ trainer: userId }, { trainee: userId }],
    })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate("trainer", "name role")
      .populate("trainee", "name role")
      .populate("initiatedBy", "name");

    return res.status(200).json({ success: true, calls });
  } catch (error) {
    console.error("getCallHistory error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { initiateCall, updateCallStatus, getCallHistory };
