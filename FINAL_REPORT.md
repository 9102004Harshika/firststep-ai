# FirstStep AI — Upgrade final report (Beep)

**Date:** 2026-11-17  
**Mode:** Upgrade existing repo (not a rebuild)

## 1. Engineering audit

See `docs/ENGINEERING_AUDIT.md`.

## 2. Critical defects fixed

1. **India geo bug** — early-career keywords no longer admit overseas jobs (GH/Ashby/SR/Lever).
2. **`Remote` as Indian city** — removed; overseas remote no longer auto-India.
3. **English `in` + remote heuristic** — removed.
4. **Sticky `indiaRelevant` OR** — now recomputed from latest payload.
5. **Discovery default** — `indiaRelevant=true`.
6. **Secrets packaging** — root `.gitignore`; `.env.example` placeholders; `docs/SECURITY.md` rotation guidance.
7. **Role Unknown collapse** — prompt v2 + sanitizer + title fallback; 100/100 India early jobs classified with **0% Unknown roles**.

## 3. Key files modified / added

- `backend/src/utils/indiaRelevance.js` (new)
- Adapters: `greenhouse.js`, `ashby.js`, `smartrecruiters.js`, `lever.js`
- `normalizeJob.js`, `upsertJobs.js`, `Job.js`
- `adminAuth.js`, `server.js`, `errorHandler.js`
- Frontend: `useJobs.js`, `JobDetailPage.jsx` (trust signals)
- Docs: `ENGINEERING_AUDIT.md`, `SECURITY.md`, `EVALUATION_METHODOLOGY.md`, `SOURCE_VERIFICATION.md`
- Evaluation: `india_benchmark_50.csv`, `ANNOTATION_GUIDE.md`, `MODEL_COMPARISON.md`, `COST_REPORT.md`
- Root `.gitignore`

## 4. Source verification

Latest ingest: **1145** jobs fetched post-geo-filter, **0** failed sources.  
Verified-add boards: Razorpay, Groww, Slice, TCS, Porter.  
Details: `docs/SOURCE_VERIFICATION.md`.

## 5. Actual unique India-relevant job count

| Metric | Count |
| --- | ---: |
| Active jobs | **1564** |
| `indiaRelevant=true` | **1071** (≥200 target) |
| India × early-career signal | **~82–134** (varies with classification updates) |

**Honest gap:** early-career India volume is below a soft 200 target after strict geo filtering. India-relevant inventory clears 200+. Expand campus-heavy boards next.

## 6. Classification results

- Prompt **v2**, provider OpenAI `gpt-4o-mini`
- Force-classified **100** India early-career jobs: **100 ok / 0 failed**
- Unknown role rate on that batch: **0%**
- Est. cost: **$0.0152** → **~$0.15 / 1k**

## 7. Human evaluation status

| Set | Status |
| --- | --- |
| Historical overseas hand-check | Documented failure (0% role) — retained |
| `india_benchmark_50.csv` | **50 rows exported**, human columns **blank** (not fabricated) |

## 8. Cost per 1,000

See `evaluation/COST_REPORT.md` — ~**$0.15–0.18 / 1k** successful classifications at current pricing config.

## 9. Tests

`npm test` (backend): **22 passed** (includes new India geo + overseas-intern rejection).

## 10. Frontend build

`npm run build --prefix frontend`: **success**.

## 11. Security status

- `.env` gitignored; do not redistribute ZIP with secrets.
- **Rotate** Atlas + LLM + admin keys if previously exposed in a ZIP/chat.
- Admin weak-key guard in production; error sanitization.

## 12. Deployment status

- App runs on Atlas `firststep_ai`.
- GitHub Actions workflow retained (secrets must be set in repo settings).
- Not claiming a live public production deploy beyond local API + Atlas.

## 13. Remaining blockers

1. Independent human labels on `india_benchmark_50.csv`.
2. Early-career India volume still shy of 200 — need more campus sources.
3. Full `verify:sources` JSON refresh optional for timestamped board table.
4. Credential rotation confirmation by human.
5. Model comparison A/B/C numeric table after labels.

## 14. Five likely live-coding asks

| Ask | Where |
| --- | --- |
| Tighten/loosen India remote rules | `utils/indiaRelevance.js` |
| Add employer board | `sourceRegistry.js` + probe HTTP 200 |
| Change role taxonomy / prompt | `constants.js` `CLASSIFICATION_PROMPT` |
| Recalculate accuracy | `evaluation/*` + `computeEvaluationMetrics` |
| Show geo evidence on cards | `JobCard.jsx` / `JobDetailPage.jsx` |
