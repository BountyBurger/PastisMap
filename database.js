const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'pastismap.db');

// Initial seed bars across France
const SEED_BARS = [];

class Database {
  constructor() {
    this.db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('❌ Erreur ouverture SQLite:', err.message);
      } else {
        this.init();
      }
    });
  }

  init() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS bars (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        brand TEXT NOT NULL,
        price REAL NOT NULL,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        city TEXT,
        address TEXT,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `;

    this.db.run(createTableQuery, (err) => {
      if (err) {
        console.error('❌ Erreur création table bars:', err.message);
        return;
      }
    });
  }

  getAllBars() {
    return new Promise((resolve, reject) => {
      this.db.all("SELECT * FROM bars ORDER BY price ASC", [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  getBarById(id) {
    return new Promise((resolve, reject) => {
      this.db.get("SELECT * FROM bars WHERE id = ?", [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  addBar(barData) {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      const query = `
        INSERT INTO bars (name, brand, price, lat, lng, city, address, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const params = [
        barData.name,
        barData.brand || 'Ricard',
        parseFloat(barData.price),
        parseFloat(barData.lat),
        parseFloat(barData.lng),
        barData.city || '',
        barData.address || '',
        barData.notes || '',
        now,
        now
      ];

      this.db.run(query, params, function (err) {
        if (err) reject(err);
        else {
          resolve({
            id: this.lastID,
            ...barData,
            price: parseFloat(barData.price),
            lat: parseFloat(barData.lat),
            lng: parseFloat(barData.lng),
            created_at: now,
            updated_at: now
          });
        }
      });
    });
  }

  updateBar(id, barData) {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      const query = `
        UPDATE bars
        SET name = ?, brand = ?, price = ?, lat = ?, lng = ?, city = ?, address = ?, notes = ?, updated_at = ?
        WHERE id = ?
      `;
      const params = [
        barData.name,
        barData.brand,
        parseFloat(barData.price),
        parseFloat(barData.lat),
        parseFloat(barData.lng),
        barData.city || '',
        barData.address || '',
        barData.notes || '',
        now,
        id
      ];

      this.db.run(query, params, function (err) {
        if (err) reject(err);
        else if (this.changes === 0) reject(new Error('Bar non trouvé'));
        else {
          resolve({
            id: parseInt(id, 10),
            ...barData,
            price: parseFloat(barData.price),
            lat: parseFloat(barData.lat),
            lng: parseFloat(barData.lng),
            updated_at: now
          });
        }
      });
    });
  }

  deleteBar(id) {
    return new Promise((resolve, reject) => {
      this.db.run("DELETE FROM bars WHERE id = ?", [id], function (err) {
        if (err) reject(err);
        else if (this.changes === 0) reject(new Error('Bar non trouvé'));
        else resolve({ success: true, id: parseInt(id, 10) });
      });
    });
  }

  getStats() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COUNT(*) as total_bars,
          AVG(price) as avg_price,
          MIN(price) as min_price,
          MAX(price) as max_price
        FROM bars
      `;
      this.db.get(query, [], async (err, row) => {
        if (err) return reject(err);

        try {
          const cheapestBar = await new Promise((res, rej) => {
            this.db.get("SELECT * FROM bars ORDER BY price ASC LIMIT 1", [], (e, r) => e ? rej(e) : res(r));
          });

          const popularBrand = await new Promise((res, rej) => {
            this.db.get("SELECT brand, COUNT(*) as count FROM bars GROUP BY brand ORDER BY count DESC LIMIT 1", [], (e, r) => e ? rej(e) : res(r));
          });

          resolve({
            totalBars: row.total_bars,
            avgPrice: row.avg_price ? parseFloat(row.avg_price.toFixed(2)) : 0,
            minPrice: row.min_price || 0,
            maxPrice: row.max_price || 0,
            cheapestBar: cheapestBar || null,
            popularBrand: popularBrand ? popularBrand.brand : 'Ricard'
          });
        } catch (e) {
          reject(e);
        }
      });
    });
  }
}

module.exports = new Database();
