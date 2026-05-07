import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.email.trim() || !formData.password.trim()) {
      return "Please fill in all fields.";
    }

    if (!formData.email.includes("@")) {
      return "Please enter a valid email address.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);

      try {
        await login(formData);
      } catch (firstError) {
        await login(formData.email, formData.password);
      }

      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={styles.page}>
      <section style={styles.leftPanel}>
        <div style={styles.brand}>
          <span style={styles.logoMark}>G</span>
          <div>
            <strong style={styles.brandName}>GymSphere</strong>
            <p style={styles.brandSub}>Your complete fitness ecosystem</p>
          </div>
        </div>

        <div style={styles.heroContent}>
          <p style={styles.eyebrow}>Welcome Back</p>
          <h1 style={styles.heroTitle}>Continue your fitness journey.</h1>
          <p style={styles.heroText}>
            Book sessions, track goals, follow diet plans, manage memberships,
            and connect with the GymSphere community.
          </p>
        </div>

        <div style={styles.featureGrid}>
          <div style={styles.featureCard}>
            <span style={styles.featureIcon}>🥗</span>
            <strong>Smart Diet</strong>
            <small>Database-backed meal plans</small>
          </div>

          <div style={styles.featureCard}>
            <span style={styles.featureIcon}>📅</span>
            <strong>Bookings</strong>
            <small>Manage trainer sessions</small>
          </div>

          <div style={styles.featureCard}>
            <span style={styles.featureIcon}>🎯</span>
            <strong>Goals</strong>
            <small>Track weekly progress</small>
          </div>
        </div>
      </section>

      <section style={styles.formPanel}>
        <div style={styles.formCard}>
          <div style={styles.formHeader}>
            <p style={styles.formKicker}>Secure Login</p>
            <h2 style={styles.formTitle}>Sign in to GymSphere</h2>
            <p style={styles.formSubtitle}>
              Enter your account details to access your dashboard.
            </p>
          </div>

          {error && <div style={styles.errorBox}>{error}</div>}

          <form onSubmit={handleSubmit} style={styles.form}>
            <label style={styles.label}>
              Email Address
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                style={styles.input}
              />
            </label>

            <label style={styles.label}>
              Password
              <input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                style={styles.input}
              />
            </label>

            <button type="submit" disabled={loading} style={styles.submitButton}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p style={styles.switchText}>
            Don&apos;t have an account?{" "}
            <Link to="/register" style={styles.switchLink}>
              Create account
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    gridTemplateColumns: "1.1fr 0.9fr",
    background:
      "radial-gradient(circle at top left, rgba(187,247,208,0.65), transparent 28rem), linear-gradient(135deg, #f8fafc 0%, #ffffff 48%, #ecfdf5 100%)",
    color: "#0f172a",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  },
  leftPanel: {
    position: "relative",
    overflow: "hidden",
    padding: "42px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    background: "linear-gradient(135deg, #052e16 0%, #166534 45%, #22c55e 100%)",
    color: "#ffffff",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    position: "relative",
    zIndex: 1,
  },
  logoMark: {
    width: "46px",
    height: "46px",
    borderRadius: "17px",
    display: "grid",
    placeItems: "center",
    background: "#ffffff",
    color: "#166534",
    fontWeight: 950,
    fontSize: "22px",
    boxShadow: "0 18px 36px rgba(0,0,0,0.2)",
  },
  brandName: {
    display: "block",
    fontSize: "22px",
    letterSpacing: "-0.04em",
  },
  brandSub: {
    margin: "2px 0 0",
    color: "#dcfce7",
    fontWeight: 700,
  },
  heroContent: {
    position: "relative",
    zIndex: 1,
    maxWidth: "720px",
  },
  eyebrow: {
    margin: "0 0 12px",
    color: "#bbf7d0",
    fontWeight: 950,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    fontSize: "13px",
  },
  heroTitle: {
    margin: 0,
    fontSize: "clamp(42px, 6vw, 78px)",
    lineHeight: 0.94,
    letterSpacing: "-0.07em",
  },
  heroText: {
    margin: "22px 0 0",
    color: "#dcfce7",
    fontSize: "18px",
    lineHeight: 1.75,
    maxWidth: "680px",
  },
  featureGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "14px",
    position: "relative",
    zIndex: 1,
  },
  featureCard: {
    border: "1px solid rgba(255,255,255,0.25)",
    borderRadius: "22px",
    padding: "16px",
    background: "rgba(255,255,255,0.14)",
    backdropFilter: "blur(14px)",
    display: "grid",
    gap: "5px",
  },
  featureIcon: {
    fontSize: "26px",
  },
  formPanel: {
    display: "grid",
    placeItems: "center",
    padding: "32px",
  },
  formCard: {
    width: "100%",
    maxWidth: "460px",
    border: "1px solid #e2e8f0",
    borderRadius: "32px",
    padding: "30px",
    background: "rgba(255,255,255,0.9)",
    boxShadow: "0 30px 80px rgba(15,23,42,0.12)",
    backdropFilter: "blur(18px)",
  },
  formHeader: {
    marginBottom: "22px",
  },
  formKicker: {
    margin: "0 0 7px",
    color: "#16a34a",
    fontWeight: 950,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    fontSize: "12px",
  },
  formTitle: {
    margin: 0,
    fontSize: "34px",
    letterSpacing: "-0.055em",
  },
  formSubtitle: {
    margin: "10px 0 0",
    color: "#64748b",
    lineHeight: 1.6,
  },
  errorBox: {
    border: "1px solid #fecaca",
    borderRadius: "16px",
    padding: "12px 14px",
    background: "#fee2e2",
    color: "#991b1b",
    fontWeight: 800,
    marginBottom: "16px",
  },
  form: {
    display: "grid",
    gap: "15px",
  },
  label: {
    display: "grid",
    gap: "8px",
    color: "#334155",
    fontWeight: 900,
    fontSize: "14px",
  },
  input: {
    border: "1px solid #dbe3ea",
    borderRadius: "17px",
    padding: "13px 14px",
    outline: "none",
    background: "#ffffff",
    color: "#0f172a",
  },
  submitButton: {
    border: "none",
    borderRadius: "999px",
    padding: "14px 18px",
    background: "linear-gradient(135deg, #16a34a 0%, #22c55e 100%)",
    color: "#ffffff",
    fontWeight: 950,
    cursor: "pointer",
    boxShadow: "0 18px 36px rgba(22,163,74,0.24)",
    marginTop: "4px",
  },
  switchText: {
    margin: "20px 0 0",
    textAlign: "center",
    color: "#64748b",
  },
  switchLink: {
    color: "#16a34a",
    fontWeight: 950,
    textDecoration: "none",
  },
};

export default Login;