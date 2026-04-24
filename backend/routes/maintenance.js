const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.*, s.site_number
       FROM maintenance_orders m
       LEFT JOIN sites s ON m.site_id = s.id
       ORDER BY m.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.*, s.site_number
       FROM maintenance_orders m
       LEFT JOIN sites s ON m.site_id = s.id
       WHERE m.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Work order not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { site_id, title, description, priority, status, assigned_to, due_date, completed_date, cost, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO maintenance_orders (site_id, title, description, priority, status, assigned_to, due_date, completed_date, cost, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [site_id, title, description, priority || 'medium', status || 'open', assigned_to, due_date, completed_date, cost, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { site_id, title, description, priority, status, assigned_to, due_date, completed_date, cost, notes } = req.body;
    const result = await pool.query(
      `UPDATE maintenance_orders SET site_id=$1, title=$2, description=$3, priority=$4, status=$5, assigned_to=$6, due_date=$7, completed_date=$8, cost=$9, notes=$10
       WHERE id=$11 RETURNING *`,
      [site_id, title, description, priority, status, assigned_to, due_date, completed_date, cost, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Work order not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM maintenance_orders WHERE id = $1', [req.params.id]);
    res.json({ message: 'Work order deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
