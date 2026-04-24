const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM guests ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM guests WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Guest not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { first_name, last_name, email, phone, rig_type, rig_length, rig_slides, license_plate, pet_info, loyalty_points, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO guests (first_name, last_name, email, phone, rig_type, rig_length, rig_slides, license_plate, pet_info, loyalty_points, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [first_name, last_name, email, phone, rig_type, rig_length, rig_slides || 0, license_plate, pet_info, loyalty_points || 0, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { first_name, last_name, email, phone, rig_type, rig_length, rig_slides, license_plate, pet_info, loyalty_points, notes } = req.body;
    const result = await pool.query(
      `UPDATE guests SET first_name=$1, last_name=$2, email=$3, phone=$4, rig_type=$5, rig_length=$6, rig_slides=$7, license_plate=$8, pet_info=$9, loyalty_points=$10, notes=$11
       WHERE id=$12 RETURNING *`,
      [first_name, last_name, email, phone, rig_type, rig_length, rig_slides, license_plate, pet_info, loyalty_points, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Guest not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM guests WHERE id = $1', [req.params.id]);
    res.json({ message: 'Guest deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
