import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Trainers from "./pages/Trainers";
import Bookings from "./pages/Bookings";
import WeeklyGoals from "./pages/weeklyGoals";
import Feedback from "./pages/Feedback";
import TrainerMatching from "./pages/TrainerMatching";
import Progress from "./pages/Progress";
import Notifications from "./pages/Notifications";
import SocialFeed from "./pages/SocialFeed";
import AdminAnalytics from "./pages/AdminAnalytics";
import Memberships from "./pages/Memberships";
import ManualBkashPayments from "./pages/ManualBkashPayments";
import DietPlans from "./pages/DietPlans";

import Store from "./pages/Store";


import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/trainers"
        element={
          <ProtectedRoute>
            <Trainers />
          </ProtectedRoute>
        }
      />

      <Route
        path="/bookings"
        element={
          <ProtectedRoute>
            <Bookings />
          </ProtectedRoute>
        }
      />

      <Route
        path="/weekly-goals"
        element={
          <ProtectedRoute>
            <WeeklyGoals />
          </ProtectedRoute>
        }
      />

      <Route
        path="/progress"
        element={
          <ProtectedRoute>
            <Progress />
          </ProtectedRoute>
        }
      />

      <Route
        path="/diet-plans"
        element={
          <ProtectedRoute>
            <DietPlans />
          </ProtectedRoute>
        }
      />

      <Route
        path="/memberships"
        element={
          <ProtectedRoute>
            <Memberships />
          </ProtectedRoute>
        }
      />

      <Route
        path="/manual-bkash-payments"
        element={
          <ProtectedRoute>
            <ManualBkashPayments />
          </ProtectedRoute>
        }
      />

      <Route
        path="/store"
        element={
          <ProtectedRoute>
            <Store />
          </ProtectedRoute>
        }
      />

      <Route
        path="/social-feed"
        element={
          <ProtectedRoute>
            <SocialFeed />
          </ProtectedRoute>
        }
      />

      <Route
        path="/trainer-matching"
        element={
          <ProtectedRoute>
            <TrainerMatching />
          </ProtectedRoute>
        }
      />

      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin-analytics"
        element={
          <ProtectedRoute>
            <AdminAnalytics />
          </ProtectedRoute>
        }
      />

      <Route
        path="/memberships"
        element={
          <ProtectedRoute>
            <Memberships />
          </ProtectedRoute>
        }
      />

      <Route
        path="/manual-bkash-payments"
        element={
          <ProtectedRoute>
            <ManualBkashPayments />
          </ProtectedRoute>
        }
      />

      <Route
        path="/diet-plans"
        element={
          <ProtectedRoute>
            <DietPlans />
          </ProtectedRoute>
        }
      />

      <Route
        path="/feedback"
        element={
          <ProtectedRoute>
            <Feedback />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;