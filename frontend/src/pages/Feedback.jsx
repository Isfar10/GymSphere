import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import PageShell from "../components/PageShell";
import StatCard from "../components/StatCard";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";

const defaultForm = {
  subject: "",
  category: "general",
  message: "",
  rating: "5",
};

function Feedback() {
  const { user } = useAuth();

  const [form, setForm] = useState(defaultForm);
  const [myFeedback, setMyFeedback] = useState([]);
  const [allFeedback, setAllFeedback] = useState([]);
  const [adminMode, setAdminMode] = useState(false);
  const [replyText, setReplyText] = useState({});
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isAdmin = user?.role === "admin";

  const visibleFeedback = useMemo(() => {
    const source = adminMode && isAdmin ? allFeedback : myFeedback;

    if (statusFilter === "all") return source;

    return source.filter((item) => item.status === statusFilter);
  }, [adminMode, isAdmin, allFeedback, myFeedback, statusFilter]);

  const stats = useMemo(() => {
    const source = adminMode && isAdmin ? allFeedback : myFeedback;

    return {
      total: source.length,
      open: source.filter((item) => item.status === "open").length,
      resolved: source.filter((item) => item.status === "resolved").length,
      averageRating:
        source.length === 0
          ? "0.0"
          : (
              source.reduce((sum, item) => sum + Number(item.rating || 0), 0) /
              source.length
            ).toFixed(1),
    };
  }, [adminMode, isAdmin, allFeedback, myFeedback]);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      setError("");

      const myResponse = await API.get("/feedback/my-feedback");
      setMyFeedback(myResponse.data.feedback || myResponse.data.items || []);

      if (isAdmin) {
        const adminResponse = await API.get("/feedback/admin/all");
        setAllFeedback(adminResponse.data.feedback || adminResponse.data.items || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load feedback.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, [isAdmin]);

  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(""), 2500);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm(defaultForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.subject.trim() || !form.message.trim()) {
      setError("Subject and message are required.");
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      await API.post("/feedback", {
        subject: form.subject,
        category: form.category,
        message: form.message,
        rating: Number(form.rating),
      });

      resetForm();
      await fetchFeedback();
      showSuccess("Feedback submitted successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit feedback.");
    } finally {
      setActionLoading(false);
    }
  };

  const deleteFeedback = async (feedbackId) => {
    try {
      setActionLoading(true);
      setError("");

      await API.delete(`/feedback/${feedbackId}`);

      await fetchFeedback();
      showSuccess("Feedback deleted.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete feedback.");
    } finally {
      setActionLoading(false);
    }
  };

  const updateStatus = async (feedbackId, status) => {
    try {
      setActionLoading(true);
      setError("");

      await API.patch(`/feedback/${feedbackId}/status`, { status });

      await fetchFeedback();
      showSuccess(`Feedback marked as ${status}.`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update feedback.");
    } finally {
      setActionLoading(false);
    }
  };

  const sendReply = async (feedbackId) => {
    try {
      setActionLoading(true);
      setError("");

      await API.patch(`/feedback/${feedbackId}/reply`, {
        reply: replyText[feedbackId] || "",
      });

      setReplyText((previous) => ({
        ...previous,
        [feedbackId]: "",
      }));

      await fetchFeedback();
      showSuccess("Reply sent successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send reply.");
    } finally {
      setActionLoading(false);
    }
  };

  const updateReplyText = (feedbackId, value) => {
    setReplyText((previous) => ({
      ...previous,
      [feedbackId]: value,
    }));
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "N/A";
    return new Date(dateValue).toLocaleString();
  };

  return (
    <>
      <Navbar />

      <PageShell
        eyebrow="Support"
        title="Feedback and complaints"
        subtitle="Share problems, suggestions, and ratings with the GymSphere team. Admins can review, reply, and resolve reports."
        heroIcon="💬"
        actions={
          <>
            <button type="button" onClick={fetchFeedback} className="gs-button">
              Refresh Feedback
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setAdminMode((previous) => !previous)}
                className="gs-button-outline"
              >
                {adminMode ? "Show My Feedback" : "Admin: Show All"}
              </button>
            )}
          </>
        }
      >
        <section className="gs-grid gs-grid-4">
          <StatCard icon="💬" label="Total" value={stats.total} helper="Feedback records" />
          <StatCard icon="📬" label="Open" value={stats.open} helper="Needs attention" />
          <StatCard icon="✅" label="Resolved" value={stats.resolved} helper="Completed cases" />
          <StatCard icon="⭐" label="Avg Rating" value={stats.averageRating} helper="User satisfaction" />
        </section>

        {success && (
          <div className="gs-alert-success" style={styles.alert}>
            {success}
          </div>
        )}

        {error && (
          <div className="gs-alert-error" style={styles.alert}>
            {error}
          </div>
        )}

        <section style={styles.layout}>
          <form onSubmit={handleSubmit} style={styles.formCard}>
            <div>
              <p style={styles.kicker}>New Feedback</p>
              <h2 style={styles.sectionTitle}>Send a Message</h2>
              <p style={styles.muted}>
                Tell us what happened, what can improve, or what you liked.
              </p>
            </div>

            <label className="gs-label">
              Subject
              <input
                name="subject"
                value={form.subject}
                onChange={handleChange}
                placeholder="Booking issue, suggestion, payment problem..."
                className="gs-input"
              />
            </label>

            <div style={styles.formGrid}>
              <label className="gs-label">
                Category
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="gs-input"
                >
                  <option value="general">General</option>
                  <option value="booking">Booking</option>
                  <option value="payment">Payment</option>
                  <option value="trainer">Trainer</option>
                  <option value="diet">Diet Plan</option>
                  <option value="bug">Bug</option>
                  <option value="suggestion">Suggestion</option>
                </select>
              </label>

              <label className="gs-label">
                Rating
                <select
                  name="rating"
                  value={form.rating}
                  onChange={handleChange}
                  className="gs-input"
                >
                  <option value="5">5 - Excellent</option>
                  <option value="4">4 - Good</option>
                  <option value="3">3 - Average</option>
                  <option value="2">2 - Poor</option>
                  <option value="1">1 - Bad</option>
                </select>
              </label>
            </div>

            <label className="gs-label">
              Message
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Write your feedback..."
                rows="5"
                className="gs-input"
              />
            </label>

            <div style={styles.buttonRow}>
              <button type="submit" disabled={actionLoading} className="gs-button">
                {actionLoading ? "Submitting..." : "Submit Feedback"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="gs-button-outline"
              >
                Reset
              </button>
            </div>
          </form>

          <aside style={styles.helpCard}>
            <p style={styles.kicker}>Support Flow</p>
            <h2 style={styles.sectionTitle}>How it works</h2>

            <div style={styles.stepList}>
              <Step number="1" title="Submit" text="Send your issue or suggestion." />
              <Step number="2" title="Review" text="Admin checks and replies." />
              <Step number="3" title="Resolve" text="Feedback is marked completed." />
            </div>
          </aside>
        </section>

        <section style={styles.feedbackSection}>
          <div className="gs-section-header">
            <div>
              <p style={styles.kicker}>Inbox</p>
              <h2 className="gs-section-title">
                {adminMode && isAdmin ? "All Feedback" : "My Feedback"}
              </h2>
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="gs-input"
              style={{ maxWidth: 190 }}
            >
              <option value="all">All status</option>
              <option value="open">Open</option>
              <option value="in_review">In Review</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          {loading ? (
            <div className="gs-empty">Loading feedback...</div>
          ) : visibleFeedback.length === 0 ? (
            <EmptyState
              icon="📭"
              title="No feedback found"
              message="Feedback submissions will appear here."
            />
          ) : (
            <div style={styles.feedbackGrid}>
              {visibleFeedback.map((item) => (
                <article key={item.id || item._id} style={styles.feedbackCard}>
                  <div style={styles.feedbackTop}>
                    <div>
                      <span className="gs-pill">{item.category || "general"}</span>
                      <h3 style={styles.feedbackTitle}>{item.subject}</h3>
                      <p style={styles.muted}>
                        {adminMode && isAdmin
                          ? `${item.user?.name || "User"} • `
                          : ""}
                        {formatDate(item.createdAt)}
                      </p>
                    </div>

                    <StatusBadge status={item.status || "open"} />
                  </div>

                  <div style={styles.ratingLine}>
                    <span>Rating</span>
                    <strong>{"⭐".repeat(Number(item.rating || 0))}</strong>
                  </div>

                  <p style={styles.messageBox}>{item.message}</p>

                  {item.reply && (
                    <div style={styles.replyBox}>
                      <strong>Admin Reply</strong>
                      <p>{item.reply}</p>
                    </div>
                  )}

                  {isAdmin && adminMode && (
                    <div style={styles.adminBox}>
                      <textarea
                        value={replyText[item.id || item._id] || ""}
                        onChange={(event) =>
                          updateReplyText(item.id || item._id, event.target.value)
                        }
                        placeholder="Write admin reply..."
                        rows="3"
                        className="gs-input"
                      />

                      <div style={styles.buttonRow}>
                        <button
                          type="button"
                          onClick={() => sendReply(item.id || item._id)}
                          disabled={actionLoading}
                          className="gs-button"
                        >
                          Send Reply
                        </button>

                        <button
                          type="button"
                          onClick={() => updateStatus(item.id || item._id, "in_review")}
                          disabled={actionLoading}
                          className="gs-button-outline"
                        >
                          In Review
                        </button>

                        <button
                          type="button"
                          onClick={() => updateStatus(item.id || item._id, "resolved")}
                          disabled={actionLoading}
                          className="gs-button-outline"
                        >
                          Resolve
                        </button>
                      </div>
                    </div>
                  )}

                  <div style={styles.footerRow}>
                    <small style={styles.muted}>
                      Last updated: {formatDate(item.updatedAt)}
                    </small>

                    <button
                      type="button"
                      onClick={() => deleteFeedback(item.id || item._id)}
                      disabled={actionLoading}
                      className="gs-button-danger"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </PageShell>
    </>
  );
}

function Step({ number, title, text }) {
  return (
    <div style={styles.step}>
      <span>{number}</span>
      <div>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>
    </div>
  );
}

const styles = {
  alert: {
    marginTop: 16,
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.1fr) minmax(300px, 0.9fr)",
    gap: 20,
    marginTop: 24,
    alignItems: "start",
  },
  formCard: {
    border: "1px solid #e2e8f0",
    borderRadius: 30,
    padding: 22,
    background: "rgba(255,255,255,0.92)",
    boxShadow: "0 24px 70px rgba(15,23,42,0.08)",
    display: "grid",
    gap: 16,
  },
  helpCard: {
    border: "1px solid #bbf7d0",
    borderRadius: 30,
    padding: 22,
    background: "linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)",
    boxShadow: "0 24px 70px rgba(15,23,42,0.08)",
  },
  kicker: {
    margin: "0 0 6px",
    color: "#16a34a",
    fontWeight: 950,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    fontSize: 13,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 28,
    letterSpacing: "-0.045em",
  },
  muted: {
    margin: "8px 0 0",
    color: "#64748b",
    lineHeight: 1.6,
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 14,
  },
  buttonRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  stepList: {
    display: "grid",
    gap: 12,
    marginTop: 18,
  },
  step: {
    display: "flex",
    gap: 12,
    border: "1px solid #bbf7d0",
    borderRadius: 20,
    padding: 14,
    background: "#ffffff",
  },
  feedbackSection: {
    marginTop: 28,
  },
  feedbackGrid: {
    display: "grid",
    gap: 16,
  },
  feedbackCard: {
    border: "1px solid #e2e8f0",
    borderRadius: 28,
    padding: 20,
    background: "rgba(255,255,255,0.92)",
    boxShadow: "0 22px 60px rgba(15,23,42,0.07)",
  },
  feedbackTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
  },
  feedbackTitle: {
    margin: "10px 0 0",
    fontSize: 26,
    letterSpacing: "-0.045em",
  },
  ratingLine: {
    marginTop: 16,
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    border: "1px solid #e2e8f0",
    borderRadius: 18,
    padding: 14,
    background: "#f8fafc",
  },
  messageBox: {
    margin: "14px 0 0",
    color: "#334155",
    lineHeight: 1.7,
  },
  replyBox: {
    marginTop: 14,
    border: "1px solid #bbf7d0",
    borderRadius: 18,
    padding: 14,
    background: "#f0fdf4",
    color: "#166534",
  },
  adminBox: {
    marginTop: 14,
    borderTop: "1px solid #e2e8f0",
    paddingTop: 14,
    display: "grid",
    gap: 12,
  },
  footerRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 16,
  },
};

export default Feedback;