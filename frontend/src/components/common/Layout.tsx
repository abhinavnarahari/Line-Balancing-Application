import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { NotificationBell } from "./NotificationBell";
import { TodayImmediateActionsNavButton } from "../../features/immediate-actions/TodayImmediateActionsNavButton";
import { ChatbotDrawer, ChatbotFloatingButton } from "../../features/chatbot";

const routeLabels: Record<string, string> = {
  "/":                   "Factory Executive Cockpit",
  "/plant-dashboard":    "Plant Management Dashboard",
  "/line-dashboard":     "Line Operations Dashboard",
  "/shift-assignment":   "Shift Assignment",
  "/attendance":         "Daily Attendance",
  "/immediate-actions":  "Today's Immediate Actions",
  "/skill-matrix":       "Sewing Skill Matrix",
  "/orders":             "Production Orders",
  "/operation-bulletins":"Operation Bulletins",
  "/capacity-planning":  "Capacity Planning & Takt Engine",
  "/line-design":        "Line Design & Workstation Architecture",
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
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        setIsChatOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Dynamic context extracted from active route
  const chatContext = {
    page: pageLabel,
    activeLineCode: location.pathname.includes("line") ? "Line 01" : undefined,
    activeStyleCode: location.pathname.includes("bulletin") || location.pathname.includes("balance") ? "DENIM-001" : undefined,
  };

  return (
    <div className="flex h-screen w-full bg-[#F6F1E8] overflow-hidden text-[#221912] relative font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F6F1E8]">
        {/* Top Header Bar */}
        <header className="h-16 shrink-0 border-b border-[#E6DDCE] bg-white/95 backdrop-blur-md flex items-center justify-between px-7 z-40 sticky top-0 shadow-[0_1px_2px_rgba(34,25,18,0.03)]">
          <div className="flex items-center gap-3.5">
            <span className="h-3 w-3 rounded-full bg-[#9C5B3C] shadow-sm shadow-[#9C5B3C]/50" />
            <span className="text-sm font-extrabold tracking-wider text-[#221912] uppercase">
              {pageLabel}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* SewNexa AI Header Button */}
            <button
              onClick={() => setIsChatOpen((prev) => !prev)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#FAF7F2] hover:bg-[#F3EFE9] border border-[#E8E2D9] hover:border-[#9C5B3C] rounded-full text-xs font-bold text-[#9C5B3C] transition-all shadow-2xs cursor-pointer group"
              title="Open SewNexa AI"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#9C5B3C] group-hover:rotate-12 transition-transform" />
              <span>SewNexa AI</span>
            </button>

            <div className="h-5 w-px bg-[#E6DDCE]" />

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
          <div className="relative z-10 min-h-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Floating Action Trigger Button */}
      <ChatbotFloatingButton onClick={() => setIsChatOpen(true)} isOpen={isChatOpen} />

      {/* Slide-over Grounded Manufacturing AI Chatbot Drawer */}
      <ChatbotDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        context={chatContext}
      />
    </div>
  );
}
