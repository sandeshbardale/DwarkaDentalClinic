/**
 * Smart Scheduling Engine Utility.
 *
 * calculateNextAppointmentDate() now accepts an explicit followUpDays parameter
 * (sourced from TreatmentCategory.defaultFollowUpDays in the database) so that
 * follow-up intervals are NEVER hardcoded in the application.
 *
 * The legacy treatmentType lookup table is kept as a fallback ONLY for backward
 * compatibility; new code should always pass followUpDays explicitly.
 *
 * Doctor availability is calculated by finding the nearest weekday on which the
 * doctor is available. The default clinic days (Monday + Thursday) are used only
 * when no explicit availability data exists.
 */

/** @deprecated — use TreatmentCategory.defaultFollowUpDays from the database */
const LEGACY_TREATMENT_INTERVALS = {
  'Orthodontics': 28,
  'Orthodontic Consultation': 28,
  'Root Canal': 10,
  'RCT': 10,
  'Tooth Extraction': 5,
  'Extraction': 5,
  'Consultation': 30,
  'Cleaning & Scaling': 180,
  'Cavity Filling': 30,
  'X-Ray & Diagnosis': 7,
  'General': 30,
};

/**
 * Find the nearest date that falls on one of the allowed weekdays.
 * Searches ±7 days from the input date, preferring forward shifts on ties.
 *
 * @param {Date}     date           Starting date
 * @param {number[]} availableDays  JS weekday numbers (0=Sun, 1=Mon, …, 6=Sat).
 *                                  Defaults to [1, 4] (Mon + Thu).
 * @returns {Date}
 */
function getNearestAvailableDay(date, availableDays = [1, 4]) {
  const day = date.getDay();
  if (availableDays.includes(day)) return new Date(date);

  let bestDate = null;
  let minDiff = Infinity;

  for (let offset = 1; offset <= 7; offset++) {
    // Check forward first (prefer future dates)
    for (const direction of [1, -1]) {
      const candidate = new Date(date);
      candidate.setDate(date.getDate() + direction * offset);
      if (availableDays.includes(candidate.getDay())) {
        const diff = Math.abs(offset);
        if (diff < minDiff || (diff === minDiff && direction > 0)) {
          minDiff = diff;
          bestDate = new Date(candidate);
        }
        break;
      }
    }
    if (bestDate) break;
  }

  return bestDate || new Date(date);
}

/**
 * Calculate the next appointment date.
 *
 * @param {string}   startDateStr   YYYY-MM-DD — the date of the last visit
 * @param {string}   treatmentType  Legacy treatment type (used as fallback only)
 * @param {number}   followUpDays   Explicit follow-up interval in days (preferred)
 * @param {number[]} availableDays  Doctor's available weekdays (default: Mon+Thu)
 * @returns {string|null}           YYYY-MM-DD of next appointment, or null
 */
function calculateNextAppointmentDate(startDateStr, treatmentType = null, followUpDays = null, availableDays = [1, 4]) {
  const start = new Date(startDateStr);
  if (isNaN(start.getTime())) return null;

  // Prefer explicit followUpDays; fall back to legacy table
  let interval = followUpDays;
  if (interval === null || interval === undefined) {
    interval = (treatmentType && LEGACY_TREATMENT_INTERVALS[treatmentType]) || 30;
  }

  if (interval <= 0) return null; // 0 = no follow-up needed

  const nextDate = new Date(start);
  nextDate.setDate(start.getDate() + interval);

  const shifted = getNearestAvailableDay(nextDate, availableDays);

  const yyyy = shifted.getFullYear();
  const mm = String(shifted.getMonth() + 1).padStart(2, '0');
  const dd = String(shifted.getDate()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}`;
}

module.exports = {
  calculateNextAppointmentDate,
  getNearestAvailableDay,
  LEGACY_TREATMENT_INTERVALS,
};
