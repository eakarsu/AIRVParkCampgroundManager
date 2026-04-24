const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM amenities ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM amenities WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Amenity not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, type, capacity, status, rate_per_hour, description } = req.body;
    const result = await pool.query(
      `INSERT INTO amenities (name, type, capacity, status, rate_per_hour, description)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [name, type, capacity, status || 'open', rate_per_hour || 0, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, type, capacity, status, rate_per_hour, description } = req.body;
    const result = await pool.query(
      `UPDATE amenities SET name=$1, type=$2, capacity=$3, status=$4, rate_per_hour=$5, description=$6
       WHERE id=$7 RETURNING *`,
      [name, type, capacity, status, rate_per_hour, description, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Amenity not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM amenities WHERE id = $1', [req.params.id]);
    res.json({ message: 'Amenity deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
