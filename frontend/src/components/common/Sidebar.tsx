import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Users,
  Settings,
  Activity,
  CalendarCheck,
  Star,
  ShoppingBag,
  ClipboardList,
  TrendingUp,
  UserCheck,
  PanelLeftClose,
  PanelLeftOpen,
  Factory,
  Layers,
  Calculator,
  Cpu,
  BarChart3,
  GitFork,
} from "lucide-react";
import { cn } from "../../utils/cn";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../features/auth/AuthContext";

type NavItem = {
  name: string;
  href: string;
  icon: React.ElementType;
};

type NavGroup = {
  group: string;
  items: NavItem[];
};

export function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem("sewnexa_sidebar_collapsed");
    return saved === "true";
  });

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sewnexa_sidebar_collapsed", String(next));
      return next;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const isActive = (href: string) =>
    href === "/"
      ? location.pathname === "/" || location.pathname === "/overall-dashboard"
      : location.pathname.startsWith(href);

  // ─── Dynamic Role-Based Navigation Groups ──────────────────────────────
  const navigation: NavGroup[] = useMemo(() => {
    const role = user?.role || "INDUSTRIAL_ENGINEER";

    if (role === "LINE_SUPERVISOR") {
      return [
        {
          group: "Floor Execution & Live Tracking",
          items: [
            { name: "Live Monitoring", href: "/monitoring", icon: TrendingUp },
            { name: "Line Operations", href: "/line-dashboard", icon: Layers },
            { name: "Operator Placement", href: "/operator-placement", icon: Users },
          ],
        },
        {
          group: "Workforce & Shift Manning",
          items: [
            { name: "Daily Attendance", href: "/attendance", icon: CalendarCheck },
            { name: "Shift Assignment", href: "/shift-assignment", icon: UserCheck },
            { name: "Sewing Skill Matrix", href: "/skill-matrix", icon: Star },
          ],
        },
        {
          group: "Plans & Specifications",
          items: [
            { name: "Planned Balancing", href: "/line-balance", icon: Activity },
            { name: "Operation Bulletins", href: "/operation-bulletins", icon: ClipboardList },
            { name: "Production Orders", href: "/orders", icon: ShoppingBag },
          ],
        },
      ];
    }

    if (role === "PRODUCTION_MANAGER" || role === "PLANT_MANAGER") {
      return [
        {
          group: "Executive Cockpit & Monitoring",
          items: [
            { name: "Factory Overview", href: "/", icon: BarChart3 },
            { name: "Plant Executive", href: "/plant-dashboard", icon: Factory },
            { name: "Line Operations", href: "/line-dashboard", icon: Layers },
            { name: "Live Monitoring", href: "/monitoring", icon: TrendingUp },
          ],
        },
        {
          group: "Orders & Line Balancing",
          items: [
            { name: "Production Orders", href: "/orders", icon: ShoppingBag },
            { name: "Planned Balancing", href: "/line-balance", icon: Activity },
          ],
        },
        {
          group: "Workforce & Skill Governance",
          items: [
            { name: "Daily Attendance", href: "/attendance", icon: CalendarCheck },
            { name: "Sewing Skill Matrix", href: "/skill-matrix", icon: Star },
          ],
        },
      ];
    }

    // Default: INDUSTRIAL_ENGINEER (IE)
    return [
      {
        group: "Pre-Production & Engineering",
        items: [
          { name: "Production Orders", href: "/orders", icon: ShoppingBag },
          { name: "Operation Bulletins", href: "/operation-bulletins", icon: ClipboardList },
          { name: "Capacity Planning", href: "/capacity-planning", icon: Calculator },
          { name: "Line Architecture", href: "/line-design", icon: Cpu },
        ],
      },
      {
        group: "Line Balancing & Optimization",
        items: [
          { name: "Planned Balancing", href: "/line-balance", icon: Activity },
          { name: "Multi-Line Optimizer", href: "/operator-allocation", icon: GitFork },
          { name: "Sewing Skill Matrix", href: "/skill-matrix", icon: Star },
          { name: "Operator Placement", href: "/operator-placement", icon: Users },
        ],
      },
      {
        group: "Monitoring & Analytics",
        items: [
          { name: "Live Monitoring", href: "/monitoring", icon: TrendingUp },
          { name: "Line Operations", href: "/line-dashboard", icon: Layers },
        ],
      },
    ];
  }, [user?.role]);

  return (
    <>
      <motion.div
        animate={{ width: isCollapsed ? 76 : 264 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="flex h-full flex-col bg-[#06202B] border-r border-[#0A2947] relative z-20 shadow-lg select-none shrink-0 overflow-hidden"
      >
        {/* Logo & Collapse Toggle Header */}
        <div
          className={cn(
            "flex h-16 shrink-0 items-center border-b border-[#0A2947] transition-all",
            isCollapsed ? "justify-center px-2" : "justify-between px-4"
          )}
        >
          {isCollapsed ? (
            <button
              type="button"
              onClick={toggleSidebar}
              className="group relative w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-[#9C5B3C] to-[#8B5E3C] shadow-md shadow-[#9C5B3C]/30 hover:brightness-110 transition-all cursor-pointer"
              title="Expand Sidebar (Ctrl+B)"
              aria-label="Expand Sidebar"
            >
              <span className="text-white font-black text-sm tracking-wide group-hover:hidden">S</span>
              <PanelLeftOpen className="w-4 h-4 text-white hidden group-hover:block transition-all" />
            </button>
          ) : (
            <>
              <Link to="/" className="flex items-center gap-3 overflow-hidden group cursor-pointer">
                <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-gradient-to-br from-[#9C5B3C] to-[#8B5E3C] shadow-md shadow-[#9C5B3C]/30 shrink-0 group-hover:scale-105 transition-transform">
                  <span className="text-white font-black text-sm tracking-wide">S</span>
                </div>
                <div className="overflow-hidden whitespace-nowrap">
                  <span className="text-[15px] font-bold text-white tracking-tight block leading-tight">
                    SewNexa
                  </span>
                  <span className="text-[11px] font-medium text-[#8C7E6E] tracking-wide leading-tight group-hover:text-[#FAF7F2] transition-colors">
                    Line Balancing Suite
                  </span>
                </div>
              </Link>

              <button
                type="button"
                onClick={toggleSidebar}
                className="p-1.5 rounded-lg text-[#8C7E6E] hover:text-white hover:bg-[#0A2947] transition-all cursor-pointer"
                title="Collapse Sidebar (Ctrl+B)"
                aria-label="Collapse Sidebar"
              >
                <PanelLeftClose className="w-4 h-4 text-[#8C7E6E] hover:text-white transition-colors" />
              </button>
            </>
          )}
        </div>

        {/* Navigation Links */}
        <div className="flex flex-1 flex-col overflow-y-auto custom-scrollbar overflow-x-hidden">
          <nav className="flex-1 px-3 py-4 space-y-5">
            {navigation.map((section, sectionIndex) => (
              <div key={section.group || "main"}>
                {section.group ? (
                  isCollapsed ? (
                    <div className="my-2 border-t border-[#0A2947]/70" />
                  ) : (
                    <p className="px-3 mb-2 text-[10.5px] font-extrabold tracking-[0.14em] text-[#8C7E6E] uppercase whitespace-nowrap overflow-hidden">
                      {section.group}
                    </p>
                  )
                ) : null}
                <div className="space-y-1">
                  {section.items.map((item, itemIndex) => {
                    const active = isActive(item.href);
                    return (
                      <motion.div
                        key={item.name}
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: sectionIndex * 0.04 + itemIndex * 0.02,
                          duration: 0.2,
                        }}
                      >
                        <Link
                          to={item.href}
                          title={isCollapsed ? item.name : undefined}
                          className={cn(
                            "group flex items-center text-[13px] font-bold transition-all relative overflow-hidden rounded-xl",
                            isCollapsed
                              ? "justify-center py-2.5 px-0 h-10 w-full"
                              : "px-3.5 py-2.5",
                            active
                              ? "text-white bg-[#9C5B3C] shadow-sm shadow-[#9C5B3C]/30"
                              : "text-[#8C7E6E] hover:text-white hover:bg-[#0A2947]/70"
                          )}
                        >
                          <item.icon
                            className={cn(
                              "h-[18px] w-[18px] flex-shrink-0 transition-colors",
                              isCollapsed ? "mr-0" : "mr-3",
                              active ? "text-white" : "text-[#8C7E6E] group-hover:text-[#B48259]"
                            )}
                            aria-hidden="true"
                            strokeWidth={active ? 2.2 : 1.7}
                          />
                          <AnimatePresence>
                            {!isCollapsed && (
                              <motion.span
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: "auto" }}
                                exit={{ opacity: 0, width: 0 }}
                                transition={{ duration: 0.15 }}
                                className="relative z-10 whitespace-nowrap overflow-hidden"
                              >
                                {item.name}
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Settings Footer */}
        <div className="p-3 border-t border-[#0A2947]">
          <Link
            to="/settings"
            title={isCollapsed ? "Settings & Masters" : undefined}
            className={cn(
              "w-full flex items-center text-[13px] font-bold transition-colors rounded-xl",
              isCollapsed ? "justify-center py-2.5 px-0 h-10" : "gap-3 px-3.5 py-2.5",
              isActive("/settings")
                ? "text-white bg-[#9C5B3C] shadow-sm shadow-[#9C5B3C]/30"
                : "text-[#8C7E6E] hover:text-white hover:bg-[#0A2947]/70"
            )}
          >
            <Settings
              className={cn("w-[18px] h-[18px] shrink-0", isActive("/settings") ? "text-white" : "text-[#8C7E6E]")}
              strokeWidth={1.7}
            />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15 }}
                  className="whitespace-nowrap overflow-hidden"
                >
                  Settings & Masters
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>
      </motion.div>
    </>
  );
}

