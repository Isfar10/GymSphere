import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";

const days = [
  "",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const TrainerMatching = () => {
  const { user } = useAuth();

  const [filters, setFilters] = useState({
    day: "",
    maxPrice: "",
  });
  const [fitnessGoal, setFitnessGoal] = useState("");
  const [goalKeywords, setGoalKeywords] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMatches = async (activeFilters = filters) => {
    try {
      setLoading(true);
      setError("");

      const params = Object.fromEntries(
        Object.entries(activeFilters).filter(([, value]) => value !== "")
      );

      const response = await API.get("/users/trainers/matches/me", { params });

      setFitnessGoal(response.data.fitnessGoal || "");
      setGoalKeywords(response.data.goalKeywords || []);
      setTrainers(response.data.trainers || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load trainer matches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const handleChange = (e) => {
    setFilters((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchMatches(filters);
  };

  const clearFilters = () => {
    const reset = { day: "", maxPrice: "" };
    setFilters(reset);
    fetchMatches(reset);
  };

  return (
    <>
      <Navbar />

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px" }}>
        <h1>Trainer Matching</h1>
        <p>
          Get trainer recommendations based on your fitness goal, trainer
          specialization, ratings, experience, and price.
        </p>

        {user?.role !== "trainee" && (
          <div
            style={{
              border: "1px solid #f0d48a",
              background: "#fff8e8",
              borderRadius: "12px",
              padding: "16px",
              color: "#7a5a00",
            }}
          >
            This feature is currently available for trainee accounts only.
          </div>
        )}

        {user?.role === "trainee" && (
          <>
            <div
              style={{
                border: "1px solid #ddd",
                borderRadius: "12px",
                background: "#fff",
                padding: "18px",
                marginBottom: "20px",
              }}
            >
              <h2 style={{ marginTop: 0 }}>Your Goal</h2>
              <p>
                <strong>Fitness Goal:</strong>{" "}
                {fitnessGoal || "Add your fitness goal in Profile for better matches."}
              </p>
              {goalKeywords.length > 0 && (
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {goalKeywords.map((keyword) => (
                    <span
                      key={keyword}
                      style={{
                        padding: "6px 10px",
                        borderRadius: "999px",
                        background: "#eef4ff",
                        color: "#0d4fd8",
                        fontSize: "13px",
                        fontWeight: "bold",
                      }}
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <form
              onSubmit={handleSearch}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "12px",
                marginBottom: "24px",
              }}
            >
              <select name="day" value={filters.day} onChange={handleChange}>
                {days.map((day) => (
                  <option key={day || "any"} value={day}>
                    {day || "Any day"}
                  </option>
                ))}
              </select>

              <input
                type="number"
                name="maxPrice"
                min="0"
                placeholder="Maximum price"
                value={filters.maxPrice}
                onChange={handleChange}
              />

              <button type="submit">Refresh Matches</button>
              <button type="button" onClick={clearFilters}>
                Clear Filters
              </button>
            </form>

            {loading && <p>Loading matched trainers...</p>}
            {error && <p style={{ color: "crimson" }}>{error}</p>}

            {!loading && !error && trainers.length === 0 && (
              <p>No trainer matches found right now.</p>
            )}

            {!loading &&
              !error &&
              trainers.length > 0 &&
              trainers.map((trainer, index) => (
                <div
                  key={trainer.id}
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: "12px",
                    background: "#fff",
                    padding: "20px",
                    marginBottom: "18px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "12px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <h2 style={{ marginTop: 0, marginBottom: "8px" }}>
                        #{index + 1} {trainer.name}
                      </h2>
                      <p style={{ margin: "6px 0" }}>
                        <strong>Match Score:</strong> {trainer.matchScore}
                      </p>
                      <p style={{ margin: "6px 0" }}>
                        <strong>Specializations:</strong>{" "}
                        {trainer.specializations?.length
                          ? trainer.specializations.join(", ")
                          : "Not listed"}
                      </p>
                      <p style={{ margin: "6px 0" }}>
                        <strong>Experience:</strong>{" "}
                        {trainer.experienceYears ?? "Not listed"} years
                      </p>
                      <p style={{ margin: "6px 0" }}>
                        <strong>Price:</strong>{" "}
                        {trainer.hourlyRate != null
                          ? `$${trainer.hourlyRate}/session`
                          : "Not listed"}
                      </p>
                      <p style={{ margin: "6px 0" }}>
                        <strong>Rating:</strong>{" "}
                        {trainer.rating?.toFixed?.(1) ?? trainer.rating} (
                        {trainer.reviewCount} reviews)
                      </p>
                      <p style={{ margin: "6px 0" }}>
                        <strong>Bio:</strong> {trainer.bio || "No bio added yet."}
                      </p>
                    </div>

                    <div
                      style={{
                        minWidth: "260px",
                        border: "1px solid #eee",
                        borderRadius: "10px",
                        padding: "14px",
                        background: "#fafafa",
                      }}
                    >
                      <h3 style={{ marginTop: 0 }}>Why this trainer matches</h3>
                      {trainer.matchReasons?.length ? (
                        <ul style={{ paddingLeft: "18px", marginBottom: "16px" }}>
                          {trainer.matchReasons.map((reason) => (
                            <li key={reason} style={{ marginBottom: "6px" }}>
                              {reason}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>No specific match reasons available yet.</p>
                      )}

                      <Link
                        to="/trainers"
                        style={{
                          display: "inline-block",
                          padding: "10px 14px",
                          borderRadius: "8px",
                          textDecoration: "none",
                          background: "#0d6efd",
                          color: "#fff",
                          fontWeight: "bold",
                        }}
                      >
                        Book from Trainers Page
                      </Link>
                    </div>
                  </div>

                  <div style={{ marginTop: "14px" }}>
                    <strong>Availability:</strong>
                    {trainer.availability?.length ? (
                      <ul>
                        {trainer.availability.map((slot, slotIndex) => (
                          <li key={`${trainer.id}-${slotIndex}`}>
                            {slot.day}: {slot.start} - {slot.end}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>Not listed</p>
                    )}
                  </div>
                </div>
              ))}
          </>
        )}
      </div>
    </>
  );
};

export default TrainerMatching;