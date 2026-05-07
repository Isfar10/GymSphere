import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import PageShell from "../components/PageShell";
import StatCard from "../components/StatCard";
import { useAuth } from "../context/AuthContext";

function Profile() {
  const { user, updateProfile } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    fitnessGoal: "",
    age: "",
    height: "",
    weight: "",
    bio: "",
    specializations: "",
    certifications: "",
    experienceYears: "",
    hourlyRate: "",
    availabilityText: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const availabilityText =
      user.availability
        ?.map((slot) => `${slot.day}|${slot.start}|${slot.end}`)
        .join("\n") || "";

    setFormData({
      name: user.name || "",
      fitnessGoal: user.fitnessGoal || "",
      age: user.age || "",
      height: user.height || "",
      weight: user.weight || "",
      bio: user.bio || "",
      specializations: user.specializations?.join(", ") || "",
      certifications: user.certifications?.join(", ") || "",
      experienceYears: user.experienceYears || "",
      hourlyRate: user.hourlyRate || "",
      availabilityText,
    });
  }, [user]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const parseCommaList = (value) =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  const parseAvailability = (value) =>
    value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [day, start, end] = line.split("|").map((item) => item.trim());
        return { day, start, end };
      })
      .filter((slot) => slot.day && slot.start && slot.end);

  const validateForm = () => {
    if (!formData.name.trim()) return "Name is required.";

    if (formData.age && Number(formData.age) < 1) {
      return "Age must be valid.";
    }

    if (formData.height && Number(formData.height) < 1) {
      return "Height must be valid.";
    }

    if (formData.weight && Number(formData.weight) < 1) {
      return "Weight must be valid.";
    }

    if (user?.role === "trainer") {
      if (!formData.bio.trim()) return "Trainer bio is required.";
      if (!formData.specializations.trim()) {
        return "Add at least one specialization.";
      }

      if (formData.experienceYears && Number(formData.experienceYears) < 0) {
        return "Experience must be valid.";
      }

      if (formData.hourlyRate && Number(formData.hourlyRate) < 0) {
        return "Hourly rate must be valid.";
      }
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name: formData.name,
        fitnessGoal: formData.fitnessGoal,
        age: formData.age ? Number(formData.age) : null,
        height: formData.height ? Number(formData.height) : null,
        weight: formData.weight ? Number(formData.weight) : null,
      };

      if (user?.role === "trainer") {
        payload.bio = formData.bio;
        payload.specializations = parseCommaList(formData.specializations);
        payload.certifications = parseCommaList(formData.certifications);
        payload.experienceYears = formData.experienceYears
          ? Number(formData.experienceYears)
          : null;
        payload.hourlyRate = formData.hourlyRate
          ? Number(formData.hourlyRate)
          : null;
        payload.availability = parseAvailability(formData.availabilityText);
      }

      await updateProfile(payload);
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Profile update failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <PageShell
        eyebrow="Account"
        title="Your GymSphere profile"
        subtitle="Keep your personal fitness details and trainer profile information up to date."
        heroIcon="👤"
        actions={
          <>
            <button type="submit" form="profile-form" className="gs-button">
              {loading ? "Saving..." : "Save Profile"}
            </button>
            <a href="/dashboard" className="gs-button-outline">
              Back to Dashboard
            </a>
          </>
        }
      >
        <section className="gs-grid gs-grid-4">
          <StatCard
            icon="👤"
            label="Role"
            value={user?.role || "User"}
            helper="Current account type"
          />

          <StatCard
            icon="🎯"
            label="Goal"
            value={user?.fitnessGoal || "Not set"}
            helper="Personal fitness target"
          />

          <StatCard
            icon="📏"
            label="Height"
            value={user?.height ? `${user.height} cm` : "Not set"}
            helper="Used for fitness insights"
          />

          <StatCard
            icon="⚖️"
            label="Weight"
            value={user?.weight ? `${user.weight} kg` : "Not set"}
            helper="Used for progress tracking"
          />
        </section>

        {message && (
          <div className="gs-alert-success" style={styles.alert}>
            {message}
          </div>
        )}

        {error && (
          <div className="gs-alert-error" style={styles.alert}>
            {error}
          </div>
        )}

        <section style={styles.layout}>
          <form id="profile-form" onSubmit={handleSubmit} style={styles.formCard}>
            <div style={styles.cardHeader}>
              <div>
                <p style={styles.kicker}>Edit</p>
                <h2 style={styles.sectionTitle}>Profile Information</h2>
              </div>
            </div>

            <div style={styles.formGrid}>
              <label className="gs-label">
                Name
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  className="gs-input"
                />
              </label>

              <label className="gs-label">
                Fitness Goal
                <input
                  name="fitnessGoal"
                  value={formData.fitnessGoal}
                  onChange={handleChange}
                  placeholder="Build muscle, lose weight..."
                  className="gs-input"
                />
              </label>

              <label className="gs-label">
                Age
                <input
                  name="age"
                  type="number"
                  value={formData.age}
                  onChange={handleChange}
                  placeholder="22"
                  className="gs-input"
                />
              </label>

              <label className="gs-label">
                Height cm
                <input
                  name="height"
                  type="number"
                  value={formData.height}
                  onChange={handleChange}
                  placeholder="170"
                  className="gs-input"
                />
              </label>

              <label className="gs-label">
                Weight kg
                <input
                  name="weight"
                  type="number"
                  value={formData.weight}
                  onChange={handleChange}
                  placeholder="70"
                  className="gs-input"
                />
              </label>
            </div>

            {user?.role === "trainer" && (
              <div style={styles.trainerSection}>
                <div>
                  <p style={styles.kicker}>Trainer Profile</p>
                  <h3 style={styles.subTitle}>Professional Details</h3>
                </div>

                <label className="gs-label">
                  Bio
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Tell trainees about your coaching style..."
                    rows="4"
                    className="gs-input"
                  />
                </label>

                <div style={styles.formGrid}>
                  <label className="gs-label">
                    Specializations
                    <input
                      name="specializations"
                      value={formData.specializations}
                      onChange={handleChange}
                      placeholder="Strength, cardio, yoga"
                      className="gs-input"
                    />
                  </label>

                  <label className="gs-label">
                    Certifications
                    <input
                      name="certifications"
                      value={formData.certifications}
                      onChange={handleChange}
                      placeholder="NASM, ACE, ISSA"
                      className="gs-input"
                    />
                  </label>

                  <label className="gs-label">
                    Experience Years
                    <input
                      name="experienceYears"
                      type="number"
                      value={formData.experienceYears}
                      onChange={handleChange}
                      placeholder="3"
                      className="gs-input"
                    />
                  </label>

                  <label className="gs-label">
                    Price Per Session
                    <input
                      name="hourlyRate"
                      type="number"
                      value={formData.hourlyRate}
                      onChange={handleChange}
                      placeholder="1000"
                      className="gs-input"
                    />
                  </label>
                </div>

                <label className="gs-label">
                  Availability
                  <textarea
                    name="availabilityText"
                    value={formData.availabilityText}
                    onChange={handleChange}
                    rows="5"
                    placeholder={`Monday|06:00|08:00\nWednesday|18:00|20:00`}
                    className="gs-input"
                  />
                </label>
              </div>
            )}

            <button type="submit" disabled={loading} className="gs-button">
              {loading ? "Saving..." : "Save Profile"}
            </button>
          </form>

          <aside style={styles.previewCard}>
            <div style={styles.avatarBlock}>
              <div style={styles.avatar}>{user?.name?.[0]?.toUpperCase() || "U"}</div>
              <h2 style={styles.previewName}>{user?.name || "Not set"}</h2>
              <p style={styles.muted}>{user?.email || "Not set"}</p>
              <span className="gs-pill">{user?.role || "user"}</span>
            </div>

            <div style={styles.previewList}>
              <PreviewRow label="Goal" value={user?.fitnessGoal || "Not set"} />
              <PreviewRow label="Age" value={user?.age || "Not set"} />
              <PreviewRow
                label="Height"
                value={user?.height ? `${user.height} cm` : "Not set"}
              />
              <PreviewRow
                label="Weight"
                value={user?.weight ? `${user.weight} kg` : "Not set"}
              />

              {user?.role === "trainer" && (
                <>
                  <PreviewRow label="Bio" value={user?.bio || "Not set"} />
                  <PreviewRow
                    label="Specializations"
                    value={
                      user?.specializations?.length
                        ? user.specializations.join(", ")
                        : "Not set"
                    }
                  />
                  <PreviewRow
                    label="Certifications"
                    value={
                      user?.certifications?.length
                        ? user.certifications.join(", ")
                        : "Not set"
                    }
                  />
                  <PreviewRow
                    label="Experience"
                    value={`${user?.experienceYears ?? "Not set"} years`}
                  />
                  <PreviewRow
                    label="Hourly Rate"
                    value={
                      user?.hourlyRate != null
                        ? `৳${user.hourlyRate}`
                        : "Not set"
                    }
                  />
                  <PreviewRow
                    label="Profile Complete"
                    value={user?.isProfileComplete ? "Yes" : "No"}
                  />
                </>
              )}
            </div>

            {user?.role === "trainer" && (
              <div style={styles.availabilityPreview}>
                <h3 style={styles.subTitle}>Availability</h3>

                {user?.availability?.length ? (
                  <div style={styles.slotWrap}>
                    {user.availability.map((slot, index) => (
                      <span key={`${slot.day}-${index}`} style={styles.slot}>
                        {slot.day}: {slot.start} - {slot.end}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={styles.muted}>Not set</p>
                )}
              </div>
            )}
          </aside>
        </section>
      </PageShell>
    </>
  );
}

function PreviewRow({ label, value }) {
  return (
    <div style={styles.previewRow}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

const styles = {
  alert: {
    marginTop: 16,
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.3fr) minmax(320px, 0.7fr)",
    gap: 20,
    marginTop: 24,
    alignItems: "start",
  },
  formCard: {
    border: "1px solid #e2e8f0",
    borderRadius: 30,
    padding: 22,
    background: "rgba(255,255,255,0.92)",
    boxShadow: "0 24px 70px rgba(15,23,42,0.08)",
    display: "grid",
    gap: 16,
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 14,
    alignItems: "flex-start",
  },
  kicker: {
    margin: "0 0 6px",
    color: "#16a34a",
    fontWeight: 950,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    fontSize: 13,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 28,
    letterSpacing: "-0.045em",
  },
  subTitle: {
    margin: "0 0 12px",
    fontSize: 22,
    letterSpacing: "-0.035em",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: 14,
  },
  trainerSection: {
    display: "grid",
    gap: 14,
    borderTop: "1px solid #e2e8f0",
    paddingTop: 18,
  },
  previewCard: {
    border: "1px solid #e2e8f0",
    borderRadius: 30,
    padding: 22,
    background: "rgba(255,255,255,0.92)",
    boxShadow: "0 24px 70px rgba(15,23,42,0.08)",
  },
  avatarBlock: {
    display: "grid",
    justifyItems: "center",
    textAlign: "center",
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: 18,
    marginBottom: 18,
  },
  avatar: {
    width: 82,
    height: 82,
    borderRadius: 28,
    display: "grid",
    placeItems: "center",
    background: "linear-gradient(135deg, #16a34a, #22c55e)",
    color: "#ffffff",
    fontWeight: 950,
    fontSize: 34,
    boxShadow: "0 18px 36px rgba(22,163,74,0.25)",
    marginBottom: 12,
  },
  previewName: {
    margin: 0,
    fontSize: 28,
    letterSpacing: "-0.05em",
  },
  muted: {
    margin: "6px 0 12px",
    color: "#64748b",
    lineHeight: 1.6,
  },
  previewList: {
    display: "grid",
    gap: 10,
  },
  previewRow: {
    border: "1px solid #e2e8f0",
    borderRadius: 18,
    padding: 13,
    background: "#f8fafc",
    display: "grid",
    gap: 5,
  },
  availabilityPreview: {
    marginTop: 18,
    borderTop: "1px solid #e2e8f0",
    paddingTop: 18,
  },
  slotWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  slot: {
    borderRadius: 999,
    padding: "7px 11px",
    background: "#dcfce7",
    color: "#166534",
    fontWeight: 850,
    fontSize: 13,
  },
};

export default Profile;