import { createContext, useContext, useEffect, useState } from "react";
import API from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return null;
      }

      const response = await API.get("/auth/me");
      setUser(response.data.user);
      return response.data.user;
    } catch (error) {
      localStorage.removeItem("token");
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const register = async (formData) => {
    const response = await API.post("/auth/register", formData);
    localStorage.setItem("token", response.data.token);
    setUser(response.data.user);
    return response.data;
  };

  const login = async (formData) => {
    const response = await API.post("/auth/login", formData);
    localStorage.setItem("token", response.data.token);
    setUser(response.data.user);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const updateProfile = async (formData) => {
    const response = await API.put("/users/profile", formData);
    setUser(response.data.user);
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
        fetchMe
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);