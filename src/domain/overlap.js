"use strict";

const MINUTES_PER_DAY = 24 * 60;

/**
 * Read a Postgres `time` value as minutes since midnight.
 *
 * Prisma maps a `TIME` column to a JavaScript Date pinned to 1970-01-01 in UTC,
 * so the wall-clock time lives in the UTC accessors, not the local ones. Reading
 * it with getHours() would shift every shift by the machine's timezone offset.
 *
 * @param {Date|string|null|undefined} value
 * @returns {number|null} minutes since midnight, or null if there is no usable time
 */
function minutesSinceMidnight(value) {
  if (value === null || value === undefined) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60;
}

/**
 * Turn a shift row into a half-open [start, end) interval in minutes.
 *
 * A shift whose end time is at or before its start time is an overnight shift
 * (22:00 to 06:00), so the end is pushed into the following day. Comparing the
 * raw times instead would report zero overlap for every night shift, which is
 * the majority of the shifts this kind of roster actually contains.
 *
 * @param {{start_time: Date|null, end_time: Date|null}} shift
 * @returns {{start: number, end: number}|null}
 */
function toInterval(shift) {
  const start = minutesSinceMidnight(shift && shift.start_time);
  const end = minutesSinceMidnight(shift && shift.end_time);
  if (start === null || end === null) return null;
  return { start, end: end <= start ? end + MINUTES_PER_DAY : end };
}

/**
 * Minutes during which two shifts on the same calendar day are both in progress.
 *
 * @param {{start_time: Date|null, end_time: Date|null}} shiftA
 * @param {{start_time: Date|null, end_time: Date|null}} shiftB
 * @returns {number} overlap in whole minutes; 0 when they do not overlap
 */
function overlapInMinutes(shiftA, shiftB) {
  const a = toInterval(shiftA);
  const b = toInterval(shiftB);
  if (!a || !b) return 0;
  const overlap = Math.min(a.end, b.end) - Math.max(a.start, b.start);
  return overlap > 0 ? overlap : 0;
}

/**
 * Minutes from the start of `dateA` to the start of `dateB`.
 *
 * @param {Date|string|null|undefined} dateA
 * @param {Date|string|null|undefined} dateB
 * @returns {number|null} null when either date is missing or unparseable
 */
function dateOffsetMinutes(dateA, dateB) {
  if (!dateA || !dateB) return null;
  const a = new Date(dateA).getTime();
  const b = new Date(dateB).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return (b - a) / 60000;
}

/**
 * Minutes during which two scheduled shifts are both in progress.
 *
 * Each shift's times are relative to its own `shift_date`, so the second shift
 * is translated onto the first shift's day before the intervals are compared.
 * That is what makes a 22:00-06:00 shift correctly collide with the 05:00 start
 * the following morning - the case a same-date-only comparison misses, and the
 * one a night roster hits constantly.
 *
 * @param {{shift_date: Date|null, start_time: Date|null, end_time: Date|null}} shiftA
 * @param {{shift_date: Date|null, start_time: Date|null, end_time: Date|null}} shiftB
 * @returns {number} overlap in whole minutes; 0 when they do not overlap
 */
function scheduledOverlapInMinutes(shiftA, shiftB) {
  const a = toInterval(shiftA);
  const b = toInterval(shiftB);
  if (!a || !b) return 0;

  const offset = dateOffsetMinutes(shiftA.shift_date, shiftB.shift_date);
  if (offset === null) return 0;

  const overlap = Math.min(a.end, b.end + offset) - Math.max(a.start, b.start + offset);
  return overlap > 0 ? overlap : 0;
}

module.exports = {
  MINUTES_PER_DAY,
  minutesSinceMidnight,
  toInterval,
  overlapInMinutes,
  dateOffsetMinutes,
  scheduledOverlapInMinutes,
};
