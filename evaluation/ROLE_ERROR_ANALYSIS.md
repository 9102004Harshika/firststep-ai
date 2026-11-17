# Role-error analysis set (baseline freeze)

**Frozen against:** `INDIA_BENCHMARK_ACCURACY_BASELINE_2026-11-17.md`  
**Do not use these 50 posts as repeated prompt-tuning data.** Build a separate development set before changing classification logic, then re-score the frozen 50 once.

## Baseline role accuracy

**76%** (38/50 correct). **12 mismatches** below.

## Failure modes

| Mode | Count | Underlying failure |
| --- | ---: | --- |
| A. Operations under-called as Other | 4 | Production/PMO/order-mgmt duties not mapped to Operations when title is generic Trainee/Apprentice |
| B. Mechanical / physical design → wrong digital role | 3 | CAD / architecture / jewelry CAD vocabulary mistaken for Software or UI/UX |
| C. Title token hijack (AI / Analyst) | 2 | “AI” or “Analyst” treated as function instead of context (consulting / finance ops) |
| D. Product Ops → Product Management | 1 | “Product” token outweighs ops responsibilities |
| E. Data-entry Trainee → Data Analytics | 1 | “Data” / documents mistaken for analytics |
| F. Architecture intern → Unknown | 1 | Out-of-taxonomy design role collapsed to Unknown instead of Other |

## The 12 mismatches

| Row | Company | Human | AI | Mode | What the posting actually does | Likely classifier trap |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | Konecranes | Operations | Other | A | Production planning, MRP, capacity, delivery coordination | Generic GET title; manufacturing verbs underweighted |
| 4 | Primetals | Other | Software Development | B | AutoCAD / Solid Edge / NX manufacturing drawings | “Engineer” + CAD tools → software |
| 7 | Volvo Group | Operations | Other | A | Production-line SOPs, tooling, process audits | Apprentice title; plant ops not recognized |
| 8 | Volvo CE | Operations | Other | A | Supplier quality, APQP/PPAP, purchasing liaison | Quality/purchasing ops → Other |
| 11 | Landor | Other | Unknown | F | Architecture / retail design intern | No architecture class; should still be Other not Unknown |
| 21 | Celonis | Other | Machine Learning / AI | C | Associate AI **Solution Consultant** / value engineering | “AI” in title → ML eng |
| 26 | Cannondesign | Other | UI/UX Design | B | Architecture student intern; REVIT | “Design” → UI/UX |
| 33 | Composio | Operations | Product Management | D | Product **Ops** Intern | Product* → PM |
| 40 | Nivoda | Other | UI/UX Design | B | Jewelry CAD for export manufacturing | “CAD Designer” → UI/UX |
| 41 | Acurus | Other | Data Analytics | E | Medical document data-entry trainee | “Data” / documents → analytics |
| 47 | Shift | Finance | Data Analytics | C | Trainee Analyst on loan settlement / finance ops | “Analyst” → Data Analytics |
| 49 | Capco | Operations | Other | A | Junior PMO: trackers, onboarding coordination | PMO not mapped to Operations |

## Negative examples (for future prompt / logic — not applied yet)

Do **not** classify from isolated tokens:

- SQL / Python / Excel alone ≠ Data Analytics (need reporting/analysis as the job’s purpose).
- “AI” in a consulting/solution title ≠ Machine Learning / AI.
- CAD / AutoCAD / REVIT / jewelry CAD ≠ UI/UX Design and ≠ Software Development.
- Product Operations / Product Ops ≠ Product Management by default.
- Trainee / Apprentice in a plant, supplier-quality, or PMO context often → Operations (or Other if no ops evidence), not Unknown.

Prefer **responsibility verbs** (plan production, settle loans, implement for customers, draw manufacturing models) over tool lists and buzzwords.

## Next engineering steps (after operational verification)

1. Keep this set frozen; do not iteratively prompt against these 12 until a held-out role-dev set exists.
2. When changing logic: responsibility-first instructions, role-boundary negatives, Other vs Unknown rule.
3. Validate on a **new** development sample (e.g. 30 India early posts not in the frozen 50).
4. Only then re-run `scoreIndiaBenchmark.js` on the frozen 50 and report delta vs baseline.
