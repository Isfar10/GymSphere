import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import PageShell from "../components/PageShell";
import StatCard from "../components/StatCard";
import EmptyState from "../components/EmptyState";
import API from "../services/api";

function FitnessComparison() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchComparison = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/progress/comparison");
      setData(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load fitness comparison."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparison();
  }, []);

  const getStatusText = (metric) => {
    if (!metric || metric.status === "no-data") return "No benchmark data";
    if (metric.status === "above") return `${metric.percentageDifference}% above community`;
    if (metric.status === "below") return `${Math.abs(metric.percentageDifference)}% below community`;
    return "Same as community";
  };

  const getStatusStyle = (metric) => {
    if (!metric || metric.status === "no-data") return styles.neutralBadge;
    if (metric.status === "above") return styles.goodBadge;
    if (metric.status === "below") return styles.warnBadge;
    return styles.neutralBadge;
  };

  const comparisonRows = data
    ? [
        {
          label: "Avg Workout Minutes",
          mine: data.myStats.averageWorkoutMinutes,
          community: data.communityStats.averageWorkoutMinutes,
          unit: "min",
          comparison: data.comparison.workoutMinutes,
        },
        {
          label: "Avg Calories Burned",
          mine: data.myStats.averageCaloriesBurned,
          community: data.communityStats.averageCaloriesBurned,
          unit: "cal",
          comparison: data.comparison.caloriesBurned,
        },
        {
          label: "Avg Workouts Completed",
          mine: data.myStats.averageWorkoutsCompleted,
          community: data.communityStats.averageWorkoutsCompleted,
          unit: "workouts",
          comparison: data.comparison.workoutsCompleted,
        },
        {
          label: "Avg Performance Score",
          mine: data.myStats.averagePerformanceScore,
          community: data.communityStats.averagePerformanceScore,
          unit: "/100",
          comparison: data.comparison.performanceScore,
        },
      ]
    : [];

  return (
    <>
      <Navbar />

      <PageShell
        eyebrow="Fitness Comparison"
        title="Compare your fitness performance"
        subtitle="See how your current progress compares with community benchmarks from other trainees."
        heroIcon="📊"
        actions={
          <button type="button" onClick={fetchComparison} className="gs-button">
            Refresh Comparison
          </button>
        }
      >
        {error && <div style={styles.error}>{error}</div>}

        {loading ? (
          <div className="gs-empty">Loading comparison...</div>
        ) : !data || data.totalMyLogs === 0 ? (
          <EmptyState
            icon="📈"
            title="No progress data yet"
            message="Add progress logs first, then return here to compare your fitness performance."
          />
        ) : (
          <>
            <section className="gs-grid gs-grid-4">
              <StatCard
                icon="⏱️"
                label="Your Avg Minutes"
                value={data.myStats.averageWorkoutMinutes}
                helper="Per progress log"
              />

              <StatCard
                icon="🔥"
                label="Your Avg Calories"
                value={data.myStats.averageCaloriesBurned}
                helper="Per progress log"
              />

              <StatCard
                icon="🏋️"
                label="Your Avg Workouts"
                value={data.myStats.averageWorkoutsCompleted}
                helper="Per progress log"
              />

              <StatCard
                icon="⭐"
                label="Performance Score"
                value={data.myStats.averagePerformanceScore}
                helper="Average score"
              />
            </section>

            <section style={styles.panel}>
              <div style={styles.header}>
                <div>
                  <p style={styles.kicker}>Community Benchmarks</p>
                  <h2 style={styles.title}>Your performance vs community</h2>
                  <p style={styles.muted}>
                    Based on {data.totalCommunityLogs} community progress logs.
                  </p>
                </div>
              </div>

              <div style={styles.table}>
                <div style={styles.tableHead}>
                  <span>Metric</span>
                  <span>You</span>
                  <span>Community</span>
                  <span>Status</span>
                </div>

                {comparisonRows.map((row) => (
                  <div key={row.label} style={styles.tableRow}>
                    <strong>{row.label}</strong>

                    <span>
                      {row.mine} {row.unit}
                    </span>

                    <span>
                      {row.community} {row.unit}
                    </span>

                    <span style={getStatusStyle(row.comparison)}>
                      {getStatusText(row.comparison)}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section style={styles.tipCard}>
              <p style={styles.kicker}>Recommendation</p>
              <h2 style={styles.title}>What this means</h2>
              <p style={styles.muted}>
                If you are below the community average, focus on consistency
                first. Increase workout minutes, completed workouts, and
                performance score gradually. If you are above average, maintain
                your routine and keep logging progress.
              </p>
            </section>
          </>
        )}
      </PageShell>
    </>
  );
}

const styles = {
  panel: {
    marginTop: 26,
    border: "1px solid #e2e8f0",
    borderRadius: 30,
    padding: 22,
    background: "rgba(255,255,255,0.94)",
    boxShadow: "0 24px 70px rgba(15,23,42,0.08)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "center",
    marginBottom: 18,
  },
  kicker: {
    margin: "0 0 6px",
    color: "#16a34a",
    fontWeight: 950,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    fontSize: 13,
  },
  title: {
    margin: 0,
    fontSize: 28,
    letterSpacing: "-0.045em",
  },
  muted: {
    margin: "8px 0 0",
    color: "#64748b",
    lineHeight: 1.7,
  },
  table: {
    display: "grid",
    gap: 10,
  },
  tableHead: {
    display: "grid",
    gridTemplateColumns: "1.3fr 1fr 1fr 1.3fr",
    gap: 12,
    padding: "12px 14px",
    borderRadius: 16,
    background: "#f8fafc",
    color: "#475569",
    fontWeight: 950,
  },
  tableRow: {
    display: "grid",
    gridTemplateColumns: "1.3fr 1fr 1fr 1.3fr",
    gap: 12,
    alignItems: "center",
    padding: "14px",
    borderRadius: 18,
    border: "1px solid #e2e8f0",
    background: "#ffffff",
  },
  goodBadge: {
    borderRadius: 999,
    padding: "7px 10px",
    background: "#dcfce7",
    color: "#166534",
    fontWeight: 900,
    textAlign: "center",
  },
  warnBadge: {
    borderRadius: 999,
    padding: "7px 10px",
    background: "#fef3c7",
    color: "#92400e",
    fontWeight: 900,
    textAlign: "center",
  },
  neutralBadge: {
    borderRadius: 999,
    padding: "7px 10px",
    background: "#e2e8f0",
    color: "#334155",
    fontWeight: 900,
    textAlign: "center",
  },
  tipCard: {
    marginTop: 22,
    border: "1px solid #bbf7d0",
    borderRadius: 30,
    padding: 22,
    background: "linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)",
  },
  error: {
    marginTop: 16,
    padding: "12px 14px",
    borderRadius: 16,
    background: "#fee2e2",
    color: "#991b1b",
    fontWeight: 800,
  },
};

export default FitnessComparison;