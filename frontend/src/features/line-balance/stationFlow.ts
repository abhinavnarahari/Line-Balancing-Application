/*
 * Pieces flow through a line in station order: a station can't have passed on more than the station before it.
 * A station with NO production recorded (while others on the line have records) is "not recorded", not a
 * blockage: pieces evidently passed through it, so it takes the output of the nearest recorded station after it
 * (or before it, at the end of the line) and doesn't limit the stations after it.
 */
export interface FlowResult {
  /** Flow-bounded good pieces per station, in the given order */
  good: number[];
  /** Pieces waiting before each station (predecessor's output minus this station's) */
  wip: number[];
  /** Stations with no production recorded */
  notRecorded: boolean[];
}

export function flowThroughStations(raw: number[]): FlowResult {
  const anyRecorded = raw.some(v => v > 0);
  const notRecorded = raw.map(v => anyRecorded && !(v > 0));
  const good = raw.map(() => 0);
  const wip = raw.map(() => 0);
  let prev = Infinity;
  raw.forEach((v, i) => {
    if (notRecorded[i]) return;
    const bounded = Math.min(v, prev);
    wip[i] = prev !== Infinity ? Math.max(0, prev - bounded) : 0;
    good[i] = bounded;
    prev = bounded;
  });
  // Not-recorded stations take the nearest recorded station after them (else before them)
  raw.forEach((_, i) => {
    if (!notRecorded[i]) return;
    let j = i + 1;
    while (j < raw.length && notRecorded[j]) j++;
    if (j < raw.length) { good[i] = good[j]; return; }
    j = i - 1;
    while (j >= 0 && notRecorded[j]) j--;
    good[i] = j >= 0 ? good[j] : 0;
  });
  return { good, wip, notRecorded };
}
