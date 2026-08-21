import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { motion, AnimatePresence } from "framer-motion";

const routeLabels: Record<string, string> = {
  "/":                   "Factory Dashboard",
  "/shifts":             "Shift Master",
  "/operators":          "Sewing Operators",
  "/operations":         "Operation Master",
  "/sizes":              "Size Master",
  "/styles":             "Style Master",
  "/shift-assignment":   "Shift Assignment",
  "/attendance":         "Daily Attendance",
  "/skill-matrix":       "Swing Skill Matrix",
  "/orders":             "Order Details",
  "/operation-bulletins":"Operation Bulletins",
  "/line-balance":       "Line Balancing",
  "/operator-placement": "Operator Placement",
  "/monitoring":         "Monitoring",
};

export function Layout() {
  const location = useLocation();
  const pageLabel = routeLabels[location.pathname] || "QTech Swing";

  return (
    <div className="flex h-screen w-full bg-[#F6F2E9] overflow-hidden text-[#26231D] relative">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 shrink-0 border-b border-[#E0D8C0] bg-white/80 backdrop-blur-xl flex items-center justify-between px-8 z-10 sticky top-0">
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-gradient-to-br from-[#C47F45] to-[#9B5A32] shadow-sm shadow-[#B8763F]/30" />
            <AnimatePresence mode="wait">
              <motion.span
                key={pageLabel}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.18 }}
                className="text-[11px] font-semibold tracking-[0.18em] text-[#6E6656] uppercase"
              >
                {pageLabel}
              </motion.span>
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-4">
            {/* Live indicator */}
            <div className="flex items-center gap-1.5 text-[10px] text-[#8A8270] font-medium">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              Live
            </div>
            <div className="h-4 w-px bg-[#E0D8C0]" />
            <div className="text-[10px] font-mono text-[#8A8270]">
              {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto relative">
          {/* Subtle paper texture overlay */}
          <svg
            className="pointer-events-none absolute inset-0 w-full h-full"
            viewBox="0 0 1400 900"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <filter id="paperGrain">
                <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" result="noise" />
                <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0.15  0 0 0 0 0.14  0 0 0 0 0.11  0 0 0 0.018 0" />
              </filter>
              <radialGradient id="cornerWash" cx="100%" cy="0%" r="60%">
                <stop offset="0%" stopColor="#D89A5C" stopOpacity="0.10" />
                <stop offset="60%" stopColor="#D89A5C" stopOpacity="0.03" />
                <stop offset="100%" stopColor="#D89A5C" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect x="0" y="0" width="100%" height="100%" filter="url(#paperGrain)" />
            <rect x="0" y="0" width="100%" height="100%" fill="url(#cornerWash)" />
          </svg>

          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              className="p-8 relative z-10 min-h-full"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
