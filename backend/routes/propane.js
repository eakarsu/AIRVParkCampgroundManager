const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ps.*, g.first_name, g.last_name
       FROM propane_sales ps
       LEFT JOIN guests g ON ps.guest_id = g.id
       ORDER BY ps.sale_date DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ps.*, g.first_name, g.last_name
       FROM propane_sales ps
       LEFT JOIN guests g ON ps.guest_id = g.id
       WHERE ps.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Sale not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { guest_id, gallons, price_per_gallon, total, tank_size, sale_date, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO propane_sales (guest_id, gallons, price_per_gallon, total, tank_size, sale_date, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [guest_id, gallons, price_per_gallon, total, tank_size, sale_date || new Date(), notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { guest_id, gallons, price_per_gallon, total, tank_size, sale_date, notes } = req.body;
    const result = await pool.query(
      `UPDATE propane_sales SET guest_id=$1, gallons=$2, price_per_gallon=$3, total=$4, tank_size=$5, sale_date=$6, notes=$7
       WHERE id=$8 RETURNING *`,
      [guest_id, gallons, price_per_gallon, total, tank_size, sale_date, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Sale not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM propane_sales WHERE id = $1', [req.params.id]);
    res.json({ message: 'Sale deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
