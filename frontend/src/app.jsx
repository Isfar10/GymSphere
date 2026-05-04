import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Trainers from "./pages/Trainers";
import Bookings from "./pages/Bookings";
import WeeklyGoals from "./pages/WeeklyGoals";
import Feedback from "./pages/Feedback";

import TrainerMatching from "./pages/TrainerMatching";

import Progress from "./pages/Progress";


import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

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
        path="/trainer-matching"
        element={
          <ProtectedRoute>
            <TrainerMatching />
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
        path="/feedback"
        element={
          <ProtectedRoute>
            <Feedback />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;