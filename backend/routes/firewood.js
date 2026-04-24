const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM firewood_inventory ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM firewood_inventory WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Firewood record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { wood_type, quantity_bundles, price_per_bundle, supplier, last_restocked, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO firewood_inventory (wood_type, quantity_bundles, price_per_bundle, supplier, last_restocked, notes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [wood_type, quantity_bundles, price_per_bundle, supplier, last_restocked, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { wood_type, quantity_bundles, price_per_bundle, supplier, last_restocked, notes } = req.body;
    const result = await pool.query(
      `UPDATE firewood_inventory SET wood_type=$1, quantity_bundles=$2, price_per_bundle=$3, supplier=$4, last_restocked=$5, notes=$6
       WHERE id=$7 RETURNING *`,
      [wood_type, quantity_bundles, price_per_bundle, supplier, last_restocked, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Firewood record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM firewood_inventory WHERE id = $1', [req.params.id]);
    res.json({ message: 'Firewood record deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
