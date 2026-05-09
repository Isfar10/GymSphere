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
const adminAnalyticsRoutes = require("./routes/adminAnalyticsRoutes");
const membershipRoutes = require("./routes/membershipRoutes");
const manualBkashPaymentRoutes = require("./routes/manualBkashPaymentRoutes");
const dietPlanRoutes = require("./routes/dietPlanRoutes");
const storeRoutes = require("./routes/storeRoutes");
const chatRoutes = require("./routes/chatRoutes");
const videoCallRoutes = require("./routes/videoCallRoutes");
const fitnessComparisonRoutes = require("./routes/fitnessComparisonRoutes");

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
app.use("/api/admin/analytics", adminAnalyticsRoutes);
app.use("/api/memberships", membershipRoutes);
app.use("/api/manual-bkash-payments", manualBkashPaymentRoutes);
app.use("/api/diet-plans", dietPlanRoutes);
app.use("/api/store", storeRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/video-calls", videoCallRoutes);
app.use("/api/fitness-comparison", fitnessComparisonRoutes);

module.exports = app;