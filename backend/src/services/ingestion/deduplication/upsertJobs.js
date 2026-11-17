import { Job } from '../../../models/Job.js';

function mergeSourceRefs(existing = [], incoming = []) {
  const key = (r) => `${r.source}:${r.sourceBoard}:${r.externalId}`;
  const map = new Map(existing.map((r) => [key(r), r]));
  for (const ref of incoming) {
    map.set(key(ref), ref);
  }
  return [...map.values()];
}

/**
 * Upsert jobs with multi-layer dedupe:
 * 1) source + externalId
 * 2) canonicalUrl
 * 3) fingerprint (company+title+location) as soft merge when URL differs
 */
export async function upsertNormalizedJobs(normalizedJobs) {
  const stats = {
    valid: 0,
    newRecords: 0,
    updated: 0,
    duplicates: 0,
    rejected: 0,
    failed: 0,
  };

  for (const item of normalizedJobs) {
    if (!item.ok) {
      stats.rejected += 1;
      continue;
    }

    const job = item.job;
    stats.valid += 1;
    const now = new Date();

    try {
      const bySource = await Job.findOne({
        source: job.source,
        externalId: job.externalId,
      });

      if (bySource) {
        bySource.title = job.title;
        bySource.company = job.company;
        bySource.description = job.description;
        bySource.descriptionHtml = job.descriptionHtml;
        bySource.location = job.location;
        bySource.jobUrl = job.jobUrl;
        bySource.canonicalUrl = job.canonicalUrl;
        bySource.employmentType =
          job.employmentType !== 'Unknown' ? job.employmentType : bySource.employmentType;
        bySource.experienceLevel =
          job.experienceLevel !== 'Unknown' ? job.experienceLevel : bySource.experienceLevel;
        bySource.postedAt = job.postedAt || bySource.postedAt;
        bySource.lastSeenAt = now;
        bySource.status = 'active';
        // Recompute India relevance from latest payload — never sticky-OR true forever.
        bySource.indiaRelevant = Boolean(job.indiaRelevant);
        bySource.geographicEvidence = job.geographicEvidence || bySource.geographicEvidence;
        bySource.geoExclusionReason = job.geoExclusionReason || null;
        bySource.sourceRefs = mergeSourceRefs(bySource.sourceRefs, job.sourceRefs);
        bySource.fingerprint = job.fingerprint;
        await bySource.save();
        stats.updated += 1;
        // "duplicates" here means re-seen existing source+id (not cross-source leakage).
        stats.duplicates += 1;
        continue;
      }

      const byUrl = await Job.findOne({ canonicalUrl: job.canonicalUrl });
      if (byUrl) {
        byUrl.lastSeenAt = now;
        byUrl.status = 'active';
        byUrl.sourceRefs = mergeSourceRefs(byUrl.sourceRefs, job.sourceRefs);
        byUrl.location = job.location || byUrl.location;
        byUrl.description = job.description || byUrl.description;
        byUrl.indiaRelevant = Boolean(job.indiaRelevant);
        byUrl.geographicEvidence = job.geographicEvidence || byUrl.geographicEvidence;
        byUrl.geoExclusionReason = job.geoExclusionReason || null;
        await byUrl.save();
        stats.updated += 1;
        stats.duplicates += 1;
        continue;
      }

      const byFingerprint = await Job.findOne({
        fingerprint: job.fingerprint,
        company: job.company,
        title: job.title,
      });
      if (byFingerprint) {
        byFingerprint.lastSeenAt = now;
        byFingerprint.status = 'active';
        byFingerprint.sourceRefs = mergeSourceRefs(byFingerprint.sourceRefs, job.sourceRefs);
        byFingerprint.location = job.location || byFingerprint.location;
        byFingerprint.indiaRelevant = Boolean(job.indiaRelevant);
        byFingerprint.geographicEvidence =
          job.geographicEvidence || byFingerprint.geographicEvidence;
        byFingerprint.geoExclusionReason = job.geoExclusionReason || null;
        await byFingerprint.save();
        stats.updated += 1;
        stats.duplicates += 1;
        continue;
      }

      await Job.create({
        ...job,
        firstSeenAt: now,
        lastSeenAt: now,
      });
      stats.newRecords += 1;
    } catch (error) {
      if (error?.code === 11000) {
        stats.duplicates += 1;
        stats.updated += 1;
        continue;
      }
      stats.failed += 1;
      console.error('Upsert failed:', error.message);
    }
  }

  return stats;
}
