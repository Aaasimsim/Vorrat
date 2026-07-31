import { todayIso } from './dates.js';

/**
 * Estimate the date a patient will run out of medication based on pack size,
 * daily dose, and date of last pickup.
 *
 * @param {object} input
 * @param {number|string} [input.packungsgroesse]  units in the pack (tablets, ml, …)
 * @param {number|string} [input.dosisProTag]      units consumed per day; may be fractional (0.5, 1.5)
 * @param {string} [input.letzteAbholung]          ISO date 'YYYY-MM-DD'
 * @param {string} [today]                         ISO date 'YYYY-MM-DD', defaults to todayIso()
 * @returns {{ reichtBis: string|null, tageVerbleibend: number|null, unsicher: boolean }}
 */
export function estimateRunOut(input, today = todayIso()) {
  const invalid = { reichtBis: null, tageVerbleibend: null, unsicher: true };

  if (!input || typeof input !== 'object') {
    return invalid;
  }

  const packungsgroesse = Number(input.packungsgroesse);
  const dosisProTag = Number(input.dosisProTag);
  const letzteAbholung = input.letzteAbholung;

  // Validate inputs: pack size > 0, daily dose > 0, valid ISO date YYYY-MM-DD
  if (
    isNaN(packungsgroesse) || packungsgroesse <= 0 ||
    isNaN(dosisProTag) || dosisProTag <= 0 ||
    typeof letzteAbholung !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(letzteAbholung)
  ) {
    return invalid;
  }

  // Calculate days of supply, rounded DOWN to whole days for safety
  const tageReichweite = Math.floor(packungsgroesse / dosisProTag);

  // Date math in UTC to avoid DST / timezone shifts
  const [year, month, day] = letzteAbholung.split('-').map(Number);
  const pickupDate = new Date(Date.UTC(year, month - 1, day));
  if (isNaN(pickupDate.getTime())) {
    return invalid;
  }

  const runOutTime = pickupDate.getTime() + tageReichweite * 86400000;
  const runOutDate = new Date(runOutTime);
  const reichtBis = runOutDate.toISOString().slice(0, 10);

  // Calculate remaining days relative to today
  const [tYear, tMonth, tDay] = today.split('-').map(Number);
  const todayDate = new Date(Date.UTC(tYear, tMonth - 1, tDay));
  const diffMs = runOutTime - todayDate.getTime();
  const tageVerbleibend = Math.floor(diffMs / 86400000);

  return {
    reichtBis,
    tageVerbleibend,
    unsicher: false,
  };
}

/**
 * Compares a run-out estimate against a shortage's reported start date.
 *
 * @param {{ reichtBis: string|null }} [runOut]
 * @param {string} [beginnIso] ISO date string 'YYYY-MM-DD'
 * @returns {'vor_engpass'|'nach_engpass'|'unbekannt'}
 */
export function compareToShortage(runOut, beginnIso) {
  if (!runOut || !runOut.reichtBis || typeof beginnIso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(beginnIso)) {
    return 'unbekannt';
  }

  if (runOut.reichtBis < beginnIso) {
    return 'vor_engpass';
  }

  return 'nach_engpass';
}
