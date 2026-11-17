import { ROLE_TAXONOMY } from '../../config/constants.js';

function normalizeCityList(cities = []) {
  return [...new Set((cities || []).map((c) => String(c).trim()).filter(Boolean))].sort();
}

/**
 * Multi-city scoring:
 * - Exact set match => correct
 * - If human labeled cities intersect AI cities and neither is empty => partial credit tracked separately
 * - Empty human cities with AI Unknown/empty => unscorable
 */
export function scoreCity(humanCities, aiCities) {
  const human = normalizeCityList(humanCities);
  const ai = normalizeCityList(aiCities);

  if (!human.length) return { correct: false, unscorable: true, partial: false };
  if (human.join('|') === ai.join('|')) return { correct: true, unscorable: false, partial: false };
  const overlap = human.filter((c) => ai.includes(c));
  if (overlap.length) return { correct: false, unscorable: false, partial: true };
  return { correct: false, unscorable: false, partial: false };
}

export function computeEvaluationMetrics(rows) {
  const labeled = rows.filter((r) => r.evaluationStatus === 'labeled');
  const sampleSize = labeled.length;

  let roleCorrect = 0;
  let cityCorrect = 0;
  let cityPartial = 0;
  let cityScored = 0;
  let experienceCorrect = 0;
  let fresherCorrect = 0;
  let exactMatch = 0;
  let unscorableCity = 0;

  const roleConfusion = {};
  for (const role of ROLE_TAXONOMY) {
    roleConfusion[role] = {};
  }

  for (const row of labeled) {
    const roleOk = row.humanRole && row.humanRole === row.aiRole;
    if (roleOk) roleCorrect += 1;

    if (row.humanRole && row.aiRole) {
      if (!roleConfusion[row.humanRole]) roleConfusion[row.humanRole] = {};
      roleConfusion[row.humanRole][row.aiRole] =
        (roleConfusion[row.humanRole][row.aiRole] || 0) + 1;
    }

    const cityScore = scoreCity(row.humanCities, row.aiCities);
    if (cityScore.unscorable) unscorableCity += 1;
    else {
      cityScored += 1;
      if (cityScore.correct) cityCorrect += 1;
      if (cityScore.partial) cityPartial += 1;
    }

    const expOk = row.humanExperience && row.humanExperience === row.aiExperience;
    if (expOk) experienceCorrect += 1;

    const fresherOk =
      row.humanFresherEligible === row.aiFresherEligible ||
      (row.humanFresherEligible == null && row.aiFresherEligible == null);
    if (row.humanFresherEligible !== undefined && fresherOk) fresherCorrect += 1;

    if (roleOk && cityScore.correct && expOk && fresherOk) exactMatch += 1;
  }

  const pct = (num, den) => (den > 0 ? Number(((num / den) * 100).toFixed(2)) : null);

  // Role precision/recall/F1 micro-averaged over labeled rows with humanRole
  let tp = 0;
  const roleSupport = labeled.filter((r) => r.humanRole).length;
  tp = roleCorrect;
  const precision = roleSupport ? tp / roleSupport : null;
  const recall = roleSupport ? tp / roleSupport : null;
  const f1 =
    precision != null && recall != null && precision + recall > 0
      ? (2 * precision * recall) / (precision + recall)
      : null;

  return {
    sampleSize,
    labeledCount: sampleSize,
    pendingCount: rows.filter((r) => r.evaluationStatus === 'pending').length,
    roleAccuracy: pct(roleCorrect, sampleSize),
    cityAccuracy: pct(cityCorrect, cityScored),
    cityPartialMatches: cityPartial,
    cityUnscorable: unscorableCity,
    experienceAccuracy: pct(experienceCorrect, sampleSize),
    fresherEligibilityAccuracy: pct(fresherCorrect, sampleSize),
    exactMatchAccuracy: pct(exactMatch, sampleSize),
    rolePrecision: precision != null ? Number((precision * 100).toFixed(2)) : null,
    roleRecall: recall != null ? Number((recall * 100).toFixed(2)) : null,
    roleF1: f1 != null ? Number((f1 * 100).toFixed(2)) : null,
    roleConfusionMatrix: roleConfusion,
    readyForReporting: sampleSize >= 50,
    note:
      sampleSize < 50
        ? 'Accuracy percentages must not be reported as final until 50 posts are manually reviewed.'
        : 'Sample of at least 50 labeled posts available.',
  };
}
