/**
 * City helpers — re-export canonical India geography utilities.
 * Kept for backward-compatible imports across the codebase.
 */
export {
  extractIndianCities,
  normalizeCityName,
  isIndiaRelevant,
  evaluateIndiaGeography,
  INDIA_GEO_CITIES,
} from './indiaRelevance.js';
