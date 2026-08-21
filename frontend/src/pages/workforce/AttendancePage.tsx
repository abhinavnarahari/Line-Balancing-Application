import { useState, useEffect, useMemo } from "react";
import { Check, X, Clock, Calendar, AlertTriangle, User, Search, Filter, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader, DataCard, EmptyState } from "../../components/ui/PremiumUI";
import { Button } from "../../components/ui/Button";

import { attendanceApi, type AttendanceRecord, type AttendanceStatus } from "../../features/attendance/mockApi";
import { shiftAssignmentApi } from "../../features/shift-assignments/mockApi";
import { operatorsApi, type Operator } from "../../features/operators/mockApi";
import { shiftApi } from "../../features/shifts/mockApi";
import type { Shift } from "../../features/shifts/types";
import { cn } from "../../utils/cn";

// Utility for status styling
const getStatusConfig = (status?: AttendanceStatus) => {
  switch (status) {
    case "PRESENT": return { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", icon: Check };
    case "LATE": return { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", icon: Clock };
    case "ABSENT": return { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", icon: X };
    case "HALF_DAY": return { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", icon: Clock };
    case "ON_LEAVE": return { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", icon: Calendar };
    default: return { bg: "bg-white", border: "border-[#E0D8C0]", text: "text-[#6E6656]", icon: AlertTriangle };
  }
};

export function AttendancePage() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedShiftId, setSelectedShiftId] = useState("");
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  
  const [roster, setRoster] = useState<Operator[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | AttendanceStatus>("ALL");

  // Initial Data Load
  useEffect(() => {
    const fetchBase = async () => {
      const [shData, opData] = await Promise.all([
        shiftApi.getShifts(),
        operatorsApi.getOperators(),
      ]);
      setShifts(shData.filter(s => s.active));
      setOperators(opData);
      if (shData.length > 0 && !selectedShiftId) {
        setSelectedShiftId(shData[0].id);
      }
    };
    fetchBase();
  }, []);

  // Load roster and attendance whenever date or shift changes
  useEffect(() => {
    if (!selectedShiftId || !date) return;
    
    const loadDayData = async () => {
      setLoading(true);
      try {
        const [assignments, attData] = await Promise.all([
          shiftAssignmentApi.getAssignments(),
          attendanceApi.getAttendanceForDate(date, selectedShiftId)
        ]);

        const targetDate = new Date(date).getTime();
        const activeAssigned = assignments.filter(a => 
          a.shiftId === selectedShiftId &&
          new Date(a.effectiveFrom).getTime() <= targetDate &&
          (!a.effectiveTo || new Date(a.effectiveTo).getTime() >= targetDate)
        );

        const assignedOperatorIds = new Set(activeAssigned.map(a => a.operatorId));
        const rosterOps = operators.filter(o => assignedOperatorIds.has(o.id));

        setRoster(rosterOps);
        setAttendance(attData);
      } finally {
        setLoading(false);
      }
    };
    
    loadDayData();
  }, [date, selectedShiftId, operators]);

  const handleMark = async (operatorId: string, status: AttendanceStatus) => {
    const record = await attendanceApi.markAttendance({
      date,
      shiftId: selectedShiftId,
      operatorId,
      status
    });
    
    setAttendance(prev => {
      const idx = prev.findIndex(a => a.operatorId === operatorId);
      if (idx >= 0) {
        const newArr = [...prev];
        newArr[idx] = record;
        return newArr;
      }
      return [...prev, record];
    });
  };

  const handleBulkMarkPresent = async () => {
    const pendingOps = roster.filter(op => !attendance.some(a => a.operatorId === op.id));
    if (pendingOps.length === 0) return;
    
    // In a real app, this would be a single batch API call. 
    // For mock, we loop.
    setLoading(true);
    for (const op of pendingOps) {
      await handleMark(op.id, "PRESENT");
    }
    setLoading(false);
  };

  // Metrics
  const presentCount = attendance.filter(a => a.status === "PRESENT").length;
  const lateCount = attendance.filter(a => a.status === "LATE").length;
  const absentCount = attendance.filter(a => a.status === "ABSENT").length;
  const halfDayCount = attendance.filter(a => a.status === "HALF_DAY").length;
  const leaveCount = attendance.filter(a => a.status === "ON_LEAVE").length;
  const pendingCount = roster.length - attendance.length;

  // Filtered Roster
  const filteredRoster = useMemo(() => {
    return roster.filter(op => {
      // Search
      const query = searchQuery.toLowerCase();
      if (query && !op.name.toLowerCase().includes(query) && !op.employeeId.toLowerCase().includes(query)) {
        return false;
      }
      // Status Filter
      if (statusFilter !== "ALL") {
        const record = attendance.find(a => a.operatorId === op.id);
        if (statusFilter === "PENDING" && record) return false;
        if (statusFilter !== "PENDING" && record?.status !== statusFilter) return false;
      }
      return true;
    });
  }, [roster, attendance, searchQuery, statusFilter]);

  if (loading && roster.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-[#D89A5C] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-[#8A8270]">Loading roster data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Workforce"
        title="Daily Attendance"
        description="Mark operator attendance for the daily shift roster to compute accurate capacities."
      />

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white border border-[#E0D8C0] rounded-sm p-4 flex flex-col justify-center items-center shadow-sm">
          <span className="text-[10px] uppercase font-semibold text-[#8A8270] tracking-wider mb-1">Total Roster</span>
          <span className="text-2xl font-bold text-[#1E1B16]">{roster.length}</span>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-sm p-4 flex flex-col justify-center items-center shadow-sm">
          <span className="text-[10px] uppercase font-semibold text-emerald-700 tracking-wider mb-1">Present</span>
          <span className="text-2xl font-bold text-emerald-800">{presentCount}</span>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-sm p-4 flex flex-col justify-center items-center shadow-sm">
          <span className="text-[10px] uppercase font-semibold text-amber-700 tracking-wider mb-1">Late</span>
          <span className="text-2xl font-bold text-amber-800">{lateCount}</span>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-sm p-4 flex flex-col justify-center items-center shadow-sm">
          <span className="text-[10px] uppercase font-semibold text-red-700 tracking-wider mb-1">Absent</span>
          <span className="text-2xl font-bold text-red-800">{absentCount}</span>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-sm p-4 flex flex-col justify-center items-center shadow-sm">
          <span className="text-[10px] uppercase font-semibold text-orange-700 tracking-wider mb-1">Half Day</span>
          <span className="text-2xl font-bold text-orange-800">{halfDayCount}</span>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-sm p-4 flex flex-col justify-center items-center shadow-sm">
          <span className="text-[10px] uppercase font-semibold text-blue-700 tracking-wider mb-1">On Leave</span>
          <span className="text-2xl font-bold text-blue-800">{leaveCount}</span>
        </div>
        <div className="bg-[#FBF8F3] border border-[#D0C8B4] rounded-sm p-4 flex flex-col justify-center items-center shadow-sm">
          <span className="text-[10px] uppercase font-semibold text-[#6E6656] tracking-wider mb-1">Pending</span>
          <span className="text-2xl font-bold text-[#26231D]">{pendingCount}</span>
        </div>
      </div>

      {/* Action Bar */}
      <DataCard>
        <div className="p-4 md:p-5 flex flex-col md:flex-row gap-4 items-end justify-between bg-white">
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <div>
              <label className="text-[10.5px] font-semibold tracking-[0.1em] uppercase text-[#6E6656] block mb-1.5">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-10 bg-white border border-[#D0C8B4] rounded-sm px-3 text-sm text-[#26231D] focus:outline-none focus:border-[#B8763F] focus:ring-1 focus:ring-[#B8763F]/20 w-full md:w-40"
              />
            </div>
            <div>
              <label className="text-[10.5px] font-semibold tracking-[0.1em] uppercase text-[#6E6656] block mb-1.5">Shift</label>
              <select
                value={selectedShiftId}
                onChange={(e) => setSelectedShiftId(e.target.value)}
                className="h-10 bg-white border border-[#D0C8B4] rounded-sm px-3 text-sm text-[#26231D] focus:outline-none focus:border-[#B8763F] focus:ring-1 focus:ring-[#B8763F]/20 w-full md:w-48"
              >
                {shifts.map(sh => (
                  <option key={sh.id} value={sh.id}>{sh.shiftName}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 md:w-64">
              <label className="text-[10.5px] font-semibold tracking-[0.1em] uppercase text-[#6E6656] block mb-1.5">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A8270]" />
                <input
                  type="text"
                  placeholder="Search by name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 bg-white border border-[#D0C8B4] rounded-sm pl-9 pr-3 text-sm text-[#26231D] focus:outline-none focus:border-[#B8763F] focus:ring-1 focus:ring-[#B8763F]/20"
                />
              </div>
            </div>
            <div>
              <label className="text-[10.5px] font-semibold tracking-[0.1em] uppercase text-[#6E6656] block mb-1.5">Filter</label>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A8270]" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="h-10 bg-white border border-[#D0C8B4] rounded-sm pl-9 pr-3 text-sm text-[#26231D] focus:outline-none focus:border-[#B8763F] focus:ring-1 focus:ring-[#B8763F]/20 w-full md:w-40 appearance-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">Pending Only</option>
                  <option value="PRESENT">Present</option>
                  <option value="LATE">Late</option>
                  <option value="ABSENT">Absent</option>
                  <option value="HALF_DAY">Half Day</option>
                  <option value="ON_LEAVE">On Leave</option>
                </select>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={handleBulkMarkPresent} 
            disabled={pendingCount === 0 || loading}
            className="w-full md:w-auto mt-4 md:mt-0"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Mark {pendingCount} Pending as Present
          </Button>
        </div>
      </DataCard>

      {/* Operator Grid */}
      {roster.length === 0 ? (
        <EmptyState 
          title="No operators assigned" 
          description="There are no operators assigned to this shift on the selected date."
        />
      ) : filteredRoster.length === 0 ? (
        <EmptyState 
          title="No operators found" 
          description="Try adjusting your search query or status filter."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {filteredRoster.map((operator) => {
              const record = attendance.find(a => a.operatorId === operator.id);
              const status = record?.status;
              const config = getStatusConfig(status);

              return (
                <motion.div
                  key={operator.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "flex flex-col rounded-sm border p-4 shadow-sm transition-colors",
                    config.bg,
                    config.border
                  )}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shrink-0 border bg-white", config.border)}>
                      <User className={cn("w-6 h-6", config.text)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs font-semibold text-[#8A8270] mb-0.5">{operator.employeeId}</p>
                      <h4 className="font-semibold text-[#1E1B16] truncate text-sm">{operator.name}</h4>
                      <p className="text-xs text-[#6E6656] mt-0.5 truncate">{operator.department}</p>
                    </div>
                    {status && (
                      <div className={cn("shrink-0 px-2 py-1 text-[10px] font-bold uppercase rounded-sm border", config.bg, config.border, config.text)}>
                        {status.replace("_", " ")}
                      </div>
                    )}
                  </div>

                  {/* Status Actions */}
                  <div className="mt-auto grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleMark(operator.id, "PRESENT")}
                      className={cn(
                        "flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-sm border transition-colors",
                        status === "PRESENT" 
                          ? "bg-emerald-600 border-emerald-600 text-white" 
                          : "bg-white border-[#D0C8B4] text-[#26231D] hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700"
                      )}
                    >
                      Present
                    </button>
                    <button
                      onClick={() => handleMark(operator.id, "LATE")}
                      className={cn(
                        "flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-sm border transition-colors",
                        status === "LATE" 
                          ? "bg-amber-500 border-amber-500 text-white" 
                          : "bg-white border-[#D0C8B4] text-[#26231D] hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700"
                      )}
                    >
                      Late
                    </button>
                    <button
                      onClick={() => handleMark(operator.id, "ABSENT")}
                      className={cn(
                        "flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-sm border transition-colors",
                        status === "ABSENT" 
                          ? "bg-red-600 border-red-600 text-white" 
                          : "bg-white border-[#D0C8B4] text-[#26231D] hover:bg-red-50 hover:border-red-200 hover:text-red-700"
                      )}
                    >
                      Absent
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                      onClick={() => handleMark(operator.id, "HALF_DAY")}
                      className={cn(
                        "flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold rounded-sm border transition-colors",
                        status === "HALF_DAY" 
                          ? "bg-orange-500 border-orange-500 text-white" 
                          : "bg-white border-[#E0D8C0] text-[#6E6656] hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200"
                      )}
                    >
                      Half Day
                    </button>
                    <button
                      onClick={() => handleMark(operator.id, "ON_LEAVE")}
                      className={cn(
                        "flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold rounded-sm border transition-colors",
                        status === "ON_LEAVE" 
                          ? "bg-blue-600 border-blue-600 text-white" 
                          : "bg-white border-[#E0D8C0] text-[#6E6656] hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
                      )}
                    >
                      On Leave
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
