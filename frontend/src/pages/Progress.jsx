import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";

const getToday = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const date = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${date}`;
};

const getDefaultStartDate = () => {
  const today = new Date();
  today.setDate(today.getDate() - 30);
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const date = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${date}`;
};

const defaultForm = {
  date: getToday(),
  weight: "",
  workoutMinutes: 0,
  caloriesBurned: 0,
  performanceScore: 0,
  workoutsCompleted: 0,
  notes: "",
};

const cardStyle = {
  background: "#fff",
  border: "1px solid #ddd",
  borderRadius: "14px",
  padding: "18px",
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  boxSizing: "border-box",
};

const buttonStyle = {
  padding: "10px 14px",
  border: "none",
  borderRadius: "8px",
  background: "#0d6efd",
  color: "#fff",
  cursor: "pointer",
};

const secondaryButtonStyle = {
  ...buttonStyle,
  background: "#777",
};

const dangerButtonStyle = {
  ...buttonStyle,
  background: "#9a3f3f",
};

const Progress = () => {
  const { user } = useAuth();

  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState({
    totalLogs: 0,
    totalWorkoutMinutes: 0,
    totalCaloriesBurned: 0,
    totalWorkoutsCompleted: 0,
    averagePerformanceScore: 0,
    startingWeight: null,
    latestWeight: null,
    weightChange: 0,
  });

  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState(getToday());

  const [form, setForm] = useState(defaultForm);
  const [editingLogId, setEditingLogId] = useState("");
  const [editForm, setEditForm] = useState(defaultForm);

  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [pageError, setPageError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");

  const isTrainee = user?.role === "trainee";

  const fetchProgressLogs = async () => {
    try {
      setLoading(true);
      setPageError("");

      const response = await API.get("/progress/mine", {
        params: {
          startDate,
          endDate,
        },
      });

      setLogs(response.data.logs || []);
      setSummary(
        response.data.summary || {
          totalLogs: 0,
          totalWorkoutMinutes: 0,
          totalCaloriesBurned: 0,
          totalWorkoutsCompleted: 0,
          averagePerformanceScore: 0,
          startingWeight: null,
          latestWeight: null,
          weightChange: 0,
        }
      );
    } catch (err) {
      setPageError(err.response?.data?.message || "Failed to load progress logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && isTrainee) {
      fetchProgressLogs();
    } else {
      setLoading(false);
    }
  }, [user]);

  const chartData = useMemo(() => {
    return logs.map((log) => ({
      ...log,
      label: new Date(log.date).toLocaleDateString(),
    }));
  }, [logs]);

  const maxWorkoutMinutes = useMemo(() => {
    const maxValue = Math.max(...logs.map((log) => Number(log.workoutMinutes || 0)), 1);
    return maxValue;
  }, [logs]);

  const maxCalories = useMemo(() => {
    const maxValue = Math.max(...logs.map((log) => Number(log.caloriesBurned || 0)), 1);
    return maxValue;
  }, [logs]);

  const handleFilterSubmit = async (e) => {
    e.preventDefault();
    await fetchProgressLogs();
  };

  const handleCreateLog = async (e) => {
    e.preventDefault();

    try {
      setCreateLoading(true);
      setActionMessage("");
      setActionError("");

      await API.post("/progress", {
        ...form,
        weight: form.weight === "" ? "" : Number(form.weight),
        workoutMinutes: Number(form.workoutMinutes || 0),
        caloriesBurned: Number(form.caloriesBurned || 0),
        performanceScore: Number(form.performanceScore || 0),
        workoutsCompleted: Number(form.workoutsCompleted || 0),
      });

      setActionMessage("Progress log created successfully");
      setForm(defaultForm);
      await fetchProgressLogs();
    } catch (err) {
      setActionError(err.response?.data?.message || "Failed to create progress log");
    } finally {
      setCreateLoading(false);
    }
  };

  const startEditing = (log) => {
    setEditingLogId(log.id);
    setEditForm({
      date: log.date,
      weight: log.weight ?? "",
      workoutMinutes: log.workoutMinutes,
      caloriesBurned: log.caloriesBurned,
      performanceScore: log.performanceScore,
      workoutsCompleted: log.workoutsCompleted,
      notes: log.notes || "",
    });
  };

  const cancelEditing = () => {
    setEditingLogId("");
    setEditForm(defaultForm);
  };

  const handleUpdateLog = async (logId) => {
    try {
      setActionLoadingId(logId);
      setActionMessage("");
      setActionError("");

      await API.put(`/progress/${logId}`, {
        ...editForm,
        weight: editForm.weight === "" ? "" : Number(editForm.weight),
        workoutMinutes: Number(editForm.workoutMinutes || 0),
        caloriesBurned: Number(editForm.caloriesBurned || 0),
        performanceScore: Number(editForm.performanceScore || 0),
        workoutsCompleted: Number(editForm.workoutsCompleted || 0),
      });

      setActionMessage("Progress log updated successfully");
      cancelEditing();
      await fetchProgressLogs();
    } catch (err) {
      setActionError(err.response?.data?.message || "Failed to update progress log");
    } finally {
      setActionLoadingId("");
    }
  };

  const handleDeleteLog = async (logId) => {
    try {
      setActionLoadingId(logId);
      setActionMessage("");
      setActionError("");

      await API.delete(`/progress/${logId}`);

      setActionMessage("Progress log deleted successfully");
      await fetchProgressLogs();
    } catch (err) {
      setActionError(err.response?.data?.message || "Failed to delete progress log");
    } finally {
      setActionLoadingId("");
    }
  };

  return (
    <>
      <Navbar />

      <div style={{ maxWidth: "1150px", margin: "30px auto", padding: "0 20px" }}>
        <h1>Fitness Progress Tracking</h1>
        <p>
          Track your workouts, weight changes, calories burned, and performance
          improvement over time.
        </p>

        {!isTrainee && (
          <div style={cardStyle}>
            <p>This feature is currently available for trainee accounts only.</p>
          </div>
        )}

        {isTrainee && (
          <>
            {actionMessage && (
              <div
                style={{
                  ...cardStyle,
                  borderColor: "#b7e4c7",
                  background: "#f1fff5",
                  marginBottom: "16px",
                }}
              >
                {actionMessage}
              </div>
            )}

            {actionError && (
              <div
                style={{
                  ...cardStyle,
                  borderColor: "#f5c2c7",
                  background: "#fff5f5",
                  marginBottom: "16px",
                }}
              >
                {actionError}
              </div>
            )}

            {pageError && (
              <div
                style={{
                  ...cardStyle,
                  borderColor: "#f5c2c7",
                  background: "#fff5f5",
                  marginBottom: "16px",
                }}
              >
                {pageError}
              </div>
            )}

            <form
              onSubmit={handleFilterSubmit}
              style={{
                ...cardStyle,
                marginBottom: "20px",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "14px",
              }}
            >
              <div>
                <label>Start Date</label>
                <input
                  style={inputStyle}
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div>
                <label>End Date</label>
                <input
                  style={inputStyle}
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", alignItems: "end" }}>
                <button style={buttonStyle} type="submit" disabled={loading}>
                  {loading ? "Loading..." : "Apply Filter"}
                </button>
              </div>
            </form>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                gap: "16px",
                marginBottom: "20px",
              }}
            >
              <div style={cardStyle}>
                <p>Total Workouts</p>
                <h2>{summary.totalWorkoutsCompleted}</h2>
              </div>

              <div style={cardStyle}>
                <p>Workout Minutes</p>
                <h2>{summary.totalWorkoutMinutes}</h2>
              </div>

              <div style={cardStyle}>
                <p>Calories Burned</p>
                <h2>{summary.totalCaloriesBurned}</h2>
              </div>

              <div style={cardStyle}>
                <p>Avg Performance</p>
                <h2>{summary.averagePerformanceScore}%</h2>
              </div>

              <div style={cardStyle}>
                <p>Latest Weight</p>
                <h2>
                  {summary.latestWeight !== null ? `${summary.latestWeight} kg` : "N/A"}
                </h2>
              </div>

              <div style={cardStyle}>
                <p>Weight Change</p>
                <h2>
                  {summary.weightChange > 0 ? "+" : ""}
                  {summary.weightChange} kg
                </h2>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "20px",
                marginBottom: "24px",
              }}
            >
              <div style={cardStyle}>
                <h2>Workout Minutes Chart</h2>

                {chartData.length === 0 && <p>No chart data available.</p>}

                {chartData.map((log) => (
                  <div key={`minutes-${log.id}`} style={{ marginBottom: "12px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "4px",
                      }}
                    >
                      <span>{log.label}</span>
                      <strong>{log.workoutMinutes} min</strong>
                    </div>

                    <div
                      style={{
                        height: "12px",
                        background: "#eee",
                        borderRadius: "999px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${Math.min(
                            100,
                            (Number(log.workoutMinutes || 0) / maxWorkoutMinutes) * 100
                          )}%`,
                          background: "#0d6efd",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div style={cardStyle}>
                <h2>Calories Burned Chart</h2>

                {chartData.length === 0 && <p>No chart data available.</p>}

                {chartData.map((log) => (
                  <div key={`calories-${log.id}`} style={{ marginBottom: "12px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "4px",
                      }}
                    >
                      <span>{log.label}</span>
                      <strong>{log.caloriesBurned} cal</strong>
                    </div>

                    <div
                      style={{
                        height: "12px",
                        background: "#eee",
                        borderRadius: "999px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${Math.min(
                            100,
                            (Number(log.caloriesBurned || 0) / maxCalories) * 100
                          )}%`,
                          background: "#4caf50",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ ...cardStyle, marginBottom: "24px" }}>
              <h2>Create Progress Log</h2>

              <form
                onSubmit={handleCreateLog}
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "14px",
                }}
              >
                <div>
                  <label>Date</label>
                  <input
                    style={inputStyle}
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, date: e.target.value }))
                    }
                    required
                  />
                </div>

                <div>
                  <label>Weight kg</label>
                  <input
                    style={inputStyle}
                    type="number"
                    min="0"
                    step="0.1"
                    value={form.weight}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, weight: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label>Workout Minutes</label>
                  <input
                    style={inputStyle}
                    type="number"
                    min="0"
                    value={form.workoutMinutes}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        workoutMinutes: e.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <label>Calories Burned</label>
                  <input
                    style={inputStyle}
                    type="number"
                    min="0"
                    value={form.caloriesBurned}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        caloriesBurned: e.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <label>Performance Score 0-100</label>
                  <input
                    style={inputStyle}
                    type="number"
                    min="0"
                    max="100"
                    value={form.performanceScore}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        performanceScore: e.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <label>Workouts Completed</label>
                  <input
                    style={inputStyle}
                    type="number"
                    min="0"
                    value={form.workoutsCompleted}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        workoutsCompleted: e.target.value,
                      }))
                    }
                  />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label>Notes</label>
                  <textarea
                    style={inputStyle}
                    rows="3"
                    value={form.notes}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, notes: e.target.value }))
                    }
                  />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <button style={buttonStyle} type="submit" disabled={createLoading}>
                    {createLoading ? "Creating..." : "Create Progress Log"}
                  </button>
                </div>
              </form>
            </div>

            <div>
              <h2>Progress History</h2>

              {loading && <p>Loading progress logs...</p>}

              {!loading && logs.length === 0 && (
                <div style={cardStyle}>
                  <p>No progress logs found for this date range.</p>
                </div>
              )}

              {!loading &&
                logs.map((log) => (
                  <div key={log.id} style={{ ...cardStyle, marginBottom: "16px" }}>
                    {editingLogId === log.id ? (
                      <>
                        <h3>Edit Progress Log</h3>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fit, minmax(220px, 1fr))",
                            gap: "14px",
                          }}
                        >
                          <div>
                            <label>Date</label>
                            <input
                              style={inputStyle}
                              type="date"
                              value={editForm.date}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  date: e.target.value,
                                }))
                              }
                            />
                          </div>

                          <div>
                            <label>Weight kg</label>
                            <input
                              style={inputStyle}
                              type="number"
                              min="0"
                              step="0.1"
                              value={editForm.weight}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  weight: e.target.value,
                                }))
                              }
                            />
                          </div>

                          <div>
                            <label>Workout Minutes</label>
                            <input
                              style={inputStyle}
                              type="number"
                              min="0"
                              value={editForm.workoutMinutes}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  workoutMinutes: e.target.value,
                                }))
                              }
                            />
                          </div>

                          <div>
                            <label>Calories Burned</label>
                            <input
                              style={inputStyle}
                              type="number"
                              min="0"
                              value={editForm.caloriesBurned}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  caloriesBurned: e.target.value,
                                }))
                              }
                            />
                          </div>

                          <div>
                            <label>Performance Score</label>
                            <input
                              style={inputStyle}
                              type="number"
                              min="0"
                              max="100"
                              value={editForm.performanceScore}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  performanceScore: e.target.value,
                                }))
                              }
                            />
                          </div>

                          <div>
                            <label>Workouts Completed</label>
                            <input
                              style={inputStyle}
                              type="number"
                              min="0"
                              value={editForm.workoutsCompleted}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  workoutsCompleted: e.target.value,
                                }))
                              }
                            />
                          </div>

                          <div style={{ gridColumn: "1 / -1" }}>
                            <label>Notes</label>
                            <textarea
                              style={inputStyle}
                              rows="3"
                              value={editForm.notes}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  notes: e.target.value,
                                }))
                              }
                            />
                          </div>

                          <div
                            style={{
                              gridColumn: "1 / -1",
                              display: "flex",
                              gap: "10px",
                              flexWrap: "wrap",
                            }}
                          >
                            <button
                              style={buttonStyle}
                              onClick={() => handleUpdateLog(log.id)}
                              disabled={actionLoadingId === log.id}
                            >
                              {actionLoadingId === log.id ? "Saving..." : "Save"}
                            </button>

                            <button
                              style={secondaryButtonStyle}
                              onClick={cancelEditing}
                              disabled={actionLoadingId === log.id}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "14px",
                            flexWrap: "wrap",
                          }}
                        >
                          <div>
                            <h3 style={{ marginTop: 0 }}>
                              {new Date(log.date).toLocaleDateString()}
                            </h3>
                            <p>
                              <strong>Weight:</strong>{" "}
                              {log.weight !== null ? `${log.weight} kg` : "Not added"}
                            </p>
                            <p>
                              <strong>Workout Minutes:</strong> {log.workoutMinutes}
                            </p>
                            <p>
                              <strong>Calories Burned:</strong> {log.caloriesBurned}
                            </p>
                            <p>
                              <strong>Workouts Completed:</strong>{" "}
                              {log.workoutsCompleted}
                            </p>
                            <p>
                              <strong>Performance Score:</strong>{" "}
                              {log.performanceScore}%
                            </p>
                            <p>
                              <strong>Notes:</strong> {log.notes || "No notes"}
                            </p>
                          </div>

                          <div style={{ minWidth: "220px" }}>
                            <p>
                              <strong>Performance</strong>
                            </p>

                            <div
                              style={{
                                width: "100%",
                                height: "14px",
                                background: "#eee",
                                borderRadius: "999px",
                                overflow: "hidden",
                              }}
                            >
                              <div
                                style={{
                                  width: `${log.performanceScore}%`,
                                  height: "100%",
                                  background: "#f59f00",
                                }}
                              />
                            </div>

                            <p>{log.performanceScore}%</p>
                          </div>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            gap: "10px",
                            flexWrap: "wrap",
                            marginTop: "14px",
                          }}
                        >
                          <button
                            style={buttonStyle}
                            onClick={() => startEditing(log)}
                            disabled={actionLoadingId === log.id}
                          >
                            Edit
                          </button>

                          <button
                            style={dangerButtonStyle}
                            onClick={() => handleDeleteLog(log.id)}
                            disabled={actionLoadingId === log.id}
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Progress;