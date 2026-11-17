# Evaluation methodology

## Two benchmarks

| Artifact | Status | Use |
| --- | --- | --- |
| `evaluation/HANDCHECK_REPORT.md` + `benchmark.csv` | Historical (v1, overseas-heavy) | Failure analysis — **not** final India accuracy |
| `evaluation/india_benchmark_50.csv` | Active India set; human labels pending | Submission evaluation after independent review |

## Metrics

Computed by `computeEvaluationMetrics`:

- Role / experience / fresher accuracy
- City exact-set accuracy (scorable rows only)
- Exact-match across all fields
- Unknown rate / coverage denominators
- Confusion matrix for roles

Never report accuracy as final until ≥50 India-relevant rows are human-labeled.

## Model comparison (planned / partial)

| System | Description |
| --- | --- |
| A | Deterministic title-role baseline (`inferRoleFromTitle`) |
| B | LLM-only structured JSON |
| C | Combined: LLM + enum sanitizer + title fallback (current v2 production path) |

After human labels land, compare A/B/C on the same 50 rows and record in `evaluation/MODEL_COMPARISON.md`.
