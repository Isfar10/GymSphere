import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import API from "../services/api";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [filter, setFilter] = useState("all");

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setPageError("");

      const query = filter === "unread" ? "?unread=true" : "";
      const response = await API.get(`/notifications${query}`);

      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (err) {
      setPageError(
        err.response?.data?.message || "Failed to load notifications"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const markAsRead = async (notificationId) => {
    try {
      setActionMessage("");
      setActionError("");

      await API.patch(`/notifications/${notificationId}/read`);
      setActionMessage("Notification marked as read");
      await fetchNotifications();
    } catch (err) {
      setActionError(
        err.response?.data?.message || "Failed to mark notification as read"
      );
    }
  };

  const markAllAsRead = async () => {
    try {
      setActionMessage("");
      setActionError("");

      await API.patch("/notifications/read-all");
      setActionMessage("All notifications marked as read");
      await fetchNotifications();
    } catch (err) {
      setActionError(
        err.response?.data?.message || "Failed to mark all as read"
      );
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      setActionMessage("");
      setActionError("");

      await API.delete(`/notifications/${notificationId}`);
      setActionMessage("Notification deleted");
      await fetchNotifications();
    } catch (err) {
      setActionError(
        err.response?.data?.message || "Failed to delete notification"
      );
    }
  };

  const createTestNotification = async () => {
    try {
      setActionMessage("");
      setActionError("");

      await API.post("/notifications/test");
      setActionMessage("Test notification created");
      await fetchNotifications();
    } catch (err) {
      setActionError(
        err.response?.data?.message || "Failed to create test notification"
      );
    }
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
    <>
      <Navbar />

      <main style={styles.page}>
        <section style={styles.header}>
          <div>
            <h1 style={styles.title}>Notifications</h1>
            <p style={styles.subtitle}>
              You have {unreadCount} unread notification
              {unreadCount === 1 ? "" : "s"}.
            </p>
          </div>

          <div style={styles.headerActions}>
            <button
              type="button"
              style={styles.secondaryButton}
              onClick={createTestNotification}
            >
              Create Test
            </button>

            <button
              type="button"
              style={{
                ...styles.primaryButton,
                opacity: unreadCount === 0 ? 0.6 : 1,
                cursor: unreadCount === 0 ? "not-allowed" : "pointer",
              }}
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
            >
              Mark All Read
            </button>
          </div>
        </section>

        <section style={styles.filterRow}>
          <button
            type="button"
            style={filter === "all" ? styles.activeFilter : styles.filterButton}
            onClick={() => setFilter("all")}
          >
            All
          </button>

          <button
            type="button"
            style={
              filter === "unread" ? styles.activeFilter : styles.filterButton
            }
            onClick={() => setFilter("unread")}
          >
            Unread
          </button>
        </section>

        {actionMessage && <p style={styles.success}>{actionMessage}</p>}
        {actionError && <p style={styles.error}>{actionError}</p>}
        {pageError && <p style={styles.error}>{pageError}</p>}

        {loading && <p style={styles.empty}>Loading notifications...</p>}

        {!loading && !pageError && notifications.length === 0 && (
          <section style={styles.emptyCard}>
            <h2 style={styles.emptyTitle}>No notifications found</h2>
            <p style={styles.emptyText}>
              Booking updates, weekly goal updates, and progress messages will
              appear here.
            </p>
          </section>
        )}

        {!loading && !pageError && notifications.length > 0 && (
          <section style={styles.list}>
            {notifications.map((notification) => (
              <article
                key={notification.id}
                style={{
                  ...styles.card,
                  borderLeft: notification.isRead
                    ? "5px solid #d5dbe7"
                    : "5px solid #0d6efd",
                }}
              >
                <div style={styles.cardTop}>
                  <div>
                    <span style={styles.type}>
                      {getTypeLabel(notification.type)}
                    </span>

                    <h2 style={styles.cardTitle}>{notification.title}</h2>
                  </div>

                  {!notification.isRead && (
                    <span style={styles.unreadBadge}>Unread</span>
                  )}
                </div>

                <p style={styles.message}>{notification.message}</p>

                <p style={styles.date}>
                  {new Date(notification.createdAt).toLocaleString()}
                </p>

                <div style={styles.cardActions}>
                  {notification.link && (
                    <Link style={styles.linkButton} to={notification.link}>
                      Open
                    </Link>
                  )}

                  {!notification.isRead && (
                    <button
                      type="button"
                      style={styles.secondaryButton}
                      onClick={() => markAsRead(notification.id)}
                    >
                      Mark Read
                    </button>
                  )}

                  <button
                    type="button"
                    style={styles.dangerButton}
                    onClick={() => deleteNotification(notification.id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </>
  );
};

const styles = {
  page: {
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "30px 20px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    alignItems: "center",
    marginBottom: "20px",
    flexWrap: "wrap",
  },
  title: {
    margin: 0,
    fontSize: "32px",
    color: "#172033",
  },
  subtitle: {
    margin: "8px 0 0",
    color: "#65708a",
  },
  headerActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  filterRow: {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
  },
  filterButton: {
    padding: "10px 16px",
    border: "1px solid #d5dbe7",
    borderRadius: "8px",
    background: "#fff",
    cursor: "pointer",
  },
  activeFilter: {
    padding: "10px 16px",
    border: "1px solid #0d6efd",
    borderRadius: "8px",
    background: "#0d6efd",
    color: "#fff",
    cursor: "pointer",
  },
  list: {
    display: "grid",
    gap: "16px",
  },
  card: {
    background: "#fff",
    borderRadius: "14px",
    boxShadow: "0 8px 24px rgba(20, 35, 65, 0.08)",
    padding: "20px",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "15px",
    alignItems: "flex-start",
  },
  type: {
    display: "inline-block",
    background: "#eef4ff",
    color: "#0d6efd",
    fontSize: "13px",
    padding: "5px 9px",
    borderRadius: "999px",
    marginBottom: "8px",
  },
  cardTitle: {
    margin: 0,
    fontSize: "20px",
    color: "#172033",
  },
  unreadBadge: {
    background: "#dc3545",
    color: "#fff",
    padding: "5px 9px",
    borderRadius: "999px",
    fontSize: "12px",
    whiteSpace: "nowrap",
  },
  message: {
    color: "#34405c",
    lineHeight: 1.6,
    margin: "14px 0 10px",
  },
  date: {
    color: "#7c879f",
    fontSize: "14px",
    marginBottom: "15px",
  },
  cardActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  primaryButton: {
    background: "#0d6efd",
    color: "#fff",
    border: "none",
    padding: "10px 14px",
    borderRadius: "8px",
    cursor: "pointer",
  },
  secondaryButton: {
    background: "#f4f6fb",
    color: "#172033",
    border: "1px solid #d5dbe7",
    padding: "10px 14px",
    borderRadius: "8px",
    cursor: "pointer",
  },
  dangerButton: {
    background: "#dc3545",
    color: "#fff",
    border: "none",
    padding: "10px 14px",
    borderRadius: "8px",
    cursor: "pointer",
  },
  linkButton: {
    background: "#198754",
    color: "#fff",
    textDecoration: "none",
    padding: "10px 14px",
    borderRadius: "8px",
    display: "inline-block",
  },
  success: {
    background: "#e7f7ee",
    color: "#146c43",
    padding: "12px 14px",
    borderRadius: "8px",
  },
  error: {
    background: "#fde8e8",
    color: "#b42318",
    padding: "12px 14px",
    borderRadius: "8px",
  },
  empty: {
    color: "#65708a",
  },
  emptyCard: {
    background: "#fff",
    borderRadius: "14px",
    padding: "35px",
    textAlign: "center",
    boxShadow: "0 8px 24px rgba(20, 35, 65, 0.08)",
  },
  emptyTitle: {
    margin: 0,
    color: "#172033",
  },
  emptyText: {
    color: "#65708a",
  },
};

export default Notifications;