export interface OperationRatingTier {
  minSec: number;
  maxSec: number;
  label: string; // e.g. "26–29 sec"
  efficiencyLabel?: string; // e.g. "> 100%"
  skillLevel: "Expert" | "Skilled" | "Intermediate" | "Basic" | "Beginner";
  badgeColor: string; // Tailwind color styles
  criteria?: string;
}

export interface OperationRatingBenchmark {
  operationName: string;
  operationCode: string;
  defaultSmv: number; // in minutes
  isCustom?: boolean;
  rating5: OperationRatingTier | null;
  rating4: OperationRatingTier | null;
  rating3: OperationRatingTier | null;
  rating2: OperationRatingTier | null;
  rating1: OperationRatingTier | null;
  notes?: string;
}

export const GSD_DEFAULT_BENCHMARKS: Record<string, OperationRatingBenchmark> = {
  "Shoulder Join": {
    operationName: "Shoulder Join",
    operationCode: "OP-001",
    defaultSmv: 0.48,
    rating5: { minSec: 26, maxSec: 29, label: "26–29 sec", efficiencyLabel: "> 100%", skillLevel: "Expert", badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200", criteria: "Autonomous execution, zero defect rate, exceeding line takt time" },
    rating4: { minSec: 29, maxSec: 32, label: "29–32 sec", efficiencyLabel: "90–100%", skillLevel: "Skilled", badgeColor: "bg-sky-50 text-sky-700 border-sky-200", criteria: "Consistent cycle time, minimal supervision, high seam quality" },
    rating3: { minSec: 32, maxSec: 37, label: "32–37 sec", efficiencyLabel: "78–89%", skillLevel: "Intermediate", badgeColor: "bg-amber-50 text-amber-700 border-amber-200", criteria: "Meets standard factory SMV target and line balancing requirements" },
    rating2: { minSec: 37, maxSec: 42, label: "37–42 sec", efficiencyLabel: "69–77%", skillLevel: "Basic", badgeColor: "bg-orange-50 text-orange-700 border-orange-200", criteria: "Requires mentoring, slight cycle time deviation from target" },
    rating1: { minSec: 42, maxSec: 48, label: "42–48 sec", efficiencyLabel: "< 69%", skillLevel: "Beginner", badgeColor: "bg-rose-50 text-rose-700 border-rose-200", criteria: "Under structured IE training / time-study observation" },
  },
  "Neck Rib Attach": {
    operationName: "Neck Rib Attach",
    operationCode: "OP-002",
    defaultSmv: 0.68,
    rating5: { minSec: 37, maxSec: 41, label: "37–41 sec", efficiencyLabel: "> 100%", skillLevel: "Expert", badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200", criteria: "Autonomous execution, zero defect rate, exceeding line takt time" },
    rating4: { minSec: 41, maxSec: 45, label: "41–45 sec", efficiencyLabel: "91–100%", skillLevel: "Skilled", badgeColor: "bg-sky-50 text-sky-700 border-sky-200", criteria: "Consistent cycle time, minimal supervision, high seam quality" },
    rating3: { minSec: 45, maxSec: 52, label: "45–52 sec", efficiencyLabel: "79–90%", skillLevel: "Intermediate", badgeColor: "bg-amber-50 text-amber-700 border-amber-200", criteria: "Meets standard factory SMV target and line balancing requirements" },
    rating2: { minSec: 52, maxSec: 60, label: "52–60 sec", efficiencyLabel: "68–78%", skillLevel: "Basic", badgeColor: "bg-orange-50 text-orange-700 border-orange-200", criteria: "Requires mentoring, slight cycle time deviation from target" },
    rating1: { minSec: 60, maxSec: 68, label: "60–68 sec", efficiencyLabel: "< 68%", skillLevel: "Beginner", badgeColor: "bg-rose-50 text-rose-700 border-rose-200", criteria: "Under structured IE training / time-study observation" },
  },
  "Neck Top Stitch": {
    operationName: "Neck Top Stitch",
    operationCode: "OP-003",
    defaultSmv: 0.58,
    rating5: { minSec: 32, maxSec: 35, label: "32–35 sec", efficiencyLabel: "> 100%", skillLevel: "Expert", badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200", criteria: "Autonomous execution, zero defect rate, exceeding line takt time" },
    rating4: { minSec: 35, maxSec: 38, label: "35–38 sec", efficiencyLabel: "92–100%", skillLevel: "Skilled", badgeColor: "bg-sky-50 text-sky-700 border-sky-200", criteria: "Consistent cycle time, minimal supervision, high seam quality" },
    rating3: { minSec: 38, maxSec: 44, label: "38–44 sec", efficiencyLabel: "80–91%", skillLevel: "Intermediate", badgeColor: "bg-amber-50 text-amber-700 border-amber-200", criteria: "Meets standard factory SMV target and line balancing requirements" },
    rating2: { minSec: 44, maxSec: 51, label: "44–51 sec", efficiencyLabel: "69–79%", skillLevel: "Basic", badgeColor: "bg-orange-50 text-orange-700 border-orange-200", criteria: "Requires mentoring, slight cycle time deviation from target" },
    rating1: { minSec: 51, maxSec: 58, label: "51–58 sec", efficiencyLabel: "< 69%", skillLevel: "Beginner", badgeColor: "bg-rose-50 text-rose-700 border-rose-200", criteria: "Under structured IE training / time-study observation" },
  },
  "Sleeve Attach Left": {
    operationName: "Sleeve Attach Left",
    operationCode: "OP-004",
    defaultSmv: 0.62,
    rating5: { minSec: 34, maxSec: 37, label: "34–37 sec", efficiencyLabel: "> 100%", skillLevel: "Expert", badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200", criteria: "Autonomous execution, zero defect rate, exceeding line takt time" },
    rating4: { minSec: 37, maxSec: 41, label: "37–41 sec", efficiencyLabel: "90–100%", skillLevel: "Skilled", badgeColor: "bg-sky-50 text-sky-700 border-sky-200", criteria: "Consistent cycle time, minimal supervision, high seam quality" },
    rating3: { minSec: 41, maxSec: 47, label: "41–47 sec", efficiencyLabel: "79–89%", skillLevel: "Intermediate", badgeColor: "bg-amber-50 text-amber-700 border-amber-200", criteria: "Meets standard factory SMV target and line balancing requirements" },
    rating2: { minSec: 47, maxSec: 54, label: "47–54 sec", efficiencyLabel: "69–78%", skillLevel: "Basic", badgeColor: "bg-orange-50 text-orange-700 border-orange-200", criteria: "Requires mentoring, slight cycle time deviation from target" },
    rating1: { minSec: 54, maxSec: 62, label: "54–62 sec", efficiencyLabel: "< 69%", skillLevel: "Beginner", badgeColor: "bg-rose-50 text-rose-700 border-rose-200", criteria: "Under structured IE training / time-study observation" },
  },
  "Sleeve Attach Right": {
    operationName: "Sleeve Attach Right",
    operationCode: "OP-005",
    defaultSmv: 0.62,
    rating5: { minSec: 34, maxSec: 37, label: "34–37 sec", efficiencyLabel: "> 100%", skillLevel: "Expert", badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200", criteria: "Autonomous execution, zero defect rate, exceeding line takt time" },
    rating4: { minSec: 37, maxSec: 41, label: "37–41 sec", efficiencyLabel: "90–100%", skillLevel: "Skilled", badgeColor: "bg-sky-50 text-sky-700 border-sky-200", criteria: "Consistent cycle time, minimal supervision, high seam quality" },
    rating3: { minSec: 41, maxSec: 47, label: "41–47 sec", efficiencyLabel: "79–89%", skillLevel: "Intermediate", badgeColor: "bg-amber-50 text-amber-700 border-amber-200", criteria: "Meets standard factory SMV target and line balancing requirements" },
    rating2: { minSec: 47, maxSec: 54, label: "47–54 sec", efficiencyLabel: "69–78%", skillLevel: "Basic", badgeColor: "bg-orange-50 text-orange-700 border-orange-200", criteria: "Requires mentoring, slight cycle time deviation from target" },
    rating1: { minSec: 54, maxSec: 62, label: "54–62 sec", efficiencyLabel: "< 69%", skillLevel: "Beginner", badgeColor: "bg-rose-50 text-rose-700 border-rose-200", criteria: "Under structured IE training / time-study observation" },
  },
  "Side Seam Close": {
    operationName: "Side Seam Close",
    operationCode: "OP-006",
    defaultSmv: 0.54,
    rating5: { minSec: 30, maxSec: 33, label: "30–33 sec", efficiencyLabel: "> 100%", skillLevel: "Expert", badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200", criteria: "Autonomous execution, zero defect rate, exceeding line takt time" },
    rating4: { minSec: 33, maxSec: 36, label: "33–36 sec", efficiencyLabel: "92–100%", skillLevel: "Skilled", badgeColor: "bg-sky-50 text-sky-700 border-sky-200", criteria: "Consistent cycle time, minimal supervision, high seam quality" },
    rating3: { minSec: 36, maxSec: 41, label: "36–41 sec", efficiencyLabel: "80–91%", skillLevel: "Intermediate", badgeColor: "bg-amber-50 text-amber-700 border-amber-200", criteria: "Meets standard factory SMV target and line balancing requirements" },
    rating2: { minSec: 41, maxSec: 47, label: "41–47 sec", efficiencyLabel: "70–79%", skillLevel: "Basic", badgeColor: "bg-orange-50 text-orange-700 border-orange-200", criteria: "Requires mentoring, slight cycle time deviation from target" },
    rating1: { minSec: 47, maxSec: 54, label: "47–54 sec", efficiencyLabel: "< 70%", skillLevel: "Beginner", badgeColor: "bg-rose-50 text-rose-700 border-rose-200", criteria: "Under structured IE training / time-study observation" },
  },
  "Bottom Hem": {
    operationName: "Bottom Hem",
    operationCode: "OP-007",
    defaultSmv: 0.79,
    rating5: { minSec: 43, maxSec: 47, label: "43–47 sec", efficiencyLabel: "> 100%", skillLevel: "Expert", badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200", criteria: "Autonomous execution, zero defect rate, exceeding line takt time" },
    rating4: { minSec: 47, maxSec: 52, label: "47–52 sec", efficiencyLabel: "90–100%", skillLevel: "Skilled", badgeColor: "bg-sky-50 text-sky-700 border-sky-200", criteria: "Consistent cycle time, minimal supervision, high seam quality" },
    rating3: { minSec: 52, maxSec: 59, label: "52–59 sec", efficiencyLabel: "80–89%", skillLevel: "Intermediate", badgeColor: "bg-amber-50 text-amber-700 border-amber-200", criteria: "Meets standard factory SMV target and line balancing requirements" },
    rating2: { minSec: 59, maxSec: 69, label: "59–69 sec", efficiencyLabel: "68–79%", skillLevel: "Basic", badgeColor: "bg-orange-50 text-orange-700 border-orange-200", criteria: "Requires mentoring, slight cycle time deviation from target" },
    rating1: { minSec: 69, maxSec: 79, label: "69–79 sec", efficiencyLabel: "< 68%", skillLevel: "Beginner", badgeColor: "bg-rose-50 text-rose-700 border-rose-200", criteria: "Under structured IE training / time-study observation" },
  },
  "Sleeve Hem": {
    operationName: "Sleeve Hem",
    operationCode: "OP-008",
    defaultSmv: 0.73,
    rating5: { minSec: 40, maxSec: 44, label: "40–44 sec", efficiencyLabel: "> 100%", skillLevel: "Expert", badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200", criteria: "Autonomous execution, zero defect rate, exceeding line takt time" },
    rating4: { minSec: 44, maxSec: 48, label: "44–48 sec", efficiencyLabel: "92–100%", skillLevel: "Skilled", badgeColor: "bg-sky-50 text-sky-700 border-sky-200", criteria: "Consistent cycle time, minimal supervision, high seam quality" },
    rating3: { minSec: 48, maxSec: 55, label: "48–55 sec", efficiencyLabel: "80–91%", skillLevel: "Intermediate", badgeColor: "bg-amber-50 text-amber-700 border-amber-200", criteria: "Meets standard factory SMV target and line balancing requirements" },
    rating2: { minSec: 55, maxSec: 64, label: "55–64 sec", efficiencyLabel: "69–79%", skillLevel: "Basic", badgeColor: "bg-orange-50 text-orange-700 border-orange-200", criteria: "Requires mentoring, slight cycle time deviation from target" },
    rating1: { minSec: 64, maxSec: 73, label: "64–73 sec", efficiencyLabel: "< 69%", skillLevel: "Beginner", badgeColor: "bg-rose-50 text-rose-700 border-rose-200", criteria: "Under structured IE training / time-study observation" },
  },
  "Label Attach": {
    operationName: "Label Attach",
    operationCode: "OP-009",
    defaultSmv: 0.42,
    rating5: { minSec: 23, maxSec: 26, label: "23–26 sec", efficiencyLabel: "> 100%", skillLevel: "Expert", badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200", criteria: "Autonomous execution, zero defect rate, exceeding line takt time" },
    rating4: { minSec: 26, maxSec: 28, label: "26–28 sec", efficiencyLabel: "93–100%", skillLevel: "Skilled", badgeColor: "bg-sky-50 text-sky-700 border-sky-200", criteria: "Consistent cycle time, minimal supervision, high seam quality" },
    rating3: { minSec: 28, maxSec: 32, label: "28–32 sec", efficiencyLabel: "81–92%", skillLevel: "Intermediate", badgeColor: "bg-amber-50 text-amber-700 border-amber-200", criteria: "Meets standard factory SMV target and line balancing requirements" },
    rating2: { minSec: 32, maxSec: 37, label: "32–37 sec", efficiencyLabel: "70–80%", skillLevel: "Basic", badgeColor: "bg-orange-50 text-orange-700 border-orange-200", criteria: "Requires mentoring, slight cycle time deviation from target" },
    rating1: { minSec: 37, maxSec: 42, label: "37–42 sec", efficiencyLabel: "< 70%", skillLevel: "Beginner", badgeColor: "bg-rose-50 text-rose-700 border-rose-200", criteria: "Under structured IE training / time-study observation" },
  },
  "Trim Check": {
    operationName: "Trim Check",
    operationCode: "OP-010",
    defaultSmv: 0.46,
    rating5: { minSec: 25, maxSec: 27, label: "25–27 sec", efficiencyLabel: "> 100%", skillLevel: "Expert", badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200", criteria: "Autonomous execution, zero defect rate, exceeding line takt time" },
    rating4: { minSec: 27, maxSec: 30, label: "27–30 sec", efficiencyLabel: "90–100%", skillLevel: "Skilled", badgeColor: "bg-sky-50 text-sky-700 border-sky-200", criteria: "Consistent cycle time, minimal supervision, high seam quality" },
    rating3: { minSec: 30, maxSec: 34, label: "30–34 sec", efficiencyLabel: "79–89%", skillLevel: "Intermediate", badgeColor: "bg-amber-50 text-amber-700 border-amber-200", criteria: "Meets standard factory SMV target and line balancing requirements" },
    rating2: { minSec: 34, maxSec: 40, label: "34–40 sec", efficiencyLabel: "68–78%", skillLevel: "Basic", badgeColor: "bg-orange-50 text-orange-700 border-orange-200", criteria: "Requires mentoring, slight cycle time deviation from target" },
    rating1: { minSec: 40, maxSec: 46, label: "40–46 sec", efficiencyLabel: "< 68%", skillLevel: "Beginner", badgeColor: "bg-rose-50 text-rose-700 border-rose-200", criteria: "Under structured IE training / time-study observation" },
  },
  "Thread Trimming": {
    operationName: "Thread Trimming",
    operationCode: "OP-011",
    defaultSmv: 0.53,
    rating5: { minSec: 29, maxSec: 32, label: "29–32 sec", efficiencyLabel: "> 100%", skillLevel: "Expert", badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200", criteria: "Autonomous execution, zero defect rate, exceeding line takt time" },
    rating4: { minSec: 32, maxSec: 35, label: "32–35 sec", efficiencyLabel: "91–100%", skillLevel: "Skilled", badgeColor: "bg-sky-50 text-sky-700 border-sky-200", criteria: "Consistent cycle time, minimal supervision, high seam quality" },
    rating3: { minSec: 35, maxSec: 40, label: "35–40 sec", efficiencyLabel: "80–90%", skillLevel: "Intermediate", badgeColor: "bg-amber-50 text-amber-700 border-amber-200", criteria: "Meets standard factory SMV target and line balancing requirements" },
    rating2: { minSec: 40, maxSec: 46, label: "40–46 sec", efficiencyLabel: "70–79%", skillLevel: "Basic", badgeColor: "bg-orange-50 text-orange-700 border-orange-200", criteria: "Requires mentoring, slight cycle time deviation from target" },
    rating1: { minSec: 46, maxSec: 53, label: "46–53 sec", efficiencyLabel: "< 70%", skillLevel: "Beginner", badgeColor: "bg-rose-50 text-rose-700 border-rose-200", criteria: "Under structured IE training / time-study observation" },
  },
  "Initial Inspection": {
    operationName: "Initial Inspection",
    operationCode: "OP-012",
    defaultSmv: 0.63,
    rating5: { minSec: 34, maxSec: 38, label: "34–38 sec", efficiencyLabel: "> 100%", skillLevel: "Expert", badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200", criteria: "Autonomous execution, zero defect rate, exceeding line takt time" },
    rating4: { minSec: 38, maxSec: 42, label: "38–42 sec", efficiencyLabel: "90–100%", skillLevel: "Skilled", badgeColor: "bg-sky-50 text-sky-700 border-sky-200", criteria: "Consistent cycle time, minimal supervision, high seam quality" },
    rating3: { minSec: 42, maxSec: 48, label: "42–48 sec", efficiencyLabel: "79–89%", skillLevel: "Intermediate", badgeColor: "bg-amber-50 text-amber-700 border-amber-200", criteria: "Meets standard factory SMV target and line balancing requirements" },
    rating2: { minSec: 48, maxSec: 55, label: "48–55 sec", efficiencyLabel: "69–78%", skillLevel: "Basic", badgeColor: "bg-orange-50 text-orange-700 border-orange-200", criteria: "Requires mentoring, slight cycle time deviation from target" },
    rating1: { minSec: 55, maxSec: 63, label: "55–63 sec", efficiencyLabel: "< 69%", skillLevel: "Beginner", badgeColor: "bg-rose-50 text-rose-700 border-rose-200", criteria: "Under structured IE training / time-study observation" },
  },
  "Spot Cleaning": {
    operationName: "Spot Cleaning",
    operationCode: "OP-013",
    defaultSmv: 0.74,
    rating5: { minSec: 41, maxSec: 45, label: "41–45 sec", efficiencyLabel: "> 100%", skillLevel: "Expert", badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200", criteria: "Autonomous execution, zero defect rate, exceeding line takt time" },
    rating4: { minSec: 45, maxSec: 50, label: "45–50 sec", efficiencyLabel: "90–100%", skillLevel: "Skilled", badgeColor: "bg-sky-50 text-sky-700 border-sky-200", criteria: "Consistent cycle time, minimal supervision, high seam quality" },
    rating3: { minSec: 50, maxSec: 57, label: "50–57 sec", efficiencyLabel: "79–89%", skillLevel: "Intermediate", badgeColor: "bg-amber-50 text-amber-700 border-amber-200", criteria: "Meets standard factory SMV target and line balancing requirements" },
    rating2: { minSec: 57, maxSec: 65, label: "57–65 sec", efficiencyLabel: "69–78%", skillLevel: "Basic", badgeColor: "bg-orange-50 text-orange-700 border-orange-200", criteria: "Requires mentoring, slight cycle time deviation from target" },
    rating1: { minSec: 65, maxSec: 74, label: "65–74 sec", efficiencyLabel: "< 69%", skillLevel: "Beginner", badgeColor: "bg-rose-50 text-rose-700 border-rose-200", criteria: "Under structured IE training / time-study observation" },
  },
  "Final Measurement": {
    operationName: "Final Measurement",
    operationCode: "OP-014",
    defaultSmv: 0.65,
    rating5: { minSec: 36, maxSec: 40, label: "36–40 sec", efficiencyLabel: "> 100%", skillLevel: "Expert", badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200", criteria: "Autonomous execution, zero defect rate, exceeding line takt time" },
    rating4: { minSec: 40, maxSec: 44, label: "40–44 sec", efficiencyLabel: "91–100%", skillLevel: "Skilled", badgeColor: "bg-sky-50 text-sky-700 border-sky-200", criteria: "Consistent cycle time, minimal supervision, high seam quality" },
    rating3: { minSec: 44, maxSec: 50, label: "44–50 sec", efficiencyLabel: "80–90%", skillLevel: "Intermediate", badgeColor: "bg-amber-50 text-amber-700 border-amber-200", criteria: "Meets standard factory SMV target and line balancing requirements" },
    rating2: { minSec: 50, maxSec: 57, label: "50–57 sec", efficiencyLabel: "70–79%", skillLevel: "Basic", badgeColor: "bg-orange-50 text-orange-700 border-orange-200", criteria: "Requires mentoring, slight cycle time deviation from target" },
    rating1: { minSec: 57, maxSec: 65, label: "57–65 sec", efficiencyLabel: "< 70%", skillLevel: "Beginner", badgeColor: "bg-rose-50 text-rose-700 border-rose-200", criteria: "Under structured IE training / time-study observation" },
  },
  "Final Inspection": {
    operationName: "Final Inspection",
    operationCode: "OP-015",
    defaultSmv: 0.69,
    rating5: { minSec: 38, maxSec: 42, label: "38–42 sec", efficiencyLabel: "> 100%", skillLevel: "Expert", badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200", criteria: "Autonomous execution, zero defect rate, exceeding line takt time" },
    rating4: { minSec: 42, maxSec: 46, label: "42–46 sec", efficiencyLabel: "91–100%", skillLevel: "Skilled", badgeColor: "bg-sky-50 text-sky-700 border-sky-200", criteria: "Consistent cycle time, minimal supervision, high seam quality" },
    rating3: { minSec: 46, maxSec: 52, label: "46–52 sec", efficiencyLabel: "81–90%", skillLevel: "Intermediate", badgeColor: "bg-amber-50 text-amber-700 border-amber-200", criteria: "Meets standard factory SMV target and line balancing requirements" },
    rating2: { minSec: 52, maxSec: 60, label: "52–60 sec", efficiencyLabel: "70–80%", skillLevel: "Basic", badgeColor: "bg-orange-50 text-orange-700 border-orange-200", criteria: "Requires mentoring, slight cycle time deviation from target" },
    rating1: { minSec: 60, maxSec: 69, label: "60–69 sec", efficiencyLabel: "< 70%", skillLevel: "Beginner", badgeColor: "bg-rose-50 text-rose-700 border-rose-200", criteria: "Under structured IE training / time-study observation" },
  },
  "Folding": {
    operationName: "Folding",
    operationCode: "OP-016",
    defaultSmv: 0.50,
    rating5: { minSec: 28, maxSec: 31, label: "28–31 sec", efficiencyLabel: "> 100%", skillLevel: "Expert", badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200", criteria: "Autonomous execution, zero defect rate, exceeding line takt time" },
    rating4: { minSec: 31, maxSec: 34, label: "31–34 sec", efficiencyLabel: "91–100%", skillLevel: "Skilled", badgeColor: "bg-sky-50 text-sky-700 border-sky-200", criteria: "Consistent cycle time, minimal supervision, high seam quality" },
    rating3: { minSec: 34, maxSec: 39, label: "34–39 sec", efficiencyLabel: "79–90%", skillLevel: "Intermediate", badgeColor: "bg-amber-50 text-amber-700 border-amber-200", criteria: "Meets standard factory SMV target and line balancing requirements" },
    rating2: { minSec: 39, maxSec: 44, label: "39–44 sec", efficiencyLabel: "70–78%", skillLevel: "Basic", badgeColor: "bg-orange-50 text-orange-700 border-orange-200", criteria: "Requires mentoring, slight cycle time deviation from target" },
    rating1: { minSec: 44, maxSec: 50, label: "44–50 sec", efficiencyLabel: "< 70%", skillLevel: "Beginner", badgeColor: "bg-rose-50 text-rose-700 border-rose-200", criteria: "Under structured IE training / time-study observation" },
  },
  "Poly Bag Packing": {
    operationName: "Poly Bag Packing",
    operationCode: "OP-017",
    defaultSmv: 0.35,
    rating5: { minSec: 18, maxSec: 21, label: "18–21 sec", efficiencyLabel: "> 100%", skillLevel: "Expert", badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200", criteria: "High speed bagging & carton prep" },
    rating4: { minSec: 21, maxSec: 23, label: "21–23 sec", efficiencyLabel: "90–100%", skillLevel: "Skilled", badgeColor: "bg-sky-50 text-sky-700 border-sky-200", criteria: "Standard bagging speed with barcode accuracy" },
    rating3: { minSec: 23, maxSec: 26, label: "23–26 sec", efficiencyLabel: "80–89%", skillLevel: "Intermediate", badgeColor: "bg-amber-50 text-amber-700 border-amber-200", criteria: "Standard factory pace" },
    rating2: { minSec: 26, maxSec: 30, label: "26–30 sec", efficiencyLabel: "70–79%", skillLevel: "Basic", badgeColor: "bg-orange-50 text-orange-700 border-orange-200", criteria: "Slight delay in polybag insertion" },
    rating1: { minSec: 30, maxSec: 35, label: "30–35 sec", efficiencyLabel: "< 70%", skillLevel: "Beginner", badgeColor: "bg-rose-50 text-rose-700 border-rose-200", criteria: "Under initial packing orientation" },
  },
  "Carton Packing": {
    operationName: "Carton Packing",
    operationCode: "OP-018",
    defaultSmv: 0.35,
    rating5: { minSec: 18, maxSec: 21, label: "18–21 sec", efficiencyLabel: "> 100%", skillLevel: "Expert", badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200", criteria: "Master carton sealing & weighing speed" },
    rating4: { minSec: 21, maxSec: 23, label: "21–23 sec", efficiencyLabel: "90–100%", skillLevel: "Skilled", badgeColor: "bg-sky-50 text-sky-700 border-sky-200", criteria: "Clean tape finish & count verification" },
    rating3: { minSec: 23, maxSec: 26, label: "23–26 sec", efficiencyLabel: "80–89%", skillLevel: "Intermediate", badgeColor: "bg-amber-50 text-amber-700 border-amber-200", criteria: "Standard packing pace" },
    rating2: { minSec: 26, maxSec: 30, label: "26–30 sec", efficiencyLabel: "70–79%", skillLevel: "Basic", badgeColor: "bg-orange-50 text-orange-700 border-orange-200", criteria: "Slow carton staging" },
    rating1: { minSec: 30, maxSec: 35, label: "30–35 sec", efficiencyLabel: "< 70%", skillLevel: "Beginner", badgeColor: "bg-rose-50 text-rose-700 border-rose-200", criteria: "Introductory training" },
  },
};

// Aliased for backwards compatibility
export const OPERATION_RATING_BENCHMARKS = GSD_DEFAULT_BENCHMARKS;

// ── Persistent Storage & Event Dispatch ───────────────────────────────────────
const CUSTOM_BENCHMARKS_STORAGE_KEY = "qtexpro_custom_operation_benchmarks";
export const BENCHMARKS_UPDATED_EVENT = "qtexpro_benchmarks_updated";

/**
 * Retrieves all user-configured custom benchmarks from localStorage.
 */
export function getCustomBenchmarks(): Record<string, OperationRatingBenchmark> {
  try {
    const raw = localStorage.getItem(CUSTOM_BENCHMARKS_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load custom benchmarks:", e);
    return {};
  }
}

/**
 * Normalizes an operation key (code or name) to a standardized cache identifier.
 */
function normalizeKey(str: string): string {
  return str.trim().toLowerCase();
}

/**
 * Saves a user-customized benchmark for an operation into persistent localStorage.
 * Automatically broadcasts an event so all components update instantaneously.
 */
export function saveCustomBenchmark(
  operationKey: string,
  benchmark: OperationRatingBenchmark
): void {
  try {
    const all = getCustomBenchmarks();
    const cleanKey = normalizeKey(operationKey);
    const codeKey = benchmark.operationCode ? normalizeKey(benchmark.operationCode) : "";
    const nameKey = benchmark.operationName ? normalizeKey(benchmark.operationName) : "";

    const updatedBenchmark: OperationRatingBenchmark = {
      ...benchmark,
      isCustom: true,
    };

    all[cleanKey] = updatedBenchmark;
    if (codeKey) all[codeKey] = updatedBenchmark;
    if (nameKey) all[nameKey] = updatedBenchmark;

    localStorage.setItem(CUSTOM_BENCHMARKS_STORAGE_KEY, JSON.stringify(all));

    // Dispatch global event for live reactivity across all views
    window.dispatchEvent(
      new CustomEvent(BENCHMARKS_UPDATED_EVENT, {
        detail: { operationKey: cleanKey, benchmark: updatedBenchmark },
      })
    );
  } catch (e) {
    console.error("Failed to save custom benchmark:", e);
  }
}

/**
 * Resets an operation benchmark back to factory GSD default.
 */
export function resetBenchmarkToDefault(operationKey: string): void {
  try {
    const all = getCustomBenchmarks();
    const cleanKey = normalizeKey(operationKey);
    delete all[cleanKey];

    // Also remove matching name/code aliases
    for (const [k, b] of Object.entries(all)) {
      if (
        normalizeKey(b.operationName) === cleanKey ||
        normalizeKey(b.operationCode) === cleanKey
      ) {
        delete all[k];
      }
    }

    localStorage.setItem(CUSTOM_BENCHMARKS_STORAGE_KEY, JSON.stringify(all));

    window.dispatchEvent(
      new CustomEvent(BENCHMARKS_UPDATED_EVENT, {
        detail: { operationKey: cleanKey, reset: true },
      })
    );
  } catch (e) {
    console.error("Failed to reset benchmark:", e);
  }
}

/**
 * Resets all customized benchmarks across the entire factory back to standard GSD.
 */
export function resetAllBenchmarksToDefault(): void {
  try {
    localStorage.removeItem(CUSTOM_BENCHMARKS_STORAGE_KEY);
    window.dispatchEvent(
      new CustomEvent(BENCHMARKS_UPDATED_EVENT, { detail: { resetAll: true } })
    );
  } catch (e) {
    console.error("Failed to reset all benchmarks:", e);
  }
}

/**
 * Subscribes to live benchmark update events. Returns an unsubscribe function.
 */
export function subscribeToBenchmarkChanges(listener: () => void): () => void {
  window.addEventListener(BENCHMARKS_UPDATED_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(BENCHMARKS_UPDATED_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

/**
 * Generates an Industrial Engineering calibrated benchmark based on Standard Allowed Minutes (SAM).
 */
export function generateDynamicSmvBenchmark(
  operationName: string,
  operationCode: string,
  smvMinutes: number = 0.5
): OperationRatingBenchmark {
  const safeSmv = smvMinutes > 0 ? smvMinutes : 0.5;
  const targetSec = safeSmv * 60;

  const r5Min = Math.max(1, Math.round(targetSec * 0.82));
  const r5Max = Math.max(r5Min + 1, Math.round(targetSec * 0.95));

  const r4Min = r5Max;
  const r4Max = Math.max(r4Min + 1, Math.round(targetSec * 1.05));

  const r3Min = r4Max;
  const r3Max = Math.max(r3Min + 1, Math.round(targetSec * 1.20));

  const r2Min = r3Max;
  const r2Max = Math.max(r2Min + 1, Math.round(targetSec * 1.40));

  const r1Min = r2Max;
  const r1Max = Math.max(r1Min + 1, Math.round(targetSec * 1.65));

  return {
    operationName: operationName || "Custom Operation",
    operationCode: operationCode || "OP-GEN",
    defaultSmv: safeSmv,
    isCustom: false,
    rating5: {
      minSec: r5Min,
      maxSec: r5Max,
      label: `${r5Min}–${r5Max} sec`,
      efficiencyLabel: "> 100%",
      skillLevel: "Expert",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      criteria: "Autonomous execution, zero defect rate, exceeding line takt time",
    },
    rating4: {
      minSec: r4Min,
      maxSec: r4Max,
      label: `${r4Min}–${r4Max} sec`,
      efficiencyLabel: "90–100%",
      skillLevel: "Skilled",
      badgeColor: "bg-sky-50 text-sky-700 border-sky-200",
      criteria: "Consistent cycle time, minimal supervision, high seam quality",
    },
    rating3: {
      minSec: r3Min,
      maxSec: r3Max,
      label: `${r3Min}–${r3Max} sec`,
      efficiencyLabel: "78–89%",
      skillLevel: "Intermediate",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
      criteria: "Meets standard factory SMV target and line balancing requirements",
    },
    rating2: {
      minSec: r2Min,
      maxSec: r2Max,
      label: `${r2Min}–${r2Max} sec`,
      efficiencyLabel: "68–77%",
      skillLevel: "Basic",
      badgeColor: "bg-orange-50 text-orange-700 border-orange-200",
      criteria: "Requires mentoring, slight cycle time deviation from target",
    },
    rating1: {
      minSec: r1Min,
      maxSec: r1Max,
      label: `${r1Min}–${r1Max} sec`,
      efficiencyLabel: "< 68%",
      skillLevel: "Beginner",
      badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
      criteria: "Under structured IE training / time-study observation",
    },
  };
}

/**
 * Normalizes operation name or code and retrieves its exact rating benchmark.
 * Priority:
 * 1. User-configured custom benchmark (localStorage)
 * 2. Factory predefined standard GSD benchmark
 * 3. Dynamically calibrated SMV benchmark (fallback)
 */
export function getBenchmarkForOperation(
  nameOrCode?: string,
  fallbackSmv?: number
): OperationRatingBenchmark | null {
  if (!nameOrCode) return null;
  const clean = normalizeKey(nameOrCode);

  // 1. Check user custom benchmarks
  const customMap = getCustomBenchmarks();
  if (customMap[clean]) return customMap[clean];

  for (const [key, benchmark] of Object.entries(customMap)) {
    if (
      key.toLowerCase() === clean ||
      benchmark.operationCode.toLowerCase() === clean ||
      benchmark.operationName.toLowerCase() === clean ||
      clean.includes(benchmark.operationName.toLowerCase()) ||
      benchmark.operationName.toLowerCase().includes(clean)
    ) {
      return benchmark;
    }
  }

  // 2. Check predefined GSD defaults
  for (const [key, benchmark] of Object.entries(GSD_DEFAULT_BENCHMARKS)) {
    if (
      key.toLowerCase() === clean ||
      benchmark.operationCode.toLowerCase() === clean ||
      benchmark.operationName.toLowerCase() === clean ||
      clean.includes(key.toLowerCase()) ||
      key.toLowerCase().includes(clean)
    ) {
      return benchmark;
    }
  }

  // 3. Fallback: generate calibrated benchmark from SMV
  if (fallbackSmv && fallbackSmv > 0) {
    return generateDynamicSmvBenchmark(nameOrCode, "OP-GEN", fallbackSmv);
  }

  return generateDynamicSmvBenchmark(nameOrCode, "OP-GEN", 0.5);
}

/**
 * Calculates rating (1 to 5) for an operation given cycle time in seconds.
 * Always respects user-configured cycle time benchmarks if customized!
 */
export function getRatingForOperationCycleTime(
  seconds: number,
  operationNameOrCode?: string,
  defaultSmv?: number
): 1 | 2 | 3 | 4 | 5 {
  if (seconds <= 0) return 1;

  const benchmark = getBenchmarkForOperation(operationNameOrCode, defaultSmv);
  if (benchmark) {
    if (benchmark.rating5 && seconds <= benchmark.rating5.maxSec) return 5;
    if (benchmark.rating4 && seconds <= benchmark.rating4.maxSec) return 4;
    if (benchmark.rating3 && seconds <= benchmark.rating3.maxSec) return 3;
    if (benchmark.rating2 && seconds <= benchmark.rating2.maxSec) return 2;
    return 1;
  }

  // Generic SMV fallback
  const smvSec = (defaultSmv && defaultSmv > 0 ? defaultSmv : 0.5) * 60;
  if (seconds <= smvSec * 0.95) return 5;
  if (seconds <= smvSec * 1.05) return 4;
  if (seconds <= smvSec * 1.20) return 3;
  if (seconds <= smvSec * 1.40) return 2;
  return 1;
}

/**
 * Returns formatted label string for a specific rating of an operation (e.g. "26–29 sec")
 */
export function getRatingRangeLabel(
  rating: number,
  operationNameOrCode?: string,
  defaultSmv?: number
): string {
  const benchmark = getBenchmarkForOperation(operationNameOrCode, defaultSmv);
  if (!benchmark) {
    return rating === 5 ? "< 28s" : rating === 4 ? "29–35s" : rating === 3 ? "36–44s" : rating === 2 ? "45–55s" : "> 55s";
  }

  switch (rating) {
    case 5:
      return benchmark.rating5 ? benchmark.rating5.label : "—";
    case 4:
      return benchmark.rating4 ? benchmark.rating4.label : "—";
    case 3:
      return benchmark.rating3 ? benchmark.rating3.label : "—";
    case 2:
      return benchmark.rating2 ? benchmark.rating2.label : "—";
    case 1:
      return benchmark.rating1 ? benchmark.rating1.label : "—";
    default:
      return "—";
  }
}

/**
 * Returns standard skill tier title: 1: Beginner, 2: Basic, 3: Intermediate, 4: Skilled, 5: Expert
 */
export function getRatingTitle(rating: number): string {
  switch (rating) {
    case 5:
      return "Expert";
    case 4:
      return "Skilled";
    case 3:
      return "Intermediate";
    case 2:
      return "Basic";
    case 1:
      return "Beginner";
    default:
      return "Not Evaluated";
  }
}
