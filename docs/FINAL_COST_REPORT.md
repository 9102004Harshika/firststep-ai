# Final cost report

**Generated:** 2026-11-17  
**Nature:** **Estimated** from logged tokens × configured `$/MTok` — **not** provider invoices. Hosting excluded.

## Configured pricing (runtime)

From health / `.env` (do not commit secrets):

- Input and output prices: `LLM_INPUT_PRICE_PER_MTOK` / `LLM_OUTPUT_PRICE_PER_MTOK`
- Measured production path for v2 India sample: **OpenAI `gpt-4o-mini`**

## Measured samples

| Scope | Successful | Input tok | Output tok | Est. $ | **Est. $/1k success** |
| --- | ---: | ---: | ---: | ---: | ---: |
| Prompt **v2** India early force batch | 100 | 111629 | 9990 | 0.0151589 | **0.1516** |
| API `/analytics/cost` corpus totals | 253 | (aggregated) | (aggregated) | (see API) | **0.1637** |

Formula:

```
estimatedCost = inputTokens/1e6 * inputPrice + outputTokens/1e6 * outputPrice
Cost_1000_success = 1000 * (Σ estimatedCost / N_success)
```

Retry tokens are included inside each job’s logged totals when retries succeed. Failed-request spend is tracked on failed classifications separately.

## Reproduce

```bash
# after classification
curl -s http://localhost:5050/api/analytics/cost
node backend/src/scripts/finalClassificationReport.js
```

## Status

| Item | Status |
| --- | --- |
| Reproducible estimate methodology | **PASS** |
| Provider invoice reconciliation | **NOT VERIFIED** (out of scope / excluded by design) |
| Cost optimization experiment (full vs truncated vs hybrid) | **NOT VERIFIED** (not completed as a controlled A/B in this sprint) |
