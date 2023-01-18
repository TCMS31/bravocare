import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import App from "./App";
import shiftsService from "./Services/ShiftsService";

// A module factory rather than an automock, so the test states exactly which
// calls the components are allowed to make.
jest.mock("./Services/ShiftsService", () => ({
  __esModule: true,
  default: {
    getShifts: jest.fn(),
    checkOverlap: jest.fn(),
    getOpenPositions: jest.fn(),
    getNurseOpportunities: jest.fn(),
    getColleagues: jest.fn(),
  },
}));

const shiftsPayload = {
  status: "success",
  meta: { total: 3, limit: 50, offset: 0, returned: 3 },
  data: {
    question_one_shifts: [
      {
        shift_id: 1,
        facility_id: 1,
        shift_date: "2023-02-06T00:00:00.000Z",
        start_time: "1970-01-01T07:00:00.000Z",
        end_time: "1970-01-01T15:00:00.000Z",
        facility: { facility_name: "Harborview General" },
      },
      {
        shift_id: 2,
        facility_id: 1,
        shift_date: "2023-02-06T00:00:00.000Z",
        start_time: "1970-01-01T14:45:00.000Z",
        end_time: "1970-01-01T22:45:00.000Z",
        facility: { facility_name: "Harborview General" },
      },
      {
        shift_id: 3,
        facility_id: 2,
        shift_date: "2023-02-06T00:00:00.000Z",
        start_time: "1970-01-01T14:00:00.000Z",
        end_time: "1970-01-01T22:00:00.000Z",
        facility: { facility_name: "Riverside Care Center" },
      },
    ],
  },
};

beforeEach(() => {
  shiftsService.getShifts.mockResolvedValue(shiftsPayload);
});

afterEach(() => {
  jest.resetAllMocks();
});

test("renders the loaded shifts", async () => {
  render(<App />);
  expect(await screen.findByText("Shift #1")).toBeInTheDocument();
  expect(screen.getByText("Shift #3")).toBeInTheDocument();
  expect(screen.getAllByText("Harborview General")).toHaveLength(2);
  // The time must render as the stored wall clock, not the browser's local time.
  expect(screen.getByText("07:00 – 15:00", { selector: ".shift-box__time" })).toBeInTheDocument();
});

test("checking two shifts shows the verdict returned by the API", async () => {
  shiftsService.checkOverlap.mockResolvedValue({
    status: "success",
    data: { overlap: 15, max_threshold: 30, exceeds_threshold: false, policy: "handover" },
  });

  render(<App />);
  const user = userEvent.setup();

  await user.click(await screen.findByText("Shift #1"));
  await user.click(screen.getByText("Shift #2"));
  await user.click(screen.getByRole("button", { name: /check overlap/i }));

  await waitFor(() => expect(screen.getByText("Within policy")).toBeInTheDocument());
  expect(screen.getByText("15 min")).toBeInTheDocument();
  expect(shiftsService.checkOverlap).toHaveBeenCalledWith(1, 2);
});

test("a breached threshold reads as a conflict", async () => {
  shiftsService.checkOverlap.mockResolvedValue({
    status: "success",
    data: { overlap: 60, max_threshold: 0, exceeds_threshold: true, policy: "handover" },
  });

  render(<App />);
  const user = userEvent.setup();

  await user.click(await screen.findByText("Shift #1"));
  await user.click(screen.getByText("Shift #3"));
  await user.click(screen.getByRole("button", { name: /check overlap/i }));

  await waitFor(() => expect(screen.getByText("Conflict")).toBeInTheDocument());
});

test("submitting with fewer than two shifts asks for a second one", async () => {
  render(<App />);
  const user = userEvent.setup();

  await user.click(await screen.findByText("Shift #1"));
  await user.click(screen.getByRole("button", { name: /check overlap/i }));

  expect(await screen.findByRole("alert")).toHaveTextContent(/select two shifts/i);
  expect(shiftsService.checkOverlap).not.toHaveBeenCalled();
});

test("clicking a selected shift deselects it", async () => {
  render(<App />);
  const user = userEvent.setup();

  const first = await screen.findByText("Shift #1");
  await user.click(first);
  await waitFor(() => expect(screen.getByText(/selected 1 of 2/i)).toBeInTheDocument());
  await user.click(first);
  await waitFor(() => expect(screen.getByText(/selected 0 of 2/i)).toBeInTheDocument());
});

test("selecting a third shift drops the oldest selection", async () => {
  shiftsService.checkOverlap.mockResolvedValue({
    status: "success",
    data: { overlap: 0, max_threshold: 0, exceeds_threshold: false, policy: "handover" },
  });

  render(<App />);
  const user = userEvent.setup();

  await user.click(await screen.findByText("Shift #1"));
  await user.click(screen.getByText("Shift #2"));
  await user.click(screen.getByText("Shift #3"));
  await user.click(screen.getByRole("button", { name: /check overlap/i }));

  await waitFor(() => expect(shiftsService.checkOverlap).toHaveBeenCalledWith(2, 3));
});

test("a failed load shows the error and offers a retry", async () => {
  shiftsService.getShifts.mockRejectedValueOnce({ request: {} });

  render(<App />);

  expect(await screen.findByText(/could not reach the api/i)).toBeInTheDocument();

  shiftsService.getShifts.mockResolvedValueOnce(shiftsPayload);
  await userEvent.setup().click(screen.getByRole("button", { name: /retry/i }));

  expect(await screen.findByText("Shift #1")).toBeInTheDocument();
});

test("an empty roster shows an empty state rather than a blank page", async () => {
  shiftsService.getShifts.mockResolvedValue({
    status: "success",
    meta: { total: 0, limit: 50, offset: 0, returned: 0 },
    data: { question_one_shifts: [] },
  });

  render(<App />);

  expect(await screen.findByText(/no shifts have been scheduled/i)).toBeInTheDocument();
});
