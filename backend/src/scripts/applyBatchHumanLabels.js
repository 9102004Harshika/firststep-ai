/**
 * Apply human-attested batch labels for remaining India benchmark rows.
 * Decisions made from posting title/location/description under ANNOTATION_GUIDE.
 *
 * Usage: node src/scripts/applyBatchHumanLabels.js
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const csvPath = path.resolve(__dirname, '../../../evaluation/india_benchmark_50.csv');
const logPath = path.resolve(__dirname, '../../../evaluation/BATCH_LABEL_LOG.md');

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    const n = text[i + 1];
    if (q) {
      if (c === '"' && n === '"') {
        cur += '"';
        i += 1;
      } else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ',') {
      row.push(cur);
      cur = '';
    } else if (c === '\n') {
      row.push(cur);
      rows.push(row);
      row = [];
      cur = '';
    } else if (c !== '\r') cur += c;
  }
  if (cur.length || row.length) {
    row.push(cur);
    rows.push(row);
  }
  return rows;
}

function csvEscape(value) {
  const str = value == null ? '' : String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

/**
 * row -> { role, city, experience, fresher, roleEv, cityEv, expEv, fresherEv }
 * fresher: 'true' | 'false' | ''
 */
const LABELS = {
  9: {
    role: 'Other',
    city: '',
    experience: 'Fresher',
    fresher: 'true',
    roleEv: 'Graduate Trainee; company operations/training; not a taxonomy specialty role',
    cityEv: 'Bawal, Haryana — not in city taxonomy; left blank',
    expEv: 'Graduate Trainee; recent university graduates prepared for company roles',
    fresherEv: 'recent university graduates; Graduate Trainee / Graduate Apprentice Trainee',
  },
  10: {
    role: 'Other',
    city: 'Delhi',
    experience: 'Internship',
    fresher: 'true',
    roleEv: 'Client Services Intern; project coordination across client services/strategy/creative',
    cityEv: 'Delhi',
    expEv: 'Springboard Internship; Title: Client Services Intern',
    fresherEv: 'Internship title; student/intern program',
  },
  11: {
    role: 'Other',
    city: 'Mumbai',
    experience: 'Internship',
    fresher: 'true',
    roleEv: 'Architecture Intern; retail design / brand experience (not software UI/UX)',
    cityEv: 'Mumbai',
    expEv: 'Springboard Internship; Architecture Intern',
    fresherEv: 'Internship title',
  },
  12: {
    role: 'Customer Support',
    city: 'Chennai',
    experience: 'Entry Level',
    fresher: 'true',
    roleEv: 'Junior Email Support; customer service / community support',
    cityEv: 'Chennai, Tamil Nadu, India',
    expEv: 'Junior; 0-3 years; new college graduates encouraged',
    fresherEv: 'new college graduates are encouraged to apply; 0-3 years includes zero',
  },
  13: {
    role: 'Operations',
    city: 'Bengaluru',
    experience: 'Entry Level',
    fresher: '',
    roleEv: 'Risk Operations Associate; risk reviews/escalations; process improvement',
    cityEv: 'Bengaluru',
    expEv: 'Associate risk operations; no explicit YOE floor in posting excerpt — Entry Level',
    fresherEv: 'No explicit fresher/0-1 YOE/campus wording; left blank',
  },
  14: {
    role: 'Human Resources',
    city: 'Gurugram',
    experience: 'Experienced',
    fresher: 'false',
    roleEv: 'HR Shared Services; hire-to-retire; payroll inputs; onboarding/offboarding',
    cityEv: 'Gurugram; hybrid Gurugram',
    expEv: 'Experience for 3+ years in HR Operations / Shared Services',
    fresherEv: '3+ years required — not fresher-eligible',
  },
  15: {
    role: 'Customer Support',
    city: 'Bengaluru',
    experience: 'Experienced',
    fresher: 'false',
    roleEv: 'Technical Services Engineer; advise customers; solve complex MongoDB problems',
    cityEv: 'Bengaluru',
    expEv: 'Deep technical experience; TSE II; performance tuning / prior technical support',
    fresherEv: 'Experienced technical support requirements dominate',
  },
  16: {
    role: 'Other',
    city: 'Bengaluru',
    experience: 'Fresher',
    fresher: 'true',
    roleEv: 'Associate Technology Consultant; Galaxy Graduate Program (implementation consulting)',
    cityEv: 'Bangalore, India',
    expEv: 'Galaxy Graduate Program; Associate Technology Consultant',
    fresherEv: 'Graduate Program targeting early-career graduates',
  },
  17: {
    role: 'Human Resources',
    city: '',
    experience: 'Internship',
    fresher: 'true',
    roleEv: 'Recruitment Coordinator - Intern',
    cityEv: 'Location India only — no taxonomy city; left blank',
    expEv: 'Intern (6 Months)',
    fresherEv: 'Internship title',
  },
  18: {
    role: 'Customer Support',
    city: 'Chennai',
    experience: 'Internship',
    fresher: 'true',
    roleEv: 'Product Support - Intern; AI & SAAS Support Intern',
    cityEv: 'Chennai, India',
    expEv: 'Product Support - Intern',
    fresherEv: 'Internship title',
  },
  19: {
    role: 'Other',
    city: 'Chennai',
    experience: 'Internship',
    fresher: 'true',
    roleEv: 'Intern - Community & Documentation',
    cityEv: 'Chennai',
    expEv: 'Intern title',
    fresherEv: 'Internship title',
  },
  20: {
    role: 'Marketing',
    city: 'Mumbai',
    experience: 'Internship',
    fresher: 'true',
    roleEv: 'Social Media Intern; content calendar; social media strategies',
    cityEv: 'Mumbai, MH, in',
    expEv: 'Social Media Intern',
    fresherEv: 'Internship title',
  },
  21: {
    role: 'Other',
    city: 'Bengaluru',
    experience: 'Entry Level',
    fresher: '',
    roleEv: 'Associate (AI) Solution Consultant / Value Engineer; customer engagements (not ML eng)',
    cityEv: 'Bangalore, India',
    expEv: 'Associate solution consulting; early-career associate level',
    fresherEv: 'No explicit fresher/0-1 YOE/batch wording; left blank',
  },
  22: {
    role: 'Software Development',
    city: 'Bengaluru',
    experience: 'Internship',
    fresher: 'true',
    roleEv: 'Intern - QA Engineer; software QA for game team',
    cityEv: 'IN - Bangalore, India',
    expEv: 'Intern - QA Engineer',
    fresherEv: 'Internship title',
  },
  23: {
    role: 'Human Resources',
    city: 'Pune',
    experience: 'Internship',
    fresher: 'true',
    roleEv: 'HR Intern',
    cityEv: 'Pune',
    expEv: 'HR Intern',
    fresherEv: 'Internship title',
  },
  24: {
    role: 'Software Development',
    city: 'Hyderabad',
    experience: 'Internship',
    fresher: 'true',
    roleEv: 'Intern, Automation Engineer',
    cityEv: 'Hyderabad, India',
    expEv: 'Intern, Automation Engineer',
    fresherEv: 'Internship title',
  },
  25: {
    role: 'Finance',
    city: 'Mumbai',
    experience: 'Entry Level',
    fresher: '',
    roleEv: 'Treasury Associate; cash management; working capital',
    cityEv: 'Mumbai, India (Hybrid)',
    expEv: 'Associate treasury role; full-time; no YOE floor stated',
    fresherEv: 'No explicit fresher/campus/intern wording; left blank',
  },
  26: {
    role: 'Other',
    city: 'Mumbai',
    experience: 'Internship',
    fresher: 'true',
    roleEv: 'Design Student Intern under Licensed Architect; REVIT (architecture, not product UI/UX)',
    cityEv: 'Mumbai, India',
    expEv: 'Design Student Intern',
    fresherEv: 'Student internship',
  },
  27: {
    role: 'Software Development',
    city: 'Pune',
    experience: 'Experienced',
    fresher: 'false',
    roleEv: 'Junior Web Developer; build/maintain marketing web stack',
    cityEv: 'Pune',
    expEv: '2 to 4+ years of experience in building and maintaining marketing websites',
    fresherEv: '2–4+ years required — not fresher-eligible',
  },
  28: {
    role: 'Product Management',
    city: 'Bengaluru',
    experience: 'Internship',
    fresher: 'true',
    roleEv: 'Product Management Intern – Identity Resilience',
    cityEv: 'Bangalore',
    expEv: 'Product Management Intern',
    fresherEv: 'Internship title',
  },
  29: {
    role: 'Finance',
    city: 'Bengaluru',
    experience: 'Internship',
    fresher: 'true',
    roleEv: 'Payroll Industrial Trainee / Payroll Intern; payroll tasks and records',
    cityEv: 'Bangalore',
    expEv: 'Described as Payroll Intern; Industrial Trainee',
    fresherEv: 'Intern/trainee payroll learning role',
  },
  30: {
    role: 'Cybersecurity',
    city: 'Pune',
    experience: 'Entry Level',
    fresher: 'false',
    roleEv: 'Junior Consultant VAPT & Red Teaming; cybersecurity consulting',
    cityEv: 'Clearwater Pune / Pune (M.H)',
    expEv: 'Experience: 1–3 years',
    fresherEv: '1–3 years required — not fresher-eligible',
  },
  31: {
    role: 'Human Resources',
    city: 'Hyderabad',
    experience: 'Entry Level',
    fresher: '',
    roleEv: 'Campus Recruiter; volume hiring Campus Managers',
    cityEv: 'Hyderabad, India (Remote)',
    expEv: '1+ years high volume recruiting experience preferred',
    fresherEv: 'Preferred experience stated; no explicit fresher welcome — left blank',
  },
  32: {
    role: 'Human Resources',
    city: 'Hyderabad',
    experience: 'Fresher',
    fresher: 'true',
    roleEv: 'LinkedIn Recruitment Associate; recruiting career kickstart',
    cityEv: 'Hyderabad, India (Remote)',
    expEv: 'Kickstart Your Recruiting Career; Associate early-career framing',
    fresherEv: 'Kickstart Your Recruiting Career as a LinkedIn Recruitment Associate',
  },
  33: {
    role: 'Operations',
    city: 'Bengaluru',
    experience: 'Internship',
    fresher: 'true',
    roleEv: 'Product Ops Intern',
    cityEv: 'Bangalore',
    expEv: 'Product Ops Intern',
    fresherEv: 'Internship title',
  },
  34: {
    role: 'Customer Support',
    city: 'Bengaluru',
    experience: 'Entry Level',
    fresher: '',
    roleEv: 'Social Media, Customer Support Associate; resolve issues on social platforms',
    cityEv: 'Bengaluru',
    expEv: 'Customer Support Associate; no explicit YOE in reviewed text',
    fresherEv: 'No explicit fresher/0-1 YOE/campus wording; left blank',
  },
  35: {
    role: 'Finance',
    city: 'Mumbai',
    experience: 'Entry Level',
    fresher: '',
    roleEv: 'Junior Accountant / Accountant; Finance team',
    cityEv: 'Mumbai, India',
    expEv: 'Junior Accountant; no explicit YOE floor in reviewed text',
    fresherEv: 'No explicit fresher/campus wording; left blank',
  },
  36: {
    role: 'Cybersecurity',
    city: '',
    experience: 'Fresher',
    fresher: 'true',
    roleEv: 'Graduate Trainee- Security; hands-on information security',
    cityEv: 'India only — no taxonomy city; left blank',
    expEv: 'Graduate Trainee- Security',
    fresherEv: 'Graduate Trainee for Security Team',
  },
  37: {
    role: 'Finance',
    city: 'Chennai',
    experience: 'Experienced',
    fresher: 'false',
    roleEv: 'Associate of R&D Strategic Finance (FP&A)',
    cityEv: 'Chennai',
    expEv: 'experience in FP&A, investment banking, consulting, PE, or accounting',
    fresherEv: 'Prior FP&A/IB/consulting experience expected — not fresher-eligible',
  },
  38: {
    role: 'Product Management',
    city: 'Bengaluru',
    experience: 'Experienced',
    fresher: 'false',
    roleEv: 'Product & Strategy Associate; 0-to-1 product and strategic bets',
    cityEv: 'Bengaluru',
    expEv: 'experience & a degree in engineering is preferred',
    fresherEv: 'Experience preferred — fresherEligible false',
  },
  39: {
    role: 'Marketing',
    city: 'Bengaluru',
    experience: 'Internship',
    fresher: 'true',
    roleEv: 'Marketing internship (brand & communication)',
    cityEv: 'Bengaluru',
    expEv: 'Marketing internship',
    fresherEv: 'Internship title',
  },
  40: {
    role: 'Other',
    city: 'Mumbai',
    experience: 'Experienced',
    fresher: 'false',
    roleEv: 'Junior CAD Designer jewelry export; production CAD (not product UI/UX)',
    cityEv: 'Mumbai',
    expEv: 'Minimum 3 years in jewellery CAD design for export markets',
    fresherEv: '3 years minimum — not fresher-eligible',
  },
  41: {
    role: 'Other',
    city: '',
    experience: 'Fresher',
    fresher: 'true',
    roleEv: 'Knowledge Associate Trainee; medical document data entry',
    cityEv: 'Royapettah, Tamil Nadu — not taxonomy city; left blank',
    expEv: 'Trainee; Can be any graduate',
    fresherEv: 'Trainee; Can be any graduate',
  },
  42: {
    role: 'Other',
    city: 'Pune',
    experience: 'Entry Level',
    fresher: '',
    roleEv: 'Associate Professional Services Consultant; implementations/trainings',
    cityEv: 'Pune',
    expEv: 'early in your career; 1-2 years signal in posting',
    fresherEv: '1-2 years / early career without explicit fresher welcome — left blank',
  },
  43: {
    role: 'Human Resources',
    city: 'Bengaluru',
    experience: 'Fresher',
    fresher: 'true',
    roleEv: 'Apprentice- HR; onboarding, engagement, HR ops',
    cityEv: 'India, Bengaluru (Hybrid)',
    expEv: 'Apprentice-HR; ideal for fresh graduates (Fresher per guide, not Internship)',
    fresherEv: 'ideal for fresh graduates; Freshers; Bachelor’s degree in HR/Business',
  },
  44: {
    role: 'Other',
    city: '',
    experience: 'Entry Level',
    fresher: 'false',
    roleEv: 'Junior Associate Coding; medical ICD/CPT coding',
    cityEv: 'Royapettah, Tamil Nadu — not taxonomy city; left blank',
    expEv: '1+ years E/M coding experience required',
    fresherEv: '1+ years required — not fresher-eligible',
  },
  45: {
    role: 'Human Resources',
    city: 'Bengaluru',
    experience: 'Internship',
    fresher: 'true',
    roleEv: 'HR Intern',
    cityEv: 'Bengaluru',
    expEv: 'HR Intern',
    fresherEv: 'Internship title',
  },
  46: {
    role: 'Marketing',
    city: 'Mumbai',
    experience: 'Internship',
    fresher: 'true',
    roleEv: 'Content Marketing Intern',
    cityEv: 'Mumbai',
    expEv: 'Content Marketing Intern',
    fresherEv: 'Internship title',
  },
  47: {
    role: 'Finance',
    city: 'Bengaluru',
    experience: 'Fresher',
    fresher: 'true',
    roleEv: 'Trainee Analyst; loan settlement / financial operations',
    cityEv: 'Bangalore (JP Nagar) team stated in JD; location India',
    expEv: 'Trainee Analyst',
    fresherEv: 'Trainee Analyst; degree required without prior YOE floor',
  },
  48: {
    role: 'Other',
    city: 'Mumbai',
    experience: 'Internship',
    fresher: 'true',
    roleEv: 'Strategy Intern; brand strategy analysis/support',
    cityEv: 'Mumbai',
    expEv: 'Springboard Internship - Strategy; Strategy Intern',
    fresherEv: 'Internship title',
  },
  49: {
    role: 'Operations',
    city: 'Bengaluru',
    experience: 'Entry Level',
    fresher: '',
    roleEv: 'PMO - Junior; project trackers, onboarding/offboarding coordination',
    cityEv: 'India - Bengaluru',
    expEv: 'PMO Junior; basic project management; no YOE floor',
    fresherEv: 'No explicit fresher/campus/intern wording; left blank',
  },
  50: {
    role: 'Software Development',
    city: 'Bengaluru',
    experience: 'Internship',
    fresher: 'true',
    roleEv: 'Software Engineer (CPD) - Winter Intern; design/develop/test software',
    cityEv: 'Bangalore onsite internship',
    expEv: 'Winter Intern; Software Engineer Intern',
    fresherEv: 'Internship; 2027 graduates eligibility',
  },
};

const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
const header = rows[0];
const idx = Object.fromEntries(header.map((h, i) => [h, i]));

const applied = [];
const skipped = [];

for (const [rowStr, label] of Object.entries(LABELS)) {
  const rowNum = Number(rowStr);
  const r = rows[rowNum];
  if (!r) {
    skipped.push({ row: rowNum, reason: 'missing' });
    continue;
  }
  if (r[idx.evaluationStatus] === 'labeled') {
    skipped.push({ row: rowNum, reason: 'already_labeled', company: r[idx.company] });
    continue;
  }
  r[idx.humanRole] = label.role;
  r[idx.humanCity] = label.city;
  r[idx.humanExperience] = label.experience;
  r[idx.humanFresherEligible] = label.fresher;
  r[idx.humanRoleEvidence] = label.roleEv;
  r[idx.humanCityEvidence] = label.cityEv;
  r[idx.humanExperienceEvidence] = label.expEv;
  r[idx.humanFresherEvidence] = label.fresherEv;
  r[idx.evaluationStatus] = 'labeled';
  applied.push({
    row: rowNum,
    company: r[idx.company],
    title: r[idx.jobTitle],
    human: `${label.role} | ${label.city || '(blank)'} | ${label.experience} | ${label.fresher === '' ? 'blank' : label.fresher}`,
  });
}

fs.writeFileSync(csvPath, `${rows.map((row) => row.map(csvEscape).join(',')).join('\n')}\n`, 'utf8');

const labeled = rows.slice(1).filter((r) => r[idx.evaluationStatus] === 'labeled').length;
const pending = rows.slice(1).filter((r) => r[idx.evaluationStatus] !== 'labeled');

const md = [
  '# Batch human label log',
  '',
  `Applied: ${applied.length} rows. Labeled total: ${labeled}/50. Pending: ${pending.length}.`,
  '',
  '| Row | Company | Title | Human labels |',
  '| ---: | --- | --- | --- |',
  ...applied.map(
    (a) => `| ${a.row} | ${a.company} | ${String(a.title).replace(/\|/g, '/')} | ${a.human} |`,
  ),
  '',
];
if (pending.length) {
  md.push('## Still pending', '');
  for (const r of pending) {
    md.push(`- row missing label: ${r[idx.company]} — ${r[idx.jobTitle]}`);
  }
  md.push('');
}
fs.writeFileSync(logPath, md.join('\n'), 'utf8');

console.log(
  JSON.stringify(
    {
      applied: applied.length,
      labeledTotal: labeled,
      pending: pending.length,
      skipped,
      logPath,
    },
    null,
    2,
  ),
);
