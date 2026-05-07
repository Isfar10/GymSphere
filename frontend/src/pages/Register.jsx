import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "trainee",
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
    if (!formData.name || !formData.email || !formData.password) {
      return "Please fill in all fields.";
    }

    if (!formData.email.includes("@")) {
      return "Please enter a valid email address.";
    }

    if (formData.password.length < 6) {
      return "Password must be at least 6 characters.";
    }

    if (!["trainee", "trainer"].includes(formData.role)) {
      return "Please select trainee or trainer.";
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

      await register({
        ...formData,
        role: formData.role === "trainer" ? "trainer" : "trainee",
      });

      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed. Please try again."
      );
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
            <p style={styles.brandSub}>Train smarter, live stronger</p>
          </div>
        </div>

        <div style={styles.heroContent}>
          <p style={styles.eyebrow}>Join GymSphere</p>

          <h1 style={styles.heroTitle}>Create your fitness command center.</h1>

          <p style={styles.heroText}>
            Register as a trainee or trainer and unlock a complete fitness
            platform with bookings, diet plans, goals, payments, store, and
            community features.
          </p>
        </div>

        <div style={styles.rolePreview}>
          <div style={styles.roleCard}>
            <strong>Trainee</strong>
            <span>Book trainers and track progress.</span>
          </div>

          <div style={styles.roleCard}>
            <strong>Trainer</strong>
            <span>Manage clients and sessions.</span>
          </div>
        </div>
      </section>

      <section style={styles.formPanel}>
        <div style={styles.formCard}>
          <div style={styles.formHeader}>
            <p style={styles.formKicker}>New Account</p>

            <h2 style={styles.formTitle}>Start strong today</h2>

            <p style={styles.formSubtitle}>
              Create your account and enter your GymSphere dashboard.
            </p>
          </div>

          {error && <div style={styles.errorBox}>{error}</div>}

          <form onSubmit={handleSubmit} style={styles.form}>
            <label style={styles.label}>
              Full Name
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                style={styles.input}
                placeholder="Enter your full name"
              />
            </label>

            <label style={styles.label}>
              Email Address
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                style={styles.input}
                placeholder="you@example.com"
              />
            </label>

            <label style={styles.label}>
              Password
              <input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                style={styles.input}
                placeholder="Minimum 6 characters"
              />
            </label>

            <label style={styles.label}>
              Account Type
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                style={styles.input}
              >
                <option value="trainee">Trainee</option>
                <option value="trainer">Trainer</option>
              </select>
            </label>

            <button type="submit" disabled={loading} style={styles.submitButton}>
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p style={styles.switchText}>
            Already have an account?{" "}
            <Link to="/login" style={styles.switchLink}>
              Login
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
    padding: "42px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    background: "linear-gradient(135deg, #052e16 0%, #166534 45%, #22c55e 100%)",
    color: "#ffffff",
    overflow: "hidden",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
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
  rolePreview: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "14px",
  },
  roleCard: {
    border: "1px solid rgba(255,255,255,0.25)",
    borderRadius: "22px",
    padding: "16px",
    background: "rgba(255,255,255,0.14)",
    backdropFilter: "blur(14px)",
    display: "grid",
    gap: "5px",
  },
  formPanel: {
    display: "grid",
    placeItems: "center",
    padding: "32px",
  },
  formCard: {
    width: "100%",
    maxWidth: "480px",
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

export default Register;