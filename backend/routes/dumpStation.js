const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ds.*, s.site_number, g.first_name, g.last_name
       FROM dump_station_logs ds
       LEFT JOIN sites s ON ds.site_id = s.id
       LEFT JOIN guests g ON ds.guest_id = g.id
       ORDER BY ds.usage_date DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ds.*, s.site_number, g.first_name, g.last_name
       FROM dump_station_logs ds
       LEFT JOIN sites s ON ds.site_id = s.id
       LEFT JOIN guests g ON ds.guest_id = g.id
       WHERE ds.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Log not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { site_id, guest_id, station_number, usage_date, duration_minutes, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO dump_station_logs (site_id, guest_id, station_number, usage_date, duration_minutes, notes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [site_id, guest_id, station_number, usage_date || new Date(), duration_minutes, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { site_id, guest_id, station_number, usage_date, duration_minutes, notes } = req.body;
    const result = await pool.query(
      `UPDATE dump_station_logs SET site_id=$1, guest_id=$2, station_number=$3, usage_date=$4, duration_minutes=$5, notes=$6
       WHERE id=$7 RETURNING *`,
      [site_id, guest_id, station_number, usage_date, duration_minutes, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Log not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM dump_station_logs WHERE id = $1', [req.params.id]);
    res.json({ message: 'Log deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
