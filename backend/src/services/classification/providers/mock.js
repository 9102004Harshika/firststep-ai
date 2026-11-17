import { extractIndianCities } from '../../../utils/cities.js';

export async function mockComplete({ user }) {
  const lower = user.toLowerCase();
  let role = 'Other';
  if (/software|developer|engineer|react|node|java|python/.test(lower)) role = 'Software Development';
  else if (/data scientist|machine learning|ml engineer|deep learning/.test(lower)) role = 'Machine Learning / AI';
  else if (/data analy/.test(lower)) role = 'Data Analytics';
  else if (/product manager|product management/.test(lower)) role = 'Product Management';
  else if (/design|ui\/ux|figma/.test(lower)) role = 'UI/UX Design';
  else if (/devops|cloud|sre|kubernetes/.test(lower)) role = 'DevOps / Cloud';
  else if (/market/.test(lower)) role = 'Marketing';
  else if (/sales/.test(lower)) role = 'Sales';
  else if (/hr|human resources|recruiter/.test(lower)) role = 'Human Resources';

  const cities = extractIndianCities(user);
  let experienceLevel = 'Unknown';
  if (/intern/.test(lower)) experienceLevel = 'Internship';
  else if (/fresher|new grad|campus/.test(lower)) experienceLevel = 'Fresher';
  else if (/entry|junior|0-1|0–1/.test(lower)) experienceLevel = 'Entry Level';
  else if (/senior|staff|lead|\d\+?\s*years/.test(lower)) experienceLevel = 'Experienced';

  let employmentType = 'Unknown';
  if (/intern/.test(lower)) employmentType = 'Internship';
  else if (/full[-\s]?time/.test(lower)) employmentType = 'Full-time';
  else if (/part[-\s]?time/.test(lower)) employmentType = 'Part-time';
  else if (/contract/.test(lower)) employmentType = 'Contract';
  else if (/remote/.test(lower)) employmentType = 'Remote';

  let fresherEligible = null;
  if (experienceLevel === 'Internship' || experienceLevel === 'Fresher') fresherEligible = true;
  else if (experienceLevel === 'Experienced') fresherEligible = false;

  const payload = {
    role,
    cities: cities.length ? cities : [],
    experienceLevel,
    employmentType,
    fresherEligible,
    confidence: 0.7,
    evidence: 'Deterministic mock classifier for tests',
  };

  return {
    text: JSON.stringify(payload),
    inputTokens: 100,
    outputTokens: 50,
    model: 'mock-v1',
    provider: 'mock',
    raw: payload,
  };
}
