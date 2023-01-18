import { useState } from "react";

import "./App.css";
import TopBar from "./components/TopBar";
import ShiftSection from "./components/ShiftSection";
import StaffingQueries from "./components/StaffingQueries";

function App() {
  // Up to two shift ids, oldest first.
  const [selection, setSelection] = useState([]);

  return (
    <main className="page">
      <header className="masthead">
        <p className="masthead__eyebrow">Nurse staffing roster</p>
        <h1 className="masthead__title">Shift overlap check</h1>
        <p className="masthead__lede">
          Pick two shifts to see whether they overlap by more than the roster allows: a short
          handover at the same facility, none across facilities.
        </p>
      </header>
      <TopBar selection={selection} />
      <ShiftSection selection={selection} setSelection={setSelection} />
      <StaffingQueries />
    </main>
  );
}

export default App;
