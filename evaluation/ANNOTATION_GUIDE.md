# Annotation guide — India benchmark (50 posts)

## Purpose

Independently label `evaluation/india_benchmark_50.csv` for role, city, experience, and fresher eligibility.

**Do not** copy AI columns into human columns.  
**Do not** ask an LLM to fill human labels.

## Files

- CSV: `evaluation/india_benchmark_50.csv`
- Worksheet: `evaluation/INDIA_BENCHMARK_WORKSHEET.md`

## Columns to fill

| Column | Allowed values |
| --- | --- |
| `humanRole` | Exact taxonomy from `ROLE_TAXONOMY` (see `backend/src/config/constants.js`) |
| `humanCity` | `\|`-separated India cities from taxonomy, or blank if unscorable |
| `humanExperience` | `Internship` \| `Fresher` \| `Entry Level` \| `Experienced` \| `Unknown` |
| `humanFresherEligible` | `true` \| `false` \| blank for null |
| `humanRoleEvidence` / `humanCityEvidence` / `humanExperienceEvidence` / `humanFresherEvidence` | Short quotes from the posting that justify each label |
| `evaluationStatus` | set to `labeled` only after review |

## Rules

1. Prefer location evidence over company about-text.
2. If the posting is overseas-only, it should not be in this India benchmark — flag to reviewers.
3. Multi-city: list all supported Indian cities; order does not matter.
4. Unknown is allowed when evidence is insufficient.
5. Fresher eligibility requires explicit evidence (YOE, student, campus, intern). Otherwise leave blank/null.
6. If title/location and JD conflict (different role or country signals), exclude the row and replace — do not manufacture ground truth from a mismatched description. See `BENCHMARK_EXCLUSIONS.md`.

## Historical note — retired script hand-check

`HANDCHECK_REPORT.md` / `handcheck50.mjs` produced **regex-assigned** “labels”, not independent human review. Those 0% / 90% / 92% figures are **invalid as human-verified accuracy** and must not be submitted as such.

This India benchmark replaces that diagnostic for submission evaluation **once you personally label all 50 rows**.
