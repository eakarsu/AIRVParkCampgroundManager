const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const fetch = require('node-fetch');
const { aiRateLimiter } = require('../middleware/rateLimiter');

// Express-validator (optional, gracefully skipped if not installed)
let body, validationResult;
try {
  ({ body, validationResult } = require('express-validator'));
} catch (_) {
  body = () => ({ notEmpty: () => ({ withMessage: () => {} }) });
  validationResult = () => ({ isEmpty: () => true, array: () => [] });
}

const validate = (validations) => async (req, res, next) => {
  if (!validations || validations.length === 0) return next();
  for (const validation of validations) {
    if (validation && typeof validation.run === 'function') {
      await validation.run(req);
    }
  }
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ error: 'Validation failed', details: errors.array() });
  }
  next();
};

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';

// 3-strategy JSON parser
function parseAIJson(content) {
  try { return JSON.parse(content); } catch (_) {}
  try {
    const block = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (block) return JSON.parse(block[1].trim());
  } catch (_) {}
  try {
    const obj = content.match(/[\[{][\s\S]*[\]}]/);
    if (obj) return JSON.parse(obj[0]);
  } catch (_) {}
  return null;
}

async function callOpenRouter(systemPrompt, userPrompt) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.CLIENT_URL || 'http://localhost:3001',
      'X-Title': 'RV Park Manager'
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7
    })
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message || 'OpenRouter API error');
  }
  const content = data.choices?.[0]?.message?.content || '';
  return { content, usage: data.usage };
}

async function persistAIResult(feature, inputSummary, rawContent, parsedData) {
  try {
    await pool.query(`
      INSERT INTO ai_results (feature, input_summary, result_text, result_json, model_used, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `, [feature, inputSummary.substring(0, 200), rawContent, parsedData ? JSON.stringify(parsedData) : null, OPENROUTER_MODEL]);
  } catch (_) {
    // Non-fatal if table doesn't exist yet
  }
}

// All AI routes require auth + rate limiting
router.use(auth);
router.use(aiRateLimiter);

// 503-on-no-key gate for the new mechanical-backlog endpoints below.
function requireAIKey(req, res, next) {
  if (!OPENROUTER_API_KEY) {
    return res.status(503).json({ error: 'AI provider not configured. Set OPENROUTER_API_KEY in the backend environment to enable this feature.' });
  }
  next();
}

// POST /dynamic-pricing — grounded with real DB occupancy
router.post('/dynamic-pricing', async (req, res) => {
  try {
    const { site_id, season, events_nearby, weather, current_rate } = req.body;

    // Ground with real occupancy data
    const totalSites = await pool.query('SELECT COUNT(*) as total FROM sites');
    const occupiedSites = await pool.query(`
      SELECT COUNT(*) as occupied FROM reservations
      WHERE status IN ('confirmed', 'checked_in')
        AND check_in <= NOW() AND check_out >= NOW()
    `);
    const siteInfo = site_id ? await pool.query('SELECT * FROM sites WHERE id = $1', [site_id]) : { rows: [] };

    const total = parseInt(totalSites.rows[0].total) || 1;
    const occupied = parseInt(occupiedSites.rows[0].occupied) || 0;
    const occupancyRate = Math.round((occupied / total) * 100);

    const systemPrompt = 'You are an AI pricing analyst for an RV park. Analyze the following data and suggest optimal pricing. Return a JSON object with: suggested_rate, confidence, reasoning, factors_considered (array), rate_range (min/max).';
    const userPrompt = `Site ID: ${site_id || 'General'}
Site Type: ${siteInfo.rows[0]?.type || 'Unknown'}
Current Daily Rate: $${siteInfo.rows[0]?.daily_rate || current_rate}
Current Occupancy: ${occupancyRate}% (${occupied}/${total} sites occupied)
Season: ${season}
Events Nearby: ${events_nearby}
Weather: ${weather}
Requested Rate Override: $${current_rate || 'N/A'}`;

    const { content, usage } = await callOpenRouter(systemPrompt, userPrompt);
    const parsed = parseAIJson(content);
    await persistAIResult('dynamic-pricing', `site:${site_id} occupancy:${occupancyRate}%`, content, parsed);

    res.json({ success: true, data: parsed || { raw_response: content }, raw_response: content, occupancy_rate: occupancyRate });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /review-response
router.post('/review-response', async (req, res) => {
  try {
    const { review_text, rating, guest_name } = req.body;
    const systemPrompt = 'You are a professional RV park manager responding to guest reviews. Write a warm, professional response. Return JSON with: response_text, sentiment_analysis, key_points_addressed (array), tone.';
    const userPrompt = `Guest Name: ${guest_name}\nRating: ${rating}/5\nReview: ${review_text}`;

    const { content } = await callOpenRouter(systemPrompt, userPrompt);
    const parsed = parseAIJson(content);
    await persistAIResult('review-response', `rating:${rating} guest:${guest_name}`, content, parsed);

    res.json({ success: true, data: parsed || { raw_response: content }, raw_response: content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /activity-recommendations
router.post('/activity-recommendations', async (req, res) => {
  try {
    const { location, season, guest_preferences, family_friendly } = req.body;
    const systemPrompt = 'You are a local activity expert for RV park guests. Recommend activities and attractions. Return JSON with: recommendations (array of {name, description, distance, cost_estimate, suitable_for, rating}), seasonal_highlights, tips.';
    const userPrompt = `Location: ${location}\nSeason: ${season}\nGuest Preferences: ${guest_preferences}\nFamily Friendly: ${family_friendly}`;

    const { content } = await callOpenRouter(systemPrompt, userPrompt);
    const parsed = parseAIJson(content);
    await persistAIResult('activity-recommendations', `location:${location} season:${season}`, content, parsed);

    res.json({ success: true, data: parsed || { raw_response: content }, raw_response: content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /site-matching — grounded with real site data
router.post('/site-matching', async (req, res) => {
  try {
    const { rig_type, rig_length, slides, amp_needed, needs_sewer, budget_per_night } = req.body;

    // Ground with real site specs from DB
    const sitesRes = await pool.query(`
      SELECT site_number, type, max_rig_length, amp_service, has_water, has_sewer,
             has_slides_room, daily_rate, status, wifi_tier
      FROM sites WHERE status = 'available'
      ORDER BY site_number
      LIMIT 30
    `);

    const systemPrompt = 'You are an RV park site matching expert. Based on the rig specifications and available sites, recommend the best matches. Return JSON with: recommended_sites (array of {site_number, site_type, why_suitable, features_matched, daily_rate}), considerations, tips_for_setup.';
    const userPrompt = `GUEST RIG:
Rig Type: ${rig_type}
Rig Length: ${rig_length} ft
Slides: ${slides}
Amp Needed: ${amp_needed}
Needs Sewer: ${needs_sewer}
Budget Per Night: $${budget_per_night}

AVAILABLE SITES (real data from database):
${sitesRes.rows.map(s => `Site ${s.site_number}: ${s.type}, Max length ${s.max_rig_length}ft, ${s.amp_service}A service, Water:${s.has_water}, Sewer:${s.has_sewer}, Slides room:${s.has_slides_room}, Rate:$${s.daily_rate}/night`).join('\n')}`;

    const { content } = await callOpenRouter(systemPrompt, userPrompt);
    const parsed = parseAIJson(content);
    await persistAIResult('site-matching', `rig:${rig_type} len:${rig_length}`, content, parsed);

    res.json({ success: true, data: parsed || { raw_response: content }, raw_response: content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /marketing-content
router.post('/marketing-content', async (req, res) => {
  try {
    const { campaign_type, season, target_audience, special_offers } = req.body;
    const systemPrompt = 'You are a marketing expert for RV parks. Create compelling marketing content. Return JSON with: headline, body_copy, call_to_action, social_media_post, email_subject, key_selling_points (array).';
    const userPrompt = `Campaign Type: ${campaign_type}\nSeason: ${season}\nTarget Audience: ${target_audience}\nSpecial Offers: ${special_offers}`;

    const { content } = await callOpenRouter(systemPrompt, userPrompt);
    const parsed = parseAIJson(content);
    await persistAIResult('marketing-content', `campaign:${campaign_type} season:${season}`, content, parsed);

    res.json({ success: true, data: parsed || { raw_response: content }, raw_response: content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /maintenance-prediction — grounded with real maintenance history
router.post('/maintenance-prediction', async (req, res) => {
  try {
    const { site_id, site_age_years, last_maintenance, equipment_list, weather_conditions } = req.body;

    // Ground with real maintenance history
    const maintHistory = await pool.query(`
      SELECT title as type, status, created_at as reported_date, completed_date as resolved_date, priority, description
      FROM maintenance_orders
      WHERE site_id = $1 OR $1::integer IS NULL
      ORDER BY created_at DESC
      LIMIT 20
    `, [site_id || null]);

    const systemPrompt = 'You are a maintenance prediction AI for RV park infrastructure. Return JSON with: predictions (array of {item, urgency, predicted_date, estimated_cost, reasoning}), preventive_measures (array), overall_risk_score.';
    const userPrompt = `Site ID: ${site_id || 'All Sites'}
Site Age: ${site_age_years} years
Last Maintenance: ${last_maintenance}
Equipment: ${equipment_list}
Weather Conditions: ${weather_conditions}

RECENT MAINTENANCE HISTORY (from database):
${maintHistory.rows.map(m => `- ${m.type || 'General'}: ${m.description || 'N/A'}, Status: ${m.status}, Priority: ${m.priority}, Reported: ${m.reported_date}`).join('\n')}`;

    const { content } = await callOpenRouter(systemPrompt, userPrompt);
    const parsed = parseAIJson(content);
    await persistAIResult('maintenance-prediction', `site:${site_id} age:${site_age_years}`, content, parsed);

    res.json({ success: true, data: parsed || { raw_response: content }, raw_response: content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /occupancy-forecast — predict future bookings with promo recommendations
router.post('/occupancy-forecast', async (req, res) => {
  try {
    const horizon = parseInt(req.body?.horizon_days) || 30;
    const sites = await pool.query('SELECT COUNT(*) FROM sites').catch(() => ({ rows: [{ count: 0 }] }));
    const recent = await pool.query(`SELECT date_trunc('day', check_in_date) as day, COUNT(*) as cnt FROM reservations WHERE check_in_date >= NOW() - INTERVAL '90 days' GROUP BY 1 ORDER BY 1`).catch(() => ({ rows: [] }));
    const future = await pool.query(`SELECT date_trunc('day', check_in_date) as day, COUNT(*) as cnt FROM reservations WHERE check_in_date BETWEEN NOW() AND NOW() + INTERVAL '${horizon} days' GROUP BY 1 ORDER BY 1`).catch(() => ({ rows: [] }));
    const sys = 'You are a campground demand forecaster. Use historical bookings, on-the-books reservations, and seasonal patterns to project occupancy and recommend promotions to fill gaps. Return ONLY valid JSON.';
    const user = `Total sites: ${sites.rows[0].count}\nLast 90 days bookings:\n${JSON.stringify(recent.rows)}\nOn-the-books for next ${horizon} days:\n${JSON.stringify(future.rows)}\n\nReturn JSON: {forecast:[{date,predicted_occupancy_pct,confidence}], demand_drivers:[], soft_dates:[{date,deficit_pct,recommended_promo,expected_lift_pct}], peak_dates:[{date,recommended_premium_pct}], summary}.`;
    const { content } = await callOpenRouter(sys, user);
    const parsed = parseAIJson(content);
    await persistAIResult('occupancy-forecast', `horizon:${horizon}`, content, parsed);
    res.json({ success: true, data: parsed || { raw_response: content }, raw_response: content });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /upsell-recommendations — suggest add-ons by guest
router.post('/upsell-recommendations', async (req, res) => {
  try {
    const { guest_id, reservation_id } = req.body || {};
    let guest = null, reservation = null, history = [];
    if (guest_id) {
      const g = await pool.query('SELECT * FROM guests WHERE id = $1', [guest_id]).catch(() => ({ rows: [] }));
      guest = g.rows[0] || null;
      const h = await pool.query('SELECT id, check_in_date, check_out_date, site_id, total_amount FROM reservations WHERE guest_id = $1 ORDER BY check_in_date DESC LIMIT 5', [guest_id]).catch(() => ({ rows: [] }));
      history = h.rows;
    }
    if (reservation_id) {
      const r = await pool.query('SELECT * FROM reservations WHERE id = $1', [reservation_id]).catch(() => ({ rows: [] }));
      reservation = r.rows[0] || null;
    }
    const amenities = await pool.query('SELECT id, name, description, price FROM amenities ORDER BY id LIMIT 30').catch(() => ({ rows: [] }));
    const sys = 'You are a hospitality upsell AI. Suggest add-ons (firewood, propane, dump, longer stay, premium site) most likely to convert. Return ONLY valid JSON.';
    const user = `Guest: ${JSON.stringify(guest)}\nReservation: ${JSON.stringify(reservation)}\nHistory: ${JSON.stringify(history)}\nAvailable amenities:\n${JSON.stringify(amenities.rows)}\n\nReturn JSON: {recommendations:[{item,offer,price_suggestion,expected_attach_rate:0-1,why,timing:"booking|pre_arrival|on_arrival|on_property"}], suggested_bundle:{name,items:[],price,discount_pct}, message_drafts:[{channel:"sms|email|inapp",text}]}.`;
    const { content } = await callOpenRouter(sys, user);
    const parsed = parseAIJson(content);
    await persistAIResult('upsell-recommendations', `guest:${guest_id || ''} res:${reservation_id || ''}`, content, parsed);
    res.json({ success: true, data: parsed || { raw_response: content }, raw_response: content });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /cancellation-risk — predict no-shows / cancellations
router.post('/cancellation-risk', async (req, res) => {
  try {
    const { reservation_id } = req.body || {};
    if (!reservation_id) return res.status(400).json({ error: 'reservation_id is required' });
    const r = await pool.query('SELECT * FROM reservations WHERE id = $1', [reservation_id]).catch(() => ({ rows: [] }));
    if (!r.rows.length) return res.status(404).json({ error: 'reservation not found' });
    const reservation = r.rows[0];
    const guestHist = reservation.guest_id ? await pool.query('SELECT id, status, check_in_date FROM reservations WHERE guest_id = $1 ORDER BY check_in_date DESC LIMIT 10', [reservation.guest_id]).catch(() => ({ rows: [] })) : { rows: [] };
    const sys = 'You are a hospitality cancellation-risk AI. Predict the probability that this reservation will cancel or no-show, and recommend interventions. Return ONLY valid JSON.';
    const user = `Reservation:\n${JSON.stringify(reservation)}\n\nGuest history:\n${JSON.stringify(guestHist.rows)}\n\nReturn JSON: {risk_score:0-100, risk_band:"low|moderate|high|critical", drivers:[{factor,weight,evidence}], recommended_interventions:[{action,channel,timing}], expected_revenue_at_risk, retention_offer_suggestion, summary}.`;
    const { content } = await callOpenRouter(sys, user);
    const parsed = parseAIJson(content);
    await persistAIResult('cancellation-risk', `res:${reservation_id}`, content, parsed);
    res.json({ success: true, data: parsed || { raw_response: content }, raw_response: content });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /guest-segmentation — cluster guests into actionable marketing segments
router.post('/guest-segmentation', requireAIKey, async (req, res) => {
  try {
    const segments = parseInt(req.body?.num_segments) || 5;
    const guests = await pool.query('SELECT id, name, email, phone, created_at FROM guests ORDER BY id LIMIT 200').catch(() => ({ rows: [] }));
    const reservations = await pool.query(`SELECT guest_id, COUNT(*) as visits, SUM(total_amount) as total_spend, MAX(check_in_date) as last_stay FROM reservations WHERE guest_id IS NOT NULL GROUP BY guest_id LIMIT 200`).catch(() => ({ rows: [] }));
    const sys = 'You are a hospitality CRM AI. Cluster guests into actionable marketing segments based on lifetime value, recency, frequency, and behavior. Return ONLY valid JSON.';
    const user = `Sample guests:\n${JSON.stringify(guests.rows.slice(0, 50))}\n\nReservation aggregates:\n${JSON.stringify(reservations.rows.slice(0, 100))}\n\nCreate up to ${segments} segments. Return JSON: {segments:[{name,description,size_estimate,defining_traits:[],sample_guest_ids:[],recommended_offers:[{offer,channel,expected_uplift_pct}],retention_risk:"low|moderate|high"}], summary, methodology_notes}.`;
    const { content } = await callOpenRouter(sys, user);
    const parsed = parseAIJson(content);
    await persistAIResult('guest-segmentation', `segments:${segments}`, content, parsed);
    res.json({ success: true, data: parsed || { raw_response: content }, raw_response: content });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /staff-scheduling — propose a balanced staff schedule for a horizon
router.post('/staff-scheduling', requireAIKey, async (req, res) => {
  try {
    const horizon = parseInt(req.body?.horizon_days) || 7;
    const teamSize = parseInt(req.body?.team_size) || 6;
    const constraints = req.body?.constraints || '';
    const upcomingRes = await pool.query(`SELECT date_trunc('day', check_in_date) as day, COUNT(*) as arrivals FROM reservations WHERE check_in_date BETWEEN NOW() AND NOW() + INTERVAL '${horizon} days' GROUP BY 1 ORDER BY 1`).catch(() => ({ rows: [] }));
    const openMaint = await pool.query(`SELECT COUNT(*) as open FROM maintenance WHERE status IN ('open','in_progress')`).catch(() => ({ rows: [{ open: 0 }] }));
    const sys = 'You are a campground operations AI. Propose a balanced staff schedule that matches arrivals, maintenance load, and amenity coverage while respecting fairness and labor rules. Return ONLY valid JSON.';
    const user = `Horizon (days): ${horizon}\nTeam size: ${teamSize}\nUpcoming arrivals by day:\n${JSON.stringify(upcomingRes.rows)}\nOpen maintenance tickets: ${openMaint.rows[0].open}\nManager constraints: ${constraints}\n\nReturn JSON: {schedule:[{date,shifts:[{shift_name,start,end,required_roles:[{role,headcount}],notes}]}], coverage_assessment, fairness_notes, risks:[], recommended_swaps:[]}.`;
    const { content } = await callOpenRouter(sys, user);
    const parsed = parseAIJson(content);
    await persistAIResult('staff-scheduling', `horizon:${horizon} team:${teamSize}`, content, parsed);
    res.json({ success: true, data: parsed || { raw_response: content }, raw_response: content });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /amenity-demand-prediction — forecast demand per amenity with stocking/staffing recs
router.post('/amenity-demand-prediction', requireAIKey, async (req, res) => {
  try {
    const horizon = parseInt(req.body?.horizon_days) || 14;
    const amenities = await pool.query('SELECT id, name, description, price FROM amenities ORDER BY id LIMIT 50').catch(() => ({ rows: [] }));
    const recentBookings = await pool.query(`SELECT amenity_id, COUNT(*) as bookings FROM amenity_bookings WHERE created_at >= NOW() - INTERVAL '60 days' GROUP BY amenity_id`).catch(() => ({ rows: [] }));
    const upcomingArrivals = await pool.query(`SELECT date_trunc('day', check_in_date) as day, COUNT(*) as arrivals FROM reservations WHERE check_in_date BETWEEN NOW() AND NOW() + INTERVAL '${horizon} days' GROUP BY 1 ORDER BY 1`).catch(() => ({ rows: [] }));
    const sys = 'You are a campground amenity demand AI. Forecast usage per amenity and recommend stocking, staffing, and capacity adjustments. Return ONLY valid JSON.';
    const user = `Horizon (days): ${horizon}\nAmenities:\n${JSON.stringify(amenities.rows)}\nLast-60-day bookings by amenity:\n${JSON.stringify(recentBookings.rows)}\nUpcoming arrivals by day:\n${JSON.stringify(upcomingArrivals.rows)}\n\nReturn JSON: {forecast:[{amenity_id,amenity_name,predicted_demand_units,confidence,peak_dates:[],recommended_stocking,recommended_staffing,recommended_pricing_change_pct}], capacity_warnings:[], cross_sell_opportunities:[], summary}.`;
    const { content } = await callOpenRouter(sys, user);
    const parsed = parseAIJson(content);
    await persistAIResult('amenity-demand-prediction', `horizon:${horizon}`, content, parsed);
    res.json({ success: true, data: parsed || { raw_response: content }, raw_response: content });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
