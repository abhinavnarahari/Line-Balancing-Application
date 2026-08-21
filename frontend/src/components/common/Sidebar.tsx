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
      { name: "Swing Skill Matrix", href: "/skill-matrix", icon: Star },
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
    <div className="flex h-full w-64 flex-col bg-white border-r border-[#E0D8C0] relative z-20 shadow-sm">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center px-5 border-b border-[#E0D8C0]">
        <div className="flex items-center gap-3">
          <div
            className="w-7 h-7 flex items-center justify-center rounded"
            style={{ background: "linear-gradient(135deg, #B8763F, #8B4A3C)" }}
          >
            <span className="text-[#FBF8F0] font-bold text-sm">Q</span>
          </div>
          <div>
            <span className="text-sm font-semibold text-[#26231D] tracking-tight block leading-tight">
              QTech
            </span>
            <span className="text-[10px] text-[#8A8270] tracking-wide leading-tight">
              Swing Line Balancing
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
                <p className="px-3 mb-1.5 text-[10px] font-semibold tracking-[0.18em] text-[#B8763F] uppercase">
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
                          "group flex items-center px-3 py-2 text-sm font-medium transition-colors relative overflow-hidden rounded-sm",
                          active
                            ? "text-[#B8763F] bg-[#FBF8F0]"
                            : "text-[#6E6656] hover:text-[#26231D] hover:bg-[#FBF8F0]"
                        )}
                      >
                        {active && (
                          <motion.div
                            layoutId="sidebar-active"
                            className="absolute left-0 top-0 w-0.5 h-full bg-[#B8763F]"
                            initial={false}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}
                        <item.icon
                          className={cn(
                            "mr-3 h-4 w-4 flex-shrink-0 transition-colors",
                            active ? "text-[#B8763F]" : "text-[#8A8270] group-hover:text-[#6E6656]"
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

      <div className="p-3 border-t border-[#E0D8C0]">
        <Link 
          to="/settings"
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors rounded-sm",
            isActive("/settings")
              ? "text-[#B8763F] bg-[#FBF8F0]"
              : "text-[#6E6656] hover:text-[#26231D] hover:bg-[#FBF8F0]"
          )}
        >
          <Settings className={cn("w-4 h-4", isActive("/settings") ? "text-[#B8763F]" : "text-[#8A8270]")} strokeWidth={1.5} />
          <span>Settings</span>
        </Link>
      </div>
    </div>
  );
}
