const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.*, s.site_number
       FROM utility_readings u
       LEFT JOIN sites s ON u.site_id = s.id
       ORDER BY u.reading_date DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.*, s.site_number
       FROM utility_readings u
       LEFT JOIN sites s ON u.site_id = s.id
       WHERE u.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Reading not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { site_id, reading_date, electric_kwh, water_gallons, sewer_gallons, amount_due, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO utility_readings (site_id, reading_date, electric_kwh, water_gallons, sewer_gallons, amount_due, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [site_id, reading_date, electric_kwh, water_gallons, sewer_gallons, amount_due, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { site_id, reading_date, electric_kwh, water_gallons, sewer_gallons, amount_due, notes } = req.body;
    const result = await pool.query(
      `UPDATE utility_readings SET site_id=$1, reading_date=$2, electric_kwh=$3, water_gallons=$4, sewer_gallons=$5, amount_due=$6, notes=$7
       WHERE id=$8 RETURNING *`,
      [site_id, reading_date, electric_kwh, water_gallons, sewer_gallons, amount_due, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Reading not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM utility_readings WHERE id = $1', [req.params.id]);
    res.json({ message: 'Reading deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
