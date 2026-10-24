/**
 * Date utility functions for TuitionTrack
 * Weekday indexes:
 * 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday
 */

export const WEEKDAYS = [
  { index: 0, name: 'Sunday', short: 'Sun' },
  { index: 1, name: 'Monday', short: 'Mon' },
  { index: 2, name: 'Tuesday', short: 'Tue' },
  { index: 3, name: 'Wednesday', short: 'Wed' },
  { index: 4, name: 'Thursday', short: 'Thu' },
  { index: 5, name: 'Friday', short: 'Fri' },
  { index: 6, name: 'Saturday', short: 'Sat' },
];

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Format a Date or year/month/day to 'YYYY-MM-DD'
 */
export function formatDate(year, month, day) {
  const y = String(year).padStart(4, '0');
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Get total days in a month (month: 1-12)
 */
export function getDaysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Parse YYYY-MM-DD into { year, month, day }
 */
export function parseDateString(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return { year, month, day };
}

/**
 * Get weekday index (0-6) for a YYYY-MM-DD date string using UTC
 */
export function getWeekdayOfDate(dateStr) {
  const parsed = parseDateString(dateStr);
  if (!parsed) return -1;
  const d = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day));
  return d.getUTCDay();
}

/**
 * Get today's date formatted as YYYY-MM-DD
 */
export function getTodayDateString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Get current year and month (1-12)
 */
export function getCurrentMonthAndYear() {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1
  };
}

/**
 * Generate all dates in a month that match a student's schedule and are >= startDate.
 * 
 * @param {Object} student - { startDate: 'YYYY-MM-DD', classDays: [0, 2] }
 * @param {number} month - 1 to 12
 * @param {number} year - e.g. 2026
 * @returns {string[]} Array of date strings 'YYYY-MM-DD'
 */
export function getScheduledDatesForMonth(student, month, year) {
  if (!student || !Array.isArray(student.classDays) || student.classDays.length === 0) {
    return [];
  }

  const daysInMonth = getDaysInMonth(year, month);
  const scheduledDates = [];
  const startParsed = student.startDate ? parseDateString(student.startDate) : null;
  const startDateStr = student.startDate || '1970-01-01';

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = formatDate(year, month, day);
    // Must respect student's tuition start date
    if (dateStr < startDateStr) {
      continue;
    }

    const weekday = getWeekdayOfDate(dateStr);
    if (student.classDays.includes(weekday)) {
      scheduledDates.push(dateStr);
    }
  }

  return scheduledDates;
}

/**
 * Calculate expected class count for a student in a specific month
 */
export function calculateExpectedClassesForMonth(student, month, year) {
  return getScheduledDatesForMonth(student, month, year).length;
}
