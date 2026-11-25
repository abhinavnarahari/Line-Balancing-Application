import { api } from "../../lib/api";
import type { SkillRatingImport } from "./skillMatrixImport";

/** All-or-nothing save of imported skill ratings (each becomes a new revision; history is kept). */
export async function saveSkillRatings(ratings: SkillRatingImport[]): Promise<unknown[]> {
  return await api.post("/skill-matrix/batch", ratings);
}
