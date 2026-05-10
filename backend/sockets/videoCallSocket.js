const jwt = require("jsonwebtoken");
const User = require("../models/User");

const activeUsers = new Map();

const getSafeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});

const setupVideoCallSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Authentication token missing"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select("-password");

      if (!user) {
        return next(new Error("User not found"));
      }

      if (!["trainer", "trainee"].includes(user.role)) {
        return next(new Error("Only trainers and trainees can join video calls"));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Socket authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    activeUsers.set(String(socket.user._id), socket.id);

    socket.emit("video:connected", {
      user: getSafeUser(socket.user),
    });

    socket.on("video:join-room", ({ roomId }) => {
      if (!roomId) return;

      socket.join(roomId);

      socket.to(roomId).emit("video:user-joined", {
        user: getSafeUser(socket.user),
        socketId: socket.id,
      });
    });

    socket.on("video:offer", ({ roomId, offer }) => {
      socket.to(roomId).emit("video:offer", {
        offer,
        from: getSafeUser(socket.user),
      });
    });

    socket.on("video:answer", ({ roomId, answer }) => {
      socket.to(roomId).emit("video:answer", {
        answer,
        from: getSafeUser(socket.user),
      });
    });

    socket.on("video:ice-candidate", ({ roomId, candidate }) => {
      socket.to(roomId).emit("video:ice-candidate", {
        candidate,
        from: getSafeUser(socket.user),
      });
    });

    socket.on("video:leave-room", ({ roomId }) => {
      socket.leave(roomId);

      socket.to(roomId).emit("video:user-left", {
        user: getSafeUser(socket.user),
      });
    });

    socket.on("disconnect", () => {
      activeUsers.delete(String(socket.user._id));
    });
  });
};

module.exports = setupVideoCallSocket;