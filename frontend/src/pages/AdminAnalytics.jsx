import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";

function AdminAnalytics() {
  const { user } = useAuth();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isAdmin = user?.role === "admin";

  const bookingStatusData = useMemo(() => {
    if (!analytics?.bookings) return [];

    return [
      { label: "Pending", value: analytics.bookings.pending },
      { label: "Accepted", value: analytics.bookings.accepted },
      { label: "Rejected", value: analytics.bookings.rejected },
      { label: "Cancelled", value: analytics.bookings.cancelled },
      { label: "Completed", value: analytics.bookings.completed },
    ];
  }, [analytics]);

  const maxBookingStatus = useMemo(() => {
    const maxValue = Math.max(...bookingStatusData.map((item) => item.value), 1);
    return maxValue;
  }, [bookingStatusData]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/admin/analytics");
      setAnalytics(response.data.analytics);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load admin analytics. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAnalytics();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  const formatCurrency = (value) => {
    return `à§³${Number(value || 0).toLocaleString()}`;
  };

  if (!isAdmin) {
    return (
      <>
        <Navbar />

        <main style={styles.page}>
          <div style={styles.lockedCard}>
            <p style={styles.eyebrow}>Restricted</p>
            <h1 style={styles.title}>Admin Analytics</h1>
            <p style={styles.subtitle}>
              You need an admin account to view platform analytics.
            </p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main style={styles.page}>
        <section style={styles.header}>
          <div>
            <p style={styles.eyebrow}>Admin Dashboard</p>
            <h1 style={styles.title}>Analytics Overview</h1>
            <p style={styles.subtitle}>
              Track users, bookings, revenue, reviews, goals, notifications, and
              community activity.
            </p>
          </div>

          <button type="button" onClick={fetchAnalytics} style={styles.refreshButton}>
            Refresh
          </button>
        </section>

        {loading ? (
          <div style={styles.emptyBox}>Loading analytics...</div>
        ) : error ? (
          <div style={styles.errorBox}>{error}</div>
        ) : (
          <>
            <section style={styles.grid}>
              <StatCard
                label="Total Users"
                value={analytics.users.total}
                helper={`${analytics.users.recent} new in last 30 days`}
              />

              <StatCard
                label="Trainees"
                value={analytics.users.trainees}
                helper="Registered trainee accounts"
              />

              <StatCard
                label="Trainers"
                value={analytics.users.trainers}
                helper="Registered trainer accounts"
              />

              <StatCard
                label="Admins"
                value={analytics.users.admins}
                helper="Admin accounts"
              />

              <StatCard
                label="Bookings"
                value={analytics.bookings.total}
                helper={`${analytics.bookings.recent} new in last 30 days`}
              />

              <StatCard
                label="Revenue"
                value={formatCurrency(analytics.revenue.total)}
                helper="Accepted and completed bookings"
              />

              <StatCard
                label="Reviews"
                value={analytics.reviews.total}
                helper={`Average rating: ${analytics.reviews.averageRating}/5`}
              />

              <StatCard
                label="Goal Completion"
                value={`${analytics.weeklyGoals.completionRate}%`}
                helper={`${analytics.weeklyGoals.totalCompleted}/${analytics.weeklyGoals.totalTargets} completed`}
              />

              <StatCard
                label="Notifications"
                value={analytics.notifications.total}
                helper="Total notification records"
              />

              <StatCard
                label="Social Posts"
                value={analytics.socialFeed.totalPosts}
                helper={
                  analytics.socialFeed.enabled
                    ? `${analytics.socialFeed.recentPosts} new in last 30 days`
                    : "Social feed model not found yet"
                }
              />

              <StatCard
                label="Social Likes"
                value={analytics.socialFeed.totalLikes}
                helper="Total likes on community posts"
              />

              <StatCard
                label="Social Comments"
                value={analytics.socialFeed.totalComments}
                helper="Total comments on community posts"
              />
            </section>

            <section style={styles.twoColumn}>
              <div style={styles.panel}>
                <h2 style={styles.panelTitle}>Booking Status Breakdown</h2>

                <div style={styles.barList}>
                  {bookingStatusData.map((item) => (
                    <div key={item.label} style={styles.barItem}>
                      <div style={styles.barTop}>
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                      </div>

                      <div style={styles.barTrack}>
                        <div
                          style={{
                            ...styles.barFill,
                            width: `${(item.value / maxBookingStatus) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={styles.panel}>
                <h2 style={styles.panelTitle}>Platform Health</h2>

                <div style={styles.healthList}>
                  <HealthRow
                    label="User Growth"
                    value={`${analytics.users.recent} recent users`}
                  />

                  <HealthRow
                    label="Booking Activity"
                    value={`${analytics.bookings.recent} recent bookings`}
                  />

                  <HealthRow
                    label="Review Quality"
                    value={`${analytics.reviews.averageRating}/5 average rating`}
                  />

                  <HealthRow
                    label="Goal Progress"
                    value={`${analytics.weeklyGoals.completionRate}% completion`}
                  />

                  <HealthRow
                    label="Community Activity"
                    value={`${analytics.socialFeed.totalPosts} posts`}
                  />

                  <HealthRow
                    label="Progress Tracking"
                    value={
                      analytics.progress.enabled
                        ? `${analytics.progress.totalEntries} entries`
                        : "Progress model not found"
                    }
                  />
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </>
  );
}

function StatCard({ label, value, helper }) {
  return (
    <div style={styles.card}>
      <p style={styles.cardLabel}>{label}</p>
      <h2 style={styles.cardValue}>{value}</h2>
      <p style={styles.cardHelper}>{helper}</p>
    </div>
  );
}

function HealthRow({ label, value }) {
  return (
    <div style={styles.healthRow}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

const styles = {
  page: {
    maxWidth: "1180px",
    margin: "0 auto",
    padding: "32px 20px",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    color: "#111827",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "18px",
    marginBottom: "24px",
  },
  eyebrow: {
    margin: "0 0 8px",
    color: "#16a34a",
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontSize: "13px",
  },
  title: {
    margin: 0,
    fontSize: "36px",
    lineHeight: 1.1,
  },
  subtitle: {
    margin: "10px 0 0",
    color: "#6b7280",
    maxWidth: "720px",
    lineHeight: 1.6,
  },
  refreshButton: {
    border: "none",
    borderRadius: "999px",
    background: "#16a34a",
    color: "#ffffff",
    padding: "11px 18px",
    fontWeight: 800,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
    marginBottom: "22px",
  },
  card: {
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "18px",
    background: "#ffffff",
    boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)",
  },
  cardLabel: {
    margin: 0,
    color: "#6b7280",
    fontSize: "14px",
    fontWeight: 700,
  },
  cardValue: {
    margin: "8px 0",
    fontSize: "30px",
  },
  cardHelper: {
    margin: 0,
    color: "#6b7280",
    fontSize: "13px",
    lineHeight: 1.5,
  },
  twoColumn: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "18px",
  },
  panel: {
    border: "1px solid #e5e7eb",
    borderRadius: "20px",
    padding: "20px",
    background: "#ffffff",
    boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)",
  },
  panelTitle: {
    margin: "0 0 16px",
    fontSize: "22px",
  },
  barList: {
    display: "grid",
    gap: "14px",
  },
  barItem: {
    display: "grid",
    gap: "8px",
  },
  barTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    color: "#374151",
  },
  barTrack: {
    height: "12px",
    borderRadius: "999px",
    background: "#e5e7eb",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: "999px",
    background: "#16a34a",
  },
  healthList: {
    display: "grid",
    gap: "12px",
  },
  healthRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
    borderBottom: "1px solid #f3f4f6",
    paddingBottom: "12px",
    color: "#374151",
  },
  emptyBox: {
    border: "1px dashed #d1d5db",
    borderRadius: "18px",
    padding: "36px 20px",
    textAlign: "center",
    color: "#6b7280",
    background: "#f9fafb",
  },
  errorBox: {
    background: "#fee2e2",
    color: "#991b1b",
    border: "1px solid #fecaca",
    borderRadius: "14px",
    padding: "12px 14px",
  },
  lockedCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "20px",
    padding: "28px",
    background: "#ffffff",
    boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)",
  },
};

export default AdminAnalytics;