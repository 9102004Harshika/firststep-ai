import { Job } from '../models/Job.js';
import { jobsQuerySchema } from '../validators/jobSchemas.js';

export async function listJobs(req, res, next) {
  try {
    const query = jobsQuerySchema.parse(req.query);
    const filter = { status: query.status };

    if (query.search) {
      filter.$text = { $search: query.search };
    }
    if (query.role) filter.role = query.role;
    if (query.city) filter['location.cities'] = query.city;
    if (query.experienceLevel) filter.experienceLevel = query.experienceLevel;
    if (query.employmentType) filter.employmentType = query.employmentType;
    if (query.fresherEligible !== undefined) filter.fresherEligible = query.fresherEligible;
    if (query.indiaRelevant !== undefined) filter.indiaRelevant = query.indiaRelevant;
    if (query.remote) {
      filter.$and = [
        ...(filter.$and || []),
        {
          $or: [
            { employmentType: 'Remote' },
            { 'location.cities': 'Remote' },
            { 'location.raw': { $regex: '\\bremote\\b', $options: 'i' } },
            { title: { $regex: '\\bremote\\b', $options: 'i' } },
          ],
        },
      ];
    }
    if (query.earlyCareer) {
      // Title-anchored early-career match (plus explicit fresher/intern fields).
      // Avoid relying on LLM "Entry Level" alone — it can mislabel senior roles.
      filter.$and = [
        ...(filter.$and || []),
        {
          $or: [
            { fresherEligible: true },
            { employmentType: 'Internship' },
            { experienceLevel: { $in: ['Internship', 'Fresher'] } },
            {
              title: {
                $regex:
                  '\\b(intern|internship|fresher|graduate|campus|trainee|junior|new\\s*grad|entry[-\\s]?level|associate)\\b',
                $options: 'i',
              },
            },
          ],
        },
        {
          title: {
            $not: {
              $regex: '\\b(senior|staff|principal|director|\\bvp\\b|chief)\\b',
              $options: 'i',
            },
          },
        },
      ];
    }

    const sortField = query.sort.startsWith('-') ? query.sort.slice(1) : query.sort;
    const sortDir = query.sort.startsWith('-') ? -1 : 1;
    const sort = { [sortField]: sortDir, _id: -1 };

    const skip = (query.page - 1) * query.limit;
    const [items, total] = await Promise.all([
      Job.find(filter).sort(sort).skip(skip).limit(query.limit).lean(),
      Job.countDocuments(filter),
    ]);

    res.json({
      ok: true,
      data: items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit) || 0,
      },
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ ok: false, error: error.errors });
    }
    return next(error);
  }
}

export async function getJob(req, res, next) {
  try {
    const job = await Job.findById(req.params.id).lean();
    if (!job) return res.status(404).json({ ok: false, error: 'Job not found' });
    return res.json({ ok: true, data: job });
  } catch (error) {
    return next(error);
  }
}

export async function getSimilarJobs(req, res, next) {
  try {
    const job = await Job.findById(req.params.id).lean();
    if (!job) return res.status(404).json({ ok: false, error: 'Job not found' });

    const or = [];
    if (job.role && job.role !== 'Unknown') or.push({ role: job.role });
    if (job.location?.cities?.length) or.push({ 'location.cities': { $in: job.location.cities } });
    if (job.company) or.push({ company: job.company });
    if (job.employmentType && job.employmentType !== 'Unknown') {
      or.push({ employmentType: job.employmentType });
    }

    const similar = await Job.find({
      _id: { $ne: job._id },
      status: 'active',
      $and: [
        ...(or.length ? [{ $or: or }] : []),
        {
          $or: [
            { fresherEligible: true },
            { employmentType: 'Internship' },
            { experienceLevel: { $in: ['Internship', 'Fresher'] } },
            {
              title: {
                $regex:
                  '\\b(intern|internship|fresher|graduate|campus|trainee|junior|new\\s*grad|entry[-\\s]?level|associate)\\b',
                $options: 'i',
              },
            },
          ],
        },
      ],
    })
      .sort({ postedAt: -1 })
      .limit(6)
      .lean();

    return res.json({ ok: true, data: similar });
  } catch (error) {
    return next(error);
  }
}
