import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Merci de remplir tous les champs");
      return;
    }
    const success = await login(username, password);
    if (!success) {
      setError("Nom d’utilisateur ou mot de passe invalide");
    } else {
      setError("");
      // Rediriger vers la page protégée ici (ex: /dashboard)
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 320, margin: "auto" }}>
      <h2>Connexion</h2>
      <input
        type="text"
        placeholder="Nom d’utilisateur"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
        style={{ width: "100%", marginBottom: 12, padding: 8 }}
      />
      <input
        type="password"
        placeholder="Mot de passe"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        style={{ width: "100%", marginBottom: 12, padding: 8 }}
      />
      <button type="submit" style={{ width: "100%", padding: 10 }}>
        Se connecter
      </button>
      {error && (
        <p style={{ color: "red", marginTop: 10, fontWeight: "bold" }}>
          {error}
        </p>
      )}
    </form>
  );
}
