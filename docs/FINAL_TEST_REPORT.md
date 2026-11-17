# Final test report

**Generated:** 2026-11-17

## Automated unit/integration tests

Command:

```bash
npm test --prefix backend
```

Result:

```
Test Files  6 passed (6)
Tests  22 passed (22)
```

Includes:

- India geography (overseas intern rejection, Remote-not-city, English `in` false positive)
- Greenhouse overseas intern filter
- Normalization, adapters, classification schema, cost math, admin auth

## Frontend production build

```bash
npm run build --prefix frontend
```

Result: **success** (Vite build completed).

## Live API smoke (Atlas-backed, 2026-11-17)

| Check | Result |
| --- | --- |
| `GET /api/health` | OK |
| `GET /api/jobs?indiaRelevant=true&earlyCareer=true` | OK (feed total measured) |
| Job detail + `jobUrl` present | OK |
| `GET /api/analytics/cost` | OK (`costPer1000` returned) |
| Admin without key | **401** |
| Dual ingestion idempotency | Run2 `newRecords=0` (see acceptance report) |
| Overseas intern unit gate | PASS in `indiaRelevance` / `adapters` tests |

## Status

| Gate | Status |
| --- | --- |
| Automated tests | **PASS** |
| Frontend build | **PASS** |
| End-to-end browser UI click-through | **NOT VERIFIED** (API-level smoke only in this sprint) |
| Lint suite | **NOT VERIFIED** (no dedicated lint script run claimed) |
