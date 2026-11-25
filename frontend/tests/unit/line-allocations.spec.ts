import { expect, test } from "@playwright/test";
import { toAllocationCounts } from "../../src/features/line-balance/allocations";

test("count map from Line Architecture is kept as numbers", () => {
  expect(toAllocationCounts({ "101": 2, "102": "1", "103": 0 })).toEqual({ "101": 2, "102": 1 });
});

test("legacy assignment list saved by Planned Balancing is converted to counts", () => {
  const legacy = [
    { bulletinLineId: 101, operationId: 9, operatorId: 5 },
    { bulletinLineId: 101, operationId: 9, operatorId: null },
    { bulletinLineId: 102, operationId: 10, operatorId: 7 },
    { bulletinLineId: null, operationId: 11, operatorId: 8 },
  ];
  expect(toAllocationCounts(legacy)).toEqual({ "101": 2, "102": 1, "11": 1 });
});

test("missing or invalid values give no allocations", () => {
  expect(toAllocationCounts(null)).toBeNull();
  expect(toAllocationCounts("x")).toBeNull();
});
