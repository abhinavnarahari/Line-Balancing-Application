import { Outlet, Link, useLocation } from "react-router-dom";
import { cn } from "../../utils/cn";
import { motion } from "framer-motion";
import { Clock, Users, Scissors, Layers, BookOpen } from "lucide-react";

const tabs = [
  { name: "Shifts", href: "/settings/shifts", icon: Clock },
  { name: "Sewing Operators", href: "/settings/operators", icon: Users },
  { name: "Operations", href: "/settings/operations", icon: Scissors },
  { name: "Sizes", href: "/settings/sizes", icon: Layers },
  { name: "Styles", href: "/settings/styles", icon: BookOpen },
];

export function SettingsLayout() {
  const location = useLocation();

  return (
    <div className="space-y-6 w-full p-6 lg:p-8">
      {/* Settings Header & Sub-nav */}
      <div>
        <h1 className="font-serif text-4xl text-[#221912] tracking-tight leading-none mb-6">Settings</h1>
        
        <div className="border-b border-[#F0EAE0]">
          <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
            {tabs.map((tab) => {
              const active = location.pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.name}
                  to={tab.href}
                  className={cn(
                    "group inline-flex items-center py-3 px-1 border-b-2 font-medium text-sm transition-colors relative whitespace-nowrap",
                    active
                      ? "border-[#B48259] text-[#B48259]"
                      : "border-transparent text-[#475569] hover:text-[#221912] hover:border-[#E6DDCE]"
                  )}
                >
                  <tab.icon
                    className={cn(
                      "mr-2 h-4 w-4",
                      active ? "text-[#B48259]" : "text-[#8C7E6E] group-hover:text-[#475569]"
                    )}
                    aria-hidden="true"
                  />
                  {tab.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Render the specific settings page */}
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Outlet />
      </motion.div>
    </div>
  );
}



