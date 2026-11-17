# Source verification

**Last live ingestion:** 2026-11-17 (admin trigger against Atlas)  
**Policy:** geography-first adapters; early-career keywords do **not** admit overseas jobs.

## Summary (latest successful run)

| Metric | Value |
| --- | ---: |
| Fetched (post geo filter) | 1145 |
| Valid | 1145 |
| New | 27 |
| Updated / re-seen | 1118 |
| Rejected | 0 |
| Failed sources | 0 |

## Enabled registry notes

- New India boards probed live before enable: **Razorpay**, **Groww**, **Slice**, **TCS**, **Porter** (HTTP 200).
- Candidate boards that 404’d remain `enabled: false` (Postman, BrowserStack, CleverTap, Chargebee, ShareChat, Meesho).
- Lever demo remains disabled until a real board ID is confirmed.
- Global `india-hiring` boards now only keep jobs with India geographic evidence.

## Reproduce

```bash
npm run verify:sources --prefix backend
# writes docs/SOURCE_VERIFICATION.json + refreshes this report style table
```

Machine-readable detail: run `verify:sources` to regenerate `SOURCE_VERIFICATION.json`.
