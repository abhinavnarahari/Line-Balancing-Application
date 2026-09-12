// Quick validation script for Auto-Assign heuristic logic
declare const process: any;

interface Op {
  id: string;
  name: string;
  employeeId: string;
  attendance: string;
  skills: Record<string, number>; // opId -> rating
}

const mockOps: Op[] = [
  { id: "1", name: "Deepa Patel", employeeId: "EMP-001", attendance: "PRESENT", skills: { "OP-001": 5, "OP-002": 3 } },
  { id: "2", name: "Suresh Nair", employeeId: "EMP-002", attendance: "PRESENT", skills: { "OP-001": 3, "OP-002": 4 } },
  { id: "3", name: "Manoj Verma", employeeId: "EMP-003", attendance: "ABSENT", skills: { "OP-001": 5, "OP-002": 5 } },
  { id: "4", name: "Kavita Sundaram", employeeId: "EMP-004", attendance: "PRESENT", skills: { "OP-001": 4, "OP-003": 5 } },
  { id: "5", name: "Arjun Sengupta", employeeId: "EMP-005", attendance: "LATE", skills: { "OP-004": 4, "OP-005": 3 } },
  { id: "6", name: "Pooja Deshmukh", employeeId: "EMP-006", attendance: "PRESENT", skills: { "OP-004": 5, "OP-005": 4 } },
];

const mockStations = [
  { seq: 1, opId: "OP-001", reqRating: "4_PLUS", smv: 24, slots: [null] },
  { seq: 2, opId: "OP-002", reqRating: "3", smv: 39, slots: [null] },
  { seq: 3, opId: "OP-003", reqRating: "5", smv: 21, slots: [null] },
  { seq: 4, opId: "OP-004", reqRating: "ANY", smv: 45, slots: [null, null] }, // 2 slots!
  { seq: 5, opId: "OP-005", reqRating: "3_PLUS", smv: 25, slots: [null] },
];

// Test the MRV + Availability algorithm
function runAutoAssign(stations: typeof mockStations, operators: Op[]) {
  const assigned = new Set<string>();
  const resultStations = JSON.parse(JSON.stringify(stations));

  // Constraint scoring
  const indices = resultStations.map((_: any, i: number) => i);
  indices.sort((a: number, b: number) => {
    const score = (s: any) => {
      let sc = 0;
      if (s.reqRating === "5") sc += 50;
      else if (s.reqRating === "4_PLUS") sc += 40;
      else if (s.reqRating === "3_PLUS") sc += 30;
      sc += s.smv;
      return sc;
    };
    return score(resultStations[b]) - score(resultStations[a]);
  });

  for (const idx of indices) {
    const st = resultStations[idx];
    for (let slot = 0; slot < st.slots.length; slot++) {
      const avail = operators.filter(o => !assigned.has(o.id));
      const qual = avail.filter(o => {
        const r = o.skills[st.opId];
        if (st.reqRating === "ANY") return true;
        if (r === undefined) return false;
        if (st.reqRating === "5") return r === 5;
        if (st.reqRating === "4_PLUS") return r >= 4;
        if (st.reqRating === "3_PLUS") return r >= 3;
        return r === Number(st.reqRating);
      });

      const pool = qual.length > 0 ? qual : avail;
      pool.sort((a, b) => {
        const pA = a.attendance === "PRESENT" || a.attendance === "LATE";
        const pB = b.attendance === "PRESENT" || b.attendance === "LATE";
        if (pA && !pB) return -1;
        if (!pA && pB) return 1;
        const sA = a.skills[st.opId] || 0;
        const sB = b.skills[st.opId] || 0;
        return sB - sA;
      });

      if (pool.length > 0) {
        st.slots[slot] = pool[0].id;
        assigned.add(pool[0].id);
      }
    }
  }

  return { resultStations, assignedCount: assigned.size };
}

const { resultStations, assignedCount } = runAutoAssign(mockStations, mockOps);
console.log("Assigned count:", assignedCount);
resultStations.forEach((s: any) => {
  console.log(`Station #${s.seq} (${s.opId}, req: ${s.reqRating}) -> Assigned slots:`, s.slots);
});

// Check that all assigned IDs are distinct
const allAssigned = resultStations.flatMap((s: any) => s.slots).filter(Boolean);
const uniqueAssigned = new Set(allAssigned);
if (allAssigned.length === uniqueAssigned.size) {
  console.log("SUCCESS: All assignments are 100% unique with zero duplicates!");
} else {
  console.error("ERROR: Duplicate assignments found!");
  process.exit(1);
}
