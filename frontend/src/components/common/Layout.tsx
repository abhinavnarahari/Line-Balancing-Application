import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { NotificationBell } from "./NotificationBell";
import { TodayImmediateActionsNavButton } from "../../features/immediate-actions/TodayImmediateActionsNavButton";
import { motion, AnimatePresence } from "framer-motion";

const routeLabels: Record<string, string> = {
  "/":                   "Factory Dashboard",
  "/shift-assignment":   "Shift Assignment",
  "/attendance":         "Daily Attendance",
  "/immediate-actions":  "Today's Immediate Actions",
  "/skill-matrix":       "Sewing Skill Matrix",
  "/orders":             "Production Orders",
  "/operation-bulletins":"Operation Bulletins",
  "/line-balance":       "Planned Lines & Balancing",
  "/operator-placement": "Operator Placement",
  "/monitoring":         "Production Monitoring",
  "/production-monitoring": "Production Monitoring",
  "/hourly-board":       "Production Monitoring",
  "/settings":           "System Settings & Masters",
  "/settings/shifts":    "Shift & Break Master",
  "/settings/lines":     "Sewing Lines Master",
  "/settings/machines":  "Sewing Machine Inventory",
  "/settings/operators": "Sewing Operators Master",
  "/settings/operations":"Operations & SMV Master",
  "/settings/sizes":     "Garment Size Master",
  "/settings/styles":    "Style Master Catalog",
};

export function Layout() {
  const location = useLocation();
  const pageLabel = routeLabels[location.pathname] || "Line Balancing Suite";

  return (
    <div className="flex h-screen w-full bg-[#F6F1E8] overflow-hidden text-[#221912] relative font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F6F1E8]">
        {/* Top Header Bar */}
        <header className="h-16 shrink-0 border-b border-[#E6DDCE] bg-white/95 backdrop-blur-md flex items-center justify-between px-7 z-40 sticky top-0 shadow-[0_1px_2px_rgba(34,25,18,0.03)]">
          <div className="flex items-center gap-3.5">
            <span className="h-3 w-3 rounded-full bg-[#9C5B3C] shadow-sm shadow-[#9C5B3C]/50" />
            <AnimatePresence mode="wait">
              <motion.span
                key={pageLabel}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15 }}
                className="text-sm font-extrabold tracking-wider text-[#221912] uppercase"
              >
                {pageLabel}
              </motion.span>
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-3">
            {/* Today's Immediate Actions Floor Governance Button */}
            <TodayImmediateActionsNavButton />

            {/* Live Manager Alerts Bell */}
            <NotificationBell />

            <div className="h-5 w-px bg-[#E6DDCE]" />

            {/* Live indicator badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F3F5F2] border border-[#d4decb] rounded-full text-xs text-[#77876F] font-bold shadow-2xs">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#77876F] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#77876F]"></span>
              </span>
              <span>Shopfloor Live</span>
            </div>

            <div className="h-5 w-px bg-[#E6DDCE]" />

            <div className="text-sm font-mono font-bold text-[#8C7E6E]">
              {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto relative bg-[#F6F1E8] custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              className="relative z-10 min-h-full"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
