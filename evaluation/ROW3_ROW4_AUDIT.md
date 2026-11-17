# Rows 3–4 confirmation audit

Updated: 2026-11-17

Integrity concern: conversation transcript made it hard to verify that rows 3 and 4 were independently confirmed (not only batch-filled). This note records a **fresh personal review** of the original postings against CSV labels.

## Verdict

**Retain both rows.** Labels match the original postings under `ANNOTATION_GUIDE.md`.

---

## Row 3 — SEW-EURODRIVE India (Mumbai)

| Field | CSV human label | Live posting evidence |
| --- | --- | --- |
| Role | Sales | Graduate Engineer Trainee – Technical Sales; sales enquiries; sales targets; customer visits |
| City | Mumbai | Mumbai, Maharashtra, India; Role Location: Mumbai |
| Experience | Fresher | Fresh graduates or candidates with up to 1 year of experience |
| Fresher eligible | true | Same + BE/B.Tech 2026 batch |

- URL: https://www.linkedin.com/jobs/view/4480640416
- JobId: `6afc260a047e5fe2dda07c24`
- Re-checked live LinkedIn on 2026-11-17: title, location, and qualifications coherent (no Vertiv-style mismatch).

**CONFIRM row 3: Sales | Mumbai | Fresher | true**

---

## Row 4 — Primetals Technologies (Kolkata)

| Field | CSV human label | Live posting evidence |
| --- | --- | --- |
| Role | Other | AutoCAD / Solid Edge / NX manufacturing drawings; GD&T; mechanical design — **not** Software Development |
| City | Kolkata | Kolkata, West Bengal, India |
| Experience | Fresher | Trainee Engineer; entry-level seniority; no YOE floor |
| Fresher eligible | *(blank)* | No explicit fresher / 0–1 YOE / batch / internship wording |

- URL: https://www.linkedin.com/jobs/view/4482298642
- JobId: `6afc260a047e5fe2dda07c1e`
- Re-checked live LinkedIn on 2026-11-17: body matches mechanical CAD trainee; fresherEligible correctly left blank per annotation guide rule 5.

**CONFIRM row 4: Other | Kolkata | Fresher |**

---

## Status

Rows 3 and 4 remain `evaluationStatus=labeled` with the labels above. They are included in the 50-row accuracy calculation.
