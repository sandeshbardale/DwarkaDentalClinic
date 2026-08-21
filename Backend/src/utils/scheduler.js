/**
 * Smart Scheduling Engine Utility
 * Applies rules for treatment type durations and shifts next visits to the nearest doctor availability day (Monday/Thursday).
 */

const TREATMENT_INTERVALS = {
  // Orthodontic -> 28 days
  'Orthodontic': 28,
  'Orthodontic Consultation': 28,
  
  // RCT -> 7-15 days (default to 10 days)
  'Root Canal': 10,
  'RCT': 10,
  
  // Extraction -> 3-7 days (default to 5 days)
  'Tooth Extraction': 5,
  'Extraction': 5,
  
  // General -> 30 days default follow-up
  'Consultation': 30,
  'Cleaning & Scaling': 30,
  'Cavity Filling': 30,
  'X-Ray & Diagnosis': 30,
  'General': 30,
};

/**
 * Find the nearest Monday (1) or Thursday (4) for a given date
 * @param {Date} date 
 * @returns {Date}
 */
function getNearestMondayOrThursday(date) {
  const day = date.getDay();
  if (day === 1 || day === 4) {
    return date; // Already available
  }

  let bestDate = new Date(date);
  let minDiff = Infinity;

  // Check surrounding dates from -3 to +3 days
  for (let offset = -3; offset <= 3; offset++) {
    const candidate = new Date(date);
    candidate.setDate(date.getDate() + offset);
    const candDay = candidate.getDay();

    if (candDay === 1 || candDay === 4) {
      const diff = Math.abs(offset);
      if (diff < minDiff) {
        minDiff = diff;
        bestDate = candidate;
      } else if (diff === minDiff && offset > 0) {
        // Tie-breaker: prefer shifting forward (e.g. Saturday shifts to Monday instead of Thursday)
        bestDate = candidate;
      }
    }
  }

  return bestDate;
}

/**
 * Calculates the next appointment date based on treatment type and doctor availability
 * @param {string} startDateStr - YYYY-MM-DD
 * @param {string} treatmentType 
 * @returns {string} - YYYY-MM-DD
 */
function calculateNextAppointmentDate(startDateStr, treatmentType) {
  const start = new Date(startDateStr);
  if (isNaN(start.getTime())) {
    return null;
  }

  // Get interval days (default to 30 days if unknown)
  const interval = TREATMENT_INTERVALS[treatmentType] || 30;
  
  // Add interval
  const nextDate = new Date(start);
  nextDate.setDate(start.getDate() + interval);

  // Shift to nearest Monday or Thursday
  const shiftedDate = getNearestMondayOrThursday(nextDate);

  // Format back to YYYY-MM-DD
  const yyyy = shiftedDate.getFullYear();
  const mm = String(shiftedDate.getMonth() + 1).padStart(2, '0');
  const dd = String(shiftedDate.getDate()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}`;
}

module.exports = {
  TREATMENT_INTERVALS,
  calculateNextAppointmentDate,
  getNearestMondayOrThursday,
};
