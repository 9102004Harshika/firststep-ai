# Deduplication

## Layers

1. **Source + externalId** — unique Mongo index; primary upsert key.
2. **Canonical URL** — tracking params stripped (`utm_*`, `gh_src`, etc.), host lowercased, trailing slash normalized.
3. **Fingerprint** — normalized `company::title::location`.
4. **Source refs merge** — if the same posting is seen across boards/URLs, `sourceRefs[]` retains provenance instead of dropping a source.

## Concurrency

Atomic upserts + unique indexes handle concurrent ingestion. Duplicate key errors (`11000`) are counted as duplicates, not hard failures.

## Expiry policy

Jobs are **not** expired because a single source fetch failed. Expiry requires reliable evidence or an explicit stale policy (`JOB_STALE_DAYS`) applied in a dedicated maintenance path — not opportunistic source outages.
