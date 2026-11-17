/**
 * RETIRED diagnostic script — DO NOT use for Beep human-accuracy claims.
 *
 * This file previously assigned "human" labels via title/keyword regex and
 * wrote HANDCHECK_REPORT.md / HANDCHECK_50_SHEET.md. That is not independent
 * human review and must not be treated as ground truth.
 *
 * Current evaluation path:
 *   1. export: node backend/src/scripts/exportIndiaBenchmark.js
 *   2. Harshika personally labels evaluation/india_benchmark_50.csv
 *   3. import + metrics only after human columns are filled
 *
 * Running this script now refuses to regenerate accuracy claims.
 */
console.error(`
[RETIRED] handcheck50.mjs will not generate human-accuracy reports.

The old regex-labeled 0%/90%/92% figures are invalid as human-verified accuracy.
Use evaluation/india_benchmark_50.csv + ANNOTATION_GUIDE.md instead.
`);
process.exit(2);
