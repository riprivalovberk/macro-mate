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

## Project Memory Update — 2026-06-12 (session 4: grounding + water)

### New facts
- v1.4: text-described foods are grounded via OpenFoodFacts (`src/lib/foodlookup.ts`) — free CORS API, per-serving preferred over per-100g, sodium g→mg; best-effort with 4s timeout, never blocks analysis. Injected as "Verified nutrition data" prompt block (`groundingData` on AnalyzeInput).
- System prompt now forbids inventing ungrounded nutrient values (use 0 + note) — fixes the Izze phantom-sodium bug.
- Water tracking: opt-in (Settings → Goals → "Track water", default off), slim 💧 −/+ row in the dashboard card, cups (8 oz), goal editable (default 8), Dexie schema v2 `water` table keyed by date, included in backups. Test count: 76.

### Decisions
- Chose OpenFoodFacts over Claude web-search tool (free/fast vs per-lookup cost; web search also conflicts with structured outputs) — user confirmed via Q&A.
- Lookup only runs for the "Describe it" flow, not photo or refine flows.

### Next steps
- Backlog: weekly score trend, streaks, "finish the day" AI suggestions; possibly extend grounding to photo flow when a brand is visible.

## Project Memory Update — 2026-06-12 (session 5: liquids + score water/alcohol)

### New facts
- v1.5: fifth meal category **Liquids** (`Meal` union + `MEALS`/`MEAL_LABELS`) for drinks logged through the day; appears as its own card on Today and in both meal pickers (`.seg.seg-meals` shrinks the 5-button picker font to 11.5px so it fits on iPhone).
- Alcohol tracking: opt-in (Settings → Goals → "Track alcohol", default off), 🍸 −/+ standard-drinks row in dashboard (mirrors water; shared `CounterRow` component in `Today.tsx`), editable daily limit (default 2 standard drinks), Dexie schema v3 `alcohol` table keyed by date, included in backups.
- Nutrition score now takes optional extras (`ScoreExtras` in `src/lib/score.ts`): when water tracking is on, hydration is a 10-pt component ("Hydrated" / "Drink more water"); when alcohol tracking is on, the limit is a 10-pt component like sugar/sodium ("No alcohol" / "Alcohol within limit" / "Too much alcohol", credit fades to 0 at limit + max(limit,1) drinks). Total is normalized back to 0–100. Untracked → behaviour unchanged.
- Test count: 83.

### Decisions
- Alcohol is a simple drinks tally like water (not per-entry alcohol grams); caloric drinks (beer, wine, cocktails) can additionally be logged as food entries under Liquids for their kcal/carbs.
- Score extras use earned/possible normalization rather than reshuffling the base 100-point weights.

## Project Memory Update — 2026-06-13 (session 6: non-food image bug)

### Bug fixed
- Non-food photos (`src/lib/ai.ts`) used to burn tokens and never surface "no food identified." Two causes: (1) the system prompt framed the task as always estimating food, so with adaptive thinking on `claude-opus-4-8` (`max_tokens: 8000`) the model deliberated until it hit `max_tokens`; (2) `analyzeFood` never checked `stop_reason === 'max_tokens'`, so a truncated/thinking-only response surfaced as a confusing "no answer"/"unreadable" error after a long wait.

### Changes
- System prompt now opens with a short-circuit rule: decide first whether the input contains food/drink/nutrition info; if not, immediately return `{"items": [], "notes": "No food identified in the image."}` without deliberating. The UI (`AddFlow.tsx:97`) already shows `analysis.notes` for empty items.
- New exported pure helper `stopReasonError(stopReason)` in `ai.ts` maps `refusal` and `max_tokens` to user-facing messages (max_tokens → "Couldn't identify the food — the analysis ran long…"). `analyzeFood` now uses it (replaces the old inline refusal check).
- Tests: +3 in `ai.test.ts` for `stopReasonError`; total 86 (was 83).

### Next steps
- Backlog unchanged: weekly score trend, streaks, "finish the day" AI suggestions; extend grounding to photo flow when a brand is visible.
