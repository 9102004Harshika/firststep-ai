# Model comparison

## Systems

| ID | System | Status |
| --- | --- | --- |
| A | Deterministic title → role baseline | Implemented in `classifyJob.js` (`inferRoleFromTitle`) |
| B | LLM JSON only (prompt v1 historical) | Produced **0% role accuracy** on overseas hand-check |
| C | LLM + enum sanitizer + title fallback (prompt **v2**) | Production path |

## Live v2 signal (pre-human-label)

On 100 India-relevant early-career jobs force-classified with prompt v2 + OpenAI `gpt-4o-mini`:

- Unknown role rate: **0%**
- Dominant roles: Software Development (39), Other (10), Product Management (7), …

This is **not** human accuracy. It shows the Unknown-collapse defect is fixed before labeling.

## Next measurement

After `india_benchmark_50.csv` is independently labeled, compute A/B/C accuracies with `computeEvaluationMetrics` and update this file with denominators.
