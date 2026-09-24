import React from "react";
import { Link } from "react-router-dom";
import { 
  X, 
  Activity, 
  Users, 
  Cpu, 
  Gauge, 
  MapPin, 
  UserCheck, 
  Sliders, 
  ShieldCheck, 
  Edit2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../../components/ui/Button";
import type { SewingLine } from "./api";
import { LINE_TYPES, OPERATIONAL_STATUSES } from "./api";

interface LineDetailModalProps {
  line: SewingLine | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (line: SewingLine) => void;
}

export const LineDetailModal: React.FC<LineDetailModalProps> = ({
  line,
  isOpen,
  onClose,
  onEdit,
}) => {
  if (!isOpen || !line) return null;

  const lineTypeObj = LINE_TYPES.find(t => t.id === line.lineType) || LINE_TYPES[0];
  const statusObj = OPERATIONAL_STATUSES.find(s => s.id === line.operationalStatus) || OPERATIONAL_STATUSES[0];

  const totalManpower = (line.operatorCount || 0) + (line.helperCount || 0);
  const operatorToMachineRatio = line.machineCount > 0 
    ? (totalManpower / line.machineCount).toFixed(2) 
    : "1.00";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/50 backdrop-blur-xs font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          className="bg-[#F6F1E8] rounded-3xl border border-[#E6DDCE] shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] my-auto text-[#221912]"
        >
          {/* ── 1. Header ────────────────────────────────────────────── */}
          <div className="bg-white border-b border-[#E6DDCE] px-6 py-4 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-black px-2.5 py-0.5 bg-[#F6F1E8] text-[#9C5B3C] border border-[#E6DDCE] rounded-lg shadow-2xs">
                  {line.lineCode}
                </span>

                <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-md border ${lineTypeObj.badgeColor}`}>
                  {lineTypeObj.label}
                </span>

                <span className={`inline-flex items-center gap-1.5 text-[10.5px] font-extrabold px-2.5 py-0.5 rounded-full border ${statusObj.badgeColor}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusObj.dotColor} ${line.operationalStatus === 'ACTIVE' ? 'animate-pulse' : ''}`} />
                  <span>{statusObj.label}</span>
                </span>
              </div>

              <h2 className="text-xl font-black text-[#221912] tracking-tight">{line.lineName}</h2>
              <p className="text-xs text-[#8C7E6E] flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#9C5B3C]" />
                <span>{line.floor || "Main Sewing Floor"}</span>
                <span>•</span>
                <span>{line.department || "Garment Assembly"}</span>
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-[#8C7E6E] hover:text-[#221912] hover:bg-[#F6F1E8] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ── 2. Scrollable Body ───────────────────────────────────── */}
          <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar flex-1">
            
            {/* Core KPI Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 bg-white border border-[#E6DDCE] rounded-2xl shadow-2xs space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C7E6E] flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-[#9C5B3C]" /> Total Manpower
                </span>
                <div className="text-xl font-mono font-black text-[#221912]">
                  {totalManpower} <span className="text-xs font-medium text-[#8C7E6E]">Ops</span>
                </div>
                <div className="text-[10px] text-[#8C7E6E]">
                  {line.operatorCount} Dedicated + {line.helperCount} Floaters
                </div>
              </div>

              <div className="p-3.5 bg-white border border-[#E6DDCE] rounded-2xl shadow-2xs space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C7E6E] flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-[#8C7E6E]" /> Workstations / Mc
                </span>
                <div className="text-xl font-mono font-black text-[#221912]">
                  {line.workstationCount} <span className="text-xs font-medium text-[#8C7E6E]">Stns</span>
                </div>
                <div className="text-[10px] text-[#8C7E6E]">
                  {line.machineCount} Installed Machines ({operatorToMachineRatio} ratio)
                </div>
              </div>

              <div className="p-3.5 bg-white border border-[#E6DDCE] rounded-2xl shadow-2xs space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C7E6E] flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-emerald-600" /> Daily Capacity
                </span>
                <div className="text-xl font-mono font-black text-emerald-700">
                  {line.capacityPerDay?.toLocaleString()} <span className="text-xs font-medium text-emerald-800">pcs</span>
                </div>
                <div className="text-[10px] text-[#8C7E6E]">
                  {Number(line.workingHours || 8).toFixed(1)} hrs shift ({Math.round((line.capacityPerDay || 0) / Number(line.workingHours || 8))} pcs/hr)
                </div>
              </div>

              <div className="p-3.5 bg-white border border-[#E6DDCE] rounded-2xl shadow-2xs space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C7E6E] flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-[#9C5B3C]" /> Target Efficiency
                </span>
                <div className="text-xl font-mono font-black text-[#9C5B3C]">
                  {line.targetEfficiencyPercent}%
                </div>
                <div className="text-[10px] text-[#8C7E6E]">
                  Standard Line Balance Target
                </div>
              </div>
            </div>

            {/* Floor Governance & Assigned Personnel */}
            <div className="p-4 bg-white border border-[#E6DDCE] rounded-2xl shadow-2xs space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#8C7E6E]">
                Floor Leadership &amp; Engineering Governance
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8E2D9] space-y-1">
                  <span className="text-[10px] font-bold uppercase text-[#8C7E6E] flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-[#9C5B3C]" /> Line Supervisor
                  </span>
                  <p className="font-bold text-[#221912]">{line.supervisorName || "Unassigned"}</p>
                  <span className="text-[10px] text-[#8C7E6E]">Floor Hourly Pacing &amp; Attendance</span>
                </div>

                <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8E2D9] space-y-1">
                  <span className="text-[10px] font-bold uppercase text-[#8C7E6E] flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5 text-[#9C5B3C]" /> Industrial Engineer (IE)
                  </span>
                  <p className="font-bold text-[#221912]">{line.ieInCharge || "Priya Sharma"}</p>
                  <span className="text-[10px] text-[#8C7E6E]">Pitch Time &amp; Line Balancing</span>
                </div>

                <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8E2D9] space-y-1">
                  <span className="text-[10px] font-bold uppercase text-[#8C7E6E] flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#8C7E6E]" /> Inline QA Lead (QC)
                  </span>
                  <p className="font-bold text-[#221912]">{line.qcInspector || "Naresh Soni"}</p>
                  <span className="text-[10px] text-[#8C7E6E]">Defect Audit &amp; Skill Verification</span>
                </div>
              </div>
            </div>

            {/* Active Running Style & Bulletin Binding */}
            <div className="p-4 bg-white border border-[#E6DDCE] rounded-2xl shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#8C7E6E]">
                  Active Order &amp; Operation Bulletin Binding
                </h4>
                <span className="text-[10px] font-bold text-[#9C5B3C]">Live Production Flow</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8E2D9] space-y-1">
                  <span className="text-[10px] font-bold uppercase text-[#8C7E6E]">Active Garment Style</span>
                  <p className="font-bold text-[#221912]">{line.currentStyle || "POLO-800 - Classic Pique Polo"}</p>
                </div>
                <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8E2D9] space-y-1">
                  <span className="text-[10px] font-bold uppercase text-[#8C7E6E]">Active Operation Bulletin</span>
                  <p className="font-bold text-[#221912] font-mono">{line.currentBulletin || "OB-POLO-800"}</p>
                </div>
              </div>
            </div>

            {/* Engineering Notes & Floor Specifications */}
            {line.notes && (
              <div className="p-4 bg-white border border-[#E6DDCE] rounded-2xl shadow-2xs space-y-1.5 text-xs">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8C7E6E]">
                  Engineering Specifications &amp; Attachments
                </span>
                <p className="text-[#33251A] leading-relaxed">{line.notes}</p>
              </div>
            )}
          </div>

          {/* ── 3. Footer Actions ────────────────────────────────────── */}
          <div className="bg-white border-t border-[#E6DDCE] px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onClose();
                onEdit(line);
              }}
              className="text-xs font-bold gap-1.5 text-[#8C7E6E] hover:text-[#221912]"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Configuration</span>
            </Button>

            <div className="flex items-center gap-2">
              <Link to={`/line-balance?lineId=${line.id}`}>
                <Button
                  size="sm"
                  className="bg-[#9C5B3C] hover:bg-[#854B31] text-white font-bold text-xs gap-1.5 shadow-xs"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Open Line Balancing</span>
                </Button>
              </Link>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
