# Data sources

## Policy

We only use publicly accessible, permitted employer job-board APIs:

- [Greenhouse Job Board API](https://developers.greenhouse.io/job-board.html)
- [Lever Postings API](https://github.com/lever/postings-api)
- [Ashby public posting API](https://developers.ashbyhq.com/)
- [SmartRecruiters postings API](https://developers.smartrecruiters.com/docs/listposts)

We do **not** scrape LinkedIn, Indeed, Naukri, or other restricted aggregators.

## Registry

`backend/src/services/ingestion/sourceRegistry.js` is the source of truth.

Board IDs are enabled only after a live HTTP probe succeeds. Invented or guessed board tokens stay `enabled: false`.

## Filtering strategy (geography-first)

Implemented in `backend/src/utils/indiaRelevance.js` via `shouldIngestJob` / `evaluateIndiaGeography`.

**Critical rule:** early-career keywords (intern, fresher, graduate, junior, campus, …) **never** independently qualify a job as India-relevant or keep an overseas posting.

Admission / `indiaRelevant` requires geographic evidence:

1. Explicit Indian city (taxonomy / aliases), and/or
2. Explicit India / Bharat in the location field, and/or
3. Remote **plus** India eligibility evidence (`Remote - India`, India-based remote, open to candidates in India, …)

Rejected examples:

- `Product Design Intern` in San Francisco (intern keyword only)
- `Remote` with no India co-signal
- Generic “customers in India” boilerplate without employment eligibility

Registry `countryRelevance` values:

| Value | Meaning |
| --- | --- |
| `india` | India-priority / India-native boards — still drop clear overseas locations; empty location may be kept for JD-level geo checks |
| `india-hiring` | Global boards — **geo evidence required** to keep |
| `unknown` | Disabled / experimental |

Early-career signals are a **separate product filter** (internship / fresher / title heuristics) applied after India relevance — not a substitute for geography.

## Adding a source

1. Confirm the public API responds with jobs (`HTTP 200`).
2. Append a registry row with employer, provider, boardId, sourceUrl, `enabled: true`.
3. Re-run ingestion (`POST /api/admin/ingestion/run` or `npm run ingest`).
4. Confirm counts in `/api/analytics/ingestion` and `docs/FINAL_DATA_INVENTORY.md`.

## Observed verification notes

- Many guessed Greenhouse slugs returned HTTP 404 and remain disabled.
- Lever adapter is implemented; demo board stays disabled until a live board ID is confirmed.
- SmartRecruiters `Freshworks` / `Swiggy` return large India inventories; overseas-only rows are still geo-filtered.
- Timestamped verification: `docs/SOURCE_VERIFICATION.md`.
