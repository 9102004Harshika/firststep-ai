# Failure handling

## Ingestion

- Per-source try/catch: failures are recorded in `IngestionRun.sourceResults` and the run continues.
- HTTP retries with exponential backoff for 408/429/5xx.
- Request timeouts via `INGESTION_REQUEST_TIMEOUT_MS`.
- Database lock prevents overlapping ingestion runs.

## Classification

- Malformed JSON → retry.
- Provider outage → optional fallback provider.
- Final failure → `classification.status = failed` with error text; job remains searchable with Unknown fields.

## API

- Zod validation for query params (400).
- Admin routes require `x-admin-api-key`.
- Central error middleware returns structured JSON; errors are logged server-side.

## Scheduler

GitHub Actions fails the workflow on genuine ingestion/classification failure (`ok: false` and status not `locked`).
