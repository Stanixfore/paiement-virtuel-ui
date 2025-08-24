import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button, TextField, Container, Typography, Alert } from '@mui/material';

const apiBase = 'http://localhost:5000';

function UserDetail() {
  const { uid } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [newUid, setNewUid] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get(`${apiBase}/solde/${uid}`)
      .then(res => {
        setUser(res.data);
        setNewUid(res.data.uid);
      })
      .catch(() => setError('Utilisateur introuvable'));
  }, [uid]);

  const handleModify = async () => {
    try {
      await axios.put(`${apiBase}/utilisateur/${uid}`, { uid: newUid });
      setMessage('Modification enregistrée');
      setError('');
      setUser(u => ({ ...u, uid: newUid }));
    } catch (e) {
      setError('Erreur lors de la modification');
      setMessage('');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Confirmez-vous la résiliation ?')) return;
    try {
      await axios.delete(`${apiBase}/utilisateur/${uid}`);
      alert('Compte supprimé avec succès');
      navigate('/');
    } catch (e) {
      alert('Erreur lors de la suppression');
    }
  };

  if (!user) return <div>Chargement...</div>;

  return (
    <Container>
      <Typography variant="h5">Gestion utilisateur</Typography>
      <Typography>UID actuel : {user.uid}</Typography>

      <TextField
        label="Changer l'UID"
        value={newUid}
        onChange={(e) => setNewUid(e.target.value)}
        fullWidth
        margin="normal"
      />

      <Button variant="contained" onClick={handleModify} fullWidth>
        Valider modification
      </Button>

      <Button variant="outlined" color="error" onClick={handleDelete} fullWidth sx={{ mt: 2 }}>
        Résilier la carte / Supprimer utilisateur
      </Button>

      {message && <Alert severity="success">{message}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}
    </Container>
  );
}

export default UserDetail;
