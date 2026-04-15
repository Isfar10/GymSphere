import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";

const defaultFilters = {
  search: "",
  specialization: "",
  minRating: "",
  maxPrice: "",
  day: ""
};

const Trainers = () => {
  const { user } = useAuth();

  const [filters, setFilters] = useState(defaultFilters);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [bookingForms, setBookingForms] = useState({});
  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [bookingLoadingId, setBookingLoadingId] = useState("");

  const fetchTrainers = async (activeFilters = filters) => {
    try {
      setLoading(true);
      setError("");

      const params = Object.fromEntries(
        Object.entries(activeFilters).filter(([, value]) => value !== "")
      );

      const response = await API.get("/users/trainers", { params });
      const trainerList = response.data.trainers || [];

      setTrainers(trainerList);

      const initialForms = {};
      trainerList.forEach((trainer) => {
        initialForms[trainer.id] = {
          sessionDate: "",
          selectedSlot:
            trainer.availability?.length > 0
              ? `${trainer.availability[0].day}|${trainer.availability[0].start}|${trainer.availability[0].end}`
              : "",
          notes: ""
        };
      });

      setBookingForms(initialForms);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load trainers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainers();
  }, []);

  const handleChange = (e) => {
    setFilters((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchTrainers(filters);
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
    fetchTrainers(defaultFilters);
  };

  const handleBookingFieldChange = (trainerId, field, value) => {
    setBookingForms((prev) => ({
      ...prev,
      [trainerId]: {
        ...prev[trainerId],
        [field]: value
      }
    }));
  };

  const handleBookSession = async (trainer) => {
    try {
      setBookingMessage("");
      setBookingError("");
      setBookingLoadingId(trainer.id);

      const form = bookingForms[trainer.id];

      if (!form?.sessionDate) {
        setBookingError("Please select a session date");
        return;
      }

      if (!form?.selectedSlot) {
        setBookingError("Please select an available slot");
        return;
      }

      const [day, start, end] = form.selectedSlot.split("|");

      await API.post("/bookings", {
        trainerId: trainer.id,
        sessionDate: form.sessionDate,
        day,
        start,
        end,
        notes: form.notes
      });

      setBookingMessage(`Session booked with ${trainer.name}`);
      setBookingForms((prev) => ({
        ...prev,
        [trainer.id]: {
          ...prev[trainer.id],
          sessionDate: "",
          notes: ""
        }
      }));
    } catch (err) {
      setBookingError(err.response?.data?.message || "Failed to create booking");
    } finally {
      setBookingLoadingId("");
    }
  };

  return (
    <>
      <Navbar />

      <div className="dashboard-page">
        <div
          className="dashboard-layout"
          style={{ gridTemplateColumns: "1.1fr 2fr", alignItems: "start" }}
        >
          <form className="auth-card" onSubmit={handleSearch}>
            <h2>Find Trainers</h2>
            <p className="subtitle">
              Search by name, specialization, rating, availability, and budget
            </p>

            <input
              type="text"
              name="search"
              placeholder="Search by name or keyword"
              value={filters.search}
              onChange={handleChange}
            />

            <input
              type="text"
              name="specialization"
              placeholder="e.g. Weight Loss, Yoga, Strength"
              value={filters.specialization}
              onChange={handleChange}
            />

            <input
              type="number"
              name="minRating"
              placeholder="Minimum rating"
              min="0"
              max="5"
              step="0.1"
              value={filters.minRating}
              onChange={handleChange}
            />

            <input
              type="number"
              name="maxPrice"
              placeholder="Maximum price per session"
              min="0"
              value={filters.maxPrice}
              onChange={handleChange}
            />

            <select name="day" value={filters.day} onChange={handleChange}>
              <option value="">Any day</option>
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
              <option value="Saturday">Saturday</option>
              <option value="Sunday">Sunday</option>
            </select>

            <button type="submit">Search Trainers</button>

            <button
              type="button"
              onClick={clearFilters}
              style={{ marginTop: "10px", background: "#555" }}
            >
              Clear Filters
            </button>
          </form>

          <div className="dashboard-card">
            <h2>Available Trainers</h2>

            {bookingMessage && <p className="success-text">{bookingMessage}</p>}
            {bookingError && <p className="error-text">{bookingError}</p>}
            {loading && <p>Loading trainers...</p>}
            {error && <p className="error-text">{error}</p>}

            {!loading && !error && trainers.length === 0 && (
              <p>No trainers matched your filters.</p>
            )}

            {!loading && !error && trainers.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gap: "16px",
                  marginTop: "16px"
                }}
              >
                {trainers.map((trainer) => (
                  <div
                    key={trainer.id}
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
                        gap: "12px",
                        flexWrap: "wrap"
                      }}
                    >
                      <div>
                        <h3 style={{ marginBottom: "8px" }}>{trainer.name}</h3>
                        <p>
                          <strong>Specializations:</strong>{" "}
                          {trainer.specializations?.length
                            ? trainer.specializations.join(", ")
                            : "Not listed"}
                        </p>
                        <p>
                          <strong>Experience:</strong>{" "}
                          {trainer.experienceYears ?? "Not listed"} years
                        </p>
                        <p>
                          <strong>Price:</strong>{" "}
                          {trainer.hourlyRate != null
                            ? `$${trainer.hourlyRate}/session`
                            : "Not listed"}
                        </p>
                        <p>
                          <strong>Rating:</strong>{" "}
                          {trainer.rating?.toFixed?.(1) ?? trainer.rating} (
                          {trainer.reviewCount} reviews)
                        </p>
                      </div>

                      <div style={{ minWidth: "220px" }}>
                        <p>
                          <strong>Availability:</strong>
                        </p>
                        {trainer.availability?.length ? (
                          <ul style={{ paddingLeft: "18px", marginTop: "8px" }}>
                            {trainer.availability.map((slot, index) => (
                              <li key={`${trainer.id}-${index}`}>
                                {slot.day}: {slot.start} - {slot.end}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p>Not listed</p>
                        )}
                      </div>
                    </div>

                    <div style={{ marginTop: "14px" }}>
                      <p>
                        <strong>Bio:</strong> {trainer.bio || "No bio added yet."}
                      </p>
                      <p>
                        <strong>Certifications:</strong>{" "}
                        {trainer.certifications?.length
                          ? trainer.certifications.join(", ")
                          : "Not listed"}
                      </p>
                    </div>

                    {user?.role === "trainee" && trainer.availability?.length > 0 && (
                      <div
                        style={{
                          marginTop: "18px",
                          paddingTop: "16px",
                          borderTop: "1px solid rgba(255,255,255,0.08)"
                        }}
                      >
                        <h4 style={{ marginBottom: "12px" }}>Book a Session</h4>

                        <input
                          type="date"
                          value={bookingForms[trainer.id]?.sessionDate || ""}
                          onChange={(e) =>
                            handleBookingFieldChange(
                              trainer.id,
                              "sessionDate",
                              e.target.value
                            )
                          }
                        />

                        <select
                          value={bookingForms[trainer.id]?.selectedSlot || ""}
                          onChange={(e) =>
                            handleBookingFieldChange(
                              trainer.id,
                              "selectedSlot",
                              e.target.value
                            )
                          }
                          style={{ marginTop: "10px" }}
                        >
                          {trainer.availability.map((slot, index) => (
                            <option
                              key={`${trainer.id}-slot-${index}`}
                              value={`${slot.day}|${slot.start}|${slot.end}`}
                            >
                              {slot.day} | {slot.start} - {slot.end}
                            </option>
                          ))}
                        </select>

                        <textarea
                          rows={3}
                          placeholder="Add notes for the trainer"
                          value={bookingForms[trainer.id]?.notes || ""}
                          onChange={(e) =>
                            handleBookingFieldChange(
                              trainer.id,
                              "notes",
                              e.target.value
                            )
                          }
                          style={{ marginTop: "10px" }}
                        />

                        <button
                          onClick={() => handleBookSession(trainer)}
                          disabled={bookingLoadingId === trainer.id}
                          style={{ marginTop: "10px" }}
                        >
                          {bookingLoadingId === trainer.id
                            ? "Booking..."
                            : "Book Session"}
                        </button>
                      </div>
                    )}
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

export default Trainers;