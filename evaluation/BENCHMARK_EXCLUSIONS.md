# Benchmark exclusions (integrity)

Updated: 2026-11-17

Rows removed from `india_benchmark_50.csv` because the original posting could not provide coherent India early-career evidence. Prefer a clean evaluation set over forcing labels from mismatched JDs.

## Excluded

| JobId | Company | Title | Reasons | URL |
| --- | --- | --- | --- | --- |
| 6afc260a047e5fe2dda07c2a | Vertiv | Diploma Engineer Trainee - Electrical (2026 passout) | Live LinkedIn + employer mirrors: title/location are Chennai trainee, but JD is US Battery Specialist boilerplate (401k, Veterans, motor vehicle records). Unusable as India early-career ground truth. | https://www.linkedin.com/jobs/view/4471627041 |
| 6afc260a047e5fe2dda07c06 | Vertiv | Field Engineer - Diploma Engineer Trainee(2026 passout) | Same Battery Specialist / US-benefits mismatch as above. | https://www.linkedin.com/jobs/view/4485395059 |
| 6afc260a047e5fe2dda07c0c | Xylem | Mechancial Engineer_Graduate Engineering Trainee | Mechanical GET title + Chennai location, but employer Workday JD is chemical-process R&D (“manufacturing chemicals”, “chemical processes”, “chemical process engineering”). Title/body contradiction — cannot classify role from title alone. | https://www.linkedin.com/jobs/view/4487273186 (Workday: R51256) |
| 6afbd108848d5e4aa52840b4 | Sigmoid | Associate Manager Analytics | Accidental weak fill after Vertiv exclusion (manager title). Removed. | https://job-boards.greenhouse.io/sigmoid/jobs/6874292002 |
| 6afbd188848d5e4aa52848e4 | Okta | Associate Customer Success Manager, APAC | Accidental weak fill (manager / APAC). Removed. | https://www.okta.com/company/careers/opportunity/8352082?gh_jid=8352082 |

## Replacements kept

1. **Landor** — Springboard Internship - Strategy (Mumbai) — https://job-boards.greenhouse.io/landor/jobs/8349420
2. **Capco** — PMO - Junior (India - Bengaluru) — https://job-boards.greenhouse.io/capco/jobs/8300474
3. **Rubrik** — Software Engineer (CPD) - Winter Intern (Bangalore) — coherent SWE internship; 2027 graduates; onsite Bangalore

## Rule

If title/location and JD conflict (different role or country signals), exclude and replace — do not manufacture human ground truth from a mismatched description.
