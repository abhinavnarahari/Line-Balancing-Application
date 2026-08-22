import type { Variants } from "framer-motion";
import { motion } from "framer-motion";
import { ArrowRight, Clock, Package, Scissors, Users } from "lucide-react";
import { Link } from "react-router-dom";
import FabricWeave from "../components/ui/FabricWeave";

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.09, delayChildren: 0.1 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

export function Dashboard() {
  const links = [
    {
      to: "/settings/shifts",
      icon: Clock,
      title: "Manage Shifts",
      description: "Configure working hours and floor rotations",
    },
    {
      to: "/settings/operators",
      icon: Users,
      title: "Manage Operators",
      description: "Register and manage sewing operators",
    },
    {
      to: "/settings/operations",
      icon: Scissors,
      title: "Manage Operations",
      description: "View and edit standard operations",
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#F6F1E8] p-4 lg:p-5">

      <div className="relative z-10 w-full space-y-6">
        {/* ─ Welcome Banner ─ */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-2xl border border-[#E6DDCE] px-7 py-6 shadow-sm"
          style={{ backgroundImage: 'radial-gradient(130% 160% at 88% 10%, rgba(156,91,60,0.30), transparent 55%), linear-gradient(155deg, #2A2019 0%, #1C1712 75%)' }}
        >
          <FabricWeave id="banner-weave" color="#F6F1E8" opacity={0.05} size={16} />
          <div className="relative flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#B8935A]">
                QTexPro · Admin Dashboard
              </span>
              <h1 className="mt-1 text-[22px] font-bold leading-tight text-[#F6F1E8]">
                Good evening, Admin.
              </h1>
              <p className="mt-1 text-[13px] font-medium text-[#B8A791]">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                className="inline-flex items-center gap-2 rounded-xl bg-[#9C5B3C] px-5 py-2.5 text-[13px] font-bold text-white hover:bg-[#B06C49] transition-colors"
              >
                Style Board <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </motion.div>

        <div className="flex items-end justify-between flex-wrap gap-6 mb-2">
          {/* Slicers / Filters Bar */}
          <div className="flex w-full flex-wrap items-center gap-3 rounded-2xl border border-[#E6DDCE] bg-white px-5 py-3.5 shadow-sm">
            <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-[#8C7E6E]">
              Filters
            </div>
            <div className="h-5 w-px bg-[#E6DDCE]" />
            <div className="flex items-center gap-1 rounded-xl border border-[#E6DDCE] bg-[#F6F1E8] p-1">
              <button className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[12px] font-bold text-[#221912] shadow-sm">
                Last 7 Days
              </button>
              <button className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-bold text-[#8C7E6E] hover:text-[#475569] transition-all">
                Last 30 Days
              </button>
            </div>
            <div className="h-5 w-px bg-[#E6DDCE]" />
            <button className="flex h-9 items-center gap-2 rounded-xl border border-[#E6DDCE] bg-white px-3.5 text-[12.5px] font-semibold text-[#475569] hover:border-[#C5B9A8] hover:bg-[#FEFCF9] transition-colors">
              All Styles
            </button>
            <button className="flex h-9 items-center gap-2 rounded-xl border border-[#E6DDCE] bg-white px-3.5 text-[12.5px] font-semibold text-[#475569] hover:border-[#C5B9A8] hover:bg-[#FEFCF9] transition-colors">
              All Plants
            </button>
            <button className="flex h-9 items-center gap-2 rounded-xl border border-[#E6DDCE] bg-white px-3.5 text-[12.5px] font-semibold text-[#475569] hover:border-[#C5B9A8] hover:bg-[#FEFCF9] transition-colors">
              All Lines
            </button>
            <button className="flex h-9 items-center gap-2 rounded-xl border border-[#E6DDCE] bg-white px-3.5 text-[12.5px] font-semibold text-[#475569] hover:border-[#C5B9A8] hover:bg-[#FEFCF9] transition-colors">
              All Operators
            </button>
          </div>
        </div>


        {/* KPI Cards */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {([] as any[]).concat([
            { label: "ACTIVE ORDERS", value: "12", color: "bg-[#B48259]", icon: Package },
            { label: "ACTIVE SHIFTS", value: "04", color: "bg-[#C59B76]", icon: Clock },
            { label: "OPERATIONS", value: "18", color: "bg-[#C0462B]", icon: Scissors },
            { label: "OPERATORS", value: "50", color: "bg-[#4A7C9D]", icon: Users },
          ]).map((stat: any) => (
            <motion.div
              key={stat.label}
              variants={item}
              className={`relative flex flex-col justify-between rounded-2xl p-5 shadow-sm text-white overflow-hidden ${stat.color}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
                  <stat.icon className="h-4 w-4" />
                </div>
                {stat.badge && (
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold tracking-wider">
                    {stat.badge}
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-serif text-3xl tracking-tight">{stat.value}</h3>
                <p className="mt-1 text-[10px] font-bold tracking-wider uppercase text-white/80">
                  {stat.label}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick links */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-center gap-2 mb-4 mt-4">
            <span className="text-[11px] font-semibold tracking-[0.22em] text-[#8C7E6E] uppercase">
              Quick Links
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="group relative bg-white border border-[#F0EAE0] p-6 flex items-center justify-between gap-4 hover:border-[#B48259] transition-colors duration-300 overflow-hidden shadow-sm"
              >
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: "linear-gradient(90deg, transparent, #B48259, transparent)" }}
                />
                <div className="flex items-center gap-4 relative">
                  <div
                    className="w-11 h-11 flex items-center justify-center shrink-0"
                    style={{ background: "linear-gradient(135deg, #B48259, #8B4A3C)" }}
                  >
                    <link.icon className="w-4 h-4 text-[#FAFAF8]" strokeWidth={1.75} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#221912]">{link.title}</h3>
                    <p className="text-xs text-[#475569] mt-0.5">{link.description}</p>
                  </div>
                </div>
                <ArrowRight
                  className="w-4 h-4 text-[#8C7E6E] group-hover:text-[#B48259] group-hover:translate-x-1 transition-all duration-300 relative"
                  strokeWidth={1.75}
                />
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
