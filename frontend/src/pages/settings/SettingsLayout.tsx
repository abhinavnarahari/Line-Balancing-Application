import { Outlet, Link, useLocation } from "react-router-dom";
import { cn } from "../../utils/cn";
import { motion } from "framer-motion";
import { Clock, Users, Scissors, Layers, BookOpen, Settings, Activity, Cpu } from "lucide-react";

const tabs = [
  { name: "Shifts & Breaks", href: "/settings/shifts", icon: Clock, description: "Shift timings & break schedules" },
  { name: "Sewing Lines", href: "/settings/lines", icon: Activity, description: "Physical production lines & targets" },
  { name: "Sewing Machines", href: "/settings/machines", icon: Cpu, description: "Machine inventory & allocations" },
  { name: "Sewing Operators", href: "/settings/operators", icon: Users, description: "Operator roster & profiles" },
  { name: "Operations & SMV", href: "/settings/operations", icon: Scissors, description: "Standard SMV & operations catalog" },
  { name: "Garment Sizes", href: "/settings/sizes", icon: Layers, description: "Size matrix & sequences" },
  { name: "Style Catalog", href: "/settings/styles", icon: BookOpen, description: "Garment styles & buyers" },
];

export function SettingsLayout() {
  const location = useLocation();

  return (
    <div className="space-y-6 w-full p-6 lg:p-8 bg-[#F6F1E8] min-h-screen">
      {/* ── Settings Header & Sub-Navigation ───────────────────────── */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#221912] text-white flex items-center justify-center shadow-sm">
              <Settings className="w-5 h-5 text-[#B48259]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C7E6E]">Administration</span>
                <span className="text-[#E6DDCE]">/</span>
                <span className="text-[11px] font-semibold text-[#9C5B3C]">Master Data Configuration</span>
              </div>
              <h1 className="text-2xl font-black text-[#221912] tracking-tight">System Settings & Masters</h1>
            </div>
          </div>
        </div>

        {/* Segmented Master Tab Bar */}
        <div className="bg-white p-1.5 rounded-2xl border border-[#E6DDCE] shadow-[0_1px_3px_rgba(34,25,18,0.05)]">
          <nav className="flex flex-wrap gap-1" aria-label="Settings Tabs">
            {tabs.map((tab) => {
              const active = location.pathname.startsWith(tab.href);
              const Icon = tab.icon;

              return (
                <Link
                  key={tab.name}
                  to={tab.href}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all duration-150 select-none",
                    active
                      ? "bg-[#9C5B3C] text-white shadow-sm shadow-[#9C5B3C]/30"
                      : "text-[#8C7E6E] hover:text-[#221912] hover:bg-[#F6F1E8]"
                  )}
                >
                  <Icon className={cn("w-4 h-4", active ? "text-white" : "text-[#8C7E6E]")} />
                  <span>{tab.name}</span>
                  {active && (
                    <motion.div
                      layoutId="activeTabPill"
                      className="absolute inset-0 bg-[#9C5B3C] rounded-xl -z-10"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ── Nested Master Pages Outlet ─────────────────────────────── */}
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Outlet />
      </motion.div>
    </div>
  );
}
