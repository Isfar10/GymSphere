import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const linkStyle = (path) => ({
    textDecoration: "none",
    color: location.pathname === path ? "#0d6efd" : "#222",
    fontWeight: location.pathname === path ? "bold" : "normal",
  });

  return (
    <nav
      style={{
        padding: "16px 24px",
        borderBottom: "1px solid #ddd",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        flexWrap: "wrap",
        background: "#fff",
      }}
    >
      <Link
        to="/dashboard"
        style={{
          textDecoration: "none",
          color: "#111",
          fontWeight: "bold",
          fontSize: "22px",
        }}
      >
        GymSphere
      </Link>

      <div
        style={{
          display: "flex",
          gap: "16px",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <Link style={linkStyle("/dashboard")} to="/dashboard">
          Dashboard
        </Link>

        <Link style={linkStyle("/trainers")} to="/trainers">
          Trainers
        </Link>

        <Link style={linkStyle("/bookings")} to="/bookings">
          Bookings
        </Link>

<<<<<<< Trainer-Matching-System
          {user?.role === "trainee" && (
            <Link to="/trainer-matching" style={linkStyle("/trainer-matching")}>
              Trainer Matching
            </Link>
          )}

          <Link to="/bookings" style={linkStyle("/bookings")}>
            Bookings
          </Link>
=======
        <Link style={linkStyle("/weekly-goals")} to="/weekly-goals">
          Weekly Goals
        </Link>
>>>>>>> main

        <Link style={linkStyle("/progress")} to="/progress">
          Progress
        </Link>

        <Link style={linkStyle("/feedback")} to="/feedback">
          Feedback
        </Link>

        <Link style={linkStyle("/profile")} to="/profile">
          Profile
        </Link>

        {user && (
          <span
            style={{
              padding: "6px 10px",
              borderRadius: "999px",
              background: "#f1f3f5",
              textTransform: "capitalize",
            }}
          >
            {user.role}
          </span>
        )}

        <button
          onClick={handleLogout}
          style={{
            padding: "8px 12px",
            border: "none",
            borderRadius: "8px",
            background: "#dc3545",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;