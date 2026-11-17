# India benchmark accuracy (50 human-reviewed posts)

Generated: 2026-11-17

**FROZEN BASELINE** — identical copy: `INDIA_BENCHMARK_ACCURACY_BASELINE_2026-11-17.md`.  
Do not overwrite the baseline file when re-scoring after future classifier changes; write a new dated report and compare.

Source: `evaluation/india_benchmark_50.csv` scored with `computeEvaluationMetrics` (same rules as evaluation importer).

Row 3–4 confirmation audit: `evaluation/ROW3_ROW4_AUDIT.md`.  
Role-error analysis: `evaluation/ROLE_ERROR_ANALYSIS.md`.  
Next ops priority: `docs/OPERATIONAL_VERIFICATION.md` (before prompt retuning).

## Headline metrics

| Metric | Value | Denominator notes |
| --- | ---: | --- |
| Labeled sample | 50 | Must be 50 |
| Role accuracy | 76% | / labeled |
| City accuracy | 97.73% | / scorable cities (blank human city unscorable) |
| Experience accuracy | 92% | / labeled |
| Fresher-eligibility accuracy | 84% | / labeled (null≠true counts as miss) |
| Exact-match (all four) | 58% | / labeled |
| City unscorable | 6 | blank human city |
| City partial overlaps | 0 | not counted correct |

## Mismatch counts

| Field | Mismatches |
| --- | ---: |
| Role | 12 |
| City (among scorable) | 1 |
| Experience | 4 |
| Fresher eligible | 8 |

## Role mismatches (human → AI)

- Row 1 Konecranes: human **Operations** vs AI **Other** — Graduate Engineer Trainee,Order Management
- Row 4 Primetals Technologies: human **Other** vs AI **Software Development** — Trainee Engineer - PTIN EN-M I&S-S (Kolkata, Location)
- Row 7 Volvo Group: human **Operations** vs AI **Other** — Graduate Apprentice Trainee
- Row 8 Volvo Construction Equipment: human **Operations** vs AI **Other** — Graduate Apprentice Trainee
- Row 11 Landor: human **Other** vs AI **Unknown** — Springboard Internship - Architecture
- Row 21 Celonis: human **Other** vs AI **Machine Learning / AI** — Associate (AI) Solution Consultant
- Row 26 Cannondesign: human **Other** vs AI **UI/UX Design** — Design Student Intern
- Row 33 Composio: human **Operations** vs AI **Product Management** — Product Ops Intern
- Row 40 Nivoda: human **Other** vs AI **UI/UX Design** — Junior CAD Designer (Export Market)
- Row 41 Acurussolutions: human **Other** vs AI **Data Analytics** — Knowledge Associate Trainee
- Row 47 Shift: human **Finance** vs AI **Data Analytics** — Trainee Analyst
- Row 49 Capco: human **Operations** vs AI **Other** — PMO - Junior

## Experience mismatches

- Row 7 Volvo Group: human **Fresher** vs AI **Internship** — Graduate Apprentice Trainee
- Row 13 Stripe: human **Entry Level** vs AI **Experienced** — Risk Operations Associate
- Row 34 Stripe: human **Entry Level** vs AI **Fresher** — Social Media, Customer Support Associate
- Row 47 Shift: human **Fresher** vs AI **Entry Level** — Trainee Analyst

## Fresher mismatches

- Row 4 Primetals Technologies: human **null** vs AI **true** — Trainee Engineer - PTIN EN-M I&S-S (Kolkata, Location)
- Row 13 Stripe: human **null** vs AI **true** — Risk Operations Associate
- Row 21 Celonis: human **null** vs AI **true** — Associate (AI) Solution Consultant
- Row 31 Freshprints: human **null** vs AI **true** — Campus Recruiter
- Row 34 Stripe: human **null** vs AI **true** — Social Media, Customer Support Associate
- Row 35 Oliverseapac: human **null** vs AI **true** — Junior Accountant
- Row 42 Showpad: human **null** vs AI **true** — Associate Consultant
- Row 49 Capco: human **null** vs AI **true** — PMO - Junior

## City mismatches (scorable only)

- Row 47 Shift: human **Bengaluru** vs AI **(blank)** — Trainee Analyst

## Import

- EvaluationLabel upserts: 50
- Removed non-India-50 EvaluationLabel docs: 85
- DB metrics labeledCount: 50
- DB roleAccuracy: 76% (must match CSV)

## Integrity notes

- Exclusions (Vertiv×2, Xylem, weak fills): `BENCHMARK_EXCLUSIONS.md` — not in the 50.
- Do not conflate this with retired regex hand-check figures.
