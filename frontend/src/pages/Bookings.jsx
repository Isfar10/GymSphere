import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import PageShell from "../components/PageShell";
import StatCard from "../components/StatCard";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";

function Bookings() {
  const { user } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState("");

  const stats = useMemo(() => {
    return {
      total: bookings.length,
      pending: bookings.filter((booking) => booking.status === "pending").length,
      accepted: bookings.filter((booking) => booking.status === "accepted").length,
      completed: bookings.filter((booking) => booking.status === "completed").length,
    };
  }, [bookings]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setPageError("");

      const endpoint = user?.role === "admin" ? "/bookings" : "/bookings/mine";
      const response = await API.get(endpoint);

      setBookings(response.data.bookings || []);
    } catch (err) {
      setPageError(err.response?.data?.message || "Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const updateStatus = async (bookingId, status) => {
    try {
      setActionLoadingId(bookingId);
      setActionMessage("");
      setActionError("");

      await API.patch(`/bookings/${bookingId}/status`, { status });

      setActionMessage(`Booking marked as ${status}.`);
      await fetchBookings();
    } catch (err) {
      setActionError(err.response?.data?.message || "Failed to update booking.");
    } finally {
      setActionLoadingId("");
    }
  };

  const renderActions = (booking) => {
    if (!user) return null;

    if (user.role === "trainer") {
      return (
        <div style={styles.actionRow}>
          {booking.status === "pending" && (
            <>
              <button
                type="button"
                onClick={() => updateStatus(booking.id, "accepted")}
                disabled={actionLoadingId === booking.id}
                className="gs-button"
              >
                Accept
              </button>

              <button
                type="button"
                onClick={() => updateStatus(booking.id, "rejected")}
                disabled={actionLoadingId === booking.id}
                className="gs-button-danger"
              >
                Reject
              </button>
            </>
          )}

          {booking.status === "accepted" && (
            <button
              type="button"
              onClick={() => updateStatus(booking.id, "completed")}
              disabled={actionLoadingId === booking.id}
              className="gs-button"
            >
              Mark Completed
            </button>
          )}
        </div>
      );
    }

    if (user.role === "trainee" && ["pending", "accepted"].includes(booking.status)) {
      return (
        <button
          type="button"
          onClick={() => updateStatus(booking.id, "cancelled")}
          disabled={actionLoadingId === booking.id}
          className="gs-button-danger"
        >
          Cancel Booking
        </button>
      );
    }

    return null;
  };

  const getRoleSpecificLabel = (booking) => {
    if (user?.role === "trainer") {
      return {
        label: "Trainee",
        name: booking.trainee?.name,
        email: booking.trainee?.email,
      };
    }

    if (user?.role === "trainee") {
      return {
        label: "Trainer",
        name: booking.trainer?.name,
        email: booking.trainer?.email,
      };
    }

    return null;
  };

  const pageTitle =
    user?.role === "trainer"
      ? "Incoming session requests"
      : user?.role === "trainee"
        ? "My bookings"
        : "All bookings";

  return (
    <>
      <Navbar />

      <PageShell
        eyebrow="Training Sessions"
        title={pageTitle}
        subtitle="Manage trainer sessions, review booking status, and keep every appointment organized."
        heroIcon="📅"
        actions={
          <>
            <button type="button" onClick={fetchBookings} className="gs-button">
              Refresh Bookings
            </button>
            {user?.role === "trainee" && (
              <a href="/trainers" className="gs-button-outline">
                Find Trainers
              </a>
            )}
          </>
        }
      >
        <section className="gs-grid gs-grid-4">
          <StatCard icon="📚" label="Total" value={stats.total} helper="All visible bookings" />
          <StatCard icon="⏳" label="Pending" value={stats.pending} helper="Waiting for action" />
          <StatCard icon="✅" label="Accepted" value={stats.accepted} helper="Confirmed sessions" />
          <StatCard icon="🏁" label="Completed" value={stats.completed} helper="Finished sessions" />
        </section>

        {actionMessage && (
          <div className="gs-alert-success" style={styles.alert}>
            {actionMessage}
          </div>
        )}

        {(actionError || pageError) && (
          <div className="gs-alert-error" style={styles.alert}>
            {actionError || pageError}
          </div>
        )}

        <section style={styles.section}>
          <div className="gs-section-header">
            <div>
              <p style={styles.kicker}>Schedule</p>
              <h2 className="gs-section-title">Booking list</h2>
            </div>
          </div>

          {loading ? (
            <div className="gs-empty">Loading bookings...</div>
          ) : bookings.length === 0 ? (
            <EmptyState
              icon="📅"
              title="No bookings found"
              message="Your bookings will appear here after a session is requested."
            />
          ) : (
            <div style={styles.bookingGrid}>
              {bookings.map((booking) => {
                const contact = getRoleSpecificLabel(booking);

                return (
                  <article key={booking.id} style={styles.bookingCard}>
                    <div style={styles.bookingTop}>
                      <div>
                        <span className="gs-pill">Session</span>
                        <h3 style={styles.bookingTitle}>
                          {contact
                            ? `${contact.label}: ${contact.name || "Unknown"}`
                            : "Training Session"}
                        </h3>

                        {contact?.email && (
                          <p style={styles.muted}>{contact.email}</p>
                        )}

                        {user?.role === "admin" && (
                          <p style={styles.muted}>
                            Trainee: {booking.trainee?.name || "Unknown"} • Trainer:{" "}
                            {booking.trainer?.name || "Unknown"}
                          </p>
                        )}
                      </div>

                      <StatusBadge status={booking.status} />
                    </div>

                    <div style={styles.detailGrid}>
                      <Info label="Date" value={booking.sessionDate || "Not set"} />
                      <Info label="Day" value={booking.day || "Not set"} />
                      <Info
                        label="Time"
                        value={`${booking.start || "--"} - ${booking.end || "--"}`}
                      />
                      <Info
                        label="Price"
                        value={
                          booking.price != null
                            ? `৳${booking.price}`
                            : "Not listed"
                        }
                      />
                    </div>

                    <div style={styles.notesBox}>
                      <p style={styles.notesLabel}>Notes</p>
                      <p style={styles.muted}>{booking.notes || "No notes added."}</p>
                    </div>

                    <div style={styles.footerRow}>
                      <small style={styles.createdText}>
                        Created:{" "}
                        {booking.createdAt
                          ? new Date(booking.createdAt).toLocaleString()
                          : "N/A"}
                      </small>

                      {renderActions(booking)}
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

function Info({ label, value }) {
  return (
    <div style={styles.infoBox}>
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  );
}

const styles = {
  alert: {
    marginTop: 16,
  },
  section: {
    marginTop: 26,
  },
  kicker: {
    margin: "0 0 6px",
    color: "#16a34a",
    fontWeight: 950,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    fontSize: 13,
  },
  bookingGrid: {
    display: "grid",
    gap: 16,
  },
  bookingCard: {
    border: "1px solid #e2e8f0",
    borderRadius: 28,
    padding: 20,
    background: "rgba(255,255,255,0.92)",
    boxShadow: "0 22px 60px rgba(15,23,42,0.07)",
  },
  bookingTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
  },
  bookingTitle: {
    margin: "10px 0 6px",
    fontSize: 26,
    letterSpacing: "-0.045em",
  },
  muted: {
    margin: 0,
    color: "#64748b",
    lineHeight: 1.6,
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 12,
    marginTop: 18,
  },
  infoBox: {
    border: "1px solid #e2e8f0",
    borderRadius: 18,
    padding: 14,
    background: "#f8fafc",
  },
  notesBox: {
    border: "1px solid #e2e8f0",
    borderRadius: 18,
    padding: 14,
    background: "#ffffff",
    marginTop: 14,
  },
  notesLabel: {
    margin: "0 0 5px",
    color: "#64748b",
    fontWeight: 900,
    fontSize: 13,
  },
  footerRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 14,
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 16,
  },
  createdText: {
    color: "#94a3b8",
    fontWeight: 800,
  },
  actionRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
};

export default Bookings;