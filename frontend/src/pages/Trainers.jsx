import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import PageShell from "../components/PageShell";
import StatCard from "../components/StatCard";
import EmptyState from "../components/EmptyState";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";

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

function Trainers() {
  const { user } = useAuth();

  const [filters, setFilters] = useState(defaultFilters);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

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

  const averageRating = useMemo(() => {
    if (trainers.length === 0) return "0.0";

    const validRatings = trainers
      .map((trainer) => Number(trainer.rating || 0))
      .filter((rating) => rating > 0);

    if (validRatings.length === 0) return "0.0";

    const average =
      validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length;

    return average.toFixed(1);
  }, [trainers]);

  const fetchTrainers = async (activeFilters = filters) => {
    try {
      setLoading(true);
      setPageError("");

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
      setPageError(err.response?.data?.message || "Failed to load trainers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainers();
  }, []);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSearch = (event) => {
    event.preventDefault();
    fetchTrainers(filters);
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
    fetchTrainers(defaultFilters);
  };

  const handleBookingFieldChange = (trainerId, field, value) => {
    setBookingForms((previous) => ({
      ...previous,
      [trainerId]: {
        ...previous[trainerId],
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
        setBookingError("Please select a session date.");
        return;
      }

      if (!form?.selectedSlot) {
        setBookingError("Please select an available slot.");
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

      setBookingMessage(`Session booked with ${trainer.name}.`);

      setBookingForms((previous) => ({
        ...previous,
        [trainer.id]: {
          ...previous[trainer.id],
          sessionDate: "",
          notes: "",
        },
      }));
    } catch (err) {
      setBookingError(err.response?.data?.message || "Failed to create booking.");
    } finally {
      setBookingLoadingId("");
    }
  };

  const fetchReviews = async (trainerId) => {
    try {
      setReviewError("");
      setReviewLoadingTrainerId(trainerId);

      const response = await API.get(`/reviews/trainer/${trainerId}`);

      setReviewsByTrainer((previous) => ({
        ...previous,
        [trainerId]: response.data.reviews || [],
      }));
    } catch (err) {
      setReviewError(err.response?.data?.message || "Failed to load reviews.");
    } finally {
      setReviewLoadingTrainerId("");
    }
  };

  const handleReviewFieldChange = (trainerId, field, value) => {
    setReviewForms((previous) => ({
      ...previous,
      [trainerId]: {
        ...previous[trainerId],
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

      setReviewMessage(`Review submitted for ${trainer.name}.`);

      setReviewForms((previous) => ({
        ...previous,
        [trainer.id]: {
          rating: 5,
          comment: "",
        },
      }));

      await fetchReviews(trainer.id);
      await fetchTrainers(filters);
    } catch (err) {
      setReviewError(err.response?.data?.message || "Failed to submit review.");
    } finally {
      setReviewSubmittingTrainerId("");
    }
  };

  const handleDeleteReview = async (trainerId, reviewId) => {
    try {
      setReviewMessage("");
      setReviewError("");

      await API.delete(`/reviews/${reviewId}`);

      setReviewMessage("Review deleted successfully.");
      await fetchReviews(trainerId);
      await fetchTrainers(filters);
    } catch (err) {
      setReviewError(err.response?.data?.message || "Failed to delete review.");
    }
  };

  return (
    <>
      <Navbar />

      <PageShell
        eyebrow="Trainer Marketplace"
        title="Find your ideal trainer"
        subtitle="Search trainers by specialization, rating, availability, and budget. Book sessions and leave reviews from one polished interface."
        heroIcon="🧑‍🏫"
        actions={
          <>
            <a href="#trainer-results" className="gs-button">
              Browse Trainers
            </a>
            <button type="button" onClick={clearFilters} className="gs-button-outline">
              Clear Filters
            </button>
          </>
        }
      >
        <section className="gs-grid gs-grid-3">
          <StatCard
            icon="🧑‍🏫"
            label="Available Trainers"
            value={trainers.length}
            helper="Matching your current filters"
          />

          <StatCard
            icon="⭐"
            label="Average Rating"
            value={averageRating}
            helper="Based on visible trainer ratings"
          />

          <StatCard
            icon="📅"
            label="Booking"
            value={user?.role === "trainee" ? "Enabled" : "View Only"}
            helper="Trainees can book sessions"
          />
        </section>

        <section className="gs-card" style={styles.filterCard}>
          <div className="gs-section-header">
            <div>
              <p style={styles.kicker}>Search</p>
              <h2 className="gs-section-title">Filter trainers</h2>
            </div>
          </div>

          <form onSubmit={handleSearch} style={styles.filterGrid}>
            <label className="gs-label">
              Search
              <input
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Name or keyword"
                className="gs-input"
              />
            </label>

            <label className="gs-label">
              Specialization
              <input
                name="specialization"
                value={filters.specialization}
                onChange={handleFilterChange}
                placeholder="Strength, yoga, cardio"
                className="gs-input"
              />
            </label>

            <label className="gs-label">
              Minimum Rating
              <input
                name="minRating"
                type="number"
                min="0"
                max="5"
                value={filters.minRating}
                onChange={handleFilterChange}
                placeholder="4"
                className="gs-input"
              />
            </label>

            <label className="gs-label">
              Max Price
              <input
                name="maxPrice"
                type="number"
                min="0"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                placeholder="1000"
                className="gs-input"
              />
            </label>

            <label className="gs-label">
              Day
              <select
                name="day"
                value={filters.day}
                onChange={handleFilterChange}
                className="gs-input"
              >
                {days.map((day) => (
                  <option key={day || "any"} value={day}>
                    {day || "Any day"}
                  </option>
                ))}
              </select>
            </label>

            <div style={styles.filterActions}>
              <button type="submit" className="gs-button">
                Search Trainers
              </button>
              <button type="button" onClick={clearFilters} className="gs-button-outline">
                Reset
              </button>
            </div>
          </form>
        </section>

        {(bookingMessage || reviewMessage) && (
          <div className="gs-alert-success" style={styles.alert}>
            {bookingMessage || reviewMessage}
          </div>
        )}

        {(bookingError || reviewError || pageError) && (
          <div className="gs-alert-error" style={styles.alert}>
            {bookingError || reviewError || pageError}
          </div>
        )}

        <section id="trainer-results" style={styles.resultsSection}>
          <div className="gs-section-header">
            <div>
              <p style={styles.kicker}>Results</p>
              <h2 className="gs-section-title">Available trainers</h2>
            </div>
          </div>

          {loading ? (
            <div className="gs-empty">Loading trainers...</div>
          ) : trainers.length === 0 ? (
            <EmptyState
              icon="🔍"
              title="No trainers found"
              message="Try changing your filters or clearing the search."
            />
          ) : (
            <div style={styles.trainerGrid}>
              {trainers.map((trainer) => {
                const trainerReviews = reviewsByTrainer[trainer.id] || [];
                const myReview = trainerReviews.find(
                  (review) => review.trainee?.id === user?.id
                );

                return (
                  <article key={trainer.id} style={styles.trainerCard}>
                    <div style={styles.trainerTop}>
                      <div>
                        <span className="gs-pill">Trainer</span>
                        <h3 style={styles.trainerName}>{trainer.name}</h3>
                        <p style={styles.muted}>
                          {trainer.bio || "No bio added yet."}
                        </p>
                      </div>

                      <div style={styles.ratingBox}>
                        <strong>
                          {trainer.rating?.toFixed?.(1) ?? trainer.rating ?? "0.0"}
                        </strong>
                        <span>⭐</span>
                        <small>{trainer.reviewCount || 0} reviews</small>
                      </div>
                    </div>

                    <div style={styles.detailGrid}>
                      <InfoBox
                        label="Specializations"
                        value={
                          trainer.specializations?.length
                            ? trainer.specializations.join(", ")
                            : "Not listed"
                        }
                      />
                      <InfoBox
                        label="Experience"
                        value={`${trainer.experienceYears ?? "Not listed"} years`}
                      />
                      <InfoBox
                        label="Price"
                        value={
                          trainer.hourlyRate != null
                            ? `৳${trainer.hourlyRate}/session`
                            : "Not listed"
                        }
                      />
                      <InfoBox
                        label="Certifications"
                        value={
                          trainer.certifications?.length
                            ? trainer.certifications.join(", ")
                            : "Not listed"
                        }
                      />
                    </div>

                    <div style={styles.availabilityBox}>
                      <h4 style={styles.smallTitle}>Availability</h4>
                      {trainer.availability?.length ? (
                        <div style={styles.slotWrap}>
                          {trainer.availability.map((slot, index) => (
                            <span key={`${slot.day}-${index}`} style={styles.slot}>
                              {slot.day}: {slot.start} - {slot.end}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p style={styles.muted}>Not listed</p>
                      )}
                    </div>

                    {user?.role === "trainee" && trainer.availability?.length > 0 && (
                      <div style={styles.bookingBox}>
                        <h4 style={styles.smallTitle}>Book a session</h4>

                        <div style={styles.bookingGrid}>
                          <input
                            type="date"
                            value={bookingForms[trainer.id]?.sessionDate || ""}
                            onChange={(event) =>
                              handleBookingFieldChange(
                                trainer.id,
                                "sessionDate",
                                event.target.value
                              )
                            }
                            className="gs-input"
                          />

                          <select
                            value={bookingForms[trainer.id]?.selectedSlot || ""}
                            onChange={(event) =>
                              handleBookingFieldChange(
                                trainer.id,
                                "selectedSlot",
                                event.target.value
                              )
                            }
                            className="gs-input"
                          >
                            {trainer.availability.map((slot, index) => (
                              <option
                                key={`${slot.day}-${slot.start}-${index}`}
                                value={`${slot.day}|${slot.start}|${slot.end}`}
                              >
                                {slot.day} | {slot.start} - {slot.end}
                              </option>
                            ))}
                          </select>
                        </div>

                        <textarea
                          rows="3"
                          placeholder="Optional notes"
                          value={bookingForms[trainer.id]?.notes || ""}
                          onChange={(event) =>
                            handleBookingFieldChange(
                              trainer.id,
                              "notes",
                              event.target.value
                            )
                          }
                          className="gs-input"
                          style={{ marginTop: 10 }}
                        />

                        <button
                          type="button"
                          onClick={() => handleBookSession(trainer)}
                          disabled={bookingLoadingId === trainer.id}
                          className="gs-button"
                          style={{ marginTop: 10 }}
                        >
                          {bookingLoadingId === trainer.id ? "Booking..." : "Book Session"}
                        </button>
                      </div>
                    )}

                    <div style={styles.reviewBox}>
                      <div style={styles.reviewHeader}>
                        <h4 style={styles.smallTitle}>Reviews</h4>
                        <button
                          type="button"
                          onClick={() => fetchReviews(trainer.id)}
                          className="gs-button-outline"
                        >
                          {reviewLoadingTrainerId === trainer.id ? "Loading..." : "Load Reviews"}
                        </button>
                      </div>

                      {trainerReviews.length === 0 ? (
                        <p style={styles.muted}>No reviews loaded yet.</p>
                      ) : (
                        <div style={styles.reviewList}>
                          {trainerReviews.map((review) => (
                            <div key={review.id} style={styles.reviewItem}>
                              <strong>
                                {review.trainee?.name || "Trainee"} • {review.rating}/5
                              </strong>
                              <p>{review.comment || "No comment"}</p>
                              <small>{new Date(review.createdAt).toLocaleString()}</small>

                              {user?.id === review.trainee?.id && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteReview(trainer.id, review.id)
                                  }
                                  className="gs-button-danger"
                                  style={{ marginTop: 8 }}
                                >
                                  Delete My Review
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {user?.role === "trainee" && !myReview && (
                        <div style={styles.leaveReviewBox}>
                          <h4 style={styles.smallTitle}>Leave a review</h4>

                          <select
                            value={reviewForms[trainer.id]?.rating || 5}
                            onChange={(event) =>
                              handleReviewFieldChange(
                                trainer.id,
                                "rating",
                                event.target.value
                              )
                            }
                            className="gs-input"
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
                            onChange={(event) =>
                              handleReviewFieldChange(
                                trainer.id,
                                "comment",
                                event.target.value
                              )
                            }
                            className="gs-input"
                            style={{ marginTop: 10 }}
                          />

                          <button
                            type="button"
                            onClick={() => handleSubmitReview(trainer)}
                            disabled={reviewSubmittingTrainerId === trainer.id}
                            className="gs-button"
                            style={{ marginTop: 10 }}
                          >
                            {reviewSubmittingTrainerId === trainer.id
                              ? "Submitting..."
                              : "Submit Review"}
                          </button>
                        </div>
                      )}

                      {user?.role === "trainee" && myReview && (
                        <p style={styles.muted}>You have already reviewed this trainer.</p>
                      )}
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

function InfoBox({ label, value }) {
  return (
    <div style={styles.infoBox}>
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  );
}

const styles = {
  filterCard: {
    marginTop: 18,
  },
  filterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 14,
    alignItems: "end",
  },
  filterActions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  alert: {
    marginTop: 16,
  },
  kicker: {
    margin: "0 0 6px",
    color: "#16a34a",
    fontWeight: 950,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    fontSize: 13,
  },
  resultsSection: {
    marginTop: 26,
  },
  trainerGrid: {
    display: "grid",
    gap: 18,
  },
  trainerCard: {
    border: "1px solid #e2e8f0",
    borderRadius: 30,
    padding: 22,
    background: "rgba(255,255,255,0.92)",
    boxShadow: "0 24px 70px rgba(15,23,42,0.08)",
  },
  trainerTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 18,
    alignItems: "flex-start",
  },
  trainerName: {
    margin: "10px 0 8px",
    fontSize: 30,
    letterSpacing: "-0.05em",
  },
  muted: {
    margin: 0,
    color: "#64748b",
    lineHeight: 1.6,
  },
  ratingBox: {
    minWidth: 120,
    borderRadius: 22,
    padding: 14,
    textAlign: "center",
    background: "#ecfdf5",
    color: "#166534",
    display: "grid",
    gap: 2,
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12,
    marginTop: 18,
  },
  infoBox: {
    border: "1px solid #e2e8f0",
    borderRadius: 18,
    padding: 14,
    background: "#f8fafc",
  },
  availabilityBox: {
    marginTop: 18,
  },
  smallTitle: {
    margin: "0 0 10px",
    fontSize: 18,
  },
  slotWrap: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  slot: {
    borderRadius: 999,
    padding: "7px 11px",
    background: "#dcfce7",
    color: "#166534",
    fontWeight: 850,
    fontSize: 13,
  },
  bookingBox: {
    marginTop: 18,
    border: "1px solid #bbf7d0",
    borderRadius: 22,
    padding: 16,
    background: "#f0fdf4",
  },
  bookingGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 10,
  },
  reviewBox: {
    marginTop: 18,
    borderTop: "1px solid #e2e8f0",
    paddingTop: 18,
  },
  reviewHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap",
  },
  reviewList: {
    display: "grid",
    gap: 10,
  },
  reviewItem: {
    border: "1px solid #e2e8f0",
    borderRadius: 18,
    padding: 14,
    background: "#ffffff",
  },
  leaveReviewBox: {
    marginTop: 14,
    border: "1px solid #e2e8f0",
    borderRadius: 18,
    padding: 14,
    background: "#f8fafc",
  },
};

export default Trainers;