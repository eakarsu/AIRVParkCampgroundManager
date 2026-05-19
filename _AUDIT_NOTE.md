# Audit Note — AIRVParkCampgroundManager

## Original audit recommendations (batch_07.md §21)

**Missing AI endpoints:** `/cancellation-risk`, `/upsell-recommendations`, `/guest-segmentation`, `/occupancy-forecast`, `/staff-scheduling`, `/amenity-demand-prediction`.

**Missing non-AI features:** online booking integration, guest comms automation, housekeeping/maintenance ticketing, payment processor integration, loyalty automation.

**Custom suggestions:** dynamic pricing, guest LTV maximization, occupancy forecasting & promos, maintenance routing, amenity demand forecasting, review-responsive marketing.

## Implemented this pass (3 mechanical)
1. `POST /api/ai/occupancy-forecast` — N-day occupancy forecast over historical + on-the-books reservations with promo recs for soft dates.
2. `POST /api/ai/upsell-recommendations` — guest+reservation+amenities → ranked add-on suggestions with channel-specific message drafts.
3. `POST /api/ai/cancellation-risk` — risk band + drivers + retention interventions for a specific reservation.

All three reuse `callOpenRouter`, `parseAIJson`, `persistAIResult`, `auth`, `aiRateLimiter`. Syntax-checked.

## Backlog (prioritized)
1. `POST /api/ai/guest-segmentation` (mechanical follow-up).
2. `POST /api/ai/staff-scheduling` (mechanical).
3. `POST /api/ai/amenity-demand-prediction` (mechanical).
4. Online booking integration (NEEDS-PRODUCT-DECISION + payment gateway).
5. Guest comms automation (NEEDS-CREDS — Twilio/SendGrid).
6. Housekeeping ticketing (mechanical CRUD).

## Apply pass 3 (frontend)

LEFT-AS-IS. The Vite/React frontend already covers every backend AI endpoint 1:1:
- `frontend/src/App.jsx` registers all 9 `/ai/*` routes under `ProtectedRoute` (JWT gate via `localStorage.getItem('token')`).
- 9 per-tool pages: `AIDynamicPricing`, `AIReviewResponse`, `AIActivityRecommendations`, `AISiteMatching`, `AIMarketingContent`, `AIMaintenancePrediction`, `AIOccupancyForecast`, `AIUpsellRecommendations`, `AICancellationRisk`.
- The pass-2 additions (`occupancy-forecast`, `upsell-recommendations`, `cancellation-risk`) all have their dedicated FE pages.

No FE files modified. Idempotent.

## Apply pass 4 (mechanical backlog)

LEFT-AS-IS. The three remaining mechanical AI items from the pass-2 backlog (`guest-segmentation`, `staff-scheduling`, `amenity-demand-prediction`) are now fully wired end-to-end:
- BE: `backend/routes/ai.js` POST handlers at lines 317/332/349, all gated by `requireAIKey` → HTTP 503 when `OPENROUTER_API_KEY` is unset, reusing `callOpenRouter`/`parseAIJson`/`persistAIResult`/`auth`/`aiRateLimiter`.
- FE: dedicated pages `AIGuestSegmentation.jsx`, `AIStaffScheduling.jsx`, `AIAmenityDemandPrediction.jsx` with JWT-bearer fetch and 503 handling.
- Routing: `App.jsx` registers `/ai/guest-segmentation`, `/ai/staff-scheduling`, `/ai/amenity-demand-prediction` under `ProtectedRoute`.

Remaining backlog is non-mechanical: online booking integration (NEEDS-PRODUCT-DECISION + payment gateway), guest comms automation (NEEDS-CREDS — Twilio/SendGrid), housekeeping ticketing CRUD (non-AI; out of AI-Center scope for pass 4). No files modified.
