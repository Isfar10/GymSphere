```import { Link, useLocation, useNavigate } from "react-router-dom";
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
    <nav style={styles.navbar}>
      <Link to="/dashboard" style={styles.brand}>
        GymSphere
      </Link>

      <div style={styles.links}>
        <Link to="/dashboard" style={linkStyle("/dashboard")}>
          Dashboard
        </Link>

        <Link to="/trainers" style={linkStyle("/trainers")}>
          Trainers
        </Link>

        <Link to="/bookings" style={linkStyle("/bookings")}>
          Bookings
        </Link>

        {user?.role === "trainee" && (
          <Link to="/trainer-matching" style={linkStyle("/trainer-matching")}>
            Trainer Matching
          </Link>
        )}

        {user?.role === "trainee" && (
          <Link to="/weekly-goals" style={linkStyle("/weekly-goals")}>
            Weekly Goals
          </Link>
        )}

        {user?.role === "trainee" && (
          <Link to="/progress" style={linkStyle("/progress")}>
            Progress
          </Link>
        )}

        <Link to="/notifications" style={linkStyle("/notifications")}>
          Notifications
        </Link>

        <Link to="/feedback" style={linkStyle("/feedback")}>
          Feedback
        </Link>

        <Link to="/profile" style={linkStyle("/profile")}>
          Profile
        </Link>

        {user && <span style={styles.roleBadge}>{user.role}</span>}

        <button type="button" onClick={handleLogout} style={styles.logoutButton}>
          Logout
        </button>
      </div>
    </nav>
  );
};

const styles = {
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    padding: "16px 24px",
    background: "#ffffff",
    boxShadow: "0 2px 12px rgba(0, 0, 0, 0.08)",
    flexWrap: "wrap",
  },
  brand: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#0d6efd",
    textDecoration: "none",
  },
  links: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
  },
  roleBadge: {
    background: "#eef4ff",
    color: "#0d6efd",
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "13px",
    textTransform: "capitalize",
  },
  logoutButton: {
    border: "none",
    background: "#dc3545",
    color: "#fff",
    padding: "8px 12px",
    borderRadius: "8px",
    cursor: "pointer",
  },
};

export default Navbar;```