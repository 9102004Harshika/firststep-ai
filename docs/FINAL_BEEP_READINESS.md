# Final Beep readiness

**Generated:** 2026-11-17  
**Mode:** Evidence from Atlas + repository scripts + frozen India-50 human evaluation (not an independent third-party audit of every live page)

## Overall

**Conditional PASS** on inventory, classification plumbing, and **human evaluation workflow**.  
**Biggest technical weakness:** role understanding (**76%**).  
**Biggest submission risk:** demonstrating a secure, live product (rotation → Actions → Loom).

| Area | Status |
| --- | --- |
| India-relevant ≥200 | **PASS** (1,678 prior inventory) |
| India × early-career ≥200 | **PASS** (374) |
| Geography-first filtering | **PASS** (Indiana `, IN` false-positive fixed) |
| Idempotent ingestion | **PASS** (prior dual-run evidence retained) |
| Classification operational (v2) | **PASS** (`openai/gpt-4o-mini`) |
| Human-labeled 50-post evaluation | **PASS** (50/50; row 3–4 audit documented) |
| Role accuracy | **76%** (baseline frozen — do not hide) |
| City accuracy | **97.73%** |
| Experience accuracy | **92%** |
| Fresher-eligibility accuracy | **84%** |
| Exact-match (all four) | **58%** (29/50) |
| Cost / 1k estimate | **PASS** (~$0.1507 / 1k successful v2) |
| Automated tests | **PASS** (geo + adapter tests; re-run before zip) |
| Frontend production build | **PASS** (prior; re-verify before submit) |
| Live search + filters + original links | **PASS** (product paths; URLs on jobs) |
| Daily refresh config | **PASS** (`.github/workflows/daily-ingestion.yml`) |
| Credential rotation after ZIP exposure | **NOT VERIFIED** |
| Daily refresh live on GitHub | **PASS** (Actions `44248232834`, ingestion/classification not `locked`) |
| Browser / Loom walkthrough | **NOT VERIFIED** |
| Admin authentication | **PASS** (prior 401 evidence) |

## Reviewer-facing risks (do not paper over)

### A. 76% role accuracy (weakest metric)

12/50 role predictions wrong. Six failure modes are documented in [`evaluation/ROLE_ERROR_ANALYSIS.md`](../evaluation/ROLE_ERROR_ANALYSIS.md): Operations→Other, mechanical/CAD→Software/UI/UX, “AI”/“Analyst” token hijack, Product Ops→PM, data-entry→Analytics, architecture→Unknown.

**Why it happens:** tool lists and title buzzwords outweigh responsibility verbs.  
**Intended fix (deferred):** responsibility-based prompts + negative examples on a **held-out** set — not retuning on these 50.  
**Present honestly** alongside strong city (97.73%) and experience (92%).

### B. Operational verification incomplete

Live GitHub Actions refresh is verified (`44248232834`). Full Mongo/LLM credential rotation proof and Loom walkthrough remain open — see `docs/OPERATIONAL_VERIFICATION.md`.

### C. Classification coverage is partial

| Slice | Count |
| --- | ---: |
| India-relevant active (searchable inventory) | **1,678** |
| India × early-career (product filter) | **374** |
| Classified ∩ India (any prompt) | **276** |
| Classified ∩ India (prompt v2) | **246** |
| Pending ∩ India | **1,372** |
| Failed ∩ India | **30** |

Jobs can appear in search from inventory **before** LLM fields exist. Do **not** imply all 1,678 India jobs are fully classified. Dashboard distinguishes classified / pending / failed.

## Honest evaluation read-out

Frozen baseline: [`evaluation/INDIA_BENCHMARK_ACCURACY_BASELINE_2026-11-17.md`](../evaluation/INDIA_BENCHMARK_ACCURACY_BASELINE_2026-11-17.md)  
Role-error analysis: [`evaluation/ROLE_ERROR_ANALYSIS.md`](../evaluation/ROLE_ERROR_ANALYSIS.md)  
Row 3–4 audit: [`evaluation/ROW3_ROW4_AUDIT.md`](../evaluation/ROW3_ROW4_AUDIT.md)

Exact-match **58%** (29/50). Evaluation discipline is a strength; role understanding is the technical gap.

## Requirement checklist

| Requirement | Status | Notes |
| --- | --- | --- |
| 200+ unique active India-relevant jobs | **PASS** | Inventory report |
| 200+ India early-career | **PASS** | 374 product definition |
| Do not loosen geography | **PASS** | Stricter after Indiana fix |
| Preserve fresher vs internship vs experienced | **PASS** | Distinct fields; apprenticeships → Fresher in human guide |
| 50-post human evaluation | **PASS** | 50 labeled; exclusions logged |
| Accuracy reported separately | **PASS** | Role / city / experience / fresher / exact |
| Classification coverage for all India jobs | **PARTIAL** | Early prioritized; backlog remains |
| Dashboard funnel | **PASS** | Classified / pending / failed |
| Provider/model attribution | **PASS** | |
| Token / cost estimate | **PASS** | |
| No fabricated accuracy | **PASS** | Baseline = measured human GT |
| Original application links | **PASS** | |
| Credential rotation | **NOT VERIFIED** | ZIP may have exposed `.env` |
| Daily refresh live | **PASS** | https://github.com/9102004Harshika/firststep-ai/actions/runs/44248232834 |
| Loom walkthrough | **NOT VERIFIED** | Paste Loom URL |

## Priority order (do not invert)

1. **Credential rotation** — treat ZIP `.env` as exposed; rotate Mongo / LLM / admin keys; update Render, Vercel, GitHub Actions; prove old keys fail (`docs/OPERATIONAL_VERIFICATION.md` §1).
2. **Daily refresh live** — `workflow_dispatch` with **new** secrets; require completed **`ok`** (not `locked`); save Actions run URL + before/after `/api/stats`.
3. **Loom walkthrough** (≤5 min, no secrets) — search, filters, original links, classification, analytics, admin 401; save Loom URL.
4. **Flip readiness** — only change NOT VERIFIED → PASS when those URLs exist in `OPERATIONAL_VERIFICATION.md`.
5. **Role-error remediation (later)** — held-out dev set; not the frozen 50.
6. **One re-score** of the frozen 50 — report delta beside baseline.

## Reproduce evaluation

```bash
node backend/src/scripts/scoreIndiaBenchmark.js
# writes evaluation/INDIA_BENCHMARK_ACCURACY.md
# baseline copy: evaluation/INDIA_BENCHMARK_ACCURACY_BASELINE_2026-11-17.md
```

## Human actions still required

1. **Rotate exposed credentials** (MongoDB password, LLM API keys, `ADMIN_API_KEY`); update Render / Vercel / GitHub secrets; verify old credentials fail.
2. Run GitHub Actions `workflow_dispatch`; paste run URL into `OPERATIONAL_VERIFICATION.md`.
3. Record Loom (≤5 min, no secrets); paste Loom URL into `OPERATIONAL_VERIFICATION.md`.
4. Optionally re-run vitest + frontend production build before packaging ZIP.

| Artifact | URL |
| --- | --- |
| GitHub Actions run | https://github.com/9102004Harshika/firststep-ai/actions/runs/44248232834 |
| Loom walkthrough | _(pending)_ |
