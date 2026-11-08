# Spendemon roadmap

## Phase 1 — "Pay. Save. Evolve." upgrade (done)
- [x] Answer: where to see the preview
- [x] Database: savings goals, PayPal ledger (extend shop_orders), inventory, milestone rewards, webhook events, atomic credit function
- [x] PayPal engine: goal contributions + shop through one verified capture path; webhook route with signature check + dedup
- [x] Save-to-Level page (/goals)
- [x] AI Purchase Guardian before Loot Shop checkout
- [x] Monster Marketplace with server inventory
- [x] Transaction Vault page (/vault)
- [x] Quests: savings/review quests, difficulty; XP from verified milestones claimed once
- [x] AI Financial Insights card
- [x] Dashboard: PayPal savings quest, recent transactions, demo journey checklist

## Phase 2 — Demo/judge-ready brief
- [ ] 1. PayPal flow polish: return page states + XP celebration, webhook/return reconciliation, setup-needed notice, /api/public/paypal-health, "Test mode" note
- [ ] 2. Goals (ring, countdown, milestone markers, completed section), Vault (date filter, detail drawer + timeline), Dashboard total saved, Guardian labels/non-blocking
- [ ] 3. Demo mode (start/reset demo journey, own data only) + first-run guided tour
- [ ] 4. Reliability: install/build/lint/tests, pin loose deps, new tests, per-route error boundaries
- [ ] 5. Docs: README for judges, roadmap, docs/DEMO_SCRIPT.md
- [ ] 6. UI polish: 360px mobile, skeletons/empty states/toasts, monster assets
