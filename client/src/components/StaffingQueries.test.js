import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import StaffingQueries from "./StaffingQueries";
import shiftsService from "../Services/ShiftsService";

jest.mock("../Services/ShiftsService", () => ({
  __esModule: true,
  default: {
    getShifts: jest.fn(),
    checkOverlap: jest.fn(),
    getOpenPositions: jest.fn(),
    getNurseOpportunities: jest.fn(),
    getColleagues: jest.fn(),
  },
}));

afterEach(() => {
  jest.resetAllMocks();
});

test("nothing is fetched until a query is chosen", () => {
  render(<StaffingQueries />);
  expect(shiftsService.getOpenPositions).not.toHaveBeenCalled();
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
});

test("open positions render as a table rather than a console log", async () => {
  shiftsService.getOpenPositions.mockResolvedValue({
    result: [
      {
        job_id: 1,
        facility_id: 1,
        facility_name: "Harborview General",
        nurse_type_needed: "RN",
        total_number_nurses_needed: 3,
        remaining_spots: 1,
      },
    ],
  });

  render(<StaffingQueries />);
  await userEvent.setup().click(screen.getByRole("button", { name: /open positions/i }));

  const table = await screen.findByRole("table");
  expect(table).toHaveTextContent("Harborview General");
  expect(table).toHaveTextContent("RN");
});

test("an empty result says so instead of rendering an empty table", async () => {
  shiftsService.getColleagues.mockResolvedValue({ nurse: "Anne", result: [] });

  render(<StaffingQueries />);
  await userEvent.setup().click(screen.getByRole("button", { name: /anne's colleagues/i }));

  expect(await screen.findByText(/no rows returned/i)).toBeInTheDocument();
});

test("a failed query surfaces the API's message", async () => {
  shiftsService.getNurseOpportunities.mockRejectedValue({
    response: { data: { message: "Internal server error" } },
  });

  render(<StaffingQueries />);
  await userEvent.setup().click(screen.getByRole("button", { name: /nurse opportunities/i }));

  expect(await screen.findByRole("alert")).toHaveTextContent("Internal server error");
});
