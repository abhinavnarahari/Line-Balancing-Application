import React, { useState, useEffect } from "react";
import { 
  Building, 
  Gauge, 
  UserCheck
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import type { SewingLine, LineType, OperationalStatus } from "./api";
import { LINE_TYPES, OPERATIONAL_STATUSES } from "./api";

interface LineFormProps {
  initialData?: SewingLine | null;
  suggestedLineCode?: string;
  onSubmit: (data: Omit<SewingLine, "id" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
}

export const LineForm: React.FC<LineFormProps> = ({
  initialData,
  suggestedLineCode,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    lineCode: initialData?.lineCode || suggestedLineCode || "LINE-01",
    lineName: initialData?.lineName || "",
    lineType: (initialData?.lineType || "PBS") as LineType,
    floor: initialData?.floor || "Unit 1 - Floor 1 (Bay A)",
    department: initialData?.department || "Knit Assembly",
    supervisorName: initialData?.supervisorName || "",
    ieInCharge: initialData?.ieInCharge || "Priya Sharma",
    qcInspector: initialData?.qcInspector || "Naresh Soni",
    workstationCount: initialData?.workstationCount ?? 24,
    operatorCount: initialData?.operatorCount ?? 20,
    helperCount: initialData?.helperCount ?? 2,
    machineCount: initialData?.machineCount ?? 22,
    workingHours: initialData?.workingHours ? Number(initialData.workingHours) : 8.0,
    capacityPerDay: initialData?.capacityPerDay ?? 1000,
    targetEfficiencyPercent: initialData?.targetEfficiencyPercent ? Number(initialData.targetEfficiencyPercent) : 85.0,
    operationalStatus: (initialData?.operationalStatus || "ACTIVE") as OperationalStatus,
    currentStyle: initialData?.currentStyle || "",
    currentBulletin: initialData?.currentBulletin || "",
    active: initialData?.active ?? true,
    notes: initialData?.notes || "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        lineCode: initialData.lineCode,
        lineName: initialData.lineName,
        lineType: (initialData.lineType || "PBS") as LineType,
        floor: initialData.floor || "Unit 1 - Floor 1 (Bay A)",
        department: initialData.department || "Knit Assembly",
        supervisorName: initialData.supervisorName || "",
        ieInCharge: initialData.ieInCharge || "Priya Sharma",
        qcInspector: initialData.qcInspector || "Naresh Soni",
        workstationCount: initialData.workstationCount ?? 24,
        operatorCount: initialData.operatorCount ?? 20,
        helperCount: initialData.helperCount ?? 2,
        machineCount: initialData.machineCount ?? 22,
        workingHours: initialData.workingHours ? Number(initialData.workingHours) : 8.0,
        capacityPerDay: initialData.capacityPerDay ?? 1000,
        targetEfficiencyPercent: initialData.targetEfficiencyPercent ? Number(initialData.targetEfficiencyPercent) : 85.0,
        operationalStatus: (initialData.operationalStatus || "ACTIVE") as OperationalStatus,
        currentStyle: initialData.currentStyle || "",
        currentBulletin: initialData.currentBulletin || "",
        active: initialData.active,
        notes: initialData.notes || "",
      });
    } else if (!formData.lineCode && suggestedLineCode) {
      setFormData((prev) => ({
        ...prev,
        lineCode: suggestedLineCode,
      }));
    }
  }, [initialData, suggestedLineCode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? "" : parseFloat(value) || 0) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      workstationCount: Number(formData.workstationCount) || 24,
      operatorCount: Number(formData.operatorCount) || 20,
      helperCount: Number(formData.helperCount) || 2,
      machineCount: Number(formData.machineCount) || 22,
      workingHours: Number(formData.workingHours) || 8.0,
      capacityPerDay: Number(formData.capacityPerDay) || 1000,
      targetEfficiencyPercent: Number(formData.targetEfficiencyPercent) || 85.0,
      active: formData.operationalStatus !== "IDLE" && formData.active,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-left font-sans text-xs">
      
      {/* ── 1. Line Identification & Type ────────────────────────────── */}
      <div className="p-4 bg-white border border-[#E6DDCE] rounded-2xl shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b border-[#E8E2D9] pb-2.5">
          <Building className="w-4 h-4 text-[#9C5B3C]" />
          <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#221912]">
            1. Line Identification &amp; Configuration Type
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-[#8C7E6E]">Line Code</label>
            <input
              type="text"
              name="lineCode"
              value={formData.lineCode}
              onChange={handleChange}
              required
              placeholder="e.g. LINE-01"
              className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E6DDCE] rounded-xl font-mono font-bold text-xs text-[#221912] focus:outline-hidden focus:border-[#9C5B3C]"
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="text-[10px] font-bold uppercase text-[#8C7E6E]">Line Name / Description</label>
            <input
              type="text"
              name="lineName"
              value={formData.lineName}
              onChange={handleChange}
              required
              placeholder="e.g. Line 01 - Main Polo & Knit Assembly"
              className="w-full px-3 py-2 bg-white border border-[#E6DDCE] rounded-xl font-bold text-xs text-[#221912] focus:outline-hidden focus:border-[#9C5B3C]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-[#8C7E6E]">Manufacturing Line Type</label>
            <select
              name="lineType"
              value={formData.lineType}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E6DDCE] rounded-xl font-bold text-xs text-[#221912] focus:outline-hidden focus:border-[#9C5B3C] cursor-pointer"
            >
              {LINE_TYPES.map(t => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-[#8C7E6E]">Floor / Bay Location</label>
            <input
              type="text"
              name="floor"
              value={formData.floor}
              onChange={handleChange}
              placeholder="e.g. Unit 1 - Floor 1 (Bay A)"
              className="w-full px-3 py-2 bg-white border border-[#E6DDCE] rounded-xl text-xs text-[#221912] focus:outline-hidden focus:border-[#9C5B3C]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-[#8C7E6E]">Department Division</label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              placeholder="e.g. Knit Assembly Floor"
              className="w-full px-3 py-2 bg-white border border-[#E6DDCE] rounded-xl text-xs text-[#221912] focus:outline-hidden focus:border-[#9C5B3C]"
            />
          </div>
        </div>
      </div>

      {/* ── 2. Capacities, Workstations & Engineering Targets ──────── */}
      <div className="p-4 bg-white border border-[#E6DDCE] rounded-2xl shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b border-[#E8E2D9] pb-2.5">
          <Gauge className="w-4 h-4 text-emerald-700" />
          <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#221912]">
            2. Physical Workstations, Sizing &amp; Daily Capacity
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-[#8C7E6E]">Workstations</label>
            <input
              type="number"
              min="1"
              max="200"
              name="workstationCount"
              value={formData.workstationCount}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E6DDCE] rounded-xl font-mono font-bold text-xs text-[#221912] focus:outline-hidden focus:border-[#9C5B3C]"
            />
            <span className="text-[9.5px] text-[#8C7E6E]">Physical stands</span>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-[#8C7E6E]">Primary Operators</label>
            <input
              type="number"
              min="1"
              max="200"
              name="operatorCount"
              value={formData.operatorCount}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E6DDCE] rounded-xl font-mono font-bold text-xs text-[#9C5B3C] focus:outline-hidden focus:border-[#9C5B3C]"
            />
            <span className="text-[9.5px] text-[#8C7E6E]">Planned sequential</span>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-[#8C7E6E]">Floaters / Helpers</label>
            <input
              type="number"
              min="0"
              max="20"
              name="helperCount"
              value={formData.helperCount}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E6DDCE] rounded-xl font-mono font-bold text-xs text-[#9C5B3C] focus:outline-hidden focus:border-[#9C5B3C]"
            />
            <span className="text-[9.5px] text-[#8C7E6E]">Buffer relief staff</span>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-[#8C7E6E]">Installed Machines</label>
            <input
              type="number"
              min="1"
              max="200"
              name="machineCount"
              value={formData.machineCount}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E6DDCE] rounded-xl font-mono font-bold text-xs text-[#221912] focus:outline-hidden focus:border-[#9C5B3C]"
            />
            <span className="text-[9.5px] text-[#8C7E6E]">Floor equipment count</span>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-[#8C7E6E]">Working Hours/Day</label>
            <input
              type="number"
              step="0.5"
              min="1"
              max="24"
              name="workingHours"
              value={formData.workingHours}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E6DDCE] rounded-xl font-mono font-bold text-xs text-[#221912] focus:outline-hidden focus:border-[#9C5B3C]"
            />
            <span className="text-[9.5px] text-[#8C7E6E]">Shift duration</span>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-[#8C7E6E]">Daily Capacity (pcs)</label>
            <input
              type="number"
              min="1"
              max="50000"
              name="capacityPerDay"
              value={formData.capacityPerDay}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E6DDCE] rounded-xl font-mono font-bold text-xs text-emerald-800 focus:outline-hidden focus:border-[#9C5B3C]"
            />
            <span className="text-[9.5px] text-[#8C7E6E]">Designed throughput</span>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-[#8C7E6E]">Target Efficiency %</label>
            <input
              type="number"
              step="0.1"
              min="10"
              max="100"
              name="targetEfficiencyPercent"
              value={formData.targetEfficiencyPercent}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E6DDCE] rounded-xl font-mono font-bold text-xs text-[#9C5B3C] focus:outline-hidden focus:border-[#9C5B3C]"
            />
            <span className="text-[9.5px] text-[#8C7E6E]">Line balancing KPI</span>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-[#8C7E6E]">Hourly Target</label>
            <div className="px-3 py-2 bg-[#FAF7F2] border border-[#E6DDCE] rounded-xl font-mono font-bold text-xs text-[#221912]">
              {Math.round((Number(formData.capacityPerDay) || 0) / (Number(formData.workingHours) || 8))} <span className="text-[10px] font-medium text-[#8C7E6E]">pcs/hr</span>
            </div>
            <span className="text-[9.5px] text-[#8C7E6E]">Pacing requirement</span>
          </div>
        </div>
      </div>

      {/* ── 3. Floor Governance, Personnel & Live Status ───────────── */}
      <div className="p-4 bg-white border border-[#E6DDCE] rounded-2xl shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b border-[#E8E2D9] pb-2.5">
          <UserCheck className="w-4 h-4 text-purple-700" />
          <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#221912]">
            3. Floor Leadership, Assigned Staff &amp; Operational Status
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-[#8C7E6E]">Line Supervisor</label>
            <input
              type="text"
              name="supervisorName"
              value={formData.supervisorName}
              onChange={handleChange}
              placeholder="e.g. Rahim Khan"
              className="w-full px-3 py-2 bg-white border border-[#E6DDCE] rounded-xl text-xs font-bold text-[#221912] focus:outline-hidden focus:border-[#9C5B3C]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-[#8C7E6E]">Assigned Industrial Engineer</label>
            <input
              type="text"
              name="ieInCharge"
              value={formData.ieInCharge}
              onChange={handleChange}
              placeholder="e.g. Priya Sharma"
              className="w-full px-3 py-2 bg-white border border-[#E6DDCE] rounded-xl text-xs font-bold text-[#221912] focus:outline-hidden focus:border-[#9C5B3C]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-[#8C7E6E]">Inline QA Lead (QC)</label>
            <input
              type="text"
              name="qcInspector"
              value={formData.qcInspector}
              onChange={handleChange}
              placeholder="e.g. Naresh Soni"
              className="w-full px-3 py-2 bg-white border border-[#E6DDCE] rounded-xl text-xs font-bold text-[#221912] focus:outline-hidden focus:border-[#9C5B3C]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-[#8C7E6E]">Operational Status</label>
            <select
              name="operationalStatus"
              value={formData.operationalStatus}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E6DDCE] rounded-xl font-bold text-xs text-[#221912] focus:outline-hidden focus:border-[#9C5B3C] cursor-pointer"
            >
              {OPERATIONAL_STATUSES.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="text-[10px] font-bold uppercase text-[#8C7E6E]">Active Garment Style (Optional)</label>
            <input
              type="text"
              name="currentStyle"
              value={formData.currentStyle}
              onChange={handleChange}
              placeholder="e.g. POLO-800 - Classic Pique Polo"
              className="w-full px-3 py-2 bg-white border border-[#E6DDCE] rounded-xl text-xs text-[#221912] focus:outline-hidden focus:border-[#9C5B3C]"
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="text-[10px] font-bold uppercase text-[#8C7E6E]">Active Operation Bulletin (Optional)</label>
            <input
              type="text"
              name="currentBulletin"
              value={formData.currentBulletin}
              onChange={handleChange}
              placeholder="e.g. OB-POLO-800"
              className="w-full px-3 py-2 bg-white border border-[#E6DDCE] rounded-xl font-mono text-xs text-[#221912] focus:outline-hidden focus:border-[#9C5B3C]"
            />
          </div>
        </div>
      </div>

      {/* ── 4. Engineering Notes & Special Attachments ─────────────── */}
      <div className="p-4 bg-white border border-[#E6DDCE] rounded-2xl shadow-2xs space-y-2">
        <label className="text-[10px] font-bold uppercase text-[#8C7E6E] block">
          Floor Engineering Specifications &amp; Notes
        </label>
        <textarea
          name="notes"
          rows={2}
          value={formData.notes}
          onChange={handleChange}
          placeholder="e.g. Equipped with pneumatic under-bed thread trimmers (UBT), continuous collar fusing feed, auto-stackers..."
          className="w-full p-3 bg-[#FAF7F2] border border-[#E6DDCE] rounded-xl text-xs text-[#221912] focus:outline-hidden focus:border-[#9C5B3C] placeholder-[#A6998A]"
        />
      </div>

      {/* ── Submit / Cancel Buttons ─────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6DDCE]">
        <Button type="button" variant="ghost" onClick={onCancel} size="sm">
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          className="bg-[#9C5B3C] hover:bg-[#854B31] text-white font-bold px-5"
        >
          {initialData ? "Save Line Architecture" : "Register Sewing Line"}
        </Button>
      </div>
    </form>
  );
};
