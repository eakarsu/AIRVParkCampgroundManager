const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT sl.*, g.first_name, g.last_name
       FROM security_logs sl
       LEFT JOIN guests g ON sl.guest_id = g.id
       ORDER BY sl.timestamp DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT sl.*, g.first_name, g.last_name
       FROM security_logs sl
       LEFT JOIN guests g ON sl.guest_id = g.id
       WHERE sl.id = $1`,
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
    const { gate_name, guest_id, access_code, action, vehicle_info, notes, timestamp } = req.body;
    const result = await pool.query(
      `INSERT INTO security_logs (gate_name, guest_id, access_code, action, vehicle_info, notes, timestamp)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [gate_name, guest_id, access_code, action, vehicle_info, notes, timestamp || new Date()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { gate_name, guest_id, access_code, action, vehicle_info, notes, timestamp } = req.body;
    const result = await pool.query(
      `UPDATE security_logs SET gate_name=$1, guest_id=$2, access_code=$3, action=$4, vehicle_info=$5, notes=$6, timestamp=$7
       WHERE id=$8 RETURNING *`,
      [gate_name, guest_id, access_code, action, vehicle_info, notes, timestamp, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Log not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM security_logs WHERE id = $1', [req.params.id]);
    res.json({ message: 'Log deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
