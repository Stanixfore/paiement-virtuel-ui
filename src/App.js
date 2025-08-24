import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useParams, Navigate } from "react-router-dom";
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Paper,
  Alert,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import axios from "axios";
import { useAuth } from "./Context/AuthContext"; // Assure le chemin est correct

const apiBase = "http://localhost:5000";

function Login() {
  const [uid, setUid] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const { login, token } = useAuth();

  useEffect(() => {
    if (token) {
      navigate("/user/" + uid);
    }
  }, [token, navigate, uid]);

  const verifierUtilisateur = async () => {
    if (!uid) {
      setError("UID requis");
      return;
    }
    try {
      await axios.get(`${apiBase}/solde/${uid}`);
      setError("");
      setMessage("");
      await login(uid, "");
      navigate(`/user/${uid}`);
    } catch (e) {
      setError(e.response?.data?.error || "Utilisateur non trouvé");
      setMessage("");
    }
  };

  const creerUtilisateur = async () => {
    if (!uid) {
      setError("UID requis");
      return;
    }
    try {
      await axios.post(`${apiBase}/creer_utilisateur`, { uid, solde: 25 });
      setError("");
      setMessage("Utilisateur créé avec solde initial");
      await login(uid, "");
      navigate(`/user/${uid}`);
    } catch (e) {
      setError(e.response?.data?.error || "Erreur création utilisateur");
      setMessage("");
    }
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 8 }}>
      <Paper sx={{ p: 4, textAlign: "center" }}>
        <CreditCardIcon color="primary" sx={{ fontSize: 60, mb: 2 }} />
        <Typography variant="h4" mb={3}>
          Paiement Virtuel NFC - Connexion
        </Typography>
        <TextField
          label="UID de la carte NFC"
          fullWidth
          value={uid}
          onChange={(e) => setUid(e.target.value)}
          sx={{ mb: 3 }}
        />
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button variant="contained" onClick={verifierUtilisateur} fullWidth>
            Vérifier Utilisateur
          </Button>
          <Button variant="outlined" onClick={creerUtilisateur} fullWidth>
            Créer Utilisateur
          </Button>
        </Box>
        {message && <Alert severity="success" sx={{ mt: 2 }}>{message}</Alert>}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Paper>
    </Container>
  );
}

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function UserDetail() {
  const { uid } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [montant, setMontant] = useState("");
  const [montantRecharge, setMontantRecharge] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [newUid, setNewUid] = useState("");
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    axios
      .get(`${apiBase}/solde/${uid}`)
      .then((res) => {
        setUser({ uid: uid, solde: res.data.solde });
        setNewUid(uid);
      })
      .catch(() => {
        setError("Utilisateur introuvable");
      });

    setTransactions([
      { id: 1, date: "2025-08-22", montant: 5.5, type: "Paiement" },
      { id: 2, date: "2025-08-21", montant: 10.0, type: "Recharge" },
    ]);
  }, [uid]);

  const payer = async () => {
    setError("");
    setMessage("");
    if (!montant || isNaN(parseFloat(montant))) {
      setError("Montant invalide");
      return;
    }
    try {
      const res = await axios.post(`${apiBase}/transaction`, {
        uid: user.uid,
        montant: parseFloat(montant),
      });
      setUser((u) => ({ ...u, solde: res.data.nouveau_solde || u.solde }));
      setMessage("Paiement effectué avec succès");
      setMontant("");
      setTransactions((old) => [
        ...old,
        {
          id: old.length + 1,
          date: new Date().toISOString().split("T")[0],
          montant: parseFloat(montant),
          type: "Paiement",
        },
      ]);
    } catch (e) {
      setError(e.response?.data?.error || "Erreur lors du paiement");
    }
  };

  const rechargerSolde = async () => {
    setError("");
    setMessage("");
    if (
      !montantRecharge ||
      isNaN(parseFloat(montantRecharge)) ||
      parseFloat(montantRecharge) <= 0
    ) {
      setError("Montant de recharge invalide");
      return;
    }
    try {
      const res = await axios.post(`${apiBase}/recharge`, {
        uid: user.uid,
        montant: parseFloat(montantRecharge),
      });
      setUser((u) => ({ ...u, solde: res.data.nouveau_solde || u.solde }));
      setMessage("Recharge effectuée avec succès");
      setMontantRecharge("");
      setTransactions((old) => [
        ...old,
        {
          id: old.length + 1,
          date: new Date().toISOString().split("T")[0],
          montant: parseFloat(montantRecharge),
          type: "Recharge",
        },
      ]);
    } catch (e) {
      setError(e.response?.data?.error || "Erreur lors de la recharge");
    }
  };

  const changerUid = () => {
    if (!newUid) {
      setError("UID ne peut pas être vide");
      return;
    }
    setUser((u) => ({ ...u, uid: newUid }));
    setMessage("UID changé localement (à l'étape backend à implémenter)");
    setError("");
  };

  if (!user) {
    return (
      <Container maxWidth="xs" sx={{ mt: 8, textAlign: "center" }}>
        <Typography>Chargement...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Button variant="outlined" onClick={() => navigate("/")}>
        ← Retour
      </Button>
      <Paper sx={{ p: 4, mt: 2 }}>
        <Typography variant="h5" gutterBottom>
          Gestion utilisateur
        </Typography>
        <Typography>
          <strong>UID:</strong> {user.uid}
        </Typography>
        <Typography>
          <strong>Solde:</strong> {user.solde} €
        </Typography>
        <Box sx={{ mt: 3 }}>
          <TextField
            label="Changer UID de la carte"
            fullWidth
            value={newUid}
            onChange={(e) => setNewUid(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button variant="contained" onClick={changerUid} fullWidth>
            Valider changement UID
          </Button>
        </Box>
        <Box sx={{ mt: 4 }}>
          <TextField
            label="Montant à débiter"
            fullWidth
            value={montant}
            onChange={(e) => setMontant(e.target.value)}
            type="number"
            inputProps={{ min: 0, step: "0.01" }}
            sx={{ mb: 2 }}
          />
          <Button variant="contained" color="success" onClick={payer} fullWidth>
            Payer
          </Button>
        </Box>
        <Box sx={{ mt: 4 }}>
          <TextField
            label="Montant à recharger"
            fullWidth
            value={montantRecharge}
            onChange={(e) => setMontantRecharge(e.target.value)}
            type="number"
            inputProps={{ min: 0, step: "0.01" }}
            sx={{ mb: 2 }}
          />
          <Button variant="contained" color="primary" onClick={rechargerSolde} fullWidth>
            Recharger le solde
          </Button>
        </Box>
        {message && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {message}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Historique des transactions
          </Typography>
          <div style={{ height: 300, width: "100%" }}>
            <DataGrid
              rows={transactions}
              columns={[
                { field: "id", headerName: "ID", width: 90 },
                { field: "date", headerName: "Date", flex: 1 },
                { field: "montant", headerName: "Montant (€)", flex: 1 },
                { field: "type", headerName: "Type", flex: 1 },
              ]}
              pageSize={5}
              rowsPerPageOptions={[5]}
              disableSelectionOnClick
            />
          </div>
        </Box>
      </Paper>
    </Container>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
        path="/user/:uid"
        element={
          <ProtectedRoute>
            <UserDetail />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
