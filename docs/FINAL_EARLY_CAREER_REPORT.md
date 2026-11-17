# Final early-career India report

**Generated:** 2026-11-17  
**Database:** Atlas `firststep_ai`  
**Gate:** ≥200 unique active India × early-career opportunities

## Verdict

| Metric | Count | Status |
| --- | ---: | --- |
| India-relevant active | **1,678** | PASS (≥200) |
| India × early-career (product definition) | **374** | **PASS (≥200)** |
| Strict title/field early ∩ India | 333 | measured |
| Fresher-eligible ∩ India | 134 | measured |
| Internship ∩ India | 189 | measured |

Geography rules were **not** loosened. Early-career remains orthogonal to India relevance.

## How early-career is counted

A job counts as early-career when **any** of the following holds:

- `fresherEligible === true`
- `employmentType === 'Internship'` or `experienceLevel === 'Internship'`
- `experienceLevel ∈ {Fresher, Entry Level}`
- Title matches  
  `\b(intern|internship|fresher|graduate|campus|trainee|junior|new\s*grad|entry[- ]?level|associate)\b`

This matches the inventory / product filter used in `finalInventoryReport.js` and analytics.

## Source expansion (Nov 17)

| Source class | Action | Provenance |
| --- | --- | --- |
| Greenhouse early boards | Full-directory scan of ~3,400 live boards; enabled boards with India + early titles | `tmp/greenhouse_india_early_scan.json` |
| Ashby early boards | Directory scan; enabled early India hits | `tmp/ashby_india_early_scan.json` |
| SmartRecruiters | Endava, IXIGO, Unacademy, Cars24 | Live `country=in` probe |
| Workday | NVIDIA / Adobe / Salesforce (early title filter) | Public CXS POST API |
| LinkedIn jobs-guest | India early-career discovery with public job view URLs | `adapters/linkedinGuest.js` |
| Careerscan | Adapter implemented; **disabled** (Cloudflare HTML challenge blocked apply-URL resolve) | `adapters/careerscan.js` |

Targeted ingest summary (`runEarlyCareerIngestion.js`):

- Fetched 1,050 raw rows
- 830 new records
- After Indiana geo fix + recompute: India-relevant **1,678**, early ∩ India **374**

## Geography integrity fix

`locationHasExplicitIndia` previously treated US state abbreviation `, IN` (Indiana) as India.

- False positives (e.g. Carvana `Plainfield, IN`, Aviation Institute `Indianapolis, IN`) were flipped off by `recomputeIndiaRelevance.js` (**226** jobs).
- Regression tests added in `tests/indiaRelevance.test.js`.
- Carvana + Aviation Institute boards disabled in `sourceRegistry.js`.

## Early ∩ India by source (post-fix)

Measured via aggregation during targeted ingest (before final recompute of some experience fields):

| Source | Early ∩ India (approx at ingest close) |
| --- | ---: |
| greenhouse | 309 |
| linkedin | 154 |
| ashby | 26 |
| smartrecruiters | 19 |
| lever | 3 |
| workday | 1 |

Final product count after classification + geo recompute: **374**.

## Limitations (honest)

1. Public ATS boards still under-supply pure campus/GET titles; LinkedIn guest discovery was required to clear 200 while preserving original apply URLs.
2. Careerscan discovery remains unavailable until HTML apply-URL resolve is unblocked.
3. Workday tenants rate-limit aggressively (HTTP 429); only a handful of Workday early India rows were captured.
4. Classification can change `experienceLevel` / `fresherEligible`, so early counts move after LLM batches — always re-run inventory before submission screenshots.

## Reproduce

```bash
node backend/src/scripts/runEarlyCareerIngestion.js
node backend/src/scripts/recomputeIndiaRelevance.js
node backend/src/scripts/finalInventoryReport.js
node backend/src/scripts/probeEarlyIndiaPotential.js
```
