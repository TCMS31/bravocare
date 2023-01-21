import { useState } from "react";

import shiftsService from "../Services/ShiftsService";
import { describeError } from "../Services/GenericServices";

/** Header showing the overlap verdict for the two currently selected shifts. */
const TopBar = ({ selection }) => {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);

  const ready = selection.length === 2;

  const checkOverlap = () => {
    if (!ready) {
      setResult(null);
      setError("Select two shifts before checking for an overlap.");
      return;
    }
    setPending(true);
    setError(null);
    shiftsService
      .checkOverlap(selection[0], selection[1])
      .then((payload) => setResult(payload.data))
      .catch((err) => {
        setResult(null);
        setError(describeError(err));
      })
      .finally(() => setPending(false));
  };

  const verdictClass = result
    ? result.exceeds_threshold
      ? "verdict verdict--bad"
      : "verdict verdict--good"
    : "verdict verdict--idle";

  return (
    <header className="top-bar">
      <div className="top-bar__readout">
        <h1 className="top-bar__title">Shift overlap check</h1>
        <dl className="readout">
          <div className="readout__row">
            <dt>Overlap</dt>
            <dd>{result ? `${result.overlap} min` : "--"}</dd>
          </div>
          <div className="readout__row">
            <dt>Allowed</dt>
            <dd>{result ? `${result.max_threshold} min` : "--"}</dd>
          </div>
          <div className="readout__row">
            <dt>Verdict</dt>
            <dd>
              <span className={verdictClass}>
                {result ? (result.exceeds_threshold ? "Conflict" : "Within policy") : "Not checked"}
              </span>
            </dd>
          </div>
        </dl>
        {error ? (
          <p className="top-bar__error" role="alert">
            {error}
          </p>
        ) : (
          <p className="top-bar__hint">
            {ready ? "Two shifts selected." : `Selected ${selection.length} of 2 shifts.`}
          </p>
        )}
      </div>
      <button className="submit-btn" onClick={checkOverlap} disabled={pending}>
        {pending ? "Checking..." : "Check overlap"}
      </button>
    </header>
  );
};

export default TopBar;
