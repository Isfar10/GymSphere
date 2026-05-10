require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const app = require("./app");
const connectDB = require("./config/db");
const setupVideoCallSocket = require("./sockets/videoCallSocket");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    const server = http.createServer(app);

    const io = new Server(server, {
      cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    setupVideoCallSocket(io);

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log("Video call socket server is active");
    });
  } catch (error) {
    console.error("Server failed to start:", error.message);
  }
};

startServer();