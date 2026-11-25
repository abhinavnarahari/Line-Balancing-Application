import { expect, test } from "@playwright/test";
import { niceAxis } from "../../src/features/line-balance/YamazumiChart";

test("the chart's axis uses round steps with a little headroom", () => {
  expect(niceAxis(71)).toEqual({ max: 80, step: 20 });
  expect(niceAxis(75)).toEqual({ max: 100, step: 20 });
  expect(niceAxis(27)).toEqual({ max: 30, step: 10 });
  expect(niceAxis(279)).toEqual({ max: 400, step: 100 });
  expect(niceAxis(140)).toEqual({ max: 200, step: 50 });
  for (const v of [3, 12, 41, 99, 166.7, 1000]) {
    const { max, step } = niceAxis(v);
    expect(max).toBeGreaterThanOrEqual(v);
    expect(max / step).toBeLessThanOrEqual(6);
  }
});
