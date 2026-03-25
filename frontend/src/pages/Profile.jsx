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
    weight: ""
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        fitnessGoal: user.fitnessGoal || "",
        age: user.age || "",
        height: user.height || "",
        weight: user.weight || ""
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      return "Name is required";
    }

    if (formData.age && Number(formData.age) < 1) {
      return "Age must be valid";
    }

    if (formData.height && Number(formData.height) < 1) {
      return "Height must be valid";
    }

    if (formData.weight && Number(formData.weight) < 1) {
      return "Weight must be valid";
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

      await updateProfile({
        ...formData,
        age: formData.age ? Number(formData.age) : null,
        height: formData.height ? Number(formData.height) : null,
        weight: formData.weight ? Number(formData.weight) : null
      });

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
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;