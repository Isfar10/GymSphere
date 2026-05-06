import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import PageShell from "../components/PageShell";
import StatCard from "../components/StatCard";

function Dashboard() {
  const { user } = useAuth();

  const role = user?.role || "member";

  const quickActions = [
    {
      title: "Find Trainers",
      description: "Browse trainers, compare services, and book sessions.",
      icon: "🧑‍🏫",
      path: "/trainers",
      roles: ["trainee", "trainer", "admin"],
    },
    {
      title: "Bookings",
      description: "Manage upcoming and past training sessions.",
      icon: "📅",
      path: "/bookings",
      roles: ["trainee", "trainer", "admin"],
    },
    {
      title: "Diet Plans",
      description: "Generate database-backed personalized meal plans.",
      icon: "🥗",
      path: "/diet-plans",
      roles: ["trainee", "trainer", "admin"],
    },
    {
      title: "Weekly Goals",
      description: "Set and complete weekly fitness targets.",
      icon: "🎯",
      path: "/weekly-goals",
      roles: ["trainee", "trainer", "admin"],
    },
    {
      title: "Progress",
      description: "Track body metrics and performance improvements.",
      icon: "📈",
      path: "/progress",
      roles: ["trainee", "trainer", "admin"],
    },
    {
      title: "Memberships",
      description: "Choose a membership plan and manage subscription.",
      icon: "💎",
      path: "/memberships",
      roles: ["trainee", "trainer", "admin"],
    },
    {
      title: "bKash Payments",
      description: "Submit and verify manual bKash payments.",
      icon: "💳",
      path: "/manual-bkash-payments",
      roles: ["trainee", "trainer", "admin"],
    },
    {
      title: "Social Feed",
      description: "Share achievements and fitness updates.",
      icon: "🌍",
      path: "/social-feed",
      roles: ["trainee", "trainer", "admin"],
    },
    {
      title: "Trainer Matching",
      description: "Get matched with trainers based on your goals.",
      icon: "🤝",
      path: "/trainer-matching",
      roles: ["trainee"],
    },
    {
      title: "Admin Analytics",
      description: "Monitor platform users, revenue, and activity.",
      icon: "📊",
      path: "/admin-analytics",
      roles: ["admin"],
    },
  ];

  const visibleActions = quickActions.filter((action) =>
    action.roles.includes(role)
  );

  return (
    <>
      <Navbar />

      <PageShell
        eyebrow="Overview"
        title={`Welcome back, ${user?.name || "GymSphere user"}`}
        subtitle="Your all-in-one fitness dashboard for training, nutrition, memberships, payments, community activity, and progress tracking."
        heroIcon="🏋️"
        actions={
          <>
            <Link to="/diet-plans" className="gs-button">
              Generate Diet Plan
            </Link>
            <Link to="/bookings" className="gs-button-outline">
              View Bookings
            </Link>
          </>
        }
      >
        <section className="gs-grid gs-grid-4">
          <StatCard
            icon="🥗"
            label="Diet Planner"
            value="Database"
            helper="Food matching algorithm"
          />

          <StatCard
            icon="💳"
            label="Payment"
            value="bKash"
            helper="Manual verification"
          />

          <StatCard
            icon="🎯"
            label="Goals"
            value="Weekly"
            helper="Track completion"
          />

          <StatCard
            icon="🌍"
            label="Community"
            value="Social"
            helper="Share progress"
          />
        </section>

        <section style={styles.profileStrip}>
          <div>
            <p style={styles.kicker}>Current Account</p>
            <h2 style={styles.accountTitle}>{user?.name || "User"}</h2>
            <p style={styles.muted}>
              {user?.email || "No email found"} •{" "}
              <strong style={styles.role}>{role}</strong>
            </p>
          </div>

          <Link to="/profile" className="gs-button-dark">
            Edit Profile
          </Link>
        </section>

        <section style={styles.sectionHeader}>
          <div>
            <p style={styles.kicker}>Quick Access</p>
            <h2 style={styles.sectionTitle}>What do you want to do today?</h2>
          </div>
        </section>

        <section style={styles.actionGrid}>
          {visibleActions.map((action) => (
            <Link key={action.path} to={action.path} style={styles.actionCard}>
              <span style={styles.actionIcon}>{action.icon}</span>
              <h3 style={styles.actionTitle}>{action.title}</h3>
              <p style={styles.actionDescription}>{action.description}</p>
              <span style={styles.actionCta}>Open →</span>
            </Link>
          ))}
        </section>
      </PageShell>
    </>
  );
}

const styles = {
  profileStrip: {
    marginTop: "18px",
    border: "1px solid #e2e8f0",
    borderRadius: "28px",
    padding: "22px",
    background: "rgba(255,255,255,0.9)",
    boxShadow: "0 20px 55px rgba(15,23,42,0.07)",
    display: "flex",
    justifyContent: "space-between",
    gap: "18px",
    alignItems: "center",
  },
  kicker: {
    margin: "0 0 6px",
    color: "#16a34a",
    fontWeight: 950,
    fontSize: "13px",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  accountTitle: {
    margin: 0,
    fontSize: "30px",
    letterSpacing: "-0.05em",
  },
  muted: {
    margin: "8px 0 0",
    color: "#64748b",
    lineHeight: 1.5,
  },
  role: {
    textTransform: "capitalize",
    color: "#166534",
  },
  sectionHeader: {
    marginTop: "30px",
    marginBottom: "16px",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "30px",
    letterSpacing: "-0.05em",
  },
  actionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "16px",
  },
  actionCard: {
    border: "1px solid #e2e8f0",
    borderRadius: "26px",
    padding: "20px",
    background: "#ffffff",
    color: "#0f172a",
    textDecoration: "none",
    boxShadow: "0 18px 45px rgba(15,23,42,0.06)",
    transition: "0.18s ease",
    display: "grid",
    gap: "9px",
  },
  actionIcon: {
    width: "48px",
    height: "48px",
    display: "grid",
    placeItems: "center",
    borderRadius: "18px",
    background: "#ecfdf5",
    fontSize: "25px",
  },
  actionTitle: {
    margin: 0,
    fontSize: "21px",
    letterSpacing: "-0.035em",
  },
  actionDescription: {
    margin: 0,
    color: "#64748b",
    lineHeight: 1.6,
  },
  actionCta: {
    color: "#16a34a",
    fontWeight: 950,
    marginTop: "5px",
  },
};

export default Dashboard;