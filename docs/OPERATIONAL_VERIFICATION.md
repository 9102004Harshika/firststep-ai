# Operational verification checklist (submission priority)

**Status:** Production Actions refresh **PASS** (run `44248232834`). Credential rotation (Mongo/LLM) and Loom remain open.  
**Do not** retune the classifier or change the frozen 50 until remaining gates pass.  
**Next action:** finish credential rotation proof if ZIP was shared → record Loom.

**Evidence rule:** Do not mark a milestone complete because a command was triggered. Mark complete only when its evidence exists.

| Milestone | Status | Evidence required |
| --- | --- | --- |
| 1. Credential rotation | **Pending verification** | Old keys fail; Render/Actions/local updated (no secret values in docs) |
| 2. Production refresh | **PASS (2026-11-18)** | Actions run URL with ingestion **`partial`/`ok`** (not `locked`), classification completed, before/after `/api/stats` |
| 3. Loom walkthrough | **Pending verification** | Loom URL ≤5 min on deployed app |
| 4. Final submission checks | **Pending verification** | URLs pasted; tests/build green; repo + form links work |

Frozen eval (unchanged): Role **76%** · City **97.73%** · Experience **92%** · Fresher **84%** · Exact **58%**

**Order matters:** rotate credentials **before** triggering live Actions (so the run uses new secrets).

---

## 1. Secure credentials (FIRST)

Earlier project ZIP contained `.env` credentials. If those were real and the ZIP was shared, treat them as **exposed**.

Rotate in provider consoles — **never paste key values into chat, docs, Loom, or git.**

| Step | Where | Status |
| --- | --- | --- |
| Rotate MongoDB Atlas DB user password | Atlas → Database Access | **NOT VERIFIED** |
| Rotate OpenAI / Gemini / Groq keys used in prod | Provider consoles (revoke old) | **NOT VERIFIED** |
| Rotate `ADMIN_API_KEY` (long random) | Generate locally; never commit | **PASS** (strong key deployed to Render + Actions; value not recorded here) |
| Update Render env | Backend service env | **PASS** (service recreated with production env; value not recorded here) |
| Update Vercel env | Frontend (`VITE_API_BASE_URL` only — no LLM/Mongo keys) | **PASS** (API via vercel.json rewrite to Render) |
| Update GitHub Actions secrets | `FIRSTSTEP_API_BASE_URL`, `FIRSTSTEP_ADMIN_API_KEY` | **PASS** |
| Update local `.env` only (gitignored) | Developer machine | **PASS** (local admin key aligned; value not recorded here) |
| Prove old credentials fail | Atlas auth fail; LLM 401; admin 401 with old key | **NOT VERIFIED** |
| Never show secrets in Loom | — | Policy |

Repo check: `.env` is gitignored and not tracked on `origin`. That does **not** clear ZIP-exposure risk.

See `docs/SECURITY.md`.

---

## 2. Verify GitHub Actions (after rotation)

Workflow: `.github/workflows/daily-ingestion.yml`  
Schedule: `30 0 * * *` UTC + `workflow_dispatch`

### `ok` vs `locked` (critical for evidence)

| Outcome | Meaning | Acceptable for submission evidence? |
| --- | --- | --- |
| **`ok`** (completed run) | Ingestion/classification actually executed | **Yes** — required |
| **`locked`** | Another run holds `PipelineLock`; this trigger was **skipped** | **No** — not proof of a successful refresh |

The workflow YAML may exit green on `locked` so overlapping cron does not fail the schedule. **Do not treat that as verified daily refresh.** For evidence: wait for the lock to clear (or ensure no other run is active), re-dispatch, and capture a run whose logs show **`ok`**, successful classification, and meaningful before/after `/api/stats`.

| Check | How | Status |
| --- | --- | --- |
| Secrets set (new admin key) | Repo → Settings → Secrets | **PASS** (`FIRSTSTEP_API_BASE_URL`, `FIRSTSTEP_ADMIN_API_KEY`) |
| Stats before | `GET /api/stats` — note active / classified / pending | **PASS** (pre-run inventory was live; see run-day stats movement) |
| Manual run | Actions → Daily FirstStep AI Ingestion → Run workflow | **PASS** |
| Ingestion outcome | Log must show completed **`ok`**/`partial` (not only `locked`) | **PASS** — `Ingestion outcome: partial` |
| Classification outcome | Log must show completed **`ok`**/`partial` (not only `locked`) | **PASS** — `Classification outcome: partial` (441 succeeded) |
| Stats after | Compare counts; note any movement | **PASS** — `lastSuccessfulRefresh=2026-11-18T06:23:11.010Z`; classified rose substantially during refresh window |
| Evidence | Paste successful **Actions run URL** + keep log screenshots offline | **PASS** |

**Actions run URL:** https://github.com/9102004Harshika/firststep-ai/actions/runs/44248232834  

Notes: earlier failed/locked runs (missing secrets, weak admin key, Render ~15m proxy timeout) are fixed by strong `ADMIN_API_KEY`, Actions secrets, async ingestion start (`{"async":true}`), and polling `/api/ingestion/runs`. `partial` means some source boards failed while the run completed — acceptable evidence (not `locked`).

---

## 3. Record Loom (≤5 minutes, no secrets)

Deployed frontend + live API.

| Beat | Pass if |
| --- | --- |
| Search / listings | Jobs load; no CORS errors |
| India + early-career filters | Results change |
| Original employer link | Opens external posting |
| Classification on a job | Role / city / experience / fresher when classified |
| Analytics / ingestion funnel | Classified vs pending vs failed (coverage is partial) |
| Admin unauthenticated | Ingestion or classify → **401** |

**Loom URL:** _(paste here)_

---

## 4. Final readiness

1. Paste both URLs into this file and `docs/FINAL_BEEP_READINESS.md`.
2. Flip `NOT VERIFIED` → **PASS** only with that evidence.
3. Re-run automated tests + frontend production build.
4. Check submission form + repository links.

---

## 5. After ops — classification improvement (deferred)

1. Baseline: `evaluation/INDIA_BENCHMARK_ACCURACY_BASELINE_2026-11-17.md` (**76%** role — keep honest)
2. Errors: `evaluation/ROLE_ERROR_ANALYSIS.md` (six failure modes)
3. Held-out role-dev set → change logic → one re-score of frozen 50

---

## Sign-off

| Gate | Owner | Date | Evidence |
| --- | --- | --- | --- |
| Credential rotation | | | (no secret values) |
| Daily refresh live (`ok`/`partial`) | | 2026-11-18 | Actions URL: https://github.com/9102004Harshika/firststep-ai/actions/runs/44248232834 |
| Loom walkthrough | | | Loom URL: |
