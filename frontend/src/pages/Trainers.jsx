import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";

const defaultFilters = {
  search: "",
  specialization: "",
  minRating: "",
  maxPrice: "",
  day: "",
};

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

  const [reviewsByTrainer, setReviewsByTrainer] = useState({});
  const [reviewForms, setReviewForms] = useState({});
  const [reviewLoadingTrainerId, setReviewLoadingTrainerId] = useState("");
  const [reviewSubmittingTrainerId, setReviewSubmittingTrainerId] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewError, setReviewError] = useState("");

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

      const initialBookingForms = {};
      const initialReviewForms = {};

      trainerList.forEach((trainer) => {
        initialBookingForms[trainer.id] = {
          sessionDate: "",
          selectedSlot:
            trainer.availability?.length > 0
              ? `${trainer.availability[0].day}|${trainer.availability[0].start}|${trainer.availability[0].end}`
              : "",
          notes: "",
        };

        initialReviewForms[trainer.id] = {
          rating: 5,
          comment: "",
        };
      });

      setBookingForms(initialBookingForms);
      setReviewForms(initialReviewForms);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load trainers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainers();
  }, []);

  const handleFilterChange = (e) => {
    setFilters((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
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
        [field]: value,
      },
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
        notes: form.notes,
      });

      setBookingMessage(`Session booked with ${trainer.name}`);
      setBookingForms((prev) => ({
        ...prev,
        [trainer.id]: {
          ...prev[trainer.id],
          sessionDate: "",
          notes: "",
        },
      }));
    } catch (err) {
      setBookingError(err.response?.data?.message || "Failed to create booking");
    } finally {
      setBookingLoadingId("");
    }
  };

  const fetchReviews = async (trainerId) => {
    try {
      setReviewError("");
      setReviewLoadingTrainerId(trainerId);

      const response = await API.get(`/reviews/trainer/${trainerId}`);

      setReviewsByTrainer((prev) => ({
        ...prev,
        [trainerId]: response.data.reviews || [],
      }));
    } catch (err) {
      setReviewError(err.response?.data?.message || "Failed to load reviews");
    } finally {
      setReviewLoadingTrainerId("");
    }
  };

  const handleReviewFieldChange = (trainerId, field, value) => {
    setReviewForms((prev) => ({
      ...prev,
      [trainerId]: {
        ...prev[trainerId],
        [field]: value,
      },
    }));
  };

  const handleSubmitReview = async (trainer) => {
    try {
      setReviewMessage("");
      setReviewError("");
      setReviewSubmittingTrainerId(trainer.id);

      const form = reviewForms[trainer.id];

      await API.post(`/reviews/trainer/${trainer.id}`, {
        rating: Number(form.rating),
        comment: form.comment,
      });

      setReviewMessage(`Review submitted for ${trainer.name}`);

      setReviewForms((prev) => ({
        ...prev,
        [trainer.id]: {
          rating: 5,
          comment: "",
        },
      }));

      await fetchReviews(trainer.id);
      await fetchTrainers(filters);
    } catch (err) {
      setReviewError(err.response?.data?.message || "Failed to submit review");
    } finally {
      setReviewSubmittingTrainerId("");
    }
  };

  const handleDeleteReview = async (trainerId, reviewId) => {
    try {
      setReviewMessage("");
      setReviewError("");

      await API.delete(`/reviews/${reviewId}`);

      setReviewMessage("Review deleted successfully");
      await fetchReviews(trainerId);
      await fetchTrainers(filters);
    } catch (err) {
      setReviewError(err.response?.data?.message || "Failed to delete review");
    }
  };

  return (
    <>
      <Navbar />

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px" }}>
        <h1>Find Trainers</h1>
        <p>Search by name, specialization, rating, availability, and budget</p>

        <form
          onSubmit={handleSearch}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "12px",
            marginBottom: "24px",
          }}
        >
          <input
            type="text"
            name="search"
            placeholder="Search trainer"
            value={filters.search}
            onChange={handleFilterChange}
          />

          <input
            type="text"
            name="specialization"
            placeholder="Specialization"
            value={filters.specialization}
            onChange={handleFilterChange}
          />

          <input
            type="number"
            name="minRating"
            placeholder="Minimum rating"
            value={filters.minRating}
            onChange={handleFilterChange}
            min="1"
            max="5"
          />

          <input
            type="number"
            name="maxPrice"
            placeholder="Maximum price"
            value={filters.maxPrice}
            onChange={handleFilterChange}
            min="0"
          />

          <select name="day" value={filters.day} onChange={handleFilterChange}>
            {days.map((day) => (
              <option key={day || "any"} value={day}>
                {day || "Any day"}
              </option>
            ))}
          </select>

          <button type="submit">Search Trainers</button>
          <button type="button" onClick={clearFilters}>
            Clear Filters
          </button>
        </form>

        <h2>Available Trainers</h2>

        {bookingMessage && (
          <p style={{ color: "green", fontWeight: "bold" }}>{bookingMessage}</p>
        )}
        {bookingError && (
          <p style={{ color: "crimson", fontWeight: "bold" }}>{bookingError}</p>
        )}
        {reviewMessage && (
          <p style={{ color: "green", fontWeight: "bold" }}>{reviewMessage}</p>
        )}
        {reviewError && (
          <p style={{ color: "crimson", fontWeight: "bold" }}>{reviewError}</p>
        )}
        {loading && <p>Loading trainers...</p>}
        {error && <p style={{ color: "crimson" }}>{error}</p>}

        {!loading && !error && trainers.length === 0 && (
          <p>No trainers matched your filters.</p>
        )}

        {!loading &&
          !error &&
          trainers.length > 0 &&
          trainers.map((trainer) => {
            const trainerReviews = reviewsByTrainer[trainer.id] || [];
            const myReview = trainerReviews.find(
              (review) => review.trainee?.id === user?.id
            );

            return (
              <div
                key={trainer.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "12px",
                  padding: "20px",
                  marginBottom: "20px",
                  background: "#fff",
                }}
              >
                <h3>{trainer.name}</h3>
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
                <p>
                  <strong>Bio:</strong> {trainer.bio || "No bio added yet."}
                </p>
                <p>
                  <strong>Certifications:</strong>{" "}
                  {trainer.certifications?.length
                    ? trainer.certifications.join(", ")
                    : "Not listed"}
                </p>

                <div>
                  <strong>Availability:</strong>
                  {trainer.availability?.length ? (
                    <ul>
                      {trainer.availability.map((slot, index) => (
                        <li key={index}>
                          {slot.day}: {slot.start} - {slot.end}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>Not listed</p>
                  )}
                </div>

                {user?.role === "trainee" && trainer.availability?.length > 0 && (
                  <div
                    style={{
                      marginTop: "18px",
                      padding: "16px",
                      border: "1px solid #eee",
                      borderRadius: "10px",
                      background: "#fafafa",
                    }}
                  >
                    <h4>Book a Session</h4>

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

                    <div style={{ marginTop: "10px" }}>
                      <select
                        value={bookingForms[trainer.id]?.selectedSlot || ""}
                        onChange={(e) =>
                          handleBookingFieldChange(
                            trainer.id,
                            "selectedSlot",
                            e.target.value
                          )
                        }
                      >
                        {trainer.availability.map((slot, index) => (
                          <option
                            key={`${trainer.id}-${index}`}
                            value={`${slot.day}|${slot.start}|${slot.end}`}
                          >
                            {slot.day} | {slot.start} - {slot.end}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ marginTop: "10px" }}>
                      <textarea
                        rows="3"
                        placeholder="Add notes for the trainer"
                        value={bookingForms[trainer.id]?.notes || ""}
                        onChange={(e) =>
                          handleBookingFieldChange(
                            trainer.id,
                            "notes",
                            e.target.value
                          )
                        }
                        style={{ width: "100%" }}
                      />
                    </div>

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

                <div
                  style={{
                    marginTop: "18px",
                    padding: "16px",
                    border: "1px solid #eee",
                    borderRadius: "10px",
                    background: "#fcfcfc",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignItems: "center",
                      marginBottom: "12px",
                      flexWrap: "wrap",
                    }}
                  >
                    <h4 style={{ margin: 0 }}>Reviews</h4>
                    <button onClick={() => fetchReviews(trainer.id)}>
                      {reviewLoadingTrainerId === trainer.id
                        ? "Loading..."
                        : "Load Reviews"}
                    </button>
                  </div>

                  {trainerReviews.length > 0 ? (
                    <div>
                      {trainerReviews.map((review) => (
                        <div
                          key={review.id}
                          style={{
                            borderTop: "1px solid #eee",
                            paddingTop: "12px",
                            marginTop: "12px",
                          }}
                        >
                          <p>
                            <strong>{review.trainee?.name}</strong> - {review.rating}/5
                          </p>
                          <p>{review.comment || "No comment"}</p>
                          <small>
                            {new Date(review.createdAt).toLocaleString()}
                          </small>

                          {user?.id === review.trainee?.id && (
                            <div style={{ marginTop: "8px" }}>
                              <button
                                onClick={() =>
                                  handleDeleteReview(trainer.id, review.id)
                                }
                                style={{ background: "#9a3f3f", color: "#fff" }}
                              >
                                Delete My Review
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>No reviews loaded yet.</p>
                  )}

                  {user?.role === "trainee" && !myReview && (
                    <div style={{ marginTop: "18px" }}>
                      <h4>Leave a Review</h4>

                      <select
                        value={reviewForms[trainer.id]?.rating || 5}
                        onChange={(e) =>
                          handleReviewFieldChange(
                            trainer.id,
                            "rating",
                            e.target.value
                          )
                        }
                      >
                        <option value={5}>5 - Excellent</option>
                        <option value={4}>4 - Very Good</option>
                        <option value={3}>3 - Good</option>
                        <option value={2}>2 - Fair</option>
                        <option value={1}>1 - Poor</option>
                      </select>

                      <textarea
                        rows="3"
                        placeholder="Write your feedback"
                        value={reviewForms[trainer.id]?.comment || ""}
                        onChange={(e) =>
                          handleReviewFieldChange(
                            trainer.id,
                            "comment",
                            e.target.value
                          )
                        }
                        style={{ width: "100%", marginTop: "10px" }}
                      />

                      <button
                        onClick={() => handleSubmitReview(trainer)}
                        disabled={reviewSubmittingTrainerId === trainer.id}
                        style={{ marginTop: "10px" }}
                      >
                        {reviewSubmittingTrainerId === trainer.id
                          ? "Submitting..."
                          : "Submit Review"}
                      </button>
                    </div>
                  )}

                  {user?.role === "trainee" && myReview && (
                    <p style={{ marginTop: "12px", color: "#555" }}>
                      You have already reviewed this trainer.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </>
  );
};

export default Trainers;