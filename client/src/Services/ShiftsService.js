import GenericService from "./GenericServices";

/**
 * Calls against the bravocare API.
 *
 * The `q4`/`q5`/`q6` paths are the server's, named after the questions in the
 * brief; the method names say what they actually return.
 */
export class ShiftsService extends GenericService {
  getShifts = (params) => this.get("question_one_shifts", { params });

  checkOverlap = (shift1, shift2) => this.post("overlap", { shift1, shift2 });

  getOpenPositions = () => this.get("q4");

  getNurseOpportunities = () => this.get("q5");

  getColleagues = (nurse) => this.get("q6", { params: nurse ? { nurse } : undefined });
}

const shiftsService = new ShiftsService();
export default shiftsService;
