# Project Memory — Macro Mate

Accumulated facts, decisions, constraints, and next steps. Newest entries at the bottom.

## Project Memory Update — 2026-06-12 (initial build + v1.1 + v1.2)

### Facts
- Macro Mate: personal macro-tracking PWA for the owner's iPhone (Safari → Add to Home Screen). Live at https://riprivalovberk.github.io/macro-mate/
- Stack: Vite + React 19 + TypeScript, Dexie (IndexedDB) for entries, localStorage for settings, `@anthropic-ai/sdk` (≥0.104) called directly from the browser with `dangerouslyAllowBrowser: true`, vite-plugin-pwa.
- AI analysis (`src/lib/ai.ts`): vision + structured outputs (`output_config.format` json_schema), adaptive thinking on Opus/Sonnet 4.6+ models only; default model `claude-opus-4-8`, picker offers Sonnet 4.6 / Haiku 4.5. Photos resized to ≤1280px JPEG client-side (`src/lib/image.ts`).
- Tests: Vitest + Testing Library + fake-indexeddb; 68 tests. CI: `.github/workflows/deploy.yml` tests + builds + deploys to Pages on push to `master` (BASE_PATH=/macro-mate/).

### Decisions
- All data on-device only; user's own Anthropic API key stored in localStorage; JSON export/import is the backup story.
- Goals: Mifflin–St Jeor TDEE calculator (cut −20% / maintain / bulk +10%; protein 2.0/1.6/1.8 g/kg), all targets user-editable. Tracked nutrients: kcal, protein, carbs, fat, fiber, sugar (limit), sodium (limit, 2300 mg).
- Nutrition score (`src/lib/score.ts`): 0–100 = calories closeness 30 + protein 25 + fiber 15 + carbs 10 + fat 10 + sugar 5 + sodium 5; reasons list with ✅/❌.
- UI: metric cycling (tap ring or any entry's number cycles kcal→P→C→F→fiber→sugar→sodium, persisted); macro bars tap-toggle grams ↔ % of calories (4/4/9); meal grouping Breakfast/Lunch/Dinner/Snacks; system dark/light theme; imperial default with metric toggle.
- Quick suggestions are meal-aware: ranked by frequency at the selected meal, then overall frequency, then recency (`quickFoods(limit, meal)`).
- Multi-image analysis: several screenshots + optional photos in one request; review step has "Refine with AI" (extra text feedback and/or extra images re-runs analysis with previous estimate as context via `revision` param).

### Constraints / gotchas
- GitHub Pages had to be enabled manually once (Settings → Pages → Source: GitHub Actions); workflow token cannot create the Pages site (`configure-pages` enablement fails with "Resource not accessible by integration" — kept `enablement: true` anyway, harmless now).
- Deploy only runs on `master`; merge via PR. PWA updates apply on next app launch (sometimes needs one extra relaunch).
- User prefers efficient, token-light sessions; one-shot implementations with tests; asks for 10 clarifying questions before big builds.

### Next steps / ideas (user-approved backlog)
- Weekly nutrition-score trend in History tab; streaks (consecutive days hitting protein/calories).
- "Finish the day" AI suggestions (e.g. 40g protein short → options from frequent foods).
- User's email: richardcprivalov@gmail.com (session context).
