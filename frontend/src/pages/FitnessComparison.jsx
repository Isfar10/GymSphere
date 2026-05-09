import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import PageShell from "../components/PageShell";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";

const METRICS = [
  { key: "performanceScore", label: "Performance Score", unit: "pts", icon: "⚡", higherIsBetter: true },
  { key: "workoutMinutes", label: "Workout Minutes", unit: "min", icon: "⏱️", higherIsBetter: true },
  { key: "caloriesBurned", label: "Calories Burned", unit: "kcal", icon: "🔥", higherIsBetter: true },
  { key: "weight", label: "Weight", unit: "kg", icon: "⚖️", higherIsBetter: false },
  { key: "bodyFat", label: "Body Fat", unit: "%", icon: "📊", higherIsBetter: false },
  { key: "chest", label: "Chest", unit: "cm", icon: "💪", higherIsBetter: true },
  { key: "waist", label: "Waist", unit: "cm", icon: "📏", higherIsBetter: false },
  { key: "arms", label: "Arms", unit: "cm", icon: "💪", higherIsBetter: true },
  { key: "legs", label: "Legs", unit: "cm", icon: "🦵", higherIsBetter: true },
];

const LEADERBOARD_METRICS = [
  { key: "performanceScore", label: "Performance" },
  { key: "workoutMinutes", label: "Workout Time" },
  { key: "caloriesBurned", label: "Calories Burned" },
];

function Bar({ value, max, color }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={barStyles.track}>
      <div style={{ ...barStyles.fill, width: `${pct}%`, background: color }} />
    </div>
  );
}

const barStyles = {
  track: {
    height: "8px",
    background: "#f1f5f9",
    borderRadius: "999px",
    overflow: "hidden",
    flex: 1,
  },
  fill: {
    height: "100%",
    borderRadius: "999px",
    transition: "width 0.6s ease",
  },
};

function FitnessComparison() {
  const { user } = useAuth();
  const [benchmarks, setBenchmarks] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [userRanks, setUserRanks] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [lbMetric, setLbMetric] = useState("performanceScore");
  const [loading, setLoading] = useState(true);
  const [lbLoading, setLbLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const { data } = await API.get("/fitness-comparison/benchmarks");
        if (data.success) {
          setBenchmarks(data.communityBenchmarks);
          setUserStats(data.userStats);
          setUserRanks(data.userRanks);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load comparison data");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    fetchLeaderboard(lbMetric);
  }, [lbMetric]);

  const fetchLeaderboard = async (metric) => {
    setLbLoading(true);
    try {
      const { data } = await API.get(`/fitness-comparison/leaderboard?metric=${metric}&limit=10`);
      if (data.success) setLeaderboard(data.leaderboard);
    } catch {/* silent */}
    finally { setLbLoading(false); }
  };

  const getPercentileLabel = (pct) => {
    if (pct === null || pct === undefined) return "No data";
    if (pct >= 90) return "Top 10%";
    if (pct >= 75) return "Top 25%";
    if (pct >= 50) return "Above Average";
    if (pct >= 25) return "Below Average";
    return "Bottom 25%";
  };

  const getPercentileColor = (pct, higherIsBetter) => {
    if (pct === null || pct === undefined) return "#94a3b8";
    const score = higherIsBetter ? pct : 100 - pct;
    if (score >= 75) return "#16a34a";
    if (score >= 50) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <>
      <Navbar />
      <PageShell
        eyebrow="Community"
        title="Fitness Comparison"
        subtitle="See how your performance stacks up against the GymSphere community."
        heroIcon="📊"
      >
        {error && <div style={styles.errorBanner}>{error}</div>}

        {loading ? (
          <div style={styles.loadingState}>Loading comparison data…</div>
        ) : (
          <>
            {/* Community Stats Banner */}
            <div style={styles.bannerRow}>
              <div style={styles.bannerCard}>
                <div style={styles.bannerValue}>{benchmarks?.totalParticipants || 0}</div>
                <div style={styles.bannerLabel}>Community Members</div>
              </div>
              <div style={styles.bannerCard}>
                <div style={styles.bannerValue}>
                  {benchmarks?.performanceScore ?? "—"}
                </div>
                <div style={styles.bannerLabel}>Avg. Performance Score</div>
              </div>
              <div style={styles.bannerCard}>
                <div style={styles.bannerValue}>
                  {benchmarks?.workoutMinutes ?? "—"}
                  <span style={styles.bannerUnit}> min</span>
                </div>
                <div style={styles.bannerLabel}>Avg. Workout Duration</div>
              </div>
              <div style={styles.bannerCard}>
                <div style={styles.bannerValue}>
                  {benchmarks?.caloriesBurned ?? "—"}
                  <span style={styles.bannerUnit}> kcal</span>
                </div>
                <div style={styles.bannerLabel}>Avg. Calories Burned</div>
              </div>
            </div>

            {/* Metric-by-metric comparison */}
            <div style={styles.layout}>
              <section style={styles.card}>
                <h2 style={styles.sectionTitle}>📈 Your Stats vs Community</h2>
                {!userStats ? (
                  <div style={styles.noDataHint}>
                    <span style={{ fontSize: "36px" }}>📋</span>
                    <p>No progress logs found. Log your progress first to compare.</p>
                  </div>
                ) : (
                  <div style={styles.metricList}>
                    {METRICS.map((m) => {
                      const userVal = userStats?.[m.key];
                      const communityVal = benchmarks?.[m.key];
                      const rank = userRanks?.[m.key];
                      const color = getPercentileColor(rank, m.higherIsBetter);
                      const max = Math.max(userVal || 0, communityVal || 0) * 1.2;

                      return (
                        <div key={m.key} style={styles.metricRow}>
                          <div style={styles.metricIcon}>{m.icon}</div>
                          <div style={styles.metricBody}>
                            <div style={styles.metricHeader}>
                              <span style={styles.metricLabel}>{m.label}</span>
                              {rank !== null && rank !== undefined && (
                                <span style={{ ...styles.rankChip, background: color }}>
                                  {getPercentileLabel(rank)}
                                </span>
                              )}
                            </div>
                            <div style={styles.barRow}>
                              <span style={styles.barLabel}>You</span>
                              <Bar
                                value={userVal || 0}
                                max={max}
                                color="linear-gradient(90deg, #16a34a, #22c55e)"
                              />
                              <span style={styles.barValue}>
                                {userVal != null ? `${userVal} ${m.unit}` : "—"}
                              </span>
                            </div>
                            <div style={styles.barRow}>
                              <span style={styles.barLabel}>Avg</span>
                              <Bar
                                value={communityVal || 0}
                                max={max}
                                color="#94a3b8"
                              />
                              <span style={styles.barValue}>
                                {communityVal != null ? `${communityVal} ${m.unit}` : "—"}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Leaderboard */}
              <section style={styles.card}>
                <h2 style={styles.sectionTitle}>🏆 Leaderboard</h2>
                <div style={styles.lbTabRow}>
                  {LEADERBOARD_METRICS.map((m) => (
                    <button
                      key={m.key}
                      style={{
                        ...styles.lbTab,
                        ...(lbMetric === m.key ? styles.lbTabActive : {}),
                      }}
                      onClick={() => setLbMetric(m.key)}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {lbLoading ? (
                  <p style={styles.hint}>Loading…</p>
                ) : leaderboard.length === 0 ? (
                  <p style={styles.hint}>No data yet.</p>
                ) : (
                  <div style={styles.lbList}>
                    {leaderboard.map((entry, idx) => {
                      const isMe = entry.userId === user?._id || entry.userId === user?.id;
                      const medals = ["🥇", "🥈", "🥉"];
                      const unit = METRICS.find((m) => m.key === lbMetric)?.unit || "";
                      return (
                        <div
                          key={entry.userId}
                          style={{
                            ...styles.lbRow,
                            ...(isMe ? styles.lbRowMe : {}),
                          }}
                        >
                          <div style={styles.lbRank}>
                            {idx < 3 ? medals[idx] : `#${idx + 1}`}
                          </div>
                          <div style={styles.lbAvatar}>
                            {entry.name?.[0]?.toUpperCase()}
                          </div>
                          <div style={styles.lbMeta}>
                            <div style={styles.lbName}>
                              {entry.name} {isMe && <span style={styles.youBadge}>You</span>}
                            </div>
                            <div style={styles.lbRole}>{entry.role}</div>
                          </div>
                          <div style={styles.lbValue}>
                            {entry.value} <span style={styles.lbUnit}>{unit}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </PageShell>
    </>
  );
}

const styles = {
  errorBanner: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#dc2626",
    padding: "12px 16px",
    borderRadius: "10px",
    margin: "16px 0",
    fontSize: "14px",
  },
  loadingState: {
    textAlign: "center",
    padding: "60px",
    color: "#94a3b8",
    fontSize: "16px",
  },
  bannerRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "16px",
    margin: "24px 0",
  },
  bannerCard: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "20px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
    textAlign: "center",
  },
  bannerValue: {
    fontSize: "28px",
    fontWeight: 900,
    color: "#0f172a",
  },
  bannerUnit: {
    fontSize: "16px",
    fontWeight: 400,
    color: "#64748b",
  },
  bannerLabel: {
    fontSize: "13px",
    color: "#64748b",
    marginTop: "4px",
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
    marginBottom: "32px",
  },
  card: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "24px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 24px rgba(0,0,0,0.05)",
  },
  sectionTitle: {
    fontSize: "17px",
    fontWeight: 800,
    color: "#0f172a",
    marginBottom: "18px",
  },
  noDataHint: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    padding: "40px 0",
    color: "#64748b",
    fontSize: "14px",
    textAlign: "center",
  },
  metricList: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  metricRow: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
  },
  metricIcon: {
    fontSize: "22px",
    flexShrink: 0,
    marginTop: "2px",
  },
  metricBody: {
    flex: 1,
  },
  metricHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "8px",
  },
  metricLabel: {
    fontWeight: 700,
    fontSize: "14px",
    color: "#0f172a",
  },
  rankChip: {
    color: "#fff",
    borderRadius: "999px",
    padding: "2px 10px",
    fontSize: "11px",
    fontWeight: 700,
  },
  barRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "4px",
  },
  barLabel: {
    fontSize: "11px",
    color: "#64748b",
    width: "24px",
    flexShrink: 0,
    fontWeight: 700,
  },
  barValue: {
    fontSize: "12px",
    color: "#0f172a",
    fontWeight: 700,
    width: "70px",
    textAlign: "right",
    flexShrink: 0,
  },
  hint: {
    color: "#94a3b8",
    fontSize: "14px",
    textAlign: "center",
    padding: "20px 0",
  },
  lbTabRow: {
    display: "flex",
    gap: "8px",
    marginBottom: "16px",
    flexWrap: "wrap",
  },
  lbTab: {
    padding: "6px 14px",
    borderRadius: "999px",
    border: "1px solid #e2e8f0",
    background: "none",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 700,
    color: "#64748b",
    transition: "0.15s",
  },
  lbTabActive: {
    background: "#dcfce7",
    color: "#16a34a",
    border: "1px solid #bbf7d0",
  },
  lbList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  lbRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 12px",
    borderRadius: "12px",
    background: "#f8fafc",
    border: "1px solid #f1f5f9",
  },
  lbRowMe: {
    background: "#dcfce7",
    border: "1px solid #bbf7d0",
  },
  lbRank: {
    width: "28px",
    textAlign: "center",
    fontWeight: 900,
    fontSize: "16px",
    flexShrink: 0,
  },
  lbAvatar: {
    width: "36px",
    height: "36px",
    borderRadius: "999px",
    background: "#0f172a",
    color: "#fff",
    display: "grid",
    placeItems: "center",
    fontWeight: 900,
    fontSize: "14px",
    flexShrink: 0,
  },
  lbMeta: { flex: 1 },
  lbName: {
    fontWeight: 700,
    fontSize: "14px",
    color: "#0f172a",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  youBadge: {
    background: "#16a34a",
    color: "#fff",
    borderRadius: "999px",
    padding: "1px 8px",
    fontSize: "10px",
    fontWeight: 900,
  },
  lbRole: {
    fontSize: "12px",
    color: "#64748b",
    textTransform: "capitalize",
  },
  lbValue: {
    fontWeight: 900,
    fontSize: "16px",
    color: "#0f172a",
    flexShrink: 0,
  },
  lbUnit: {
    fontSize: "11px",
    fontWeight: 400,
    color: "#64748b",
  },
};

export default FitnessComparison;
