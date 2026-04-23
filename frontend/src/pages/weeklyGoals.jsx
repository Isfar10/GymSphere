import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";

const getMondayOfWeek = (dateString) => {
  const baseDate = dateString ? new Date(dateString) : new Date();

  if (Number.isNaN(baseDate.getTime())) {
    return "";
  }

  const localDate = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate()
  );

  const day = localDate.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  localDate.setDate(localDate.getDate() + diff);

  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, "0");
  const date = String(localDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${date}`;
};

const defaultForm = {
  title: "",
  description: "",
  category: "workout",
  targetCount: 1,
  unit: "sessions",
};

const WeeklyGoals = () => {
  const { user } = useAuth();

  const [weekStart, setWeekStart] = useState(getMondayOfWeek());
  const [goals, setGoals] = useState([]);
  const [summary, setSummary] = useState({
    totalGoals: 0,
    completedGoals: 0,
    totalTarget: 0,
    totalCompleted: 0,
    progressPercentage: 0,
  });

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState("");

  const [form, setForm] = useState(defaultForm);
  const [createLoading, setCreateLoading] = useState(false);

  const [editingGoalId, setEditingGoalId] = useState("");
  const [editForm, setEditForm] = useState(defaultForm);

  const isTrainee = user?.role === "trainee";

  const weekLabel = useMemo(() => {
    if (!weekStart) return "";
    return new Date(weekStart).toLocaleDateString();
  }, [weekStart]);

  const fetchGoals = async (selectedWeek = weekStart) => {
    try {
      setLoading(true);
      setPageError("");

      const response = await API.get("/weekly-goals/mine", {
        params: { weekStart: selectedWeek },
      });

      setGoals(response.data.goals || []);
      setSummary(
        response.data.summary || {
          totalGoals: 0,
          completedGoals: 0,
          totalTarget: 0,
          totalCompleted: 0,
          progressPercentage: 0,
        }
      );
    } catch (err) {
      setPageError(err.response?.data?.message || "Failed to load weekly goals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && isTrainee) {
      fetchGoals();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleWeekChange = async (value) => {
    const normalizedWeek = getMondayOfWeek(value);
    setWeekStart(normalizedWeek);
    await fetchGoals(normalizedWeek);
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();

    try {
      setCreateLoading(true);
      setActionMessage("");
      setActionError("");

      await API.post("/weekly-goals", {
        ...form,
        targetCount: Number(form.targetCount),
        weekStart,
      });

      setActionMessage("Weekly goal created successfully");
      setForm(defaultForm);
      await fetchGoals(weekStart);
    } catch (err) {
      setActionError(err.response?.data?.message || "Failed to create weekly goal");
    } finally {
      setCreateLoading(false);
    }
  };

  const startEditing = (goal) => {
    setEditingGoalId(goal.id);
    setEditForm({
      title: goal.title,
      description: goal.description,
      category: goal.category,
      targetCount: goal.targetCount,
      unit: goal.unit,
    });
  };

  const cancelEditing = () => {
    setEditingGoalId("");
    setEditForm(defaultForm);
  };

  const handleUpdateGoal = async (goalId) => {
    try {
      setActionLoadingId(goalId);
      setActionMessage("");
      setActionError("");

      await API.put(`/weekly-goals/${goalId}`, {
        ...editForm,
        targetCount: Number(editForm.targetCount),
        weekStart,
      });

      setActionMessage("Weekly goal updated successfully");
      cancelEditing();
      await fetchGoals(weekStart);
    } catch (err) {
      setActionError(err.response?.data?.message || "Failed to update weekly goal");
    } finally {
      setActionLoadingId("");
    }
  };

  const handleProgressUpdate = async (goalId, action) => {
    try {
      setActionLoadingId(goalId);
      setActionMessage("");
      setActionError("");

      await API.patch(`/weekly-goals/${goalId}/progress`, { action });

      setActionMessage("Weekly goal progress updated");
      await fetchGoals(weekStart);
    } catch (err) {
      setActionError(
        err.response?.data?.message || "Failed to update weekly goal progress"
      );
    } finally {
      setActionLoadingId("");
    }
  };

  const handleDeleteGoal = async (goalId) => {
    try {
      setActionLoadingId(goalId);
      setActionMessage("");
      setActionError("");

      await API.delete(`/weekly-goals/${goalId}`);

      setActionMessage("Weekly goal deleted successfully");
      await fetchGoals(weekStart);
    } catch (err) {
      setActionError(err.response?.data?.message || "Failed to delete weekly goal");
    } finally {
      setActionLoadingId("");
    }
  };

  return (
    <>
      <Navbar />

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px" }}>
        <h1>Weekly Goals</h1>
        <p>Set a target for the week and update your completion progress.</p>

        {!isTrainee && (
          <div
            style={{
              background: "#fff8e8",
              border: "1px solid #f1d48a",
              borderRadius: "12px",
              padding: "16px",
              color: "#7a5a00",
            }}
          >
            This feature is currently available for trainee accounts only.
          </div>
        )}

        {isTrainee && (
          <>
            <div
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "center",
                flexWrap: "wrap",
                marginBottom: "20px",
              }}
            >
              <label>
                <strong>Select week:</strong>
              </label>
              <input
                type="date"
                value={weekStart}
                onChange={(e) => handleWeekChange(e.target.value)}
              />
              <span style={{ color: "#666" }}>Week starts on {weekLabel}</span>
            </div>

            {actionMessage && (
              <p style={{ color: "green", fontWeight: "bold" }}>{actionMessage}</p>
            )}
            {actionError && (
              <p style={{ color: "crimson", fontWeight: "bold" }}>{actionError}</p>
            )}
            {pageError && <p style={{ color: "crimson" }}>{pageError}</p>}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              <div
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "12px",
                  padding: "16px",
                  background: "#fff",
                }}
              >
                <h3 style={{ marginTop: 0 }}>Total Goals</h3>
                <p style={{ fontSize: "28px", fontWeight: "bold", margin: 0 }}>
                  {summary.totalGoals}
                </p>
              </div>

              <div
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "12px",
                  padding: "16px",
                  background: "#fff",
                }}
              >
                <h3 style={{ marginTop: 0 }}>Completed Goals</h3>
                <p style={{ fontSize: "28px", fontWeight: "bold", margin: 0 }}>
                  {summary.completedGoals}
                </p>
              </div>

              <div
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "12px",
                  padding: "16px",
                  background: "#fff",
                }}
              >
                <h3 style={{ marginTop: 0 }}>Total Progress</h3>
                <p style={{ fontSize: "28px", fontWeight: "bold", margin: 0 }}>
                  {summary.totalCompleted}/{summary.totalTarget}
                </p>
              </div>

              <div
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "12px",
                  padding: "16px",
                  background: "#fff",
                }}
              >
                <h3 style={{ marginTop: 0 }}>Completion Rate</h3>
                <p style={{ fontSize: "28px", fontWeight: "bold", margin: 0 }}>
                  {summary.progressPercentage}%
                </p>
              </div>
            </div>

            <div
              style={{
                border: "1px solid #ddd",
                borderRadius: "12px",
                padding: "20px",
                background: "#fff",
                marginBottom: "24px",
              }}
            >
              <h2>Create Weekly Goal</h2>

              <form
                onSubmit={handleCreateGoal}
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "12px",
                }}
              >
                <input
                  type="text"
                  placeholder="Goal title"
                  value={form.title}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  required
                />

                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, category: e.target.value }))
                  }
                >
                  <option value="workout">Workout</option>
                  <option value="cardio">Cardio</option>
                  <option value="nutrition">Nutrition</option>
                  <option value="weight">Weight</option>
                  <option value="habit">Habit</option>
                  <option value="custom">Custom</option>
                </select>

                <input
                  type="number"
                  min="1"
                  placeholder="Target count"
                  value={form.targetCount}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, targetCount: e.target.value }))
                  }
                  required
                />

                <input
                  type="text"
                  placeholder="Unit (sessions, km, days)"
                  value={form.unit}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, unit: e.target.value }))
                  }
                />

                <textarea
                  placeholder="Description"
                  rows="3"
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  style={{ gridColumn: "1 / -1" }}
                />

                <button type="submit" disabled={createLoading}>
                  {createLoading ? "Creating..." : "Create Goal"}
                </button>
              </form>
            </div>

            <div>
              <h2>Goals for {weekLabel}</h2>

              {loading && <p>Loading weekly goals...</p>}

              {!loading && goals.length === 0 && (
                <p>No weekly goals found for this week.</p>
              )}

              {!loading &&
                goals.length > 0 &&
                goals.map((goal) => (
                  <div
                    key={goal.id}
                    style={{
                      border: "1px solid #ddd",
                      borderRadius: "12px",
                      padding: "20px",
                      background: "#fff",
                      marginBottom: "18px",
                    }}
                  >
                    {editingGoalId === goal.id ? (
                      <>
                        <h3>Edit Goal</h3>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fit, minmax(220px, 1fr))",
                            gap: "12px",
                          }}
                        >
                          <input
                            type="text"
                            value={editForm.title}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                title: e.target.value,
                              }))
                            }
                          />

                          <select
                            value={editForm.category}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                category: e.target.value,
                              }))
                            }
                          >
                            <option value="workout">Workout</option>
                            <option value="cardio">Cardio</option>
                            <option value="nutrition">Nutrition</option>
                            <option value="weight">Weight</option>
                            <option value="habit">Habit</option>
                            <option value="custom">Custom</option>
                          </select>

                          <input
                            type="number"
                            min="1"
                            value={editForm.targetCount}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                targetCount: e.target.value,
                              }))
                            }
                          />

                          <input
                            type="text"
                            value={editForm.unit}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                unit: e.target.value,
                              }))
                            }
                          />

                          <textarea
                            rows="3"
                            value={editForm.description}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                description: e.target.value,
                              }))
                            }
                            style={{ gridColumn: "1 / -1" }}
                          />

                          <div
                            style={{
                              display: "flex",
                              gap: "10px",
                              flexWrap: "wrap",
                              gridColumn: "1 / -1",
                            }}
                          >
                            <button
                              onClick={() => handleUpdateGoal(goal.id)}
                              disabled={actionLoadingId === goal.id}
                            >
                              {actionLoadingId === goal.id
                                ? "Saving..."
                                : "Save Changes"}
                            </button>
                            <button
                              onClick={cancelEditing}
                              style={{ background: "#777", color: "#fff" }}
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
                            gap: "12px",
                            flexWrap: "wrap",
                          }}
                        >
                          <div>
                            <h3 style={{ marginTop: 0 }}>{goal.title}</h3>
                            <p style={{ margin: "8px 0" }}>
                              <strong>Category:</strong> {goal.category}
                            </p>
                            <p style={{ margin: "8px 0" }}>
                              <strong>Description:</strong>{" "}
                              {goal.description || "No description"}
                            </p>
                            <p style={{ margin: "8px 0" }}>
                              <strong>Progress:</strong> {goal.completedCount}/
                              {goal.targetCount} {goal.unit}
                            </p>
                            <p style={{ margin: "8px 0" }}>
                              <strong>Status:</strong>{" "}
                              {goal.isCompleted ? "Completed" : "In Progress"}
                            </p>
                          </div>

                          <div style={{ minWidth: "220px" }}>
                            <div
                              style={{
                                width: "100%",
                                height: "14px",
                                background: "#eee",
                                borderRadius: "999px",
                                overflow: "hidden",
                                marginBottom: "8px",
                              }}
                            >
                              <div
                                style={{
                                  width: `${goal.progressPercentage}%`,
                                  height: "100%",
                                  background: "#4caf50",
                                }}
                              />
                            </div>
                            <strong>{goal.progressPercentage}% complete</strong>
                          </div>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            gap: "10px",
                            flexWrap: "wrap",
                            marginTop: "16px",
                          }}
                        >
                          <button
                            onClick={() =>
                              handleProgressUpdate(goal.id, "decrement")
                            }
                            disabled={actionLoadingId === goal.id}
                          >
                            -1
                          </button>

                          <button
                            onClick={() =>
                              handleProgressUpdate(goal.id, "increment")
                            }
                            disabled={actionLoadingId === goal.id}
                          >
                            +1
                          </button>

                          <button
                            onClick={() =>
                              handleProgressUpdate(goal.id, "complete")
                            }
                            disabled={actionLoadingId === goal.id}
                          >
                            Mark Complete
                          </button>

                          <button
                            onClick={() => handleProgressUpdate(goal.id, "reset")}
                            disabled={actionLoadingId === goal.id}
                            style={{ background: "#777", color: "#fff" }}
                          >
                            Reset
                          </button>

                          <button
                            onClick={() => startEditing(goal)}
                            disabled={actionLoadingId === goal.id}
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => handleDeleteGoal(goal.id)}
                            disabled={actionLoadingId === goal.id}
                            style={{ background: "#9a3f3f", color: "#fff" }}
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

export default WeeklyGoals;