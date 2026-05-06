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
    color: location.pathname === path ? "#16a34a" : "#222",
    fontWeight: location.pathname === path ? "bold" : "normal",
  });

  return (
    <nav style={styles.navbar}>
      <Link to="/dashboard" style={styles.logo}>
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

        <Link to="/weekly-goals" style={linkStyle("/weekly-goals")}>
          Weekly Goals
        </Link>

        <Link to="/progress" style={linkStyle("/progress")}>
          Progress
        </Link>

        <Link to="/memberships" style={linkStyle("/memberships")}>
          Memberships
        </Link>

        <Link to="/social-feed" style={linkStyle("/social-feed")}>
          Social Feed
        </Link>

        {user?.role === "trainee" && (
          <Link to="/trainer-matching" style={linkStyle("/trainer-matching")}>
            Trainer Matching
          </Link>
        )}

        <Link to="/notifications" style={linkStyle("/notifications")}>
          Notifications
        </Link>

        {user?.role === "admin" && (
          <Link to="/admin-analytics" style={linkStyle("/admin-analytics")}>
            Admin Analytics
          </Link>
        )}

        <Link to="/feedback" style={linkStyle("/feedback")}>
          Feedback
        </Link>

        <Link to="/profile" style={linkStyle("/profile")}>
          Profile
        </Link>
      </div>

      <div style={styles.rightSide}>
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
    alignItems: "center",
    justifyContent: "space-between",
    gap: "18px",
    padding: "16px 24px",
    borderBottom: "1px solid #e5e7eb",
    background: "#ffffff",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    position: "sticky",
    top: 0,
    zIndex: 20,
  },
  logo: {
    textDecoration: "none",
    color: "#16a34a",
    fontSize: "22px",
    fontWeight: 900,
    whiteSpace: "nowrap",
  },
  links: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  rightSide: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  roleBadge: {
    borderRadius: "999px",
    background: "#ecfdf5",
    color: "#166534",
    padding: "6px 10px",
    textTransform: "capitalize",
    fontSize: "13px",
    fontWeight: 800,
  },
  logoutButton: {
    border: "none",
    background: "#111827",
    color: "#ffffff",
    borderRadius: "999px",
    padding: "9px 14px",
    cursor: "pointer",
    fontWeight: 800,
  },
};

export default Navbar;