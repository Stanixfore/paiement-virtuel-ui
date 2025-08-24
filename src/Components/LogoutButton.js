import React from "react";
import { useAuth } from "../context/AuthContext";

export default function LogoutButton() {
  const { logout } = useAuth();

  return (
    <button onClick={logout} style={{ padding: "8px 16px", cursor: "pointer" }}>
      Se déconnecter
    </button>
  );
}
