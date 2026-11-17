/**
 * Classification evidence report from Atlas (no secrets).
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import dns from 'node:dns';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../..');
dotenv.config({ path: path.join(root, '.env'), override: true });
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // ignore
}

async function main() {
  const { connectDb, disconnectDb } = await import('../config/db.js');
  const { Job } = await import('../models/Job.js');
  const { ClassificationRun } = await import('../models/ClassificationRun.js');
  await connectDb();

  const generatedAt = new Date().toISOString();
  const indiaClassified = await Job.find({
    status: 'active',
    indiaRelevant: true,
    'classification.status': 'classified',
  })
    .select({
      role: 1,
      experienceLevel: 1,
      fresherEligible: 1,
      location: 1,
      classification: 1,
      title: 1,
      company: 1,
    })
    .lean();

  const v2 = indiaClassified.filter((j) => j.classification?.promptVersion === 'v2');
  const unknownRole = v2.filter((j) => !j.role || j.role === 'Unknown').length;
  const unknownCity = v2.filter((j) => !(j.location?.cities || []).length).length;
  const tokensIn = v2.reduce((s, j) => s + (j.classification?.inputTokens || 0), 0);
  const tokensOut = v2.reduce((s, j) => s + (j.classification?.outputTokens || 0), 0);
  const cost = v2.reduce((s, j) => s + (j.classification?.estimatedCost || 0), 0);
  const byProvider = {};
  const byRole = {};
  for (const j of v2) {
    const p = `${j.classification?.provider}/${j.classification?.model}`;
    byProvider[p] = (byProvider[p] || 0) + 1;
    byRole[j.role || 'Unknown'] = (byRole[j.role || 'Unknown'] || 0) + 1;
  }

  const failedIndia = await Job.countDocuments({
    status: 'active',
    indiaRelevant: true,
    'classification.status': 'failed',
  });

  const pendingIndia = await Job.countDocuments({
    status: 'active',
    indiaRelevant: true,
    $or: [
      { 'classification.status': 'pending' },
      { 'classification.status': { $exists: false } },
    ],
  });

  const latestRuns = await ClassificationRun.find().sort({ startedAt: -1 }).limit(5).lean();

  const benchPath = path.join(root, 'evaluation/india_benchmark_50.csv');
  let benchRows = 0;
  let labeledRows = 0;
  try {
    const text = await fs.readFile(benchPath, 'utf8');
    const lines = text.trim().split(/\n/);
    benchRows = Math.max(0, lines.length - 1);
    // humanRole is column index 10 in export
    for (const line of lines.slice(1)) {
      // crude: count non-empty humanRole between commas is hard with CSV quotes;
      // treat evaluationStatus labeled if line ends with ,labeled or contains ,labeled,
      if (/,(labeled)(\s|,|$)/.test(line) || line.includes(',labeled,')) labeledRows += 1;
    }
  } catch {
    benchRows = 0;
  }

  const report = {
    generatedAt,
    promptVersionCurrent: process.env.LLM_PROMPT_VERSION || 'v2',
    indiaRelevant: {
      classifiedTotal: indiaClassified.length,
      classifiedPromptV2: v2.length,
      failed: failedIndia,
      pending: pendingIndia,
      unknownRoleAmongV2: unknownRole,
      unknownRoleRateV2: v2.length ? Number((unknownRole / v2.length).toFixed(4)) : null,
      unknownCityAmongV2: unknownCity,
      unknownCityRateV2: v2.length ? Number((unknownCity / v2.length).toFixed(4)) : null,
      tokensInV2: tokensIn,
      tokensOutV2: tokensOut,
      estimatedCostV2: Number(cost.toFixed(8)),
      costPer1000SuccessV2:
        v2.length > 0 ? Number(((cost / v2.length) * 1000).toFixed(6)) : null,
      byProvider,
      byRole,
    },
    humanEvaluation: {
      indiaBenchmarkRows: benchRows,
      labeledRowsDetected: labeledRows,
      accuracyClaimAllowed: labeledRows >= 50,
      status: labeledRows >= 50 ? 'READY_FOR_METRICS' : 'HUMAN_LABELS_PENDING',
    },
    latestClassificationRuns: latestRuns.map((r) => ({
      id: String(r._id),
      status: r.status,
      provider: r.provider,
      model: r.model,
      promptVersion: r.promptVersion,
      totals: r.totals,
      startedAt: r.startedAt,
      finishedAt: r.finishedAt,
    })),
    verdict: {
      operationalClassification: v2.length >= 50 && unknownRole === 0 ? 'PASS' : 'PARTIAL',
      humanAccuracy: labeledRows >= 50 ? 'READY' : 'NOT VERIFIED',
    },
  };

  const md = `# Final classification report

**Generated:** ${generatedAt}

## Operational results (India-relevant, prompt v2)

| Metric | Value |
| --- | ---: |
| Classified (any prompt) ∩ India | ${indiaClassified.length} |
| Classified prompt **v2** ∩ India | ${v2.length} |
| Failed ∩ India | ${failedIndia} |
| Pending ∩ India | ${pendingIndia} |
| Unknown role rate (v2) | ${report.indiaRelevant.unknownRoleRateV2 ?? 'n/a'} |
| Unknown city rate (v2)* | ${report.indiaRelevant.unknownCityRateV2 ?? 'n/a'} |
| Tokens in / out (v2 sum) | ${tokensIn} / ${tokensOut} |
| Est. cost (v2 sum) | $${report.indiaRelevant.estimatedCostV2} |
| Est. cost / 1k success (v2) | $${report.indiaRelevant.costPer1000SuccessV2 ?? 'n/a'} |

\\* Empty city arrays can be valid when India is country-level / remote-India without a city token.

### Role mix (v2 India)

| Role | Count |
| --- | ---: |
${Object.entries(byRole)
  .sort((a, b) => b[1] - a[1])
  .map(([k, v]) => `| ${k} | ${v} |`)
  .join('\n')}

### Provider / model (v2 India)

| Provider/Model | Count |
| --- | ---: |
${Object.entries(byProvider)
  .map(([k, v]) => `| ${k} | ${v} |`)
  .join('\n')}

## Human evaluation

| Item | Value |
| --- | --- |
| \`india_benchmark_50.csv\` rows | ${benchRows} |
| Labeled rows detected | ${labeledRows} |
| Accuracy claim allowed? | **${labeledRows >= 50 ? 'yes' : 'NO — labels pending'}** |

Historical v1 overseas hand-check (0% role) remains in \`evaluation/HANDCHECK_REPORT.md\` as a failure record.

## Verdict

| Gate | Status |
| --- | --- |
| Operational classification (v2 Unknown-role collapse fixed on measured batch) | **${report.verdict.operationalClassification}** |
| Human-labeled India accuracy | **${report.verdict.humanAccuracy}** |

## Reproduce

\`\`\`bash
node backend/src/scripts/classifyIndiaEarly.js   # optional force sample
node backend/src/scripts/finalClassificationReport.js
\`\`\`
`;

  await fs.writeFile(path.join(root, 'docs/FINAL_CLASSIFICATION_REPORT.md'), md, 'utf8');
  await fs.writeFile(
    path.join(root, 'docs/FINAL_CLASSIFICATION_REPORT.json'),
    JSON.stringify(report, null, 2),
    'utf8',
  );
  console.log(JSON.stringify(report.indiaRelevant, null, 2));
  console.log(JSON.stringify(report.humanEvaluation, null, 2));
  await disconnectDb();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
