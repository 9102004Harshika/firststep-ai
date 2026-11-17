# Deployment

## Backend (Render)

`render.yaml` defines a Node web service with root `backend/`.

Required env vars:

- `MONGODB_URI`
- `MONGODB_DB_NAME=firststep_ai`
- `ADMIN_API_KEY`
- `GEMINI_API_KEY`
- `CORS_ORIGIN` (frontend origin)
- optional `GROQ_API_KEY`, pricing, LLM model overrides

Health check: `/api/health`

## Frontend (Vercel)

Deploy the `frontend/` directory.

Set `VITE_API_BASE_URL` to the Render API origin.

Update `frontend/vercel.json` rewrite destination to the real API host.

## Scheduler (GitHub Actions)

Secrets:

- `FIRSTSTEP_API_BASE_URL`
- `FIRSTSTEP_ADMIN_API_KEY`

Schedule: `30 0 * * *` UTC (= 06:00 IST).

## Verification checklist

1. `/api/health` returns `ok: true`
2. `/api/stats` shows non-zero active jobs after ingestion
3. Frontend loads jobs without console CORS errors
4. Admin ingestion with wrong key returns 401
5. Cron dry-run via `workflow_dispatch`
