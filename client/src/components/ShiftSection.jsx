import { useCallback, useEffect, useState } from "react";

import shiftsService from "../Services/ShiftsService";
import { describeError } from "../Services/GenericServices";
import ShiftBox from "./ShiftBox";

/**
 * The grid of shifts. Clicking a shift selects it; at most two are selected at
 * once and selecting a third drops the oldest.
 */
const ShiftSection = ({ selection, setSelection }) => {
  const [shifts, setShifts] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);

  const loadShifts = useCallback(() => {
    setStatus("loading");
    setError(null);
    shiftsService
      .getShifts()
      .then((payload) => {
        setShifts(payload?.data?.question_one_shifts ?? []);
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

  if (status === "loading") {
    return (
      <section className="shifts-section shifts-section--message" aria-busy="true">
        Loading shifts&hellip;
      </section>
    );
  }

  if (status === "error") {
    return (
      <section className="shifts-section shifts-section--message" role="alert">
        <p>{error}</p>
        <button type="button" className="submit-btn" onClick={loadShifts}>
          Retry
        </button>
      </section>
    );
  }

  if (shifts.length === 0) {
    return (
      <section className="shifts-section shifts-section--message">
        No shifts have been scheduled yet.
      </section>
    );
  }

  return (
    <section className="shifts-section" aria-label="Scheduled shifts">
      {shifts.map((shift) => (
        <ShiftBox
          key={shift.shift_id}
          facilityName={shift.facility?.facility_name}
          shift={shift}
          selectShift={selectShift}
          selected={selection.includes(shift.shift_id)}
        />
      ))}
    </section>
  );
};

export default ShiftSection;
