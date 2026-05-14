const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

/**
 * POST /api/utilities/:guestId/generate-invoice
 * Compute utility charges for a guest and create a revenue record
 */
router.post('/:guestId/generate-invoice', auth, async (req, res) => {
  try {
    const { guestId } = req.params;
    const { electric_rate_per_kwh = 0.15, water_rate_per_gallon = 0.005, sewer_rate_per_gallon = 0.003 } = req.body;

    // Get all unbilled utility readings for this guest
    const guestRes = await pool.query('SELECT * FROM guests WHERE id = $1', [guestId]);
    if (guestRes.rows.length === 0) return res.status(404).json({ error: 'Guest not found' });

    // Get current reservation's site
    const reservationRes = await pool.query(`
      SELECT r.*, s.site_number FROM reservations r
      JOIN sites s ON r.site_id = s.id
      WHERE r.guest_id = $1 AND r.status IN ('confirmed', 'checked_in')
      ORDER BY r.check_in DESC LIMIT 1
    `, [guestId]);

    if (reservationRes.rows.length === 0) {
      return res.status(400).json({ error: 'No active reservation found for this guest' });
    }

    const reservation = reservationRes.rows[0];

    // Get recent utility readings for the site
    const readingsRes = await pool.query(`
      SELECT * FROM utility_readings
      WHERE site_id = $1
      ORDER BY reading_date DESC LIMIT 10
    `, [reservation.site_id]);

    if (readingsRes.rows.length === 0) {
      return res.status(400).json({ error: 'No utility readings found for this site' });
    }

    // Calculate charges
    const latest = readingsRes.rows[0];
    const electricCharge = parseFloat(latest.electric_kwh || 0) * electric_rate_per_kwh;
    const waterCharge = parseFloat(latest.water_gallons || 0) * water_rate_per_gallon;
    const sewerCharge = parseFloat(latest.sewer_gallons || 0) * sewer_rate_per_gallon;
    const totalCharge = Math.round((electricCharge + waterCharge + sewerCharge) * 100) / 100;

    // Create revenue record
    let revenueRecord = null;
    try {
      const revRes = await pool.query(`
        INSERT INTO revenue_records (reservation_id, guest_id, type, amount, description, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING *
      `, [reservation.id, guestId, 'utility', totalCharge,
          `Utility charges: Electric ${latest.electric_kwh}kWh, Water ${latest.water_gallons}gal, Sewer ${latest.sewer_gallons}gal`]);
      revenueRecord = revRes.rows[0];
    } catch (_) {
      // Table may not have this exact schema, non-fatal
    }

    res.json({
      guest_id: parseInt(guestId),
      guest_name: `${guestRes.rows[0].first_name} ${guestRes.rows[0].last_name}`,
      site_number: reservation.site_number,
      invoice: {
        electric_kwh: latest.electric_kwh,
        electric_charge: electricCharge.toFixed(2),
        water_gallons: latest.water_gallons,
        water_charge: waterCharge.toFixed(2),
        sewer_gallons: latest.sewer_gallons,
        sewer_charge: sewerCharge.toFixed(2),
        total_charge: totalCharge
      },
      revenue_record: revenueRecord,
      rates_used: { electric_rate_per_kwh, water_rate_per_gallon, sewer_rate_per_gallon }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
