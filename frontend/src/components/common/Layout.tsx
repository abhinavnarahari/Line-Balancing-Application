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
  "/skill-matrix":       "Sewing Skill Matrix",
  "/orders":             "Order Details",
  "/operation-bulletins":"Operation Bulletins",
  "/line-balance":       "Line Balancing",
  "/operator-placement": "Operator Placement",
  "/monitoring":         "Monitoring",
};

export function Layout() {
  const location = useLocation();
  const pageLabel = routeLabels[location.pathname] || "QTexPro Sewing";

  return (
    <div className="flex h-screen w-full bg-[#F6F1E8] overflow-hidden text-[#221912] relative">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 shrink-0 border-b border-[#F0EAE0] bg-white/80 backdrop-blur-xl flex items-center justify-between px-8 z-10 sticky top-0">
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-gradient-to-br from-[#FFE5BF] to-[#B48259] shadow-sm shadow-[#B48259]/30" />
            <AnimatePresence mode="wait">
              <motion.span
                key={pageLabel}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.18 }}
                className="text-[11px] font-semibold tracking-[0.18em] text-[#8C7E6E] uppercase"
              >
                {pageLabel}
              </motion.span>
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-4">
            {/* Live indicator */}
            <div className="flex items-center gap-1.5 text-[10px] text-[#8C7E6E] font-medium">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              Live
            </div>
            <div className="h-4 w-px bg-[#F0EAE0]" />
            <div className="text-[10px] font-mono text-[#8C7E6E]">
              {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto relative">

          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              className="relative z-10 min-h-full"
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

