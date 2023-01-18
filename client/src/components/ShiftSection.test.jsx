import { groupByDay } from "./ShiftSection";

const shift = (id, date) => ({ shift_id: id, shift_date: `${date}T00:00:00.000Z` });

test("groupByDay keeps the API order inside and across days", () => {
  const groups = groupByDay([
    shift(1, "2023-02-06"),
    shift(3, "2023-02-06"),
    shift(8, "2023-02-07"),
  ]);
  expect(groups.map(([date, rows]) => [date, rows.map((row) => row.shift_id)])).toEqual([
    ["2023-02-06", [1, 3]],
    ["2023-02-07", [8]],
  ]);
});

test("groupByDay returns nothing for an empty roster", () => {
  expect(groupByDay([])).toEqual([]);
});
