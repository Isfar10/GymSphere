import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();

  const getRoleTitle = () => {
    if (user?.role === "trainer") return "Trainer Dashboard";
    if (user?.role === "admin") return "Admin Dashboard";
    return "Trainee Dashboard";
  };

  const getWelcomeText = () => {
    if (user?.role === "trainer") {
      return "Manage clients, create workout plans, and prepare for future live sessions.";
    }

    if (user?.role === "admin") {
      return "Monitor users, system activity, and prepare for analytics and management tools.";
    }

    return "Track your fitness profile, prepare for workout plans, and get ready for trainer booking features.";
  };

  const getQuickActions = () => {
    if (user?.role === "trainer") {
      return [
        "Create workout plans",
        "Manage trainee list",
        "Set training availability"
      ];
    }

    if (user?.role === "admin") {
      return [
        "Manage platform users",
        "Review complaints",
        "View system insights"
      ];
    }

    return [
      "Update your profile",
      "Set your fitness goal",
      "Explore future trainer booking"
    ];
  };

  return (
    <>
      <Navbar />

      <div className="dashboard-page">
        <div className="dashboard-layout">
          <div className="dashboard-card large-card">
            <h1>{getRoleTitle()}</h1>
            <p className="subtitle dashboard-subtitle">{getWelcomeText()}</p>

            <div className="info-grid">
              <div className="info-box">
                <span>Name</span>
                <h3>{user?.name || "Not available"}</h3>
              </div>

              <div className="info-box">
                <span>Email</span>
                <h3>{user?.email || "Not available"}</h3>
              </div>

              <div className="info-box">
                <span>Role</span>
                <h3>{user?.role || "Not available"}</h3>
              </div>

              <div className="info-box">
                <span>Fitness Goal</span>
                <h3>{user?.fitnessGoal || "Not set yet"}</h3>
              </div>

              <div className="info-box">
                <span>Age</span>
                <h3>{user?.age || "Not set"}</h3>
              </div>

              <div className="info-box">
                <span>Height</span>
                <h3>{user?.height ? `${user.height} cm` : "Not set"}</h3>
              </div>

              <div className="info-box">
                <span>Weight</span>
                <h3>{user?.weight ? `${user.weight} kg` : "Not set"}</h3>
              </div>
            </div>
          </div>

          <div className="dashboard-card side-card">
            <h2>Quick Actions</h2>
            <ul className="action-list">
              {getQuickActions().map((action, index) => (
                <li key={index}>{action}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;