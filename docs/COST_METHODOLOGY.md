# Cost methodology

## What we measure

For every classification attempt we log:

- provider + model
- input tokens
- output tokens
- retries (tokens accumulate across attempts)
- estimated cost
- success / failure

## Formula

Configurable prices:

- `LLM_INPUT_PRICE_PER_MTOK`
- `LLM_OUTPUT_PRICE_PER_MTOK`

Per request:

```
estimatedCost = inputTokens/1e6 * inputPrice + outputTokens/1e6 * outputPrice
```

Benchmark:

```
Cost_1000 = 1000 * (TotalEstimatedCost / SuccessfullyClassifiedPosts)
```

Exposed at `GET /api/analytics/cost`.

## Caveats

- Figures are **estimated** from token logs × configured rates, not provider invoices.
- Free-tier / discounted billing is not assumed.
- Retry tokens are included (as required).
- Hosting costs are excluded.
