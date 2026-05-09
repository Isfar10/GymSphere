import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const filteredNotifications = useMemo(() => {
    if (filter === "unread") {
      return notifications.filter((notification) => !notification.isRead);
    }

    return notifications;
  }, [notifications, filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const query = filter === "unread" ? "?unread=true" : "";
      const response = await API.get(`/notifications${query}`);

      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load notifications. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(""), 2500);
  };

  const markAsRead = async (id) => {
    try {
      setActionLoading(true);
      setError("");

      await API.patch(`/notifications/${id}/read`);
      await fetchNotifications();

      showSuccess("Notification marked as read.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to mark notification as read."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      setActionLoading(true);
      setError("");

      await API.patch("/notifications/mark-all-read");
      await fetchNotifications();

      showSuccess("All notifications marked as read.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to mark all notifications as read."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const deleteNotification = async (id) => {
    try {
      setActionLoading(true);
      setError("");

      await API.delete(`/notifications/${id}`);
      await fetchNotifications();

      showSuccess("Notification deleted.");
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to delete notification."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const createTestNotification = async () => {
    try {
      setActionLoading(true);
      setError("");

      await API.post("/notifications/test");
      await fetchNotifications();

      showSuccess("Test notification created.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to create test notification."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "Unknown time";

    return new Date(dateValue).toLocaleString();
  };

  const getTypeLabel = (type) => {
    const labels = {
      booking: "Booking",
      weekly_goal: "Weekly Goal",
      progress: "Progress",
      review: "Review",
      feedback: "Feedback",
      promotion: "Promotion",
      system: "System",
    };

    return labels[type] || "Notification";
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <p style={styles.eyebrow}>GymSphere</p>
          <h1 style={styles.title}>Notifications</h1>
          <p style={styles.subtitle}>
            View reminders, alerts, updates, and system messages.
          </p>
        </div>

        <Link to="/dashboard" style={styles.backLink}>
          Back to Dashboard
        </Link>
      </div>

      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <p style={styles.summaryLabel}>Total Notifications</p>
          <h2 style={styles.summaryNumber}>{notifications.length}</h2>
        </div>

        <div style={styles.summaryCard}>
          <p style={styles.summaryLabel}>Unread</p>
          <h2 style={styles.summaryNumber}>{unreadCount}</h2>
        </div>

        <div style={styles.summaryCard}>
          <p style={styles.summaryLabel}>Showing</p>
          <h2 style={styles.summaryNumber}>
            {filter === "all" ? "All" : "Unread"}
          </h2>
        </div>
      </div>

      <div style={styles.toolbar}>
        <div style={styles.filterGroup}>
          <button
            type="button"
            style={{
              ...styles.filterButton,
              ...(filter === "all" ? styles.activeFilterButton : {}),
            }}
            onClick={() => setFilter("all")}
          >
            All
          </button>

          <button
            type="button"
            style={{
              ...styles.filterButton,
              ...(filter === "unread" ? styles.activeFilterButton : {}),
            }}
            onClick={() => setFilter("unread")}
          >
            Unread
          </button>
        </div>

        <div style={styles.actionGroup}>
          <button
            type="button"
            style={styles.secondaryButton}
            onClick={createTestNotification}
            disabled={actionLoading}
          >
            Create Test
          </button>

          <button
            type="button"
            style={styles.primaryButton}
            onClick={markAllAsRead}
            disabled={actionLoading || unreadCount === 0}
          >
            Mark All Read
          </button>
        </div>
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}
      {success && <div style={styles.successBox}>{success}</div>}

      {loading ? (
        <div style={styles.emptyBox}>Loading notifications...</div>
      ) : filteredNotifications.length === 0 ? (
        <div style={styles.emptyBox}>
          <h3 style={styles.emptyTitle}>No notifications found</h3>
          <p style={styles.emptyText}>
            You are all caught up. Use the test button to confirm the system is
            working.
          </p>
        </div>
      ) : (
        <div style={styles.list}>
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              style={{
                ...styles.notificationCard,
                ...(notification.isRead ? {} : styles.unreadCard),
              }}
            >
              <div style={styles.notificationContent}>
                <div style={styles.cardTop}>
                  <span style={styles.badge}>
                    {getTypeLabel(notification.type)}
                  </span>

                  {!notification.isRead && (
                    <span style={styles.unreadBadge}>Unread</span>
                  )}
                </div>

                <h3 style={styles.notificationTitle}>
                  {notification.title}
                </h3>

                <p style={styles.notificationMessage}>
                  {notification.message}
                </p>

                <p style={styles.dateText}>
                  {formatDate(notification.createdAt)}
                </p>

                {notification.link && (
                  <Link to={notification.link} style={styles.linkText}>
                    Open related page
                  </Link>
                )}
              </div>

              <div style={styles.cardActions}>
                {!notification.isRead && (
                  <button
                    type="button"
                    style={styles.smallButton}
                    onClick={() => markAsRead(notification.id)}
                    disabled={actionLoading}
                  >
                    Mark Read
                  </button>
                )}

                <button
                  type="button"
                  style={styles.dangerButton}
                  onClick={() => deleteNotification(notification.id)}
                  disabled={actionLoading}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "32px 20px",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    color: "#111827",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "flex-start",
    marginBottom: "24px",
  },
  eyebrow: {
    margin: "0 0 6px",
    color: "#16a34a",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    fontSize: "13px",
  },
  title: {
    margin: 0,
    fontSize: "34px",
    lineHeight: 1.1,
  },
  subtitle: {
    margin: "10px 0 0",
    color: "#6b7280",
  },
  backLink: {
    textDecoration: "none",
    color: "#16a34a",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: "16px",
    marginBottom: "20px",
  },
  summaryCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "18px",
    background: "#ffffff",
    boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)",
  },
  summaryLabel: {
    margin: 0,
    color: "#6b7280",
    fontSize: "14px",
  },
  summaryNumber: {
    margin: "8px 0 0",
    fontSize: "28px",
  },
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "14px",
    flexWrap: "wrap",
    marginBottom: "18px",
  },
  filterGroup: {
    display: "flex",
    gap: "10px",
  },
  actionGroup: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  filterButton: {
    border: "1px solid #d1d5db",
    background: "#ffffff",
    color: "#111827",
    borderRadius: "999px",
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: 700,
  },
  activeFilterButton: {
    borderColor: "#16a34a",
    background: "#dcfce7",
    color: "#166534",
  },
  primaryButton: {
    border: "none",
    background: "#16a34a",
    color: "#ffffff",
    borderRadius: "999px",
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: 700,
  },
  secondaryButton: {
    border: "1px solid #16a34a",
    background: "#ffffff",
    color: "#16a34a",
    borderRadius: "999px",
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: 700,
  },
  errorBox: {
    background: "#fee2e2",
    color: "#991b1b",
    border: "1px solid #fecaca",
    borderRadius: "14px",
    padding: "12px 14px",
    marginBottom: "14px",
  },
  successBox: {
    background: "#dcfce7",
    color: "#166534",
    border: "1px solid #bbf7d0",
    borderRadius: "14px",
    padding: "12px 14px",
    marginBottom: "14px",
  },
  emptyBox: {
    border: "1px dashed #d1d5db",
    borderRadius: "18px",
    padding: "36px 20px",
    textAlign: "center",
    color: "#6b7280",
    background: "#f9fafb",
  },
  emptyTitle: {
    margin: "0 0 8px",
    color: "#111827",
  },
  emptyText: {
    margin: 0,
  },
  list: {
    display: "grid",
    gap: "14px",
  },
  notificationCard: {
    display: "flex",
    justifyContent: "space-between",
    gap: "18px",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "18px",
    background: "#ffffff",
    boxShadow: "0 10px 25px rgba(15, 23, 42, 0.05)",
  },
  unreadCard: {
    borderColor: "#16a34a",
    background: "#f0fdf4",
  },
  notificationContent: {
    flex: 1,
  },
  cardTop: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    marginBottom: "10px",
  },
  badge: {
    display: "inline-flex",
    borderRadius: "999px",
    padding: "5px 10px",
    background: "#e5e7eb",
    color: "#374151",
    fontSize: "12px",
    fontWeight: 700,
  },
  unreadBadge: {
    display: "inline-flex",
    borderRadius: "999px",
    padding: "5px 10px",
    background: "#16a34a",
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: 700,
  },
  notificationTitle: {
    margin: "0 0 8px",
    fontSize: "20px",
  },
  notificationMessage: {
    margin: "0 0 10px",
    color: "#374151",
    lineHeight: 1.6,
  },
  dateText: {
    margin: "0 0 8px",
    color: "#6b7280",
    fontSize: "13px",
  },
  linkText: {
    color: "#16a34a",
    fontWeight: 700,
    textDecoration: "none",
  },
  cardActions: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    minWidth: "120px",
  },
  smallButton: {
    border: "none",
    background: "#111827",
    color: "#ffffff",
    borderRadius: "10px",
    padding: "9px 12px",
    cursor: "pointer",
    fontWeight: 700,
  },
  dangerButton: {
    border: "1px solid #fecaca",
    background: "#ffffff",
    color: "#dc2626",
    borderRadius: "10px",
    padding: "9px 12px",
    cursor: "pointer",
    fontWeight: 700,
  },
};

export default Notifications;