const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET /api/sites/availability?start=DATE&end=DATE
// Returns matrix: sites as rows, dates as columns, with booking status
router.get('/availability', async (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ error: 'start and end query params are required (YYYY-MM-DD)' });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isNaN(startDate) || isNaN(endDate) || endDate <= startDate) {
      return res.status(400).json({ error: 'Invalid date range' });
    }

    // Limit to 90 days to avoid huge payloads
    const maxDays = Math.min(Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)), 90);

    // Get all sites
    const sitesRes = await pool.query('SELECT id, site_number, type, status, daily_rate FROM sites ORDER BY site_number');

    // Get all reservations overlapping the date range
    const reservationsRes = await pool.query(`
      SELECT r.site_id, r.check_in, r.check_out, r.status, r.guest_id,
             g.first_name, g.last_name
      FROM reservations r
      LEFT JOIN guests g ON r.guest_id = g.id
      WHERE r.status NOT IN ('cancelled')
        AND r.check_in < $2
        AND r.check_out > $1
    `, [start, end]);

    // Build date array
    const dates = [];
    const current = new Date(startDate);
    for (let i = 0; i < maxDays; i++) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }

    // Build availability matrix
    const matrix = sitesRes.rows.map(site => {
      const siteReservations = reservationsRes.rows.filter(r => r.site_id === site.id);
      const availability = {};
      dates.forEach(date => {
        const dateObj = new Date(date);
        const reservation = siteReservations.find(r => {
          const checkIn = new Date(r.check_in);
          const checkOut = new Date(r.check_out);
          return dateObj >= checkIn && dateObj < checkOut;
        });
        availability[date] = reservation
          ? { status: 'booked', reservation_status: reservation.status, guest: `${reservation.first_name || ''} ${reservation.last_name || ''}`.trim() }
          : { status: site.status === 'available' ? 'available' : site.status };
      });
      return {
        site_id: site.id,
        site_number: site.site_number,
        type: site.type,
        daily_rate: site.daily_rate,
        availability
      };
    });

    res.json({ sites: matrix, dates, start, end });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
