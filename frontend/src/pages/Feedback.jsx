import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";

const defaultForm = {
  type: "complaint",
  category: "other",
  subject: "",
  message: "",
};

const defaultAdminForm = {
  status: "in_review",
  adminResponse: "",
};

const Feedback = () => {
  const { user } = useAuth();

  const [myFeedback, setMyFeedback] = useState([]);
  const [allFeedback, setAllFeedback] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [adminForms, setAdminForms] = useState({});
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const isAdmin = user?.role === "admin";

  const fetchMyFeedback = async () => {
    const response = await API.get("/feedback/mine");
    setMyFeedback(response.data.feedback || []);
  };

  const fetchAllFeedback = async () => {
    if (!isAdmin) return;
    const response = await API.get("/feedback");
    const items = response.data.feedback || [];
    setAllFeedback(items);

    const nextAdminForms = {};
    items.forEach((item) => {
      nextAdminForms[item.id] = {
        status: item.status || "in_review",
        adminResponse: item.adminResponse || "",
      };
    });
    setAdminForms(nextAdminForms);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      await fetchMyFeedback();
      await fetchAllFeedback();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load feedback");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const handleCreate = async (e) => {
    e.preventDefault();

    try {
      setCreateLoading(true);
      setMessage("");
      setError("");

      await API.post("/feedback", form);

      setMessage("Feedback submitted successfully");
      setForm(defaultForm);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit feedback");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setActionLoadingId(id);
      setMessage("");
      setError("");

      await API.delete(`/feedback/${id}`);

      setMessage("Feedback deleted successfully");
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete feedback");
    } finally {
      setActionLoadingId("");
    }
  };

  const handleAdminFieldChange = (id, field, value) => {
    setAdminForms((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || defaultAdminForm),
        [field]: value,
      },
    }));
  };

  const handleAdminUpdate = async (id) => {
    try {
      setActionLoadingId(id);
      setMessage("");
      setError("");

      await API.patch(`/feedback/${id}`, adminForms[id]);

      setMessage("Feedback updated successfully");
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update feedback");
    } finally {
      setActionLoadingId("");
    }
  };

  return (
    <>
      <Navbar />

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px" }}>
        <h1>Complaint & Recommendation</h1>
        <p>Submit complaints, suggestions, and platform feedback.</p>

        {message && (
          <p style={{ color: "green", fontWeight: "bold" }}>{message}</p>
        )}
        {error && (
          <p style={{ color: "crimson", fontWeight: "bold" }}>{error}</p>
        )}

        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: "12px",
            padding: "20px",
            background: "#fff",
            marginBottom: "24px",
          }}
        >
          <h2>Submit Feedback</h2>

          <form
            onSubmit={handleCreate}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "12px",
            }}
          >
            <select
              value={form.type}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, type: e.target.value }))
              }
            >
              <option value="complaint">Complaint</option>
              <option value="recommendation">Recommendation</option>
            </select>

            <select
              value={form.category}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, category: e.target.value }))
              }
            >
              <option value="trainer">Trainer</option>
              <option value="booking">Booking</option>
              <option value="payment">Payment</option>
              <option value="subscription">Subscription</option>
              <option value="store">Store</option>
              <option value="app">App</option>
              <option value="other">Other</option>
            </select>

            <input
              type="text"
              placeholder="Subject"
              value={form.subject}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, subject: e.target.value }))
              }
              required
              style={{ gridColumn: "1 / -1" }}
            />

            <textarea
              rows="5"
              placeholder="Describe the issue or your recommendation"
              value={form.message}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, message: e.target.value }))
              }
              required
              style={{ gridColumn: "1 / -1" }}
            />

            <button type="submit" disabled={createLoading}>
              {createLoading ? "Submitting..." : "Submit"}
            </button>
          </form>
        </div>

        <div style={{ marginBottom: "30px" }}>
          <h2>My Submissions</h2>

          {loading && <p>Loading feedback...</p>}
          {!loading && myFeedback.length === 0 && (
            <p>No feedback submitted yet.</p>
          )}

          {!loading &&
            myFeedback.length > 0 &&
            myFeedback.map((item) => (
              <div
                key={item.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "12px",
                  padding: "18px",
                  background: "#fff",
                  marginBottom: "16px",
                }}
              >
                <h3 style={{ marginTop: 0 }}>{item.subject}</h3>
                <p>
                  <strong>Type:</strong> {item.type}
                </p>
                <p>
                  <strong>Category:</strong> {item.category}
                </p>
                <p>
                  <strong>Status:</strong> {item.status}
                </p>
                <p>
                  <strong>Message:</strong> {item.message}
                </p>
                <p>
                  <strong>Admin Response:</strong>{" "}
                  {item.adminResponse || "No response yet"}
                </p>
                <small>{new Date(item.createdAt).toLocaleString()}</small>

                <div style={{ marginTop: "12px" }}>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={actionLoadingId === item.id}
                    style={{ background: "#9a3f3f", color: "#fff" }}
                  >
                    {actionLoadingId === item.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            ))}
        </div>

        {isAdmin && (
          <div>
            <h2>Admin Review Panel</h2>

            {allFeedback.length === 0 && !loading && <p>No feedback found.</p>}

            {allFeedback.map((item) => (
              <div
                key={item.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "12px",
                  padding: "18px",
                  background: "#fff",
                  marginBottom: "16px",
                }}
              >
                <h3 style={{ marginTop: 0 }}>{item.subject}</h3>
                <p>
                  <strong>User:</strong> {item.user?.name} ({item.user?.email})
                </p>
                <p>
                  <strong>Role:</strong> {item.user?.role}
                </p>
                <p>
                  <strong>Type:</strong> {item.type}
                </p>
                <p>
                  <strong>Category:</strong> {item.category}
                </p>
                <p>
                  <strong>Message:</strong> {item.message}
                </p>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "12px",
                    marginTop: "12px",
                  }}
                >
                  <select
                    value={adminForms[item.id]?.status || "in_review"}
                    onChange={(e) =>
                      handleAdminFieldChange(item.id, "status", e.target.value)
                    }
                  >
                    <option value="open">Open</option>
                    <option value="in_review">In Review</option>
                    <option value="resolved">Resolved</option>
                    <option value="rejected">Rejected</option>
                  </select>

                  <textarea
                    rows="4"
                    placeholder="Admin response"
                    value={adminForms[item.id]?.adminResponse || ""}
                    onChange={(e) =>
                      handleAdminFieldChange(
                        item.id,
                        "adminResponse",
                        e.target.value
                      )
                    }
                    style={{ gridColumn: "1 / -1" }}
                  />

                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <button
                      onClick={() => handleAdminUpdate(item.id)}
                      disabled={actionLoadingId === item.id}
                    >
                      {actionLoadingId === item.id ? "Saving..." : "Save Update"}
                    </button>

                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={actionLoadingId === item.id}
                      style={{ background: "#9a3f3f", color: "#fff" }}
                    >
                      {actionLoadingId === item.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Feedback;