import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
    roles: ["admin", "trainer", "trainee"],
  },
  {
    label: "Trainers",
    path: "/trainers",
    roles: ["admin", "trainer", "trainee"],
  },
  {
    label: "Bookings",
    path: "/bookings",
    roles: ["admin", "trainer", "trainee"],
  },
  {
    label: "Messages",
    path: "/messages",
    roles: ["trainer", "trainee"],
  },
  {
    label: "Video Call",
    path: "/video-call",
    roles: ["trainer", "trainee"],
  },
  {
    label: "Store",
    path: "/store",
    roles: ["admin", "trainer", "trainee"],
  },
  {
    label: "Weekly Goals",
    path: "/weekly-goals",
    roles: ["trainer", "trainee"],
  },
  {
    label: "Progress",
    path: "/progress",
    roles: ["trainer", "trainee"],
  },
  {
    label: "Comparison",
    path: "/fitness-comparison",
    roles: ["trainee"],
  },
  {
    label: "Diet Plans",
    path: "/diet-plans",
    roles: ["trainer", "trainee"],
  },
  {
    label: "Memberships",
    path: "/memberships",
    roles: ["admin", "trainee"],
  },
  {
    label: "bKash",
    path: "/manual-bkash-payments",
    roles: ["admin", "trainee"],
  },
  {
    label: "Social Feed",
    path: "/social-feed",
    roles: ["admin", "trainer", "trainee"],
  },
  {
    label: "Matching",
    path: "/trainer-matching",
    roles: ["trainee"],
  },
  {
    label: "Notifications",
    path: "/notifications",
    roles: ["admin", "trainer", "trainee"],
  },
  {
    label: "Analytics",
    path: "/admin-analytics",
    roles: ["admin"],
  },
  {
    label: "Feedback",
    path: "/feedback",
    roles: ["admin", "trainer", "trainee"],
  },
  {
    label: "Profile",
    path: "/profile",
    roles: ["admin", "trainer", "trainee"],
  },
];

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const role = user?.role || "trainee";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  const visibleItems = navItems.filter((item) =>
    item.roles.includes(role)
  );

  return (
    <header style={styles.header}>
      <nav style={styles.nav}>
        <Link to="/dashboard" style={styles.brand}>
          <span style={styles.logoMark}>G</span>

          <span>
            <strong style={styles.brandName}>GymSphere</strong>
            <small style={styles.brandSub}>
              Fitness ecosystem
            </small>
          </span>
        </Link>

        <div style={styles.links}>
          {visibleItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                ...styles.link,
                ...(isActive(item.path)
                  ? styles.activeLink
                  : {}),
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div style={styles.right}>
          {user && (
            <div style={styles.userChip}>
              <span style={styles.avatar}>
                {user.name?.[0]?.toUpperCase() || "U"}
              </span>

              <span style={styles.userMeta}>
                <strong>{user.name || "User"}</strong>
                <small>{role}</small>
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={handleLogout}
            style={styles.logoutButton}
          >
            Logout
          </button>
        </div>
      </nav>
    </header>
  );
}

const styles = {
  header: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    padding: "12px 16px",
    background: "rgba(248, 250, 252, 0.78)",
    backdropFilter: "blur(18px)",
    borderBottom: "1px solid rgba(226, 232, 240, 0.75)",
  },

  nav: {
    maxWidth: "1280px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "auto 1fr auto",
    gap: "18px",
    alignItems: "center",
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
    color: "#0f172a",
    textDecoration: "none",
    whiteSpace: "nowrap",
  },

  logoMark: {
    width: "42px",
    height: "42px",
    display: "grid",
    placeItems: "center",
    borderRadius: "16px",
    background: "linear-gradient(135deg, #16a34a, #22c55e)",
    color: "#ffffff",
    fontWeight: 950,
    boxShadow: "0 14px 30px rgba(22, 163, 74, 0.24)",
  },

  brandName: {
    display: "block",
    fontSize: "18px",
    letterSpacing: "-0.04em",
  },

  brandSub: {
    display: "block",
    color: "#64748b",
    fontWeight: 700,
    marginTop: "1px",
  },

  links: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    overflowX: "auto",
    scrollbarWidth: "none",
    padding: "4px",
  },

  link: {
    flex: "0 0 auto",
    color: "#475569",
    textDecoration: "none",
    borderRadius: "999px",
    padding: "9px 12px",
    fontWeight: 850,
    fontSize: "14px",
    transition: "0.18s ease",
  },

  activeLink: {
    background: "#dcfce7",
    color: "#166534",
    boxShadow: "inset 0 0 0 1px #bbf7d0",
  },

  right: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    whiteSpace: "nowrap",
  },

  userChip: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    border: "1px solid #e2e8f0",
    borderRadius: "999px",
    padding: "6px 10px 6px 6px",
    background: "#ffffff",
  },

  avatar: {
    width: "32px",
    height: "32px",
    borderRadius: "999px",
    display: "grid",
    placeItems: "center",
    background: "#0f172a",
    color: "#ffffff",
    fontWeight: 900,
  },

  userMeta: {
    display: "grid",
    lineHeight: 1.1,
    textTransform: "capitalize",
  },

  logoutButton: {
    border: "none",
    borderRadius: "999px",
    padding: "10px 14px",
    background: "#0f172a",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: 900,
  },
};

export default Navbar;