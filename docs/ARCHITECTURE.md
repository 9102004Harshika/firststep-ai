# Architecture

## Overview

FirstStep AI is a monorepo with a Node/Express ingestion + classification API and a React dashboard.

## Data flow

1. **Source registry** lists verified employer board identifiers.
2. **Adapters** fetch public JSON from Greenhouse, Ashby, SmartRecruiters (and Lever when enabled).
3. **Adapters** apply **geography-first** admission (`shouldIngestJob`). Early-career keywords never keep overseas jobs.
4. **Normalization** maps provider payloads into one schema, strips HTML, canonicalizes URLs, computes `indiaRelevant` + `geographicEvidence`.
5. **Deduplication** upserts by `(source, externalId)`, then `canonicalUrl`, then company+title+location fingerprint; `indiaRelevant` is recomputed (not sticky-OR).
6. **MongoDB** stores jobs, ingestion runs, classification runs, evaluation labels, and pipeline locks.
7. **LLM classification** updates role, cities, experience, employment type, fresher eligibility with token/cost logging (prompt versioned).
8. **API** exposes search/filter (default discovery: India-relevant), analytics, pipeline health, and admin triggers.
9. **GitHub Actions** calls admin endpoints daily (idempotent, lock-protected).

## Process model

- Ingestion and classification use MongoDB-backed locks (`PipelineLock`) so overlapping cron/admin runs do not corrupt state.
- Adapters fail independently; one bad board does not abort the run (`partial` status).
- Classification skips unchanged content hashes + prompt versions to avoid re-paying for the same posts.

## Key modules

| Path | Responsibility |
| --- | --- |
| `backend/src/services/ingestion/` | Registry, adapters, normalize, dedupe, orchestrator |
| `backend/src/services/classification/` | Provider abstraction + batch runner |
| `backend/src/services/analytics/` | Stats, cost, pipeline health |
| `backend/src/services/evaluation/` | CSV export/import + metrics |
| `frontend/src/` | Discovery UI, analytics, health |

## Trade-offs

- Prefer verified public ATS APIs over scrapers (ToS + reliability).
- Filter global boards with **India geographic evidence** before fetching full JD bodies; early-career is orthogonal.
- MongoDB Atlas is the production target; local mongo helpers are opt-in only (`USE_LOCAL_MONGO=1`).
