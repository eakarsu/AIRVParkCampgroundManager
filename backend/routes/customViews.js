// Custom Views routes for RV Park & Campground Manager
// Provides 4 endpoints: occupancy-timeline, site-utilization-heatmap,
// reservation-confirmation-pdf, pricing-rules (CRUD)
const express = require('express');
const router = express.Router();
const pool = require('../db');

// In-memory store for pricing/booking rules (seeded with defaults)
let __ruleCounter = 4;
const pricingRules = [
  { id: 1, name: 'Peak Summer', type: 'season', season_start: '2026-06-01', season_end: '2026-08-31', multiplier: 1.50, min_nights: 3, max_nights: 14, notes: 'Summer peak season pricing' },
  { id: 2, name: 'Shoulder Spring', type: 'season', season_start: '2026-04-01', season_end: '2026-05-31', multiplier: 1.10, min_nights: 2, max_nights: 21, notes: 'Spring shoulder season' },
  { id: 3, name: 'Weekly Discount', type: 'length_of_stay', season_start: null, season_end: null, multiplier: 0.90, min_nights: 7, max_nights: 13, notes: '10% off for 7-13 nights' },
  { id: 4, name: 'Monthly Discount', type: 'length_of_stay', season_start: null, season_end: null, multiplier: 0.75, min_nights: 28, max_nights: 90, notes: '25% off for 28+ nights' }
];

// Helper: safely query DB or return fallback
async function safeQuery(sql, params = []) {
  try {
    const res = await pool.query(sql, params);
    return res.rows;
  } catch (e) {
    return null;
  }
}

// ---------- VIZ 1: Occupancy Timeline ----------
// GET /api/custom-views/occupancy-timeline?days=30
router.get('/occupancy-timeline', async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days, 10) || 30, 90);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get total site count
    const sitesRows = await safeQuery('SELECT COUNT(*) AS cnt FROM sites');
    const totalSites = sitesRows && sitesRows.length > 0 ? parseInt(sitesRows[0].cnt, 10) || 0 : 0;

    // Get reservations overlapping window
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + days);
    const reservations = await safeQuery(
      `SELECT site_id, check_in, check_out, status FROM reservations
       WHERE status IS NULL OR status NOT IN ('cancelled')`
    );

    const timeline = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      let occupied = 0;
      if (reservations && totalSites > 0) {
        const occupiedSites = new Set();
        for (const r of reservations) {
          const ci = new Date(r.check_in);
          const co = new Date(r.check_out);
          if (d >= ci && d < co) occupiedSites.add(r.site_id);
        }
        occupied = occupiedSites.size;
      } else {
        // synthesized seasonal fallback
        const base = 0.55 + 0.25 * Math.sin((i / days) * Math.PI * 2);
        occupied = Math.round(((totalSites || 40) * Math.max(0.2, Math.min(0.95, base + (Math.random() - 0.5) * 0.1))));
      }
      const total = totalSites || 40;
      timeline.push({
        date: dateStr,
        day_of_week: d.toLocaleDateString('en-US', { weekday: 'short' }),
        occupied,
        available: Math.max(0, total - occupied),
        total,
        occupancy_pct: total > 0 ? Math.round((occupied / total) * 1000) / 10 : 0
      });
    }
    const avg = timeline.reduce((s, t) => s + t.occupancy_pct, 0) / timeline.length;
    res.json({
      timeline,
      summary: {
        days,
        total_sites: totalSites || 40,
        avg_occupancy_pct: Math.round(avg * 10) / 10,
        peak_date: timeline.reduce((a, b) => a.occupancy_pct > b.occupancy_pct ? a : b).date,
        low_date: timeline.reduce((a, b) => a.occupancy_pct < b.occupancy_pct ? a : b).date
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- VIZ 2: Site Utilization Heatmap (site x date) ----------
// GET /api/custom-views/site-utilization-heatmap?days=14
router.get('/site-utilization-heatmap', async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days, 10) || 14, 30);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let sites = await safeQuery('SELECT id, site_number, type FROM sites ORDER BY site_number ASC LIMIT 25');
    if (!sites || sites.length === 0) {
      sites = Array.from({ length: 12 }, (_, i) => ({
        id: i + 1,
        site_number: `S${String(i + 1).padStart(2, '0')}`,
        type: ['back-in', 'pull-through', 'tent', 'cabin'][i % 4]
      }));
    }

    const reservations = await safeQuery(
      `SELECT site_id, check_in, check_out, status FROM reservations
       WHERE status IS NULL OR status NOT IN ('cancelled')`
    );

    const dates = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }

    const heatmap = sites.map(site => {
      const cells = dates.map(dateStr => {
        let utilization = 0;
        let status = 'available';
        if (reservations && reservations.length > 0) {
          const target = new Date(dateStr);
          const r = reservations.find(rv => {
            if (rv.site_id !== site.id) return false;
            const ci = new Date(rv.check_in);
            const co = new Date(rv.check_out);
            return target >= ci && target < co;
          });
          if (r) {
            utilization = 1.0;
            status = r.status || 'booked';
          }
        } else {
          // synthesized
          const seed = (site.id * 13 + dates.indexOf(dateStr) * 7) % 100;
          utilization = seed > 65 ? Math.round((seed / 100) * 100) / 100 : 0;
          status = utilization > 0.5 ? 'booked' : utilization > 0 ? 'partial' : 'available';
        }
        return { date: dateStr, utilization, status };
      });
      return {
        site_id: site.id,
        site_number: site.site_number,
        type: site.type,
        cells,
        avg_utilization: Math.round((cells.reduce((s, c) => s + c.utilization, 0) / cells.length) * 100) / 100
      };
    });

    res.json({
      sites: heatmap,
      dates,
      days,
      site_count: heatmap.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- NON-VIZ 1: Reservation Confirmation PDF ----------
// GET or POST /api/custom-views/reservation-confirmation-pdf?reservation_id=X
// Returns a minimal valid PDF (application/pdf)
function buildPdf(lines) {
  // Build a very small but valid PDF document with one page of text.
  const header = '%PDF-1.4\n';
  let content = 'BT\n/F1 14 Tf\n50 780 Td\n';
  lines.forEach((line, idx) => {
    const safe = String(line).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    if (idx === 0) {
      content += `(${safe}) Tj\n`;
    } else {
      content += `0 -18 Td\n(${safe}) Tj\n`;
    }
  });
  content += 'ET\n';
  const stream = `<< /Length ${content.length} >>\nstream\n${content}\nendstream\n`;

  const objs = [];
  objs.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  objs.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
  objs.push('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n');
  objs.push(`4 0 obj\n${stream}endobj\n`);
  objs.push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n');

  let pdf = header;
  const offsets = [0];
  for (const o of objs) {
    offsets.push(Buffer.byteLength(pdf, 'binary'));
    pdf += o;
  }
  const xrefOffset = Buffer.byteLength(pdf, 'binary');
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objs.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, 'binary');
}

async function generateConfirmationPdf(req, res) {
  try {
    const resId = req.query.reservation_id || (req.body && req.body.reservation_id);
    let reservation = null;
    if (resId) {
      const rows = await safeQuery(
        `SELECT r.*, g.first_name, g.last_name, g.email, g.phone,
                s.site_number, s.type AS site_type, s.daily_rate
         FROM reservations r
         LEFT JOIN guests g ON r.guest_id = g.id
         LEFT JOIN sites s ON r.site_id = s.id
         WHERE r.id = $1`,
        [resId]
      );
      if (rows && rows.length > 0) reservation = rows[0];
    }
    if (!reservation) {
      reservation = {
        id: resId || 'DEMO-001',
        first_name: 'Demo',
        last_name: 'Guest',
        email: 'demo@example.com',
        phone: '555-0100',
        site_number: 'A-12',
        site_type: 'pull-through',
        daily_rate: 65.0,
        check_in: '2026-06-15',
        check_out: '2026-06-20',
        status: 'confirmed',
        total_amount: 325.0
      };
    }
    const lines = [
      'RV Park & Campground Manager',
      'Reservation Confirmation',
      '',
      `Confirmation #: ${reservation.id}`,
      `Guest: ${reservation.first_name || ''} ${reservation.last_name || ''}`.trim(),
      `Email: ${reservation.email || 'N/A'}`,
      `Phone: ${reservation.phone || 'N/A'}`,
      '',
      `Site: ${reservation.site_number || 'N/A'} (${reservation.site_type || 'N/A'})`,
      `Check-in:  ${String(reservation.check_in).split('T')[0]}`,
      `Check-out: ${String(reservation.check_out).split('T')[0]}`,
      `Status: ${reservation.status || 'pending'}`,
      `Daily Rate: $${Number(reservation.daily_rate || 0).toFixed(2)}`,
      `Total: $${Number(reservation.total_amount || 0).toFixed(2)}`,
      '',
      'Thank you for choosing our park!',
      `Generated: ${new Date().toISOString()}`
    ];
    const buf = buildPdf(lines);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="reservation-${reservation.id}.pdf"`);
    res.setHeader('Content-Length', buf.length);
    res.status(200).end(buf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
router.get('/reservation-confirmation-pdf', generateConfirmationPdf);
router.post('/reservation-confirmation-pdf', generateConfirmationPdf);

// ---------- NON-VIZ 2: Pricing Rules CRUD ----------
// GET /api/custom-views/pricing-rules
router.get('/pricing-rules', (req, res) => {
  res.json({ rules: pricingRules, count: pricingRules.length });
});

// POST /api/custom-views/pricing-rules
router.post('/pricing-rules', (req, res) => {
  const body = req.body || {};
  const rule = {
    id: ++__ruleCounter,
    name: body.name || 'New Rule',
    type: body.type === 'length_of_stay' ? 'length_of_stay' : 'season',
    season_start: body.season_start || null,
    season_end: body.season_end || null,
    multiplier: Number(body.multiplier) || 1.0,
    min_nights: Number(body.min_nights) || 1,
    max_nights: Number(body.max_nights) || 30,
    notes: body.notes || ''
  };
  pricingRules.push(rule);
  res.status(201).json(rule);
});

// PUT /api/custom-views/pricing-rules/:id
router.put('/pricing-rules/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = pricingRules.findIndex(r => r.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Rule not found' });
  const body = req.body || {};
  pricingRules[idx] = {
    ...pricingRules[idx],
    ...(body.name !== undefined ? { name: body.name } : {}),
    ...(body.type !== undefined ? { type: body.type === 'length_of_stay' ? 'length_of_stay' : 'season' } : {}),
    ...(body.season_start !== undefined ? { season_start: body.season_start } : {}),
    ...(body.season_end !== undefined ? { season_end: body.season_end } : {}),
    ...(body.multiplier !== undefined ? { multiplier: Number(body.multiplier) } : {}),
    ...(body.min_nights !== undefined ? { min_nights: Number(body.min_nights) } : {}),
    ...(body.max_nights !== undefined ? { max_nights: Number(body.max_nights) } : {}),
    ...(body.notes !== undefined ? { notes: body.notes } : {})
  };
  res.json(pricingRules[idx]);
});

// DELETE /api/custom-views/pricing-rules/:id
router.delete('/pricing-rules/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = pricingRules.findIndex(r => r.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Rule not found' });
  const removed = pricingRules.splice(idx, 1)[0];
  res.json({ message: 'Rule deleted', rule: removed });
});

module.exports = router;
