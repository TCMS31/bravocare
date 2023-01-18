import { formatDate, formatTime } from "./ShiftBox";

test("formatTime renders the stored wall clock regardless of the viewer's timezone", () => {
  // Prisma sends a TIME column as an instant on 1970-01-01 UTC. Formatting it
  // with toLocaleTimeString - as the original component did - shifts every
  // time by the browser's UTC offset.
  expect(formatTime("1970-01-01T07:00:00.000Z")).toBe("07:00");
  expect(formatTime("1970-01-01T22:45:00.000Z")).toBe("22:45");
  expect(formatTime("1970-01-01T00:05:00.000Z")).toBe("00:05");
});

test("formatTime degrades instead of throwing on bad input", () => {
  expect(formatTime(null)).toBe("--:--");
  expect(formatTime(undefined)).toBe("--:--");
  expect(formatTime("nonsense")).toBe("--:--");
});

test("formatDate renders an ISO day", () => {
  expect(formatDate("2023-02-06T00:00:00.000Z")).toBe("2023-02-06");
  expect(formatDate(null)).toBe("----------");
  expect(formatDate("nonsense")).toBe("----------");
});
