# Cost report

## Pricing basis

Configured in `.env` / health payload (estimates, not invoices):

- Input $/MTok and output $/MTok from `LLM_INPUT_PRICE_PER_MTOK` / `LLM_OUTPUT_PRICE_PER_MTOK`
- Active sample path: OpenAI `gpt-4o-mini`

## Measured runs

| Run | N success | Input tok | Output tok | Est. $ | $/1k success |
| --- | ---: | ---: | ---: | ---: | ---: |
| Historical corpus (pre-upgrade analytics) | 171 | 226009 | 18205 | 0.02988 | ~0.175 |
| India early v2 force classify (2026-11-17) | 100 | 111629 | 9990 | 0.01516 | **0.1516** |

Formula: `1000 * (estimatedCost / successfulClassifications)`.

Failed-request spend should be tracked separately when retries fail after token burn; this v2 batch had **0 failures**.
