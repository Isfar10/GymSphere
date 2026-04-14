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

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <h2>GymSphere</h2>
      </div>

      <div className="navbar-right">
        <Link
          to="/dashboard"
          className={location.pathname === "/dashboard" ? "active-link" : ""}
        >
          Dashboard
        </Link>

        <Link
          to="/trainers"
          className={location.pathname === "/trainers" ? "active-link" : ""}
        >
          Trainers
        </Link>

        <Link
          to="/profile"
          className={location.pathname === "/profile" ? "active-link" : ""}
        >
          Profile
        </Link>

        {user && <span className="role-badge">{user.role}</span>}

        <button onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;