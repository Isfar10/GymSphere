import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

const Profile = () => {
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
    availabilityText: ""
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const availabilityText =
      user.availability?.map((slot) => `${slot.day}|${slot.start}|${slot.end}`).join("\n") ||
      "";

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
      availabilityText
    });
  }, [user]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
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
    if (!formData.name.trim()) return "Name is required";
    if (formData.age && Number(formData.age) < 1) return "Age must be valid";
    if (formData.height && Number(formData.height) < 1) return "Height must be valid";
    if (formData.weight && Number(formData.weight) < 1) return "Weight must be valid";

    if (user?.role === "trainer") {
      if (!formData.bio.trim()) return "Trainer bio is required";
      if (!formData.specializations.trim()) return "Add at least one specialization";
      if (formData.experienceYears && Number(formData.experienceYears) < 0) {
        return "Experience must be valid";
      }
      if (formData.hourlyRate && Number(formData.hourlyRate) < 0) {
        return "Hourly rate must be valid";
      }
    }

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
        weight: formData.weight ? Number(formData.weight) : null
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
      setMessage("Profile updated successfully");
    } catch (err) {
      setError(err.response?.data?.message || "Profile update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <div className="dashboard-page">
        <div className="profile-layout">
          <form className="auth-card" onSubmit={handleSubmit}>
            <h2>Update Profile</h2>
            <p className="subtitle">Keep your GymSphere profile up to date</p>

            {message && <p className="success-text">{message}</p>}
            {error && <p className="error-text">{error}</p>}

            <input
              type="text"
              name="name"
              placeholder="Enter your name"
              value={formData.name}
              onChange={handleChange}
            />

            <input
              type="text"
              name="fitnessGoal"
              placeholder="Enter your fitness goal"
              value={formData.fitnessGoal}
              onChange={handleChange}
            />

            <input
              type="number"
              name="age"
              placeholder="Enter your age"
              value={formData.age}
              onChange={handleChange}
            />

            <input
              type="number"
              name="height"
              placeholder="Enter your height (cm)"
              value={formData.height}
              onChange={handleChange}
            />

            <input
              type="number"
              name="weight"
              placeholder="Enter your weight (kg)"
              value={formData.weight}
              onChange={handleChange}
            />

            {user?.role === "trainer" && (
              <>
                <textarea
                  name="bio"
                  placeholder="Write a short trainer bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={4}
                />

                <input
                  type="text"
                  name="specializations"
                  placeholder="Specializations (comma separated)"
                  value={formData.specializations}
                  onChange={handleChange}
                />

                <input
                  type="text"
                  name="certifications"
                  placeholder="Certifications (comma separated)"
                  value={formData.certifications}
                  onChange={handleChange}
                />

                <input
                  type="number"
                  name="experienceYears"
                  placeholder="Years of experience"
                  value={formData.experienceYears}
                  onChange={handleChange}
                />

                <input
                  type="number"
                  name="hourlyRate"
                  placeholder="Price per session"
                  value={formData.hourlyRate}
                  onChange={handleChange}
                />

                <textarea
                  name="availabilityText"
                  placeholder={`Availability format:
Monday|06:00|08:00
Wednesday|18:00|20:00`}
                  value={formData.availabilityText}
                  onChange={handleChange}
                  rows={5}
                />
              </>
            )}

            <button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Profile"}
            </button>
          </form>

          <div className="dashboard-card side-card">
            <h2>Current Profile</h2>

            <div className="profile-preview">
              <p><strong>Name:</strong> {user?.name || "Not set"}</p>
              <p><strong>Email:</strong> {user?.email || "Not set"}</p>
              <p><strong>Role:</strong> {user?.role || "Not set"}</p>
              <p><strong>Goal:</strong> {user?.fitnessGoal || "Not set"}</p>
              <p><strong>Age:</strong> {user?.age || "Not set"}</p>
              <p><strong>Height:</strong> {user?.height ? `${user.height} cm` : "Not set"}</p>
              <p><strong>Weight:</strong> {user?.weight ? `${user.weight} kg` : "Not set"}</p>

              {user?.role === "trainer" && (
                <>
                  <hr style={{ margin: "16px 0", opacity: 0.2 }} />
                  <p><strong>Bio:</strong> {user?.bio || "Not set"}</p>
                  <p>
                    <strong>Specializations:</strong>{" "}
                    {user?.specializations?.length
                      ? user.specializations.join(", ")
                      : "Not set"}
                  </p>
                  <p>
                    <strong>Certifications:</strong>{" "}
                    {user?.certifications?.length
                      ? user.certifications.join(", ")
                      : "Not set"}
                  </p>
                  <p>
                    <strong>Experience:</strong>{" "}
                    {user?.experienceYears ?? "Not set"} years
                  </p>
                  <p>
                    <strong>Hourly Rate:</strong>{" "}
                    {user?.hourlyRate != null ? `$${user.hourlyRate}` : "Not set"}
                  </p>
                  <p>
                    <strong>Profile Complete:</strong>{" "}
                    {user?.isProfileComplete ? "Yes" : "No"}
                  </p>

                  <div style={{ marginTop: "12px" }}>
                    <strong>Availability:</strong>
                    {user?.availability?.length ? (
                      <ul style={{ paddingLeft: "18px", marginTop: "8px" }}>
                        {user.availability.map((slot, index) => (
                          <li key={index}>
                            {slot.day}: {slot.start} - {slot.end}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>Not set</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;