import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background:
            "radial-gradient(circle at top left, rgba(187,247,208,0.65), transparent 28rem), linear-gradient(135deg, #f8fafc 0%, #ffffff 48%, #ecfdf5 100%)",
          color: "#0f172a",
          fontFamily:
            "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
        }}
      >
        <div
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: "24px",
            padding: "28px",
            background: "#ffffff",
            boxShadow: "0 20px 50px rgba(15,23,42,0.08)",
            textAlign: "center",
          }}
        >
          <h2 style={{ margin: "0 0 8px" }}>Loading...</h2>
          <p style={{ margin: 0, color: "#64748b" }}>
            Please wait while we verify your account.
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;