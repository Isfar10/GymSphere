import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import PageShell from "../components/PageShell";
import StatCard from "../components/StatCard";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";
import API from "../services/api";

const defaultForm = {
  title: "",
  category: "workout",
  targetCount: "",
  description: "",
};

function WeeklyGoals() {
  const [form, setForm] = useState(defaultForm);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const stats = useMemo(() => {
    const total = goals.length;
    const completed = goals.filter((goal) => goal.status === "completed").length;
    const active = goals.filter((goal) => goal.status !== "completed").length;
    const totalTargets = goals.reduce(
      (sum, goal) => sum + Number(goal.targetCount || 0),
      0
    );
    const totalDone = goals.reduce(
      (sum, goal) => sum + Number(goal.completedCount || 0),
      0
    );

    const completionRate =
      totalTargets === 0 ? 0 : Math.round((totalDone / totalTargets) * 100);

    return {
      total,
      active,
      completed,
      completionRate: Math.min(100, completionRate),
    };
  }, [goals]);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/weekly-goals");
      setGoals(response.data.goals || response.data.weeklyGoals || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load weekly goals.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

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

    if (!form.title.trim() || !form.targetCount) {
      setError("Goal title and target count are required.");
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      await API.post("/weekly-goals", {
        title: form.title,
        category: form.category,
        targetCount: Number(form.targetCount),
        description: form.description,
      });

      resetForm();
      await fetchGoals();
      showSuccess("Weekly goal created.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create weekly goal.");
    } finally {
      setActionLoading(false);
    }
  };

  const incrementGoal = async (goalId) => {
    try {
      setActionLoading(true);
      setError("");

      await API.patch(`/weekly-goals/${goalId}/increment`);

      await fetchGoals();
      showSuccess("Goal progress updated.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update goal.");
    } finally {
      setActionLoading(false);
    }
  };

  const completeGoal = async (goalId) => {
    try {
      setActionLoading(true);
      setError("");

      await API.patch(`/weekly-goals/${goalId}/complete`);

      await fetchGoals();
      showSuccess("Goal marked as completed.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to complete goal.");
    } finally {
      setActionLoading(false);
    }
  };

  const deleteGoal = async (goalId) => {
    try {
      setActionLoading(true);
      setError("");

      await API.delete(`/weekly-goals/${goalId}`);

      await fetchGoals();
      showSuccess("Goal deleted.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete goal.");
    } finally {
      setActionLoading(false);
    }
  };

  const getProgressPercent = (goal) => {
    const target = Number(goal.targetCount || 0);
    const completed = Number(goal.completedCount || 0);

    if (target === 0) return 0;

    return Math.min(100, Math.round((completed / target) * 100));
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "N/A";
    return new Date(dateValue).toLocaleDateString();
  };

  return (
    <>
      <Navbar />

      <PageShell
        eyebrow="Weekly Focus"
        title="Complete your weekly goals"
        subtitle="Create measurable weekly targets, track completion, and build a consistent fitness habit."
        heroIcon="🎯"
        actions={
          <>
            <button type="button" onClick={fetchGoals} className="gs-button">
              Refresh Goals
            </button>
            <a href="/progress" className="gs-button-outline">
              View Progress
            </a>
          </>
        }
      >
        <section className="gs-grid gs-grid-4">
          <StatCard icon="🎯" label="Total Goals" value={stats.total} helper="Created goals" />
          <StatCard icon="⚡" label="Active" value={stats.active} helper="Still in progress" />
          <StatCard icon="✅" label="Completed" value={stats.completed} helper="Finished goals" />
          <StatCard
            icon="📊"
            label="Completion"
            value={`${stats.completionRate}%`}
            helper="Overall target completion"
          />
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
              <p style={styles.kicker}>New Goal</p>
              <h2 style={styles.sectionTitle}>Set Weekly Target</h2>
              <p style={styles.muted}>
                Keep goals specific and measurable for better consistency.
              </p>
            </div>

            <label className="gs-label">
              Goal Title
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Complete 4 workouts"
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
                  <option value="workout">Workout</option>
                  <option value="nutrition">Nutrition</option>
                  <option value="cardio">Cardio</option>
                  <option value="strength">Strength</option>
                  <option value="habit">Habit</option>
                  <option value="other">Other</option>
                </select>
              </label>

              <label className="gs-label">
                Target Count
                <input
                  name="targetCount"
                  type="number"
                  min="1"
                  value={form.targetCount}
                  onChange={handleChange}
                  placeholder="4"
                  className="gs-input"
                />
              </label>
            </div>

            <label className="gs-label">
              Description
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Add a short description..."
                rows="4"
                className="gs-input"
              />
            </label>

            <div style={styles.buttonRow}>
              <button type="submit" disabled={actionLoading} className="gs-button">
                {actionLoading ? "Saving..." : "Create Goal"}
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

          <aside style={styles.focusCard}>
            <p style={styles.kicker}>Motivation</p>
            <h2 style={styles.sectionTitle}>This Week</h2>
            <p style={styles.focusText}>
              Small weekly wins create long-term transformation. Update your
              goals whenever you complete a session, meal target, or habit.
            </p>

            <div style={styles.bigPercent}>
              <strong>{stats.completionRate}%</strong>
              <span>overall completion</span>
            </div>
          </aside>
        </section>

        <section style={styles.goalSection}>
          <div className="gs-section-header">
            <div>
              <p style={styles.kicker}>Goal Board</p>
              <h2 className="gs-section-title">My weekly goals</h2>
            </div>
          </div>

          {loading ? (
            <div className="gs-empty">Loading weekly goals...</div>
          ) : goals.length === 0 ? (
            <EmptyState
              icon="🎯"
              title="No weekly goals yet"
              message="Create your first weekly target to begin tracking."
            />
          ) : (
            <div style={styles.goalGrid}>
              {goals.map((goal) => {
                const percent = getProgressPercent(goal);

                return (
                  <article key={goal.id || goal._id} style={styles.goalCard}>
                    <div style={styles.goalTop}>
                      <div>
                        <span className="gs-pill">{goal.category || "goal"}</span>
                        <h3 style={styles.goalTitle}>{goal.title}</h3>
                        <p style={styles.muted}>
                          {goal.description || "No description added."}
                        </p>
                      </div>

                      <StatusBadge status={goal.status || "active"} />
                    </div>

                    <div style={styles.progressArea}>
                      <div style={styles.progressText}>
                        <span>
                          {goal.completedCount || 0}/{goal.targetCount || 0}
                        </span>
                        <strong>{percent}%</strong>
                      </div>

                      <div style={styles.track}>
                        <div style={{ ...styles.fill, width: `${percent}%` }} />
                      </div>
                    </div>

                    <div style={styles.goalMeta}>
                      <span>Created: {formatDate(goal.createdAt)}</span>
                      {goal.updatedAt && <span>Updated: {formatDate(goal.updatedAt)}</span>}
                    </div>

                    <div style={styles.actionRow}>
                      <button
                        type="button"
                        onClick={() => incrementGoal(goal.id || goal._id)}
                        disabled={actionLoading || goal.status === "completed"}
                        className="gs-button"
                      >
                        +1 Progress
                      </button>

                      <button
                        type="button"
                        onClick={() => completeGoal(goal.id || goal._id)}
                        disabled={actionLoading || goal.status === "completed"}
                        className="gs-button-outline"
                      >
                        Complete
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteGoal(goal.id || goal._id)}
                        disabled={actionLoading}
                        className="gs-button-danger"
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </PageShell>
    </>
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
  focusCard: {
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
  focusText: {
    color: "#166534",
    lineHeight: 1.7,
    margin: "14px 0 0",
  },
  bigPercent: {
    marginTop: 26,
    borderRadius: 26,
    padding: 20,
    background: "#16a34a",
    color: "#ffffff",
    display: "grid",
    gap: 4,
  },
  goalSection: {
    marginTop: 28,
  },
  goalGrid: {
    display: "grid",
    gap: 16,
  },
  goalCard: {
    border: "1px solid #e2e8f0",
    borderRadius: 28,
    padding: 20,
    background: "rgba(255,255,255,0.92)",
    boxShadow: "0 22px 60px rgba(15,23,42,0.07)",
  },
  goalTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
  },
  goalTitle: {
    margin: "10px 0 0",
    fontSize: 26,
    letterSpacing: "-0.045em",
  },
  progressArea: {
    marginTop: 18,
  },
  progressText: {
    display: "flex",
    justifyContent: "space-between",
    color: "#166534",
    fontWeight: 950,
    marginBottom: 8,
  },
  track: {
    height: 12,
    borderRadius: 999,
    background: "#e2e8f0",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 999,
    background: "linear-gradient(90deg, #16a34a, #84cc16)",
  },
  goalMeta: {
    marginTop: 12,
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: 800,
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
  actionRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 16,
  },
};

export default WeeklyGoals;