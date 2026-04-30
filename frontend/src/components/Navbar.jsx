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
        borderBottom: "1px solid #ddd",
        background: "#fff",
        position: "sticky",
        top: 0,
        zIndex: 20,
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <Link
          to="/dashboard"
          style={{
            textDecoration: "none",
            color: "#111",
            fontSize: "22px",
            fontWeight: "bold",
          }}
        >
          GymSphere
        </Link>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
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


          <Link to="/feedback" style={linkStyle("/feedback")}>
            Feedback
          </Link>



          <Link to="/profile" style={linkStyle("/profile")}>
            Profile
          </Link>

          {user && (
            <span
              style={{
                padding: "6px 10px",
                borderRadius: "999px",
                background: "#f3f3f3",
                fontSize: "14px",
              }}
            >
              {user.role}
            </span>
          )}

          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;