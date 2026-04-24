const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const fetch = require('node-fetch');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

async function callOpenRouter(systemPrompt, userPrompt) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3001',
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
  return content;
}

function parseAIResponse(content) {
  try {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return { success: true, data: JSON.parse(jsonMatch[1].trim()), raw_response: content };
    }
    // Try direct JSON parse
    return { success: true, data: JSON.parse(content), raw_response: content };
  } catch (e) {
    return { success: true, data: { raw_response: content }, raw_response: content };
  }
}

// POST /dynamic-pricing
router.post('/dynamic-pricing', auth, async (req, res) => {
  try {
    const { site_id, season, events_nearby, weather, current_rate } = req.body;
    const systemPrompt = 'You are an AI pricing analyst for an RV park. Analyze the following data and suggest optimal pricing. Return a JSON object with: suggested_rate, confidence, reasoning, factors_considered (array), rate_range (min/max).';
    const userPrompt = `Site ID: ${site_id}\nSeason: ${season}\nEvents Nearby: ${events_nearby}\nWeather: ${weather}\nCurrent Rate: $${current_rate}`;

    const content = await callOpenRouter(systemPrompt, userPrompt);
    const result = parseAIResponse(content);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /review-response
router.post('/review-response', auth, async (req, res) => {
  try {
    const { review_text, rating, guest_name } = req.body;
    const systemPrompt = 'You are a professional RV park manager responding to guest reviews. Write a warm, professional response. Return JSON with: response_text, sentiment_analysis, key_points_addressed (array), tone.';
    const userPrompt = `Guest Name: ${guest_name}\nRating: ${rating}/5\nReview: ${review_text}`;

    const content = await callOpenRouter(systemPrompt, userPrompt);
    const result = parseAIResponse(content);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /activity-recommendations
router.post('/activity-recommendations', auth, async (req, res) => {
  try {
    const { location, season, guest_preferences, family_friendly } = req.body;
    const systemPrompt = 'You are a local activity expert for RV park guests. Recommend activities and attractions. Return JSON with: recommendations (array of {name, description, distance, cost_estimate, suitable_for, rating}), seasonal_highlights, tips.';
    const userPrompt = `Location: ${location}\nSeason: ${season}\nGuest Preferences: ${guest_preferences}\nFamily Friendly: ${family_friendly}`;

    const content = await callOpenRouter(systemPrompt, userPrompt);
    const result = parseAIResponse(content);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /site-matching
router.post('/site-matching', auth, async (req, res) => {
  try {
    const { rig_type, rig_length, slides, amp_needed, needs_sewer, budget_per_night } = req.body;
    const systemPrompt = 'You are an RV park site matching expert. Based on the rig specifications, recommend the best sites. Return JSON with: recommended_sites (array of {site_type, why_suitable, features_matched}), considerations, tips_for_setup.';
    const userPrompt = `Rig Type: ${rig_type}\nRig Length: ${rig_length} ft\nSlides: ${slides}\nAmp Needed: ${amp_needed}\nNeeds Sewer: ${needs_sewer}\nBudget Per Night: $${budget_per_night}`;

    const content = await callOpenRouter(systemPrompt, userPrompt);
    const result = parseAIResponse(content);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /marketing-content
router.post('/marketing-content', auth, async (req, res) => {
  try {
    const { campaign_type, season, target_audience, special_offers } = req.body;
    const systemPrompt = 'You are a marketing expert for RV parks. Create compelling marketing content. Return JSON with: headline, body_copy, call_to_action, social_media_post, email_subject, key_selling_points (array).';
    const userPrompt = `Campaign Type: ${campaign_type}\nSeason: ${season}\nTarget Audience: ${target_audience}\nSpecial Offers: ${special_offers}`;

    const content = await callOpenRouter(systemPrompt, userPrompt);
    const result = parseAIResponse(content);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /maintenance-prediction
router.post('/maintenance-prediction', auth, async (req, res) => {
  try {
    const { site_id, site_age_years, last_maintenance, equipment_list, weather_conditions } = req.body;
    const systemPrompt = 'You are a maintenance prediction AI for RV park infrastructure. Analyze the data and predict maintenance needs. Return JSON with: predictions (array of {item, urgency, predicted_date, estimated_cost, reasoning}), preventive_measures (array), overall_risk_score.';
    const userPrompt = `Site ID: ${site_id}\nSite Age: ${site_age_years} years\nLast Maintenance: ${last_maintenance}\nEquipment: ${equipment_list}\nWeather Conditions: ${weather_conditions}`;

    const content = await callOpenRouter(systemPrompt, userPrompt);
    const result = parseAIResponse(content);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
