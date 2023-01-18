import { useState } from "react";

import "./App.css";
import TopBar from "./components/TopBar";
import ShiftSection from "./components/ShiftSection";
import StaffingQueries from "./components/StaffingQueries";

function App() {
  // Up to two shift ids, oldest first.
  const [selection, setSelection] = useState([]);

  return (
    <div className="App">
      <main className="page">
        <TopBar selection={selection} />
        <p className="page__hint">
          Select two shifts, then check whether they overlap by more than the roster allows.
        </p>
        <ShiftSection selection={selection} setSelection={setSelection} />
        <StaffingQueries />
      </main>
    </div>
  );
}

export default App;
