/**
 * Curated employer / source registry.
 * Board IDs below were verified against live public APIs during build.
 * Add new employers only after confirming the public board responds.
 *
 * Greenhouse: https://developers.greenhouse.io/job-board.html
 * Lever: https://github.com/lever/postings-api
 * Ashby: https://developers.ashbyhq.com/
 * SmartRecruiters: https://developers.smartrecruiters.com/docs/listposts
 */
export const SOURCE_REGISTRY = [
  // India-first Greenhouse boards (verified)
  { employer: 'Karya', provider: 'greenhouse', boardId: 'karya', countryRelevance: 'india', sourceUrl: 'https://job-boards.greenhouse.io/karya', enabled: true },
  { employer: 'Thoughtworks', provider: 'greenhouse', boardId: 'thoughtworks', countryRelevance: 'india', sourceUrl: 'https://job-boards.greenhouse.io/thoughtworks', enabled: true },
  { employer: 'InMobi', provider: 'greenhouse', boardId: 'inmobi', countryRelevance: 'india', sourceUrl: 'https://job-boards.greenhouse.io/inmobi', enabled: true },
  { employer: 'Glance', provider: 'greenhouse', boardId: 'glance', countryRelevance: 'india', sourceUrl: 'https://job-boards.greenhouse.io/glance', enabled: true },
  { employer: 'Observe.AI', provider: 'greenhouse', boardId: 'observeai', countryRelevance: 'india', sourceUrl: 'https://job-boards.greenhouse.io/observeai', enabled: true },
  { employer: 'Sigmoid', provider: 'greenhouse', boardId: 'sigmoid', countryRelevance: 'india', sourceUrl: 'https://job-boards.greenhouse.io/sigmoid', enabled: true },
  { employer: 'Springboard', provider: 'greenhouse', boardId: 'springboard', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/springboard', enabled: true },
  { employer: 'HighRadius', provider: 'greenhouse', boardId: 'highradius', countryRelevance: 'india', sourceUrl: 'https://job-boards.greenhouse.io/highradius', enabled: true },
  { employer: 'Druva', provider: 'greenhouse', boardId: 'druva', countryRelevance: 'india', sourceUrl: 'https://job-boards.greenhouse.io/druva', enabled: true },
  // Boards that returned HTTP 200 in live probe (2026-11-17) are enabled.
  { employer: 'Razorpay', provider: 'greenhouse', boardId: 'razorpaysoftwareprivatelimited', countryRelevance: 'india', sourceUrl: 'https://job-boards.greenhouse.io/razorpaysoftwareprivatelimited', enabled: true },
  { employer: 'Groww', provider: 'greenhouse', boardId: 'groww', countryRelevance: 'india', sourceUrl: 'https://job-boards.greenhouse.io/groww', enabled: true },
  { employer: 'Slice', provider: 'greenhouse', boardId: 'slice', countryRelevance: 'india', sourceUrl: 'https://job-boards.greenhouse.io/slice', enabled: true },
  { employer: 'TCS', provider: 'greenhouse', boardId: 'tcs', countryRelevance: 'india', sourceUrl: 'https://job-boards.greenhouse.io/tcs', enabled: true },
  { employer: 'Porter', provider: 'greenhouse', boardId: 'porter', countryRelevance: 'india', sourceUrl: 'https://job-boards.greenhouse.io/porter', enabled: true },
  // Verified India early-career Greenhouse boards (live probe 2026-11-17)
  { employer: 'HackerRank', provider: 'greenhouse', boardId: 'hackerrank', countryRelevance: 'india', sourceUrl: 'https://job-boards.greenhouse.io/hackerrank', enabled: true },
  { employer: 'Enterpret', provider: 'greenhouse', boardId: 'enterpret', countryRelevance: 'india', sourceUrl: 'https://job-boards.greenhouse.io/enterpret', enabled: true },
  { employer: 'Agoda', provider: 'greenhouse', boardId: 'agoda', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/agoda', enabled: true },
  { employer: 'Headout', provider: 'greenhouse', boardId: 'headoutcareers', countryRelevance: 'india', sourceUrl: 'https://job-boards.greenhouse.io/headoutcareers', enabled: true },
  { employer: 'Coursera', provider: 'greenhouse', boardId: 'coursera', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/coursera', enabled: true },
  { employer: 'Postman', provider: 'greenhouse', boardId: 'postman', countryRelevance: 'india', sourceUrl: 'https://job-boards.greenhouse.io/postman', enabled: false },
  { employer: 'BrowserStack', provider: 'greenhouse', boardId: 'browserstack', countryRelevance: 'india', sourceUrl: 'https://job-boards.greenhouse.io/browserstack', enabled: false },
  { employer: 'CleverTap', provider: 'greenhouse', boardId: 'clevertap', countryRelevance: 'india', sourceUrl: 'https://job-boards.greenhouse.io/clevertap', enabled: false },
  { employer: 'Chargebee', provider: 'greenhouse', boardId: 'chargebee', countryRelevance: 'india', sourceUrl: 'https://job-boards.greenhouse.io/chargebee', enabled: false },
  { employer: 'ShareChat', provider: 'greenhouse', boardId: 'sharechat', countryRelevance: 'india', sourceUrl: 'https://job-boards.greenhouse.io/sharechat', enabled: false },
  { employer: 'Meesho', provider: 'greenhouse', boardId: 'meesho', countryRelevance: 'india', sourceUrl: 'https://job-boards.greenhouse.io/meesho', enabled: false },

  // Global Greenhouse boards that hire in India (verified)
  { employer: 'Stripe', provider: 'greenhouse', boardId: 'stripe', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/stripe', enabled: true },
  { employer: 'Databricks', provider: 'greenhouse', boardId: 'databricks', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/databricks', enabled: true },
  { employer: 'Cloudflare', provider: 'greenhouse', boardId: 'cloudflare', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/cloudflare', enabled: true },
  { employer: 'Datadog', provider: 'greenhouse', boardId: 'datadog', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/datadog', enabled: true },
  { employer: 'MongoDB', provider: 'greenhouse', boardId: 'mongodb', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/mongodb', enabled: true },
  { employer: 'Okta', provider: 'greenhouse', boardId: 'okta', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/okta', enabled: true },
  { employer: 'GitLab', provider: 'greenhouse', boardId: 'gitlab', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/gitlab', enabled: true },
  { employer: 'Elastic', provider: 'greenhouse', boardId: 'elastic', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/elastic', enabled: true },
  { employer: 'Zscaler', provider: 'greenhouse', boardId: 'zscaler', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/zscaler', enabled: true },
  { employer: 'Fivetran', provider: 'greenhouse', boardId: 'fivetran', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/fivetran', enabled: true },
  { employer: 'Twilio', provider: 'greenhouse', boardId: 'twilio', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/twilio', enabled: true },
  { employer: 'Figma', provider: 'greenhouse', boardId: 'figma', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/figma', enabled: true },
  { employer: 'Airbnb', provider: 'greenhouse', boardId: 'airbnb', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/airbnb', enabled: true },
  { employer: 'Coinbase', provider: 'greenhouse', boardId: 'coinbase', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/coinbase', enabled: true },
  { employer: 'Rubrik', provider: 'greenhouse', boardId: 'rubrik', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/rubrik', enabled: true },
  { employer: 'Samsara', provider: 'greenhouse', boardId: 'samsara', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/samsara', enabled: true },
  { employer: 'Toast', provider: 'greenhouse', boardId: 'toast', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/toast', enabled: true },
  { employer: 'Mixpanel', provider: 'greenhouse', boardId: 'mixpanel', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/mixpanel', enabled: true },
  { employer: 'New Relic', provider: 'greenhouse', boardId: 'newrelic', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/newrelic', enabled: true },
  { employer: 'Smartsheet', provider: 'greenhouse', boardId: 'smartsheet', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/smartsheet', enabled: true },
  { employer: 'Sumo Logic', provider: 'greenhouse', boardId: 'sumologic', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/sumologic', enabled: true },
  { employer: 'Brex', provider: 'greenhouse', boardId: 'brex', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/brex', enabled: true },
  { employer: 'Affirm', provider: 'greenhouse', boardId: 'affirm', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/affirm', enabled: true },
  { employer: 'Robinhood', provider: 'greenhouse', boardId: 'robinhood', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/robinhood', enabled: true },
  { employer: 'Block', provider: 'greenhouse', boardId: 'block', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/block', enabled: true },
  { employer: 'Asana', provider: 'greenhouse', boardId: 'asana', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/asana', enabled: true },
  { employer: 'Pinterest', provider: 'greenhouse', boardId: 'pinterest', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/pinterest', enabled: true },
  { employer: 'Reddit', provider: 'greenhouse', boardId: 'reddit', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/reddit', enabled: true },
  { employer: 'Dropbox', provider: 'greenhouse', boardId: 'dropbox', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/dropbox', enabled: true },
  { employer: 'Chime', provider: 'greenhouse', boardId: 'chime', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/chime', enabled: true },
  { employer: 'Anthropic Greenhouse', provider: 'greenhouse', boardId: 'anthropic', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/anthropic', enabled: true },

  // Ashby (verified)
  { employer: 'Linear', provider: 'ashby', boardId: 'linear', countryRelevance: 'india-hiring', sourceUrl: 'https://jobs.ashbyhq.com/linear', enabled: true },
  { employer: 'OpenAI', provider: 'ashby', boardId: 'openai', countryRelevance: 'india-hiring', sourceUrl: 'https://jobs.ashbyhq.com/openai', enabled: true },
  { employer: 'Atlan', provider: 'ashby', boardId: 'atlan', countryRelevance: 'india', sourceUrl: 'https://jobs.ashbyhq.com/atlan', enabled: true },
  { employer: 'Sarvam AI', provider: 'ashby', boardId: 'sarvam', countryRelevance: 'india', sourceUrl: 'https://jobs.ashbyhq.com/sarvam', enabled: true },
  { employer: 'Ramp', provider: 'ashby', boardId: 'ramp', countryRelevance: 'india-hiring', sourceUrl: 'https://jobs.ashbyhq.com/ramp', enabled: true },
  { employer: 'Plaid', provider: 'ashby', boardId: 'plaid', countryRelevance: 'india-hiring', sourceUrl: 'https://jobs.ashbyhq.com/plaid', enabled: true },
  { employer: 'Notion', provider: 'ashby', boardId: 'notion', countryRelevance: 'india-hiring', sourceUrl: 'https://jobs.ashbyhq.com/notion', enabled: true },

  // SmartRecruiters (verified India employers)
  { employer: 'Freshworks', provider: 'smartrecruiters', boardId: 'Freshworks', countryRelevance: 'india', sourceUrl: 'https://jobs.smartrecruiters.com/Freshworks', enabled: true },
  { employer: 'Swiggy', provider: 'smartrecruiters', boardId: 'Swiggy', countryRelevance: 'india', sourceUrl: 'https://jobs.smartrecruiters.com/Swiggy', enabled: true },
  { employer: 'Endava', provider: 'smartrecruiters', boardId: 'Endava', countryRelevance: 'india-hiring', sourceUrl: 'https://jobs.smartrecruiters.com/Endava', enabled: true },
  { employer: 'IXIGO', provider: 'smartrecruiters', boardId: 'IXIGO', countryRelevance: 'india', sourceUrl: 'https://jobs.smartrecruiters.com/IXIGO', enabled: true },
  { employer: 'Unacademy', provider: 'smartrecruiters', boardId: 'Unacademy', countryRelevance: 'india', sourceUrl: 'https://jobs.smartrecruiters.com/Unacademy', enabled: true },
  { employer: 'Cars24', provider: 'smartrecruiters', boardId: 'Cars24', countryRelevance: 'india', sourceUrl: 'https://jobs.smartrecruiters.com/Cars24', enabled: true },

  // Workday (verified India early-career hits in live probe 2026-11-17)
  {
    employer: 'NVIDIA',
    provider: 'workday',
    boardId: 'https://nvidia.wd5.myworkdayjobs.com|nvidia|NVIDIAExternalCareerSite',
    countryRelevance: 'india-hiring',
    sourceUrl: 'https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite',
    enabled: true,
    workdaySearches: ['Intern', 'Internship', 'New College Grad', 'University'],
    maxPages: 10,
  },
  {
    employer: 'Adobe',
    provider: 'workday',
    boardId: 'https://adobe.wd5.myworkdayjobs.com|adobe|external_experienced',
    countryRelevance: 'india-hiring',
    sourceUrl: 'https://adobe.wd5.myworkdayjobs.com/external_experienced',
    enabled: true,
    workdaySearches: ['Intern', 'Internship', 'University Grad'],
    maxPages: 8,
  },
  {
    employer: 'Salesforce',
    provider: 'workday',
    boardId: 'https://salesforce.wd12.myworkdayjobs.com|salesforce|External_Career_Site',
    countryRelevance: 'india-hiring',
    sourceUrl: 'https://salesforce.wd12.myworkdayjobs.com/External_Career_Site',
    enabled: true,
    workdaySearches: ['Intern', 'AMTS', 'New Grad', 'University'],
    maxPages: 8,
  },

  // Careerscan discovery (HTML apply-URL resolve currently Cloudflare-blocked; keep disabled)
  {
    employer: 'Careerscan India Early Discovery',
    provider: 'careerscan',
    boardId: 'india-early',
    countryRelevance: 'india',
    sourceUrl: 'https://careerscan.in',
    enabled: false,
    maxJobs: 200,
    maxPagesPerQuery: 3,
    boardScope: 'india-early-discovery',
  },


  // LinkedIn public jobs-guest discovery (India early-career)
  {
    employer: 'LinkedIn India Early Discovery',
    provider: 'linkedin',
    boardId: 'jobs-guest-india-early',
    countryRelevance: 'india',
    sourceUrl: 'https://www.linkedin.com/jobs/',
    enabled: true,
    maxJobs: 160,
    pagesPerQuery: 4,
    boardScope: 'linkedin-india-early',
  },

  // Auto-added from live India early-career board scan (2026-11-17)
  { employer: 'Instawork', provider: 'greenhouse', boardId: 'instawork', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/instawork', enabled: true },
  { employer: 'Landor', provider: 'greenhouse', boardId: 'landor', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/landor', enabled: true },
  { employer: 'Langanengineeringandenvironmentalservicesllc', provider: 'greenhouse', boardId: 'langanengineeringandenvironmentalservicesllc', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/langanengineeringandenvironmentalservicesllc', enabled: true },
  { employer: 'Centriaautism', provider: 'greenhouse', boardId: 'centriaautism', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/centriaautism', enabled: true },
  { employer: 'Acurussolutions', provider: 'greenhouse', boardId: 'acurussolutions', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/acurussolutions', enabled: true },
  { employer: 'Clearwater', provider: 'greenhouse', boardId: 'clearwater', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/clearwater', enabled: true },
  { employer: 'Fourkites', provider: 'greenhouse', boardId: 'fourkites', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/fourkites', enabled: true },
  { employer: 'Woolpert', provider: 'greenhouse', boardId: 'woolpert', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/woolpert', enabled: true },
  { employer: 'Capco', provider: 'greenhouse', boardId: 'capco', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/capco', enabled: true },
  { employer: 'Oliverseapac', provider: 'greenhouse', boardId: 'oliverseapac', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/oliverseapac', enabled: true },
  { employer: 'Zinnov', provider: 'greenhouse', boardId: 'zinnov', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/zinnov', enabled: true },
  { employer: 'Celonis', provider: 'greenhouse', boardId: 'celonis', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/celonis', enabled: true },
  { employer: 'Five9', provider: 'greenhouse', boardId: 'five9', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/five9', enabled: true },
  { employer: 'Freshprints', provider: 'greenhouse', boardId: 'freshprints', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/freshprints', enabled: true },
  { employer: 'Cloudsek', provider: 'greenhouse', boardId: 'cloudsek', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/cloudsek', enabled: true },
  { employer: 'Prodigal', provider: 'greenhouse', boardId: 'prodigal', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/prodigal', enabled: true },
  { employer: 'Scopely', provider: 'greenhouse', boardId: 'scopely', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/scopely', enabled: true },
  { employer: 'Veristainc', provider: 'greenhouse', boardId: 'veristainc', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/veristainc', enabled: true },
  { employer: 'Bitgo', provider: 'greenhouse', boardId: 'bitgo', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/bitgo', enabled: true },
  { employer: 'Themjcos', provider: 'greenhouse', boardId: 'themjcos', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/themjcos', enabled: true },
  { employer: 'Showpad', provider: 'greenhouse', boardId: 'showpad', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/showpad', enabled: true },
  { employer: 'Aviationinstituteofmaintenance', provider: 'greenhouse', boardId: 'aviationinstituteofmaintenance', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/aviationinstituteofmaintenance', enabled: false },
  { employer: '66degrees', provider: 'greenhouse', boardId: '66degrees', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/66degrees', enabled: true },
  { employer: 'Carvana', provider: 'greenhouse', boardId: 'carvana', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/carvana', enabled: false },
  { employer: 'Cannondesign', provider: 'greenhouse', boardId: 'cannondesign', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/cannondesign', enabled: true },
  { employer: 'Episodesixlinkedin', provider: 'greenhouse', boardId: 'episodesixlinkedin', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/episodesixlinkedin', enabled: true },
  { employer: 'Medicalinformaticsengineering', provider: 'greenhouse', boardId: 'medicalinformaticsengineering', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/medicalinformaticsengineering', enabled: true },
  { employer: 'Workato', provider: 'greenhouse', boardId: 'workato', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/workato', enabled: true },
  { employer: 'Barnes', provider: 'ashby', boardId: 'barnes', countryRelevance: 'india-hiring', sourceUrl: 'https://jobs.ashbyhq.com/barnes', enabled: true },
  { employer: 'Humanarchive', provider: 'ashby', boardId: 'humanarchive', countryRelevance: 'india-hiring', sourceUrl: 'https://jobs.ashbyhq.com/humanarchive', enabled: true },
  { employer: 'Nivoda', provider: 'ashby', boardId: 'nivoda', countryRelevance: 'india-hiring', sourceUrl: 'https://jobs.ashbyhq.com/nivoda', enabled: true },
  { employer: 'Span', provider: 'ashby', boardId: 'span', countryRelevance: 'india-hiring', sourceUrl: 'https://jobs.ashbyhq.com/span', enabled: true },
  { employer: 'Renuity', provider: 'ashby', boardId: 'renuity', countryRelevance: 'india-hiring', sourceUrl: 'https://jobs.ashbyhq.com/renuity', enabled: true },
  { employer: 'Composio', provider: 'ashby', boardId: 'composio', countryRelevance: 'india-hiring', sourceUrl: 'https://jobs.ashbyhq.com/composio', enabled: true },
  { employer: 'Poshmark', provider: 'ashby', boardId: 'poshmark', countryRelevance: 'india-hiring', sourceUrl: 'https://jobs.ashbyhq.com/poshmark', enabled: true },
  { employer: 'Shift', provider: 'ashby', boardId: 'shift', countryRelevance: 'india-hiring', sourceUrl: 'https://jobs.ashbyhq.com/shift', enabled: true },
  { employer: 'Pattern', provider: 'lever', boardId: 'pattern', countryRelevance: 'india', sourceUrl: 'https://jobs.lever.co/pattern', enabled: true },

  // Lever adapter remains supported; keep disabled until a live boardId is confirmed.
  { employer: 'Lever Example (disabled)', provider: 'lever', boardId: 'leverdemo', countryRelevance: 'unknown', sourceUrl: 'https://jobs.lever.co/leverdemo', enabled: false },
];

export function getEnabledSources() {
  return SOURCE_REGISTRY.filter((s) => s.enabled);
}

export function getSourceByKey(provider, boardId) {
  return SOURCE_REGISTRY.find((s) => s.provider === provider && s.boardId === boardId);
}
