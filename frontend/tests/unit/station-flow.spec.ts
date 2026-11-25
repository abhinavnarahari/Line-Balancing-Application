import { expect, test } from "@playwright/test";
import { flowThroughStations } from "../../src/features/line-balance/stationFlow";

test("pieces flow through stations; a station can't pass on more than it received", () => {
  expect(flowThroughStations([100, 120, 80, 90])).toEqual({ good: [100, 100, 80, 80], wip: [0, 0, 20, 0], notRecorded: [false, false, false, false] });
});

test("stations with no records don't zero the line; they take the next recorded station's output", () => {
  // Line 05: stations 1-2 and 17 have no records, the rest ~4,500
  const r = flowThroughStations([0, 0, 4425, 4515, 0, 4260]);
  expect(r.notRecorded).toEqual([true, true, false, false, true, false]);
  expect(r.good).toEqual([4425, 4425, 4425, 4425, 4260, 4260]);
  expect(r.wip).toEqual([0, 0, 0, 0, 0, 165]);
  expect(Math.min(...r.good)).toBe(4260); // order output = end of line
});

test("a not-recorded last station takes the station before it; nothing recorded stays zero", () => {
  expect(flowThroughStations([50, 40, 0]).good).toEqual([50, 40, 40]);
  expect(flowThroughStations([0, 0, 0])).toEqual({ good: [0, 0, 0], wip: [0, 0, 0], notRecorded: [false, false, false] });
});
