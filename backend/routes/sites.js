const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET all sites
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sites ORDER BY site_number ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET site by id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sites WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Site not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create site
router.post('/', auth, async (req, res) => {
  try {
    const { site_number, type, status, length_ft, width_ft, max_rig_length, has_slides_room, amp_service, has_water, has_sewer, wifi_tier, daily_rate, weekly_rate, monthly_rate, seasonal_rate, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO sites (site_number, type, status, length_ft, width_ft, max_rig_length, has_slides_room, amp_service, has_water, has_sewer, wifi_tier, daily_rate, weekly_rate, monthly_rate, seasonal_rate, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
      [site_number, type, status || 'available', length_ft, width_ft, max_rig_length, has_slides_room || false, amp_service || 30, has_water !== false, has_sewer !== false, wifi_tier || 'basic', daily_rate, weekly_rate, monthly_rate, seasonal_rate, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update site
router.put('/:id', auth, async (req, res) => {
  try {
    const { site_number, type, status, length_ft, width_ft, max_rig_length, has_slides_room, amp_service, has_water, has_sewer, wifi_tier, daily_rate, weekly_rate, monthly_rate, seasonal_rate, notes } = req.body;
    const result = await pool.query(
      `UPDATE sites SET site_number=$1, type=$2, status=$3, length_ft=$4, width_ft=$5, max_rig_length=$6, has_slides_room=$7, amp_service=$8, has_water=$9, has_sewer=$10, wifi_tier=$11, daily_rate=$12, weekly_rate=$13, monthly_rate=$14, seasonal_rate=$15, notes=$16
       WHERE id=$17 RETURNING *`,
      [site_number, type, status, length_ft, width_ft, max_rig_length, has_slides_room, amp_service, has_water, has_sewer, wifi_tier, daily_rate, weekly_rate, monthly_rate, seasonal_rate, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Site not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE site
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM sites WHERE id = $1', [req.params.id]);
    res.json({ message: 'Site deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
