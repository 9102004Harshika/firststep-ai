# AI classification

## Providers

Configured via environment variables:

| Variable | Purpose |
| --- | --- |
| `LLM_PROVIDER` | `gemini` \| `groq` \| `openai` \| `mock` |
| `LLM_MODEL` | Model id (default `gemini-2.5-flash`) |
| `LLM_FALLBACK_PROVIDER` | Optional fallback provider |
| `GEMINI_API_KEY` / `GROQ_API_KEY` / `OPENAI_API_KEY` | Credentials |
| `LLM_PROMPT_VERSION` | Stored with each classification (current default **v2**) |

`mock` is for automated tests only.

## Prompt

Stored in `backend/src/config/constants.js` (`CLASSIFICATION_PROMPT`).

Production path (`classifyJob.js`):

1. Compact title/location/description user prompt.
2. LLM JSON response.
3. Enum alias normalization + title-role inference fallback.
4. Zod `classificationOutputSchema` validation.
5. Confidence calibration (not treated as calibrated probability).
6. City normalization via India taxonomy (Remote is not a city).
7. Persist provider, model, prompt version, tokens, estimated cost, evidence, content hash.

## Accuracy status (honest)

| Evidence | Status |
| --- | --- |
| Historical overseas hand-check (prompt v1) | **0% role accuracy** — retained in `evaluation/HANDCHECK_REPORT.md` |
| Prompt v2 batch on 100 India early-career jobs | **0% Unknown role rate** operationally — **not** human accuracy |
| `evaluation/india_benchmark_50.csv` | Human labels **pending** — **do not advertise 90%+ accuracy** |

Until ≥50 India-relevant posts are independently labeled, classification quality is **NOT VERIFIED** as an accuracy claim.

## Reclassification policy

Jobs are skipped when prior status is `classified`, content hash matches, and prompt version matches.

Force reclassification: admin `force: true` or `node src/scripts/classifyIndiaEarly.js`.

## Prompt-injection stance

Job descriptions are untrusted. System prompt instructs the model to ignore embedded instructions. Tests cover a mock injection path; production relies on schema validation + sanitization.
