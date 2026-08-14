require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'pastis-secret-2026';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Middleware de vérification du Token Admin
const adminAuth = (req, res, next) => {
  const token = 
    req.headers['x-admin-token'] || 
    (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null) ||
    req.query.token || 
    (req.body && req.body.token);

  if (token && token === ADMIN_TOKEN) {
    req.isAdmin = true;
    next();
  } else {
    return res.status(401).json({ 
      error: "Accès refusé. Token d'administration invalide ou manquant.",
      code: "UNAUTHORIZED" 
    });
  }
};

// --- ROUTES PUBLIQUES (LECTURE) ---

// Obtenir tous les bars
app.get('/api/bars', async (req, res) => {
  try {
    const bars = await db.getAllBars();
    res.json(bars);
  } catch (err) {
    console.error('Erreur GET /api/bars:', err);
    res.status(500).json({ error: "Impossible de récupérer les bars" });
  }
});

// Obtenir un bar par son ID
app.get('/api/bars/:id', async (req, res) => {
  try {
    const bar = await db.getBarById(req.params.id);
    if (!bar) {
      return res.status(404).json({ error: "Bar introuvable" });
    }
    res.json(bar);
  } catch (err) {
    console.error('Erreur GET /api/bars/:id:', err);
    res.status(500).json({ error: "Impossible de récupérer le bar" });
  }
});

// Obtenir les statistiques globales
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await db.getStats();
    res.json(stats);
  } catch (err) {
    console.error('Erreur GET /api/stats:', err);
    res.status(500).json({ error: "Impossible de calculer les statistiques" });
  }
});

// Vérifier la validité d'un token secret
app.post('/api/verify-token', (req, res) => {
  const token = req.body.token || req.headers['x-admin-token'] || req.query.token;
  const isValid = (token === ADMIN_TOKEN);
  res.json({ valid: isValid });
});

// --- ROUTES PROTEGEES (ADMIN / EDITEUR) ---

// Ajouter un nouveau bar
app.post('/api/bars', adminAuth, async (req, res) => {
  const { name, brand, price, lat, lng, city, address, notes } = req.body;

  if (!name || price === undefined || lat === undefined || lng === undefined) {
    return res.status(400).json({ error: "Les champs Nom, Prix, Latitude et Longitude sont obligatoires." });
  }

  try {
    const newBar = await db.addBar({ name, brand, price, lat, lng, city, address, notes });
    res.status(201).json(newBar);
  } catch (err) {
    console.error('Erreur POST /api/bars:', err);
    res.status(500).json({ error: "Impossible d'ajouter le bar" });
  }
});

// Modifier un bar existant
app.put('/api/bars/:id', adminAuth, async (req, res) => {
  const { name, brand, price, lat, lng, city, address, notes } = req.body;

  if (!name || price === undefined || lat === undefined || lng === undefined) {
    return res.status(400).json({ error: "Les champs Nom, Prix, Latitude et Longitude sont obligatoires." });
  }

  try {
    const updatedBar = await db.updateBar(req.params.id, { name, brand, price, lat, lng, city, address, notes });
    res.json(updatedBar);
  } catch (err) {
    console.error('Erreur PUT /api/bars/:id:', err);
    res.status(500).json({ error: "Impossible de modifier le bar" });
  }
});

// Supprimer un bar
app.delete('/api/bars/:id', adminAuth, async (req, res) => {
  try {
    const result = await db.deleteBar(req.params.id);
    res.json(result);
  } catch (err) {
    console.error('Erreur DELETE /api/bars/:id:', err);
    res.status(500).json({ error: "Impossible de supprimer le bar" });
  }
});

// Catch-all route pour SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`
  ======================================================
  🥃 PastisMap Server est prêt !
  📍 URL Publique : http://localhost:${PORT}
  ✏️  URL Admin    : http://localhost:${PORT}/?token=${ADMIN_TOKEN}
  ======================================================
  `);
});
