import type { Variants } from "framer-motion";
import { motion } from "framer-motion";
import { ArrowRight, Clock, Package, Scissors, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { LineBalancePulse } from "./LineBalancePulse";

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
      to: "/shifts",
      icon: Clock,
      title: "Manage Shifts",
      description: "Configure working hours and floor rotations",
    },
    {
      to: "/operations",
      icon: Scissors,
      title: "Manage Operations",
      description: "View and edit standard operations",
    },
  ];

  return (
    <div className="relative overflow-hidden bg-[#F6F2E9]">
      {/* Quiet backdrop — a near-invisible paper grain plus one soft corner wash, well clear of the content */}
      <svg
        className="pointer-events-none absolute inset-0 w-full h-full"
        viewBox="0 0 1400 900"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <filter id="paperGrain">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" result="noise" />
            <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0.15  0 0 0 0 0.14  0 0 0 0 0.11  0 0 0 0.02 0" />
          </filter>

          <radialGradient id="cornerWash" cx="100%" cy="0%" r="75%">
            <stop offset="0%" stopColor="#D89A5C" stopOpacity="0.16" />
            <stop offset="55%" stopColor="#D89A5C" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#D89A5C" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Barely-there paper texture across the whole canvas */}
        <rect x="0" y="0" width="1400" height="900" filter="url(#paperGrain)" />

        {/* One quiet wash, tucked into the top-right corner, away from the card grid */}
        <rect x="0" y="0" width="1400" height="900" fill="url(#cornerWash)" />

        {/* Single hairline rule, low contrast, echoing a ruled ledger page */}
        <line x1="0" y1="0" x2="1400" y2="0" stroke="#26231D" strokeOpacity="0.06" strokeWidth="1" />
      </svg>

      <div className="relative max-w-5xl mx-auto px-6 py-14">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-end justify-between mb-14 flex-wrap gap-6"
        >
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="h-px w-8 bg-gradient-to-r from-[#D89A5C] to-[#B8763F]" />
              <span className="text-[11px] font-semibold tracking-[0.22em] text-[#B8763F] uppercase">
                Factory Floor
              </span>
            </div>
            <h1 className="font-serif text-5xl text-[#26231D] tracking-tight leading-none">
              Overview
            </h1>
            <p className="text-sm text-[#6E6656] mt-3 max-w-sm">
              Current factory performance and metrics, updated in real time.
            </p>
          </div>

          {/* Line-balance signature — the shop-floor concept the product is built around, in motion */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="shrink-0 w-64"
          >
            <div className="flex items-center gap-1.5 mb-1.5 justify-end">
              <span className="text-[10px] font-medium tracking-[0.14em] text-[#8A8270] uppercase">
                Line Balance
              </span>
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B8763F] opacity-60" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#B8763F]" />
              </span>
            </div>
            <LineBalancePulse className="w-64 h-28" />
          </motion.div>
        </motion.div>

        {/* Bento stats */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6"
        >
          {/* Hero stat */}
          <motion.div
            variants={item}
            className="lg:col-span-7 relative bg-white border border-[#E0D8C0] p-8 flex flex-col justify-between overflow-hidden group hover:border-[#B8763F] transition-colors duration-300 shadow-sm"
          >
            <div className="flex items-center justify-between relative">
              <span className="text-[11px] font-medium tracking-[0.14em] text-[#8A8270] uppercase">
                Active Orders
              </span>
              <Package className="w-4 h-4 text-[#B8763F]" strokeWidth={1.5} />
            </div>
            <div className="relative">
              <span
                className="font-serif text-7xl tracking-tight bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(135deg, #B8763F, #8B4A3C)" }}
              >
                12
              </span>
              <p className="text-xs text-[#8A8270] mt-2">Across 6 active production lines</p>
            </div>
          </motion.div>

          {/* Compact stat stack */}
          <motion.div
            variants={item}
            className="lg:col-span-5 bg-white border border-[#E0D8C0] divide-y divide-[#E9E1CC] shadow-sm"
          >
            {[
              { name: "Active Shifts", value: "04", icon: Clock },
              { name: "Operations", value: "18", icon: Scissors },
              { name: "Operators", value: "50", icon: Users },
            ].map((stat) => (
              <div
                key={stat.name}
                className="flex items-center justify-between px-6 py-5 hover:bg-[#FBF8F0] transition-colors duration-200"
              >
                <div className="flex items-center gap-3">
                  <stat.icon className="w-4 h-4 text-[#B8763F]" strokeWidth={1.5} />
                  <span className="text-sm text-[#6E6656]">{stat.name}</span>
                </div>
                <span className="font-serif text-2xl text-[#26231D] tracking-tight">
                  {stat.value}
                </span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Quick links */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-center gap-2 mb-4 mt-4">
            <span className="text-[11px] font-semibold tracking-[0.22em] text-[#8A8270] uppercase">
              Quick Links
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="group relative bg-white border border-[#E0D8C0] p-6 flex items-center justify-between gap-4 hover:border-[#B8763F] transition-colors duration-300 overflow-hidden shadow-sm"
              >
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: "linear-gradient(90deg, transparent, #B8763F, transparent)" }}
                />
                <div className="flex items-center gap-4 relative">
                  <div
                    className="w-11 h-11 flex items-center justify-center shrink-0"
                    style={{ background: "linear-gradient(135deg, #B8763F, #8B4A3C)" }}
                  >
                    <link.icon className="w-4 h-4 text-[#FBF8F0]" strokeWidth={1.75} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#26231D]">{link.title}</h3>
                    <p className="text-xs text-[#6E6656] mt-0.5">{link.description}</p>
                  </div>
                </div>
                <ArrowRight
                  className="w-4 h-4 text-[#8A8270] group-hover:text-[#B8763F] group-hover:translate-x-1 transition-all duration-300 relative"
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