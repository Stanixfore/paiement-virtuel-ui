import React, { createContext, useContext, useState } from "react";
import axios from "axios";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(null);

  // Fonction login pour récupérer token depuis backend et stocker en local
  const login = async (username, password) => {
    try {
      const response = await axios.post("http://localhost:5000/login", {
        username,
        password,
      });
      const tokenReceived = response.data.token;
      setToken(tokenReceived);
      localStorage.setItem("token", tokenReceived);
      setUser({ username });
      return true;
    } catch (error) {
      return false;
    }
  };

  // Fonction logout pour supprimer token et reset user
  const logout = () => {
    setToken("");
    setUser(null);
    localStorage.removeItem("token");
  };

  // Intercepteur axios pour ajouter token automatiquement aux requêtes
  axios.interceptors.request.use((config) => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
