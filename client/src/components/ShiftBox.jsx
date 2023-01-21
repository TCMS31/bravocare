/**
 * Format a Postgres `time` value (which arrives as an ISO instant on
 * 1970-01-01 UTC) as a wall-clock time. Reading it in the browser's local
 * timezone would shift every shift by the viewer's UTC offset.
 */
export function formatTime(value) {
  if (!value) return "--:--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/** Format a Postgres `date` value as YYYY-MM-DD. */
export function formatDate(value) {
  if (!value) return "----------";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "----------";
  return date.toISOString().slice(0, 10);
}

const ShiftBox = ({ facilityName, shift, selectShift, selected }) => (
  <button
    type="button"
    className={`shift-box${selected ? " shift-box--selected" : ""}`}
    aria-pressed={selected}
    onClick={() => selectShift(shift)}
  >
    <span className="shift-box__facility">{facilityName || "Unassigned"}</span>
    <span className="shift-box__date">{formatDate(shift.shift_date)}</span>
    <span className="shift-box__time">
      {formatTime(shift.start_time)} &ndash; {formatTime(shift.end_time)}
    </span>
    <span className="shift-box__id">Shift #{shift.shift_id}</span>
  </button>
);

export default ShiftBox;
