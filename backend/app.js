const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const workoutRoutes = require("./routes/workoutRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const weeklyGoalRoutes = require("./routes/weeklyGoalRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const progressRoutes = require("./routes/progressRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const socialPostRoutes = require("./routes/socialPostRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "GymSphere API is running" });
});

app.use("/workout", workoutRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/weekly-goals", weeklyGoalRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/social-feed", socialPostRoutes);

module.exports = app;