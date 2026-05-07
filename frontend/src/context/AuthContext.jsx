import { createContext, useContext, useEffect, useState } from "react";
import API from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");

    if (!savedUser) return null;

    try {
      return JSON.parse(savedUser);
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  const saveAuth = (token, userData) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const fetchMe = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        localStorage.removeItem("user");
        setUser(null);
        setLoading(false);
        return null;
      }

      const response = await API.get("/auth/me");
      const userData = response.data.user;

      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);

      return userData;
    } catch (error) {
      console.error("Fetch user failed:", error.response?.data || error.message);

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);

      return null;
    } finally {
      setLoading(false);
    }
  };

  const register = async (formData) => {
    const response = await API.post("/auth/register", formData);

    saveAuth(response.data.token, response.data.user);

    return response.data;
  };

  const login = async (formDataOrEmail, maybePassword) => {
    const payload =
      typeof formDataOrEmail === "object"
        ? formDataOrEmail
        : {
            email: formDataOrEmail,
            password: maybePassword,
          };

    const response = await API.post("/auth/login", payload);

    saveAuth(response.data.token, response.data.user);

    return response.data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const updateProfile = async (formData) => {
    const response = await API.put("/users/profile", formData);
    const userData = response.data.user;

    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);

    return response.data;
  };

  useEffect(() => {
    fetchMe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        register,
        login,
        logout,
        updateProfile,
        fetchMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);