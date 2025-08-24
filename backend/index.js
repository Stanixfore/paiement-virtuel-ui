// Charger dotenv pour lire le .env
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;
const API_TOKEN = process.env.API_TOKEN;

// Configuration CORS pour autoriser ton frontend React seulement
const corsOptions = {
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204,
};

// Middleware CORS global
app.use(cors(corsOptions));

// Réponse explicite 204 pour les requêtes OPTIONS (préflight)
app.options('*', (req, res) => {
  res.sendStatus(204);
});

// Middleware pour parser le JSON des requêtes
app.use(express.json());

// Middleware d'authentification par token Bearer, sauf sur /login et OPTIONS
app.use((req, res, next) => {
  if (req.path === '/login' || req.method === 'OPTIONS') {
    return next();
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token || token !== API_TOKEN) {
    return res.status(401).json({ error: 'Non autorisé, token manquant ou invalide' });
  }
  next();
});

// Route POST /login simple
app.post('/login', (req, res) => {
  const { username } = req.body;
  if (username) {
    return res.json({ token: API_TOKEN });
  }
  res.status(400).json({ error: 'Identifiant requis' });
});


let utilisateurs = {};

// Wrapper pour gérer les erreurs dans les async/await
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Créer un utilisateur
app.post('/creer_utilisateur', asyncHandler(async (req, res) => {
  const { uid, nom, prenom, solde = 0 } = req.body;
  if (utilisateurs[uid]) {
    return res.status(409).json({ error: 'Utilisateur existe déjà' });
  }
  utilisateurs[uid] = { nom, prenom, solde };
  res.status(201).json(utilisateurs[uid]);
}));

// Obtenir le solde d’un utilisateur
app.get('/solde/:uid', asyncHandler(async (req, res) => {
  const user = utilisateurs[req.params.uid];
  if (!user) {
    return res.status(404).json({ error: 'Utilisateur non trouvé' });
  }
  res.json({ solde: user.solde });
}));

// Recharger le solde
app.post('/recharge', asyncHandler(async (req, res) => {
  const { uid, montant } = req.body;
  if (!utilisateurs[uid]) {
    return res.status(404).json({ error: 'Utilisateur non trouvé' });
  }
  if (typeof montant !== 'number' || montant <= 0) {
    return res.status(400).json({ error: 'Montant invalide' });
  }
  utilisateurs[uid].solde += montant;
  res.json({ nouveau_solde: utilisateurs[uid].solde });
}));

// Middleware global pour gérer les erreurs inattendues
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Une erreur interne est survenue.' });
});

app.listen(port, () => {
  console.log(`Serveur backend lancé sur http://localhost:${port}`);
});
