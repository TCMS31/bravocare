import { useState } from "react";

import shiftsService from "../Services/ShiftsService";
import { describeError } from "../Services/GenericServices";

/**
 * The three staffing questions from the brief.
 *
 * The results are rendered as a table rather than written to the browser
 * console, which is where the original version left them.
 */
const QUERIES = [
  {
    id: "q4",
    label: "Open positions",
    description: "Question 4 - how many nurses each job still needs",
    columns: [
      ["facility_name", "Facility"],
      ["job_id", "Job"],
      ["nurse_type_needed", "Type"],
      ["total_number_nurses_needed", "Needed"],
      ["remaining_spots", "Remaining"],
    ],
    run: () => shiftsService.getOpenPositions(),
  },
  {
    id: "q5",
    label: "Nurse opportunities",
    description: "Question 5 - jobs each nurse could still be hired for",
    columns: [
      ["nurse_name", "Nurse"],
      ["nurse_type", "Type"],
      ["total_remaining_jobs", "Open jobs"],
      ["remaining_spots", "Open spots"],
    ],
    run: () => shiftsService.getNurseOpportunities(),
  },
  {
    id: "q6",
    label: "Anne's colleagues",
    description: "Question 6 - nurses sharing a facility with Anne",
    columns: [
      ["nurse_name", "Nurse"],
      ["nurse_type", "Type"],
    ],
    run: () => shiftsService.getColleagues(),
  },
];

const StaffingQueries = () => {
  const [activeId, setActiveId] = useState(null);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);

  const active = QUERIES.find((query) => query.id === activeId) || null;

  const runQuery = (query) => {
    setActiveId(query.id);
    setPending(true);
    setError(null);
    query
      .run()
      .then((payload) => setRows(payload?.result ?? []))
      .catch((err) => {
        setRows([]);
        setError(describeError(err));
      })
      .finally(() => setPending(false));
  };

  return (
    <section className="queries" aria-labelledby="queries-title">
      <h2 className="section-title" id="queries-title">
        Staffing questions
      </h2>
      <div className="queries__buttons">
        {QUERIES.map((query) => (
          <button
            key={query.id}
            type="button"
            className="btn"
            aria-pressed={activeId === query.id}
            onClick={() => runQuery(query)}
          >
            {query.label}
          </button>
        ))}
      </div>

      {active && (
        <div className="queries__result">
          <p className="queries__description">{active.description}</p>
          {pending && <p aria-busy="true">Running&hellip;</p>}
          {error && (
            <p className="queries__error" role="alert">
              {error}
            </p>
          )}
          {!pending && !error && rows.length === 0 && <p>No rows returned.</p>}
          {!pending && !error && rows.length > 0 && (
            <div className="table-scroll">
              <table className="result-table">
                <caption className="visually-hidden">{active.label}</caption>
                <thead>
                  <tr>
                    {active.columns.map(([key, heading]) => (
                      <th key={key} scope="col">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={row.job_id ?? row.nurse_id ?? index}>
                      {active.columns.map(([key]) => (
                        <td
                          key={key}
                          className={typeof row[key] === "number" ? "is-number" : undefined}
                        >
                          {row[key] ?? "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default StaffingQueries;
