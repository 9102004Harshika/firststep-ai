# Evaluation methodology

## Goal

Manually verify **50** classified posts and report independent accuracies for:

- Role
- City
- Experience level
- Fresher eligibility
- Exact-match across all of the above

Also report **estimated cost per 1,000 posts** from logged tokens.

## Active India benchmark (use this for submission)

| Artifact | Path |
| --- | --- |
| India 50 CSV (human labels blank) | [`india_benchmark_50.csv`](./india_benchmark_50.csv) |
| Annotation guide | [`ANNOTATION_GUIDE.md`](./ANNOTATION_GUIDE.md) |
| Model comparison notes | [`MODEL_COMPARISON.md`](./MODEL_COMPARISON.md) |
| Cost notes | [`COST_REPORT.md`](./COST_REPORT.md) |

**Do not advertise accuracy until ≥50 human labels exist.**

After labeling:

```bash
# fill human* columns in india_benchmark_50.csv then:
npm run import:evaluation --prefix backend
# or point import at the India CSV path
```

## Historical failure record (retained — not final India accuracy)

| Artifact | Path |
| --- | --- |
| Overseas-heavy v1 hand-check | [`HANDCHECK_REPORT.md`](./HANDCHECK_REPORT.md) |
| Old sheet / CSV | [`HANDCHECK_50_SHEET.md`](./HANDCHECK_50_SHEET.md), [`benchmark.csv`](./benchmark.csv) |

Headline of that historical set: **0% role accuracy** (all AI roles `Unknown`).

## Workflow

1. Run classification on real jobs.
2. Export a review pack / `npm run export:evaluation` → `evaluation/benchmark.csv`.
3. Human annotators fill `humanRole`, `humanCity`, `humanExperience`, `humanFresherEligible`.
4. Non-empty human fields ⇒ `labeled` on import.
5. `npm run import:evaluation` (or `evaluation/importHandcheck.mjs` against the live Mongo URI) prints / stores metrics.
6. Analytics page reads `GET /api/evaluation/summary`.

## City scoring

- Cities are `|`-separated lists.
- Exact set match (order-insensitive) counts as correct.
- Partial overlaps are tracked separately and do **not** count as correct.
- Empty human city labels are unscorable (typical for non-India posts).

## Integrity rules

- Human columns start blank before labeling.
- Never invent labels without reading the post.
- Exclude ambiguous posts by leaving them unlabeled or marking excluded in the DB.
