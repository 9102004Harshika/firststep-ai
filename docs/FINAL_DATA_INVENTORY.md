# Final data inventory

**Generated:** 2026-11-17T12:03:19.862Z  
**Database:** `firststep_ai` (Atlas — credentials not included)

## Headline counts

| Metric | Count | Status |
| --- | ---: | --- |
| Total DB records | 2397 | measured |
| Unique active jobs | 2397 | measured |
| **India-relevant active** | **1678** | **PASS (≥200)** |
| Early-career ∩ India | 374 | measured (not the 200 gate) |
| Fresher-eligible ∩ India | 134 | measured |
| Internship ∩ India | 189 | measured |
| Active non-India / unknown-geo bucket | 719 | measured |
| Classified ∩ India | 276 | measured |
| Unknown role ∩ India | 1436 | measured |
| Classification failed (all active) | 81 | measured |
| Classification pending (all active) | 1913 | measured |
| Duplicate fingerprint groups | 1 | measured |

## By source (India-relevant active)

| Source | Count |
| --- | ---: |
| greenhouse | 1250 |
| smartrecruiters | 159 |
| linkedin | 154 |
| ashby | 105 |
| lever | 8 |
| workday | 2 |

## By role (India-relevant active)

| Role | Count |
| --- | ---: |
| Unknown | 1436 |
| Software Development | 54 |
| Other | 51 |
| Machine Learning / AI | 20 |
| Human Resources | 19 |
| Operations | 18 |
| UI/UX Design | 14 |
| Product Management | 12 |
| Data Analytics | 9 |
| Finance | 9 |
| Customer Support | 9 |
| Marketing | 8 |
| Business Development | 5 |
| DevOps / Cloud | 5 |
| Cybersecurity | 5 |
| Sales | 3 |
| Data Science | 1 |

## Top cities (India-relevant active)

| City | Count |
| --- | ---: |
| Bengaluru | 905 |
| Mumbai | 154 |
| Pune | 105 |
| Gurugram | 104 |
| Hyderabad | 87 |
| Chennai | 81 |
| Delhi | 42 |
| Noida | 14 |
| Kolkata | 11 |
| Vadodara | 10 |
| Lucknow | 7 |
| Chandigarh | 5 |
| Coimbatore | 5 |
| Indore | 4 |
| Jaipur | 4 |
| Visakhapatnam | 3 |
| Ahmedabad | 3 |
| Mysuru | 1 |
| Kochi | 1 |
| Nagpur | 1 |
| Bhopal | 1 |
| Surat | 1 |

## Top employers (India-relevant active)

| Employer | Count |
| --- | ---: |
| Capco | 115 |
| Swiggy | 106 |
| Okta | 86 |
| Databricks | 78 |
| Zscaler | 76 |
| MongoDB | 69 |
| Sarvam AI | 50 |
| InMobi | 46 |
| Stripe | 45 |
| Cloudflare | 45 |
| Rubrik | 37 |
| Instawork | 37 |
| HighRadius | 37 |
| Sigmoid | 37 |
| GitLab | 34 |
| Oliverseapac | 33 |
| Freshworks | 30 |
| Celonis | 24 |
| Smartsheet | 22 |
| Toast | 21 |
| Zinnov | 21 |
| HackerRank | 20 |
| Landor | 20 |
| Glance | 20 |
| Five9 | 20 |
| Elastic | 19 |
| Razorpay | 18 |
| Fivetran | 17 |
| Freshprints | 17 |
| Karya | 16 |

## Method

```bash
node backend/src/scripts/finalInventoryReport.js
```

Machine-readable twin: `docs/FINAL_DATA_INVENTORY.json`.
