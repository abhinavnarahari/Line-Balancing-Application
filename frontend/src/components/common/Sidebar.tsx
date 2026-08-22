import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Settings,
  Activity,
  CalendarCheck,
  Star,
  ShoppingBag,
  ClipboardList,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import { cn } from "../../utils/cn";
import { motion } from "framer-motion";

type NavItem = {
  name: string;
  href: string;
  icon: React.ElementType;
};

type NavGroup = {
  group: string;
  items: NavItem[];
};

const navigation: NavGroup[] = [
  {
    group: "",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
    ],
  },

  {
    group: "Workforce",
    items: [
      { name: "Shift Assignment", href: "/shift-assignment", icon: UserCheck },
      { name: "Daily Attendance", href: "/attendance", icon: CalendarCheck },
      { name: "Sewing Skill Matrix", href: "/skill-matrix", icon: Star },
    ],
  },
  {
    group: "Production",
    items: [
      { name: "Orders", href: "/orders", icon: ShoppingBag },
      { name: "Operation Bulletins", href: "/operation-bulletins", icon: ClipboardList },
    ],
  },
  {
    group: "Line Balancing",
    items: [
      { name: "Planned Lines", href: "/line-balance", icon: Activity },
      { name: "Operator Placement", href: "/operator-placement", icon: Users },
      { name: "Monitoring", href: "/monitoring", icon: TrendingUp },
    ],
  },
];

export function Sidebar() {
  const location = useLocation();

  const isActive = (href: string) =>
    href === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(href);

  return (
    <div className="flex h-full w-64 flex-col bg-[#06202B] border-r border-[#0A2947] relative z-20 shadow-sm">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center px-5 border-b border-[#0A2947]">
        <div className="flex items-center gap-3">
          <div
            className="w-7 h-7 flex items-center justify-center rounded"
            style={{ background: "linear-gradient(135deg, #FFE5BF, #B48259)" }}
          >
            <span className="text-[#06202B] font-bold text-sm">Q</span>
          </div>
          <div>
            <span className="text-sm font-semibold text-white tracking-tight block leading-tight">
              QTexPro
            </span>
            <span className="text-[10px] text-slate-400 tracking-wide leading-tight">
              Line Balancing
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        <nav className="flex-1 px-3 py-4 space-y-5">
          {navigation.map((section, sectionIndex) => (
            <div key={section.group || "main"}>
              {section.group && (
                <p className="px-3 mb-1.5 text-[10px] font-semibold tracking-[0.18em] text-[#D3D4C0] uppercase">
                  {section.group}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item, itemIndex) => {
                  const active = isActive(item.href);
                  return (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: (sectionIndex * 0.05) + (itemIndex * 0.03),
                        duration: 0.2,
                      }}
                    >
                      <Link
                        to={item.href}
                        className={cn(
                          "group flex items-center px-3 py-2.5 text-sm font-semibold transition-colors relative overflow-hidden rounded-xl",
                          active
                            ? "text-[#221912] bg-[#F6F1E8]"
                            : "text-slate-400 hover:text-white hover:bg-[#0A2947]"
                        )}
                      >
                        {active && (
                          <motion.div
                            layoutId="sidebar-active"
                            className="absolute inset-0 bg-[#F6F1E8] rounded-xl -z-10"
                            initial={false}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}
                        <item.icon
                          className={cn(
                            "mr-3 h-4 w-4 flex-shrink-0 transition-colors",
                            active ? "text-[#221912]" : "text-slate-400 group-hover:text-white"
                          )}
                          aria-hidden="true"
                          strokeWidth={active ? 2 : 1.5}
                        />
                        <span className="relative z-10 text-sm">{item.name}</span>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div className="p-3 border-t border-[#0A2947]">
        <Link 
          to="/settings"
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors rounded-xl",
            isActive("/settings")
              ? "text-[#221912] bg-[#F6F1E8]"
              : "text-slate-400 hover:text-white hover:bg-[#0A2947]"
          )}
        >
          <Settings className={cn("w-4 h-4", isActive("/settings") ? "text-[#221912]" : "text-slate-400")} strokeWidth={1.5} />
          <span>Settings</span>
        </Link>
      </div>
    </div>
  );
}
