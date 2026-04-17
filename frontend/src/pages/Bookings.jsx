import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";

const Bookings = () => {
  const { user } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState("");

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setPageError("");

      const endpoint = user?.role === "admin" ? "/bookings" : "/bookings/mine";
      const response = await API.get(endpoint);

      setBookings(response.data.bookings || []);
    } catch (err) {
      setPageError(err.response?.data?.message || "Failed to load bookings");
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

      setActionMessage(`Booking marked as ${status}`);
      await fetchBookings();
    } catch (err) {
      setActionError(err.response?.data?.message || "Failed to update booking");
    } finally {
      setActionLoadingId("");
    }
  };

  const renderActions = (booking) => {
    if (!user) return null;

    if (user.role === "trainer") {
      return (
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "12px" }}>
          {booking.status === "pending" && (
            <>
              <button
                onClick={() => updateStatus(booking.id, "accepted")}
                disabled={actionLoadingId === booking.id}
              >
                Accept
              </button>

              <button
                onClick={() => updateStatus(booking.id, "rejected")}
                disabled={actionLoadingId === booking.id}
                style={{ background: "#9a3f3f" }}
              >
                Reject
              </button>
            </>
          )}

          {booking.status === "accepted" && (
            <button
              onClick={() => updateStatus(booking.id, "completed")}
              disabled={actionLoadingId === booking.id}
            >
              Mark Completed
            </button>
          )}
        </div>
      );
    }

    if (user.role === "trainee") {
      if (["pending", "accepted"].includes(booking.status)) {
        return (
          <div style={{ marginTop: "12px" }}>
            <button
              onClick={() => updateStatus(booking.id, "cancelled")}
              disabled={actionLoadingId === booking.id}
              style={{ background: "#9a3f3f" }}
            >
              Cancel Booking
            </button>
          </div>
        );
      }
    }

    return null;
  };

  const getRoleSpecificLabel = (booking) => {
    if (user?.role === "trainer") {
      return (
        <p>
          <strong>Trainee:</strong> {booking.trainee?.name} ({booking.trainee?.email})
        </p>
      );
    }

    if (user?.role === "trainee") {
      return (
        <p>
          <strong>Trainer:</strong> {booking.trainer?.name} ({booking.trainer?.email})
        </p>
      );
    }

    return (
      <>
        <p>
          <strong>Trainee:</strong> {booking.trainee?.name} ({booking.trainee?.email})
        </p>
        <p>
          <strong>Trainer:</strong> {booking.trainer?.name} ({booking.trainer?.email})
        </p>
      </>
    );
  };

  return (
    <>
      <Navbar />

      <div className="dashboard-page">
        <div className="dashboard-layout" style={{ gridTemplateColumns: "1fr" }}>
          <div className="dashboard-card">
            <h2>
              {user?.role === "trainer"
                ? "Incoming Session Requests"
                : user?.role === "trainee"
                ? "My Bookings"
                : "All Bookings"}
            </h2>

            {actionMessage && <p className="success-text">{actionMessage}</p>}
            {actionError && <p className="error-text">{actionError}</p>}
            {pageError && <p className="error-text">{pageError}</p>}
            {loading && <p>Loading bookings...</p>}

            {!loading && !pageError && bookings.length === 0 && (
              <p>No bookings found yet.</p>
            )}

            {!loading && !pageError && bookings.length > 0 && (
              <div style={{ display: "grid", gap: "16px", marginTop: "16px" }}>
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="dashboard-card"
                    style={{
                      margin: 0,
                      border: "1px solid rgba(255,255,255,0.08)"
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "16px",
                        flexWrap: "wrap"
                      }}
                    >
                      <div>
                        {getRoleSpecificLabel(booking)}

                        <p>
                          <strong>Date:</strong> {booking.sessionDate}
                        </p>
                        <p>
                          <strong>Day:</strong> {booking.day}
                        </p>
                        <p>
                          <strong>Time:</strong> {booking.start} - {booking.end}
                        </p>
                        <p>
                          <strong>Price:</strong> ${booking.price}
                        </p>
                        <p>
                          <strong>Status:</strong> {booking.status}
                        </p>
                        <p>
                          <strong>Notes:</strong> {booking.notes || "No notes"}
                        </p>
                      </div>

                      <div style={{ minWidth: "180px" }}>
                        <p>
                          <strong>Created:</strong>
                        </p>
                        <p>{new Date(booking.createdAt).toLocaleString()}</p>
                      </div>
                    </div>

                    {renderActions(booking)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Bookings;