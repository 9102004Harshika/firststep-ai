# Final classification report

**Generated:** 2026-11-17T12:03:18.894Z

## Operational results (India-relevant, prompt v2)

| Metric | Value |
| --- | ---: |
| Classified (any prompt) ∩ India | 276 |
| Classified prompt **v2** ∩ India | 246 |
| Failed ∩ India | 30 |
| Pending ∩ India | 1372 |
| Unknown role rate (v2) | 0.0163 |
| Unknown city rate (v2)* | 0.1667 |
| Tokens in / out (v2 sum) | 273561 / 24314 |
| Est. cost (v2 sum) | $0.0370817 |
| Est. cost / 1k success (v2) | $0.150739 |

\* Empty city arrays can be valid when India is country-level / remote-India without a city token.

### Role mix (v2 India)

| Role | Count |
| --- | ---: |
| Software Development | 54 |
| Other | 51 |
| Machine Learning / AI | 20 |
| Human Resources | 19 |
| Operations | 18 |
| UI/UX Design | 14 |
| Product Management | 12 |
| Finance | 9 |
| Customer Support | 9 |
| Data Analytics | 9 |
| Marketing | 8 |
| Cybersecurity | 5 |
| DevOps / Cloud | 5 |
| Business Development | 5 |
| Unknown | 4 |
| Sales | 3 |
| Data Science | 1 |

### Provider / model (v2 India)

| Provider/Model | Count |
| --- | ---: |
| openai/gpt-4o-mini | 246 |

## Coverage precision (do not overclaim)

- **Searchable India inventory:** 1,678 active India-relevant jobs (may appear in UI without LLM labels).
- **Fully classified ∩ India:** 276 (246 prompt v2).
- **Pending ∩ India:** 1,372 — early-career prioritized; backlog remains.
- **Failed ∩ India:** 30.

Search ≠ classified. Analytics funnel must show pending/failed.

## Human evaluation (frozen baseline)

| Metric | Value |
| --- | ---: |
| Labeled sample | 50/50 |
| Role accuracy | **76%** |
| City accuracy | **97.73%** |
| Experience accuracy | **92%** |
| Fresher eligibility | **84%** |
| Exact-match (all four) | **58%** |

Baseline file: `evaluation/INDIA_BENCHMARK_ACCURACY_BASELINE_2026-11-17.md`  
Role errors: `evaluation/ROLE_ERROR_ANALYSIS.md`  
Historical invalid regex hand-check: `evaluation/HANDCHECK_REPORT.md` (not submission accuracy).

## Verdict

| Gate | Status |
| --- | --- |
| Operational classification (v2) | **PASS** on measured early/India batch |
| India-wide classification complete | **PARTIAL** (276 / 1,678) |
| Human-labeled accuracy reported | **PASS** (honest; role is weakest) |

## Reproduce

```bash
node backend/src/scripts/classifyIndiaEarly.js   # optional force sample
node backend/src/scripts/finalClassificationReport.js
```
