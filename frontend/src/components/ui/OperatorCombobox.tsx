import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  ChevronDown,
  Check,
  X,
  User,
  UserPlus,
  UserMinus,
  Sparkles,
  AlertTriangle,
  Star,
  UserX
} from "lucide-react";
import type { Operator } from "../../features/operators/api";

export interface OperatorComboboxProps {
  value: string | number | null;
  onChange: (operatorId: string) => void;
  availableOperators: Operator[];
  currentOperator?: Operator | null;
  operationId: string | number;
  getOperatorSkill: (operatorId: string | number | null, operationId: string | number) => number | null;
  getOperatorAttendance: (operatorId: string | number | null) => string | null | undefined;
  requiredSkillRating?: string;
  slotIndex?: number;
  totalSlots?: number;
  disabled?: boolean;
  className?: string;
}

// Deterministic vibrant avatar gradient generator
function getAvatarGradient(name: string): string {
  const gradients = [
    "from-blue-500 to-indigo-600 text-white",
    "from-emerald-500 to-teal-600 text-white",
    "from-violet-500 to-purple-600 text-white",
    "from-amber-500 to-orange-600 text-white",
    "from-rose-500 to-pink-600 text-white",
    "from-cyan-500 to-blue-600 text-white",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}

// Extract clean 2-letter uppercase initials
function getInitials(name: string): string {
  if (!name) return "OP";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Human-friendly role formatting
function formatRole(role?: string): string {
  if (!role || role === "OPERATOR") return "";
  if (role === "LINE_SUPERVISOR") return "Supervisor";
  if (role === "QUALITY_CHECKER") return "QC Inspector";
  if (role === "FLOATER") return "Floater";
  if (role === "HELPER") return "Helper";
  return role;
}

type FilterTab = "all" | "present" | "matches_req" | "expert" | "floater";

export function OperatorCombobox({
  value,
  onChange,
  availableOperators,
  currentOperator,
  operationId,
  getOperatorSkill,
  getOperatorAttendance,
  requiredSkillRating = "ANY",
  slotIndex = 0,
  totalSlots = 1,
  disabled = false,
  className = "",
}: OperatorComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; openUpward: boolean }>({
    top: 0,
    left: 0,
    width: 380,
    openUpward: false,
  });

  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Active selected operator details
  const selectedOperator = useMemo(() => {
    if (!value) return null;
    if (currentOperator && String(currentOperator.id) === String(value)) {
      return currentOperator;
    }
    return availableOperators.find((op) => String(op.id) === String(value)) || null;
  }, [value, currentOperator, availableOperators]);

  const selectedSkill = useMemo(() => {
    return selectedOperator ? getOperatorSkill(selectedOperator.id, operationId) : null;
  }, [selectedOperator, operationId, getOperatorSkill]);

  const selectedAttendance = useMemo(() => {
    return selectedOperator ? getOperatorAttendance(selectedOperator.id) : null;
  }, [selectedOperator, getOperatorAttendance]);

  const isSkillMismatch = useMemo(() => {
    if (!requiredSkillRating || requiredSkillRating === "ANY" || selectedSkill === null) {
      return false;
    }
    if (requiredSkillRating === "3_PLUS") return selectedSkill < 3;
    if (requiredSkillRating === "4_PLUS") return selectedSkill < 4;
    return selectedSkill < Number(requiredSkillRating);
  }, [requiredSkillRating, selectedSkill]);

  // Positioning & scroll management
  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) {
      setIsOpen(false);
      return;
    }
    const popoverHeight = 360;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < popoverHeight && rect.top > popoverHeight;

    const desiredWidth = Math.max(rect.width, 390);
    const maxLeft = window.innerWidth - desiredWidth - 16;
    const computedLeft = Math.max(12, Math.min(rect.left, maxLeft));

    setCoords({
      top: openUpward ? rect.top - 6 : rect.bottom + 6,
      left: computedLeft,
      width: desiredWidth,
      openUpward,
    });
  };

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handleScroll = () => updatePosition();
    const handleResize = () => updatePosition();

    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen]);

  // Auto-focus search input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }, 30);
    } else {
      setSearchQuery("");
      setActiveTab("all");
    }
  }, [isOpen]);

  // Click outside handling
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  // Escape key handling
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Check if operator meets required rating
  const checkMeetsRequirement = (op: Operator): boolean => {
    if (!requiredSkillRating || requiredSkillRating === "ANY") return true;
    const r = getOperatorSkill(op.id, operationId);
    if (r === null) return false;
    if (requiredSkillRating === "3_PLUS") return r >= 3;
    if (requiredSkillRating === "4_PLUS") return r >= 4;
    return r >= Number(requiredSkillRating);
  };

  // Filtered and intelligently sorted operators
  const filteredAndSortedOperators = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return availableOperators
      .filter((op) => {
        // Tab filter
        const att = getOperatorAttendance(op.id);
        const skill = getOperatorSkill(op.id, operationId);

        if (activeTab === "present" && att !== "PRESENT" && att !== "LATE") {
          return false;
        }
        if (activeTab === "matches_req" && !checkMeetsRequirement(op)) {
          return false;
        }
        if (activeTab === "expert" && (skill === null || skill < 4)) {
          return false;
        }
        if (activeTab === "floater" && op.role !== "FLOATER" && op.role !== "HELPER") {
          return false;
        }

        // Search text filter
        if (!q) return true;
        const matchesName = op.name.toLowerCase().includes(q);
        const matchesEmpId = op.employeeId.toLowerCase().includes(q);
        const matchesRole = op.role?.toLowerCase().includes(q);
        const matchesDept = op.department?.toLowerCase().includes(q);
        const matchesRating = skill !== null && String(skill).includes(q);

        return matchesName || matchesEmpId || matchesRole || matchesDept || matchesRating;
      })
      .sort((a, b) => {
        // 1. Currently selected operator always stays on top
        const aIsSelected = value && String(a.id) === String(value);
        const bIsSelected = value && String(b.id) === String(value);
        if (aIsSelected && !bIsSelected) return -1;
        if (!aIsSelected && bIsSelected) return 1;

        // 2. Meets requirement priority
        const aMeets = checkMeetsRequirement(a);
        const bMeets = checkMeetsRequirement(b);
        if (aMeets && !bMeets) return -1;
        if (!aMeets && bMeets) return 1;

        // 3. Higher skill rating first
        const aSkill = getOperatorSkill(a.id, operationId) || 0;
        const bSkill = getOperatorSkill(b.id, operationId) || 0;
        if (aSkill !== bSkill) return bSkill - aSkill;

        // 4. Present operators before Absent
        const aAtt = getOperatorAttendance(a.id);
        const bAtt = getOperatorAttendance(b.id);
        const aPresent = aAtt === "PRESENT" || aAtt === "LATE";
        const bPresent = bAtt === "PRESENT" || bAtt === "LATE";
        if (aPresent && !bPresent) return -1;
        if (!aPresent && bPresent) return 1;

        // 5. Natural alphabetical
        return a.employeeId.localeCompare(b.employeeId);
      });
  }, [
    availableOperators,
    searchQuery,
    activeTab,
    value,
    operationId,
    requiredSkillRating,
    getOperatorSkill,
    getOperatorAttendance,
  ]);

  // Aggregate stats for filter tabs
  const stats = useMemo(() => {
    let presentCount = 0;
    let meetsReqCount = 0;
    let expertCount = 0;
    let floaterCount = 0;

    availableOperators.forEach((op) => {
      const att = getOperatorAttendance(op.id);
      const skill = getOperatorSkill(op.id, operationId);
      if (att === "PRESENT" || att === "LATE") presentCount++;
      if (checkMeetsRequirement(op)) meetsReqCount++;
      if (skill !== null && skill >= 4) expertCount++;
      if (op.role === "FLOATER" || op.role === "HELPER") floaterCount++;
    });

    return {
      total: availableOperators.length,
      presentCount,
      meetsReqCount,
      expertCount,
      floaterCount,
    };
  }, [availableOperators, operationId, requiredSkillRating, getOperatorAttendance, getOperatorSkill]);

  const handleSelect = (opId: string) => {
    onChange(opId);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setIsOpen(false);
  };

  // Format attendance pill
  const renderAttendanceDot = (status?: string | null) => {
    if (status === "PRESENT") {
      return (
        <span
          className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white shrink-0"
          title="Present Today"
        />
      );
    }
    if (status === "LATE") {
      return (
        <span
          className="w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white shrink-0"
          title="Late Arrival"
        />
      );
    }
    if (status === "ABSENT") {
      return (
        <span
          className="w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white shrink-0"
          title="Absent"
        />
      );
    }
    return (
      <span
        className="w-2 h-2 rounded-full bg-slate-300 ring-2 ring-white shrink-0"
        title="Attendance Unrecorded"
      />
    );
  };

  // Render Star Badge
  const renderStarBadge = (rating: number | null, isMismatch = false) => {
    if (rating === null) {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
          Unrated
        </span>
      );
    }

    if (isMismatch) {
      return (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs"
          title={`Rating ★${rating} does not meet station requirement (★${requiredSkillRating})`}
        >
          <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-600" />
          <span>★ {rating}</span>
          <AlertTriangle className="w-2.5 h-2.5 text-amber-700 ml-0.5" />
        </span>
      );
    }

    if (rating >= 4) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
          <Star className="w-2.5 h-2.5 fill-emerald-500 text-emerald-600" />
          <span>★ {rating}</span>
        </span>
      );
    }

    if (rating === 3) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 shadow-2xs">
          <Star className="w-2.5 h-2.5 fill-blue-500 text-blue-600" />
          <span>★ {rating}</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
        <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-600" />
        <span>★ {rating}</span>
      </span>
    );
  };

  const slotSuffix = totalSlots > 1 ? ` #${slotIndex + 1}` : "";
  const reqRatingText = requiredSkillRating !== "ANY" ? `★${requiredSkillRating} ` : "";

  return (
    <div className={`relative w-full ${className}`}>
      {/* ─── Trigger Button ─────────────────────────────────────────── */}
      <div
        ref={triggerRef}
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
          }
        }}
        className={`w-full min-h-[34px] rounded-xl px-2.5 py-1 text-xs transition-all cursor-pointer flex items-center justify-between gap-2 shadow-2xs select-none border ${
          isOpen
            ? "border-blue-500 ring-2 ring-blue-500/15 bg-white"
            : selectedOperator
            ? isSkillMismatch
              ? "border-amber-300 bg-amber-50/20 hover:border-amber-400 hover:bg-amber-50/40"
              : "border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/50"
            : "border-dashed border-slate-300 bg-slate-50/50 hover:border-blue-400 hover:bg-blue-50/30 text-slate-500"
        } ${disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
        title={
          selectedOperator
            ? `${selectedOperator.name} (${selectedOperator.employeeId})`
            : `Click to select operator for slot${slotSuffix}`
        }
      >
        {selectedOperator ? (
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Operator Avatar with Attendance Indicator */}
            <div className="relative shrink-0">
              <div
                className={`w-6 h-6 rounded-full bg-gradient-to-br ${getAvatarGradient(
                  selectedOperator.name
                )} flex items-center justify-center font-bold text-[9.5px] shadow-2xs`}
              >
                {getInitials(selectedOperator.name)}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5">
                {renderAttendanceDot(selectedAttendance)}
              </div>
            </div>

            {/* Operator Info */}
            <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
              <span className="font-semibold text-slate-800 text-[11.5px] truncate">
                {selectedOperator.name}
              </span>
              <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded shrink-0">
                {selectedOperator.employeeId}
              </span>
              {selectedOperator.role && selectedOperator.role !== "OPERATOR" && (
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                  {formatRole(selectedOperator.role)}
                </span>
              )}
            </div>

            {/* Skill Rating Pill on the trigger */}
            <div className="shrink-0">{renderStarBadge(selectedSkill, isSkillMismatch)}</div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-500 text-[11px] font-medium truncate flex-1">
            <UserPlus className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              Assign {reqRatingText}Operator{slotSuffix} ({availableOperators.length} avail)
            </span>
          </div>
        )}

        {/* Action icons */}
        <div className="flex items-center gap-1 shrink-0">
          {selectedOperator && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
              title="Unassign operator"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-blue-600" : ""
            }`}
          />
        </div>
      </div>

      {/* ─── Portaled Floating Search Dropdown ────────────────────────── */}
      {isOpen &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              position: "fixed",
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              zIndex: 99999,
              transform: coords.openUpward ? "translateY(-100%)" : "none",
            }}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[420px] animate-in fade-in duration-150 ring-1 ring-black/5 select-none"
          >
            {/* Header: Title & Slot Context */}
            <div className="px-3.5 pt-3 pb-2 bg-gradient-to-r from-slate-50 to-slate-100/60 border-b border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                  <User className="w-3 h-3" />
                </div>
                <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                  Select Operator{slotSuffix}
                </span>
                {requiredSkillRating && requiredSkillRating !== "ANY" && (
                  <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                    Required: ★{requiredSkillRating}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[9px] shadow-2xs">
                  ESC
                </kbd>
                <span>to close</span>
              </div>
            </div>

            {/* Search Input Bar */}
            <div className="p-2.5 border-b border-slate-100 bg-white">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, EMP ID, role, or rating..."
                  className="w-full h-8.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl pl-8 pr-7 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/15 transition-all font-medium"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Quick Filter Chips */}
              <div className="flex items-center gap-1 mt-2 overflow-x-auto pb-0.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className={`px-2 py-0.5 rounded-lg font-bold transition-all shrink-0 cursor-pointer ${
                    activeTab === "all"
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                  }`}
                >
                  All ({stats.total})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("present")}
                  className={`px-2 py-0.5 rounded-lg font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                    activeTab === "present"
                      ? "bg-emerald-600 text-white shadow-2xs"
                      : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Present ({stats.presentCount})</span>
                </button>

                {requiredSkillRating !== "ANY" && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("matches_req")}
                    className={`px-2 py-0.5 rounded-lg font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                      activeTab === "matches_req"
                        ? "bg-amber-600 text-white shadow-2xs"
                        : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60"
                    }`}
                  >
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>Meets Req ({stats.meetsReqCount})</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setActiveTab("expert")}
                  className={`px-2 py-0.5 rounded-lg font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                    activeTab === "expert"
                      ? "bg-indigo-600 text-white shadow-2xs"
                      : "bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200/60"
                  }`}
                >
                  <Star className="w-2.5 h-2.5" />
                  <span>★ 4-5 Stars ({stats.expertCount})</span>
                </button>

                {stats.floaterCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("floater")}
                    className={`px-2 py-0.5 rounded-lg font-bold transition-all shrink-0 cursor-pointer ${
                      activeTab === "floater"
                        ? "bg-purple-600 text-white shadow-2xs"
                        : "bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200/60"
                    }`}
                  >
                    Floaters ({stats.floaterCount})
                  </button>
                )}
              </div>
            </div>

            {/* List Body */}
            <div ref={listRef} className="overflow-y-auto p-1.5 space-y-0.5 max-h-[260px] custom-scrollbar">
              {/* Option to Unassign if an operator is currently selected */}
              {selectedOperator && (
                <div
                  onClick={() => handleSelect("")}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50/80 transition-colors cursor-pointer flex items-center justify-between border border-transparent hover:border-rose-200 mb-1"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                      <UserMinus className="w-3.5 h-3.5" />
                    </div>
                    <span>Unassign Operator (Leave slot empty)</span>
                  </div>
                  <X className="w-3.5 h-3.5 text-rose-500" />
                </div>
              )}

              {/* Filtered Operator Rows */}
              {filteredAndSortedOperators.length === 0 ? (
                <div className="py-8 text-center px-4 space-y-2">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                    <UserX className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-medium text-slate-600">
                    No operators found matching &ldquo;
                    <span className="font-semibold text-slate-900">{searchQuery}</span>&rdquo;
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setActiveTab("all");
                    }}
                    className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    Reset filters &amp; show all {availableOperators.length} operators
                  </button>
                </div>
              ) : (
                filteredAndSortedOperators.map((op) => {
                  const isSelected = value && String(op.id) === String(value);
                  const skill = getOperatorSkill(op.id, operationId);
                  const attendance = getOperatorAttendance(op.id);
                  const isPresent = attendance === "PRESENT";
                  const isLate = attendance === "LATE";
                  const isAbsent = attendance === "ABSENT";
                  const meetsReq = checkMeetsRequirement(op);

                  return (
                    <div
                      key={op.id}
                      onClick={() => handleSelect(String(op.id))}
                      className={`px-2.5 py-2 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-between gap-2 border ${
                        isSelected
                          ? "bg-blue-50/80 border-blue-200 text-blue-900 font-semibold"
                          : "border-transparent hover:bg-slate-50 hover:border-slate-200 text-slate-700"
                      }`}
                    >
                      {/* Left: Avatar + Indicator */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="relative shrink-0">
                          <div
                            className={`w-7 h-7 rounded-full bg-gradient-to-br ${getAvatarGradient(
                              op.name
                            )} flex items-center justify-center font-bold text-[10px] shadow-2xs`}
                          >
                            {getInitials(op.name)}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5">
                            {renderAttendanceDot(attendance)}
                          </div>
                        </div>

                        {/* Middle: Name, ID, Role & Attendance status */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900 text-xs truncate">
                              {op.name}
                            </span>
                            <span className="font-mono text-[9.5px] font-medium text-slate-500 bg-slate-100 px-1 py-0.2 rounded shrink-0">
                              {op.employeeId}
                            </span>
                            {op.role && op.role !== "OPERATOR" && (
                              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200/80 shrink-0">
                                {formatRole(op.role)}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-[10.5px] text-slate-400 mt-0.5">
                            <span className="flex items-center gap-1">
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isPresent
                                    ? "bg-emerald-500"
                                    : isLate
                                    ? "bg-amber-500"
                                    : isAbsent
                                    ? "bg-rose-500"
                                    : "bg-slate-300"
                                }`}
                              />
                              <span
                                className={
                                  isPresent
                                    ? "text-emerald-700 font-medium"
                                    : isLate
                                    ? "text-amber-700 font-medium"
                                    : isAbsent
                                    ? "text-rose-600 font-medium"
                                    : "text-slate-500"
                                }
                              >
                                {isPresent
                                  ? "Present"
                                  : isLate
                                  ? "Late"
                                  : isAbsent
                                  ? "Absent"
                                  : "Unmarked"}
                              </span>
                            </span>
                            <span>•</span>
                            <span className="truncate">{op.department || "Sewing"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Skill Rating Badge + Checkmark */}
                      <div className="flex items-center gap-2 shrink-0">
                        {renderStarBadge(skill, !meetsReq && requiredSkillRating !== "ANY")}
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                            <Check className="w-3 h-3 stroke-[2.5]" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer: Live Count & Status */}
            <div className="px-3.5 py-2 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-[10.5px] text-slate-500">
              <span>
                Showing <strong className="text-slate-800">{filteredAndSortedOperators.length}</strong> of{" "}
                {availableOperators.length} available
              </span>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>{stats.presentCount} Present</span>
                </span>
                {stats.total - stats.presentCount > 0 && (
                  <span className="flex items-center gap-1 text-slate-400">
                    <span>{stats.total - stats.presentCount} Away</span>
                  </span>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
