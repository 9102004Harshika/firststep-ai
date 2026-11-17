# FirstStep AI — Engineering Audit

**Date:** 2026-11-17  
**Scope:** Existing repository upgrade (no greenfield rebuild)  
**Priority order:** P0 security + India geo → sources → classification → ops → UI

## Critical defects found and fixed

| ID | Severity | Finding | Affected files | Correction | Evidence |
| --- | --- | --- | --- | --- | --- |
| C1 | Critical | Early-career keywords OR’d into adapter keep → SF Intern entered India pipeline | `adapters/greenhouse.js`, `ashby.js`, `smartrecruiters.js` | Shared `shouldIngestJob` — geography only | `tests/indiaRelevance.test.js`, `tests/adapters.test.js` |
| C2 | Critical | `Remote` treated as Indian city | `constants.js`, `cities.js` | Removed Remote from city taxonomy | unit tests |
| C3 | Critical | `\b(in\|ind)\b` + remote/office false positive | `utils/cities.js` → `indiaRelevance.js` | Deleted heuristic; strict eligibility phrases | unit tests |
| C4 | Critical | Secrets shipped in ZIP / no root `.gitignore` | repo root | Root `.gitignore`, `.env.example` placeholders only | files present |
| H1 | High | Sticky `indiaRelevant = incoming \|\| existing` | `upsertJobs.js` | Always recompute from latest payload | code |
| H2 | High | UI default did not require `indiaRelevant` | `useJobs.js` | Default `indiaRelevant: true` | code |
| H3 | High | Lever had no geo filter | `adapters/lever.js` | Same `shouldIngestJob` gate | code |
| H4 | High | Historical eval 0% role / non-India sample | `evaluation/*` | Preserve old report; new `india_benchmark_50` workflow | docs |
| M1 | Medium | Weak admin key allowed in prod | `adminAuth.js`, `server.js` | Reject weak keys; CORS/body limits | code |

## Reproduction (C1 — before fix)

1. Greenhouse board with `countryRelevance: 'india-hiring'`.
2. Job title `Product Design Intern`, location `San Francisco`.
3. Pre-fix adapter returned the job because `/intern/` matched.
4. Default UI (`earlyCareer=true`, `indiaRelevant=false`) displayed it.

## Expected behavior (after fix)

1. Adapter drops overseas-only roles regardless of intern/fresher keywords.
2. `indiaRelevant` requires city/country/`india_remote` evidence.
3. Discovery defaults to India-relevant listings only.

## Security actions required by human

If the earlier ZIP contained a real `.env`, **rotate immediately**:

- MongoDB Atlas user password
- Gemini / OpenAI / Groq API keys
- `ADMIN_API_KEY`

Do **not** commit `.env`. Local `.env` is gitignored; only `.env.example` should be shared.

## Remaining work (tracked)

- Live source verification report (`npm run verify:sources`)
- Re-ingest under new geo rules + classify India-relevant set with prompt v2
- New 50-post India benchmark with blank human labels (no fabricated labels)
- Cost optimization experiment write-up after new evaluation

## Honesty note

Historical `evaluation/HANDCHECK_REPORT.md` (0% role accuracy, overseas-heavy sample) is retained as a failure record — not as a success claim.
