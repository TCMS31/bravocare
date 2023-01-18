import { useCallback, useEffect, useState } from "react";

import shiftsService from "../Services/ShiftsService";
import { describeError } from "../Services/GenericServices";
import ShiftBox, { formatDate } from "./ShiftBox";

/** Group shifts by calendar day, keeping the API's date-then-start-time order. */
export function groupByDay(shifts) {
  const days = new Map();
  for (const shift of shifts) {
    const key = formatDate(shift.shift_date);
    if (!days.has(key)) days.set(key, []);
    days.get(key).push(shift);
  }
  return [...days.entries()];
}

/**
 * The roster, one group per day. Clicking a shift selects it; at most two are
 * selected at once and selecting a third drops the oldest.
 */
const ShiftSection = ({ selection, setSelection }) => {
  const [shifts, setShifts] = useState([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);

  const loadShifts = useCallback(() => {
    setStatus("loading");
    setError(null);
    shiftsService
      .getShifts()
      .then((payload) => {
        const rows = payload?.data?.question_one_shifts ?? [];
        setShifts(rows);
        setTotal(payload?.meta?.total ?? rows.length);
        setStatus("ready");
      })
      .catch((err) => {
        setError(describeError(err));
        setStatus("error");
      });
  }, []);

  useEffect(loadShifts, [loadShifts]);

  const selectShift = (shift) => {
    const id = shift.shift_id;
    if (selection.includes(id)) {
      setSelection(selection.filter((selectedId) => selectedId !== id));
      return;
    }
    setSelection([...selection, id].slice(-2));
  };

  let body;
  if (status === "loading") {
    body = (
      <div className="roster__message" aria-busy="true">
        Loading shifts&hellip;
      </div>
    );
  } else if (status === "error") {
    body = (
      <div className="roster__message roster__message--error" role="alert">
        <p>{error}</p>
        <button type="button" className="btn" onClick={loadShifts}>
          Retry
        </button>
      </div>
    );
  } else if (shifts.length === 0) {
    body = <div className="roster__message">No shifts have been scheduled yet.</div>;
  } else {
    body = (
      <>
        {groupByDay(shifts).map(([date, dayShifts]) => (
          <section className="roster__day" key={date} aria-labelledby={`day-${date}`}>
            <h3 className="roster__date" id={`day-${date}`}>
              {date}
            </h3>
            <ul className="roster__grid">
              {dayShifts.map((shift) => (
                <li key={shift.shift_id}>
                  <ShiftBox
                    facilityName={shift.facility?.facility_name}
                    shift={shift}
                    selectShift={selectShift}
                    selected={selection.includes(shift.shift_id)}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
        {total > shifts.length && (
          <p className="roster__note">
            Showing the first {shifts.length} of {total} shifts.
          </p>
        )}
      </>
    );
  }

  return (
    <section className="roster" aria-labelledby="roster-title">
      <h2 className="section-title" id="roster-title">
        Scheduled shifts
      </h2>
      <p className="roster__hint">Select two shifts, then check them above.</p>
      {body}
    </section>
  );
};

export default ShiftSection;
