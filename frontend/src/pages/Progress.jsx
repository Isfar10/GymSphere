import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import PageShell from "../components/PageShell";
import StatCard from "../components/StatCard";
import EmptyState from "../components/EmptyState";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";

const defaultForm = {
  weight: "",
  bodyFat: "",
  chest: "",
  waist: "",
  arms: "",
  legs: "",
  workoutDuration: "",
  caloriesBurned: "",
  notes: "",
};

function Progress() {
  const { user } = useAuth();

  const [form, setForm] = useState(defaultForm);
  const [progressEntries, setProgressEntries] = useState([]);
  const [allProgressEntries, setAllProgressEntries] = useState([]);
  const [adminMode, setAdminMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isAdmin = user?.role === "admin";
  const visibleEntries = adminMode && isAdmin ? allProgressEntries : progressEntries;

  const latestEntry = progressEntries[0] || null;

  const stats = useMemo(() => {
    const latestWeight = latestEntry?.weight || user?.weight || 0;
    const totalCalories = progressEntries.reduce(
      (sum, entry) => sum + Number(entry.caloriesBurned || 0),
      0
    );
    const totalWorkoutMinutes = progressEntries.reduce(
      (sum, entry) => sum + Number(entry.workoutDuration || 0),
      0
    );

    return {
      entries: progressEntries.length,
      latestWeight,
      totalCalories,
      totalWorkoutMinutes,
    };
  }, [progressEntries, latestEntry, user]);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      setError("");

      const myResponse = await API.get("/progress/my-progress");
      setProgressEntries(myResponse.data.progress || myResponse.data.entries || []);

      if (isAdmin) {
        try {
          const adminResponse = await API.get("/progress/admin/all");
          setAllProgressEntries(
            adminResponse.data.progress || adminResponse.data.entries || []
          );
        } catch {
          setAllProgressEntries([]);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load progress entries.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
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

    if (!form.weight && !form.workoutDuration && !form.caloriesBurned) {
      setError("Add at least weight, workout duration, or calories burned.");
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      await API.post("/progress", {
        weight: form.weight ? Number(form.weight) : undefined,
        bodyFat: form.bodyFat ? Number(form.bodyFat) : undefined,
        chest: form.chest ? Number(form.chest) : undefined,
        waist: form.waist ? Number(form.waist) : undefined,
        arms: form.arms ? Number(form.arms) : undefined,
        legs: form.legs ? Number(form.legs) : undefined,
        workoutDuration: form.workoutDuration
          ? Number(form.workoutDuration)
          : undefined,
        caloriesBurned: form.caloriesBurned
          ? Number(form.caloriesBurned)
          : undefined,
        notes: form.notes,
      });

      resetForm();
      await fetchProgress();
      showSuccess("Progress entry saved successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save progress entry.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (entryId) => {
    try {
      setActionLoading(true);
      setError("");

      await API.delete(`/progress/${entryId}`);

      await fetchProgress();
      showSuccess("Progress entry deleted.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete progress entry.");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "N/A";
    return new Date(dateValue).toLocaleString();
  };

  return (
    <>
      <Navbar />

      <PageShell
        eyebrow="Performance"
        title="Track your fitness progress"
        subtitle="Record body metrics, workout duration, calories burned, and progress notes to monitor your fitness journey."
        heroIcon="📈"
        actions={
          <>
            <button type="button" onClick={fetchProgress} className="gs-button">
              Refresh Progress
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setAdminMode((previous) => !previous)}
                className="gs-button-outline"
              >
                {adminMode ? "Show My Entries" : "Admin: Show All"}
              </button>
            )}
          </>
        }
      >
        <section className="gs-grid gs-grid-4">
          <StatCard
            icon="📌"
            label="Entries"
            value={stats.entries}
            helper="Saved progress logs"
          />

          <StatCard
            icon="⚖️"
            label="Latest Weight"
            value={stats.latestWeight ? `${stats.latestWeight} kg` : "Not set"}
            helper="Most recent body weight"
          />

          <StatCard
            icon="🔥"
            label="Calories Burned"
            value={stats.totalCalories}
            helper="Total logged calories"
          />

          <StatCard
            icon="⏱️"
            label="Workout Minutes"
            value={stats.totalWorkoutMinutes}
            helper="Total logged training time"
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
              <p style={styles.kicker}>New Entry</p>
              <h2 style={styles.sectionTitle}>Log Progress</h2>
              <p style={styles.muted}>
                Add body measurements and workout performance details.
              </p>
            </div>

            <div style={styles.formGrid}>
              <label className="gs-label">
                Weight kg
                <input
                  name="weight"
                  type="number"
                  value={form.weight}
                  onChange={handleChange}
                  placeholder="70"
                  className="gs-input"
                />
              </label>

              <label className="gs-label">
                Body Fat %
                <input
                  name="bodyFat"
                  type="number"
                  value={form.bodyFat}
                  onChange={handleChange}
                  placeholder="18"
                  className="gs-input"
                />
              </label>

              <label className="gs-label">
                Chest cm
                <input
                  name="chest"
                  type="number"
                  value={form.chest}
                  onChange={handleChange}
                  placeholder="95"
                  className="gs-input"
                />
              </label>

              <label className="gs-label">
                Waist cm
                <input
                  name="waist"
                  type="number"
                  value={form.waist}
                  onChange={handleChange}
                  placeholder="80"
                  className="gs-input"
                />
              </label>

              <label className="gs-label">
                Arms cm
                <input
                  name="arms"
                  type="number"
                  value={form.arms}
                  onChange={handleChange}
                  placeholder="35"
                  className="gs-input"
                />
              </label>

              <label className="gs-label">
                Legs cm
                <input
                  name="legs"
                  type="number"
                  value={form.legs}
                  onChange={handleChange}
                  placeholder="55"
                  className="gs-input"
                />
              </label>

              <label className="gs-label">
                Workout Minutes
                <input
                  name="workoutDuration"
                  type="number"
                  value={form.workoutDuration}
                  onChange={handleChange}
                  placeholder="60"
                  className="gs-input"
                />
              </label>

              <label className="gs-label">
                Calories Burned
                <input
                  name="caloriesBurned"
                  type="number"
                  value={form.caloriesBurned}
                  onChange={handleChange}
                  placeholder="400"
                  className="gs-input"
                />
              </label>
            </div>

            <label className="gs-label">
              Notes
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="How did the workout feel?"
                rows="4"
                className="gs-input"
              />
            </label>

            <div style={styles.buttonRow}>
              <button type="submit" disabled={actionLoading} className="gs-button">
                {actionLoading ? "Saving..." : "Save Progress"}
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

          <aside style={styles.summaryCard}>
            <p style={styles.kicker}>Latest Snapshot</p>
            <h2 style={styles.sectionTitle}>Current Progress</h2>

            {latestEntry ? (
              <div style={styles.snapshotList}>
                <Snapshot label="Weight" value={`${latestEntry.weight || "N/A"} kg`} />
                <Snapshot label="Body Fat" value={`${latestEntry.bodyFat || "N/A"}%`} />
                <Snapshot
                  label="Calories"
                  value={`${latestEntry.caloriesBurned || "N/A"}`}
                />
                <Snapshot
                  label="Workout"
                  value={`${latestEntry.workoutDuration || "N/A"} min`}
                />
                <Snapshot label="Logged" value={formatDate(latestEntry.createdAt)} />
              </div>
            ) : (
              <EmptyState
                icon="📈"
                title="No snapshot yet"
                message="Create your first progress entry to see your current stats."
              />
            )}
          </aside>
        </section>

        <section style={styles.historySection}>
          <div className="gs-section-header">
            <div>
              <p style={styles.kicker}>History</p>
              <h2 className="gs-section-title">
                {adminMode && isAdmin ? "All Progress Entries" : "My Progress Entries"}
              </h2>
            </div>
          </div>

          {loading ? (
            <div className="gs-empty">Loading progress entries...</div>
          ) : visibleEntries.length === 0 ? (
            <EmptyState
              icon="📂"
              title="No progress entries"
              message="Saved progress entries will appear here."
            />
          ) : (
            <div style={styles.entryGrid}>
              {visibleEntries.map((entry) => (
                <article key={entry.id || entry._id} style={styles.entryCard}>
                  <div style={styles.entryTop}>
                    <div>
                      <span className="gs-pill">
                        {entry.user?.name || "Progress Entry"}
                      </span>
                      <h3 style={styles.entryTitle}>
                        {entry.weight ? `${entry.weight} kg` : "Workout Log"}
                      </h3>
                      <p style={styles.muted}>{formatDate(entry.createdAt)}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(entry.id || entry._id)}
                      disabled={actionLoading}
                      className="gs-button-danger"
                    >
                      Delete
                    </button>
                  </div>

                  <div style={styles.metricGrid}>
                    <Metric label="Body Fat" value={entry.bodyFat || "N/A"} suffix="%" />
                    <Metric label="Chest" value={entry.chest || "N/A"} suffix="cm" />
                    <Metric label="Waist" value={entry.waist || "N/A"} suffix="cm" />
                    <Metric
                      label="Workout"
                      value={entry.workoutDuration || "N/A"}
                      suffix="min"
                    />
                    <Metric
                      label="Calories"
                      value={entry.caloriesBurned || "N/A"}
                      suffix=""
                    />
                  </div>

                  {entry.notes && <p style={styles.notes}>{entry.notes}</p>}
                </article>
              ))}
            </div>
          )}
        </section>
      </PageShell>
    </>
  );
}

function Snapshot({ label, value }) {
  return (
    <div style={styles.snapshotItem}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Metric({ label, value, suffix }) {
  return (
    <div style={styles.metricBox}>
      <p>{label}</p>
      <strong>
        {value}
        {value !== "N/A" ? suffix : ""}
      </strong>
    </div>
  );
}

const styles = {
  alert: {
    marginTop: 16,
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.2fr) minmax(310px, 0.8fr)",
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
  summaryCard: {
    border: "1px solid #e2e8f0",
    borderRadius: 30,
    padding: 22,
    background: "rgba(255,255,255,0.92)",
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
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 14,
  },
  buttonRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  snapshotList: {
    display: "grid",
    gap: 10,
    marginTop: 16,
  },
  snapshotItem: {
    border: "1px solid #e2e8f0",
    borderRadius: 18,
    padding: 14,
    background: "#f8fafc",
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
  },
  historySection: {
    marginTop: 28,
  },
  entryGrid: {
    display: "grid",
    gap: 16,
  },
  entryCard: {
    border: "1px solid #e2e8f0",
    borderRadius: 28,
    padding: 20,
    background: "rgba(255,255,255,0.92)",
    boxShadow: "0 22px 60px rgba(15,23,42,0.07)",
  },
  entryTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
  },
  entryTitle: {
    margin: "10px 0 0",
    fontSize: 26,
    letterSpacing: "-0.045em",
  },
  metricGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(135px, 1fr))",
    gap: 12,
    marginTop: 16,
  },
  metricBox: {
    border: "1px solid #e2e8f0",
    borderRadius: 18,
    padding: 14,
    background: "#f8fafc",
  },
  notes: {
    borderTop: "1px solid #e2e8f0",
    paddingTop: 14,
    margin: "16px 0 0",
    color: "#334155",
    lineHeight: 1.7,
  },
};

export default Progress;