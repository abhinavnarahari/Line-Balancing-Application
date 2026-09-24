import React from "react";
import { useNavigate } from "react-router-dom";
import { 
  X, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Zap, 
  Activity, 
  ClipboardList, 
  Star, 
  Gauge, 
  TrendingUp, 
  AlertTriangle, 
  Send, 
  RefreshCw, 
  CheckCheck, 
  BarChart3, 
  Layers, 
  Factory,
  ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../features/auth/AuthContext";

export interface LifecycleStep {
  step: number;
  title: string;
  role: "IE" | "Supervisor" | "Production Manager" | "IE / Supervisor";
  roleType: "INDUSTRIAL_ENGINEER" | "LINE_SUPERVISOR" | "PRODUCTION_MANAGER" | "SHARED";
  phase: "Planning & Balancing" | "Live Floor Operations" | "Dynamic Correction & Recovery" | "Executive Governance";
  description: string;
  tool: string;
  route: string;
  icon: React.ElementType;
}

export const LIFECYCLE_STEPS: LifecycleStep[] = [
  // Phase 1: Planning & Balancing (IE)
  {
    step: 1,
    title: "New Style Planning",
    role: "IE",
    roleType: "INDUSTRIAL_ENGINEER",
    phase: "Planning & Balancing",
    description: "New style is planned for production with Style SAM/SMV, operations list, and target hourly output.",
    tool: "Style Master & Capacity Planning",
    route: "/capacity-planning",
    icon: Factory,
  },
  {
    step: 2,
    title: "Operation Breakdown",
    role: "IE",
    roleType: "INDUSTRIAL_ENGINEER",
    phase: "Planning & Balancing",
    description: "IE reviews all sequential sewing operations, machine specifications, and standard SMVs.",
    tool: "Operation Bulletins",
    route: "/operation-bulletins",
    icon: ClipboardList,
  },
  {
    step: 3,
    title: "Operator Skill Availability",
    role: "IE",
    roleType: "INDUSTRIAL_ENGINEER",
    phase: "Planning & Balancing",
    description: "System visualizes available operators, grade certifications, and historical efficiency by operation.",
    tool: "Sewing Skill Matrix",
    route: "/skill-matrix",
    icon: Star,
  },
  {
    step: 4,
    title: "Initial Line Setup",
    role: "IE",
    roleType: "INDUSTRIAL_ENGINEER",
    phase: "Planning & Balancing",
    description: "Operators and workstations are manually allocated across operations according to initial layout.",
    tool: "Line Balancer (Manual Allocation)",
    route: "/line-balance",
    icon: Layers,
  },
  {
    step: 5,
    title: "Identify Imbalance",
    role: "IE",
    roleType: "INDUSTRIAL_ENGINEER",
    phase: "Planning & Balancing",
    description: "Workload and Yamazumi pitch chart highlight overloaded bottleneck stations and spare capacity.",
    tool: "Yamazumi Workload Chart",
    route: "/line-balance",
    icon: Activity,
  },
  {
    step: 6,
    title: "Auto Balance (Hero Feature)",
    role: "IE",
    roleType: "INDUSTRIAL_ENGINEER",
    phase: "Planning & Balancing",
    description: "Click Auto Balance and mathematical algorithm optimizes operator placement and station pairing.",
    tool: "Auto Balance Optimizer",
    route: "/line-balance",
    icon: Zap,
  },
  {
    step: 7,
    title: "Compare Manual vs System",
    role: "IE",
    roleType: "INDUSTRIAL_ENGINEER",
    phase: "Planning & Balancing",
    description: "Compare manual line balance against system recommended balance across efficiency %, balance loss, and output.",
    tool: "Balance Comparison Engine",
    route: "/line-balance",
    icon: Gauge,
  },
  {
    step: 8,
    title: "Approve & Release",
    role: "IE / Supervisor",
    roleType: "SHARED",
    phase: "Planning & Balancing",
    description: "Final line configuration and workstation roster are released and published to the sewing floor.",
    tool: "Line Plan Release",
    route: "/line-balance",
    icon: CheckCheck,
  },

  // Phase 2: Live Floor Operations (Line Supervisor)
  {
    step: 9,
    title: "Production Starts",
    role: "Supervisor",
    roleType: "LINE_SUPERVISOR",
    phase: "Live Floor Operations",
    description: "Actual shift production begins with operators logged into their allocated workstations.",
    tool: "Live Production Monitoring",
    route: "/monitoring",
    icon: TrendingUp,
  },
  {
    step: 10,
    title: "TAKT Monitoring",
    role: "Supervisor",
    roleType: "LINE_SUPERVISOR",
    phase: "Live Floor Operations",
    description: "Actual cycle time and hourly piece output are continuously benchmarked against target TAKT time.",
    tool: "Hourly TAKT Board",
    route: "/monitoring",
    icon: Gauge,
  },
  {
    step: 11,
    title: "Bottleneck Appears",
    role: "Supervisor",
    roleType: "LINE_SUPERVISOR",
    phase: "Live Floor Operations",
    description: "Live monitoring detects when an operation starts falling behind target or buffer WIP builds up.",
    tool: "Live Bottleneck Detector",
    route: "/monitoring",
    icon: AlertTriangle,
  },
  {
    step: 12,
    title: "Live Alert Notification",
    role: "Supervisor",
    roleType: "LINE_SUPERVISOR",
    phase: "Live Floor Operations",
    description: "System triggers real-time visual alerts and notifications warning that the station is lagging.",
    tool: "Notification Alert Center",
    route: "/monitoring",
    icon: AlertTriangle,
  },
  {
    step: 13,
    title: "Escalation to IE",
    role: "Supervisor",
    roleType: "LINE_SUPERVISOR",
    phase: "Live Floor Operations",
    description: "Supervisor escalates unresolved bottlenecks to Industrial Engineering with one-click issue dispatch.",
    tool: "Supervisor Escalation Engine",
    route: "/monitoring",
    icon: Send,
  },

  // Phase 3: Dynamic Correction & Recovery
  {
    step: 14,
    title: "Corrective Action",
    role: "IE",
    roleType: "INDUSTRIAL_ENGINEER",
    phase: "Dynamic Correction & Recovery",
    description: "IE executes dynamic rebalancing, assigning floating operators or splitting operations based on skills.",
    tool: "Dynamic Rebalance Engine",
    route: "/immediate-actions",
    icon: RefreshCw,
  },
  {
    step: 15,
    title: "Output Recovery",
    role: "Supervisor",
    roleType: "LINE_SUPERVISOR",
    phase: "Dynamic Correction & Recovery",
    description: "Live floor throughput recovers toward target TAKT, verifying real-time operational impact.",
    tool: "Live Throughput Tracking",
    route: "/monitoring",
    icon: CheckCircle2,
  },

  // Phase 4: Executive Governance (Production Manager)
  {
    step: 16,
    title: "Management Cockpit View",
    role: "Production Manager",
    roleType: "PRODUCTION_MANAGER",
    phase: "Executive Governance",
    description: "Production Manager sees multi-line health, factory target achievement, live OEE, and active exceptions.",
    tool: "Factory Overview Dashboard",
    route: "/overall-dashboard",
    icon: BarChart3,
  },
  {
    step: 17,
    title: "End-of-Shift Analytics",
    role: "Production Manager",
    roleType: "PRODUCTION_MANAGER",
    phase: "Executive Governance",
    description: "Planned vs. actual output and line balancing efficiency reviewed across all styles and shifts.",
    tool: "Shift Performance Analytics",
    route: "/plant-dashboard",
    icon: BarChart3,
  },
];

interface RoleWorkflowGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RoleWorkflowGuideModal: React.FC<RoleWorkflowGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const userRole = user?.role || "INDUSTRIAL_ENGINEER";

  const phases: Array<{ name: LifecycleStep["phase"]; color: string }> = [
    { name: "Planning & Balancing", color: "border-[#9C5B3C] text-[#9C5B3C]" },
    { name: "Live Floor Operations", color: "border-blue-600 text-blue-700" },
    { name: "Dynamic Correction & Recovery", color: "border-amber-600 text-amber-700" },
    { name: "Executive Governance", color: "border-emerald-600 text-emerald-700" },
  ];

  const handleStepClick = (route: string) => {
    onClose();
    navigate(route);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-xs font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] shadow-2xl border border-[#E8E2D9] flex flex-col overflow-hidden text-[#221912]"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 bg-[#FAF7F2] border-b border-[#E8E2D9] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#9C5B3C] to-[#7D462E] text-white flex items-center justify-center shadow-md shadow-[#9C5B3C]/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black tracking-tight text-[#221912]">
                    17-Step Garment Line Balancing Lifecycle
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#9C5B3C]/10 text-[#9C5B3C] text-[11px] font-bold">
                    Role-Driven Flow
                  </span>
                </div>
                <p className="text-xs text-[#8C7E6E] font-medium mt-0.5">
                  Logged in as <strong className="text-[#221912]">{user?.roleTitle} ({user?.name})</strong> • Steps for your active persona are highlighted
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#8C7E6E] hover:text-[#221912] hover:bg-white border border-transparent hover:border-[#E8E2D9] transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Role Filter Pills */}
          <div className="px-6 py-3 bg-[#FAF7F2]/50 border-b border-[#E8E2D9] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-[#8C7E6E] font-bold flex-wrap">
              <span>Roles:</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#9C5B3C] text-white text-[11px] font-bold shadow-xs">
                IE (Industrial Engineer) • Steps 1-8, 14
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[11px] font-bold shadow-xs">
                Line Supervisor • Steps 8-13, 15
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold shadow-xs">
                Production Manager • Steps 16-17
              </span>
            </div>
            <div className="text-[11px] text-[#8C7E6E] font-medium hidden md:block">
              Click any step to open its corresponding workbench
            </div>
          </div>

          {/* Scrollable Step Cards Content */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 custom-scrollbar bg-[#F6F1E8]/30">
            {phases.map((phase) => {
              const phaseSteps = LIFECYCLE_STEPS.filter((s) => s.phase === phase.name);
              return (
                <div key={phase.name} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#9C5B3C]" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#5C4D3E]">
                      {phase.name} ({phaseSteps.length} Steps)
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {phaseSteps.map((step) => {
                      const isUserRole =
                        step.roleType === userRole ||
                        step.roleType === "SHARED" ||
                        (userRole === "INDUSTRIAL_ENGINEER" && (step.role.includes("IE") || step.roleType === "INDUSTRIAL_ENGINEER")) ||
                        (userRole === "LINE_SUPERVISOR" && (step.role.includes("Supervisor") || step.roleType === "LINE_SUPERVISOR")) ||
                        (userRole === "PRODUCTION_MANAGER" && (step.role.includes("Manager") || step.roleType === "PRODUCTION_MANAGER"));

                      const StepIcon = step.icon;

                      return (
                        <div
                          key={step.step}
                          onClick={() => handleStepClick(step.route)}
                          className={`group p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                            isUserRole
                              ? "bg-white border-[#9C5B3C]/50 shadow-sm ring-1 ring-[#9C5B3C]/20 hover:border-[#9C5B3C] hover:shadow-md"
                              : "bg-white/80 border-[#E8E2D9] hover:bg-white hover:border-[#D1C7BA]"
                          }`}
                        >
                          <div>
                            {/* Step Header */}
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                                    isUserRole
                                      ? "bg-[#9C5B3C] text-white"
                                      : "bg-[#EAE2D5] text-[#5C4D3E]"
                                  }`}
                                >
                                  {step.step}
                                </div>
                                <div>
                                  <h4 className="text-xs font-black text-[#221912] group-hover:text-[#9C5B3C] transition-colors">
                                    {step.title}
                                  </h4>
                                  <span className="text-[10px] font-bold text-[#8C7E6E]">
                                    {step.role}
                                  </span>
                                </div>
                              </div>

                              {isUserRole && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FAF7F2] border border-[#E8E2D9] text-[#9C5B3C] text-[9.5px] font-extrabold shrink-0">
                                  <ShieldCheck className="w-3 h-3" />
                                  Your Persona
                                </span>
                              )}
                            </div>

                            {/* Description */}
                            <p className="text-[11.5px] text-[#5C4D3E] font-medium leading-relaxed mb-3">
                              {step.description}
                            </p>
                          </div>

                          {/* Footer action */}
                          <div className="pt-2 border-t border-[#F3ECE0] flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-1.5 text-[#8C7E6E] font-bold">
                              <StepIcon className="w-3.5 h-3.5 text-[#9C5B3C]" />
                              <span>{step.tool}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[#9C5B3C] font-bold group-hover:translate-x-0.5 transition-transform">
                              <span>Open Tool</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Modal Footer */}
          <div className="p-4 sm:p-5 bg-[#FAF7F2] border-t border-[#E8E2D9] flex items-center justify-between shrink-0">
            <div className="text-xs text-[#8C7E6E] font-medium">
              Line Balancing Suite v2.6 • Powered by Intelligent Workstation Balancing
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#9C5B3C] hover:bg-[#854B31] text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
            >
              Done / Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
