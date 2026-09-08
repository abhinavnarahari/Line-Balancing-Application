import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Check, X, Clock, Calendar, Search, Fingerprint, History, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader, DataCard, EmptyState, PremiumSelect, type PremiumSelectOption } from "../../components/ui/PremiumUI";
import { Button } from "../../components/ui/Button";

import { attendanceApi, type AttendanceRecord, type AttendanceStatus } from "../../features/attendance/api";
import { operatorsApi, type Operator } from "../../features/operators/api";
import { shiftsApi } from "../../features/shifts/api";
import type { Shift } from "../../features/shifts/types";
import { shiftAssignmentApi, type ShiftAssignment } from "../../features/shift-assignments/api";
import { cn } from "../../utils/cn";

// Utility for status styling
// Utility for status styling
const getStatusBadge = (status?: AttendanceStatus, lateMinutes?: number) => {
  switch (status) {
    case "PRESENT": return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#F3F5F2] text-[#77876F] border border-[#d4decb]"><Check className="w-3 h-3"/> Present</span>;
    case "LATE": return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs">
        <Clock className="w-3 h-3 text-amber-600"/>
        Late {lateMinutes && lateMinutes > 0 ? `(+${lateMinutes}m)` : ""}
      </span>
    );
    case "ABSENT": return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#fff1f2] text-[#be123c] border border-[#fecaca]"><X className="w-3 h-3"/> Absent</span>;
    case "HALF_DAY": return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#fffbeb] text-[#d97706] border border-[#fde68a]"><Clock className="w-3 h-3"/> Half Day</span>;
    case "ON_LEAVE": return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#EFE9DF] text-[#8B5E3C] border border-[#D8C9B8]"><Calendar className="w-3 h-3"/> On Leave</span>;
    default: return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#F6F1E8] text-[#8C7E6E] border border-[#E6DDCE]">Pending</span>;
  }
};

export function AttendancePage() {
  // Filters
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get("employeeId") || "";
  
  const [activeTab, setActiveTab] = useState<"TOOL" | "HISTORY">(initialSearch ? "HISTORY" : "TOOL");
  
  // Base Data State
  const [operators, setOperators] = useState<Operator[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);

  // Roster/Tool State
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [roster, setRoster] = useState<Operator[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [pendingAttendance, setPendingAttendance] = useState<Record<string | number, AttendanceStatus>>({});
  const [customCheckInTimes, setCustomCheckInTimes] = useState<Record<string | number, string>>({});
  const [notificationBanner, setNotificationBanner] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);

  // History State
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  // History Filters
  const [historySearchQuery, setHistorySearchQuery] = useState(initialSearch);

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [shiftFilter, setShiftFilter] = useState<string>("ALL");

  // Pagination
  const [rosterPage, setRosterPage] = useState(1);
  const [rosterPageSize, setRosterPageSize] = useState(25);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(25);

  useEffect(() => {
    setRosterPage(1);
  }, [searchQuery, statusFilter, shiftFilter, date]);

  // Options for PremiumSelect
  const statusOptions: PremiumSelectOption[] = [
    { value: "ALL", label: "All Statuses" },
    { value: "PENDING", label: "Pending Only" },
    { value: "PRESENT", label: "Present" },
    { value: "LATE", label: "Late" },
    { value: "ABSENT", label: "Absent" },
    { value: "HALF_DAY", label: "Half Day" },
    { value: "ON_LEAVE", label: "On Leave" }
  ];

  const shiftOptions: PremiumSelectOption[] = [
    { value: "ALL", label: "All Shifts" },
    ...shifts.map(s => ({ value: String(s.id), label: s.shiftCode }))
  ];

  // Initial Data Load
  useEffect(() => {
    const fetchBase = async () => {
      try {
        const [opData, shiftData, assignData] = await Promise.all([
          operatorsApi.getOperators(),
          shiftsApi.getShifts(true),
          shiftAssignmentApi.getAssignments()
        ]);
        setOperators(opData.filter(o => o.active));
        setShifts(shiftData);
        setAssignments(assignData);
      } catch (err) {
        console.error("Failed to load base data", err);
      }
    };
    fetchBase();
  }, []);

  // Load roster and attendance whenever date changes
  useEffect(() => {
    if (!date || operators.length === 0 || activeTab !== "TOOL") return;
    
    const loadDayData = async () => {
      setLoading(true);
      try {
        const attData = await attendanceApi.getAttendanceForDate(date, "");
        setAttendance(attData);
        setPendingAttendance({}); // clear unsaved on date change
        setCustomCheckInTimes({});
        setRoster(operators); // Start with all active operators
      } finally {
        setLoading(false);
      }
    };
    
    loadDayData();
  }, [date, operators, activeTab]);

  // Load history when tab switches
  useEffect(() => {
    if (activeTab === "HISTORY") {
      const loadHistory = async () => {
        setHistoryLoading(true);
        try {
          const histData = await attendanceApi.getHistory();
          setHistory(histData);
        } catch (err) {
          console.error(err);
        } finally {
          setHistoryLoading(false);
        }
      };
      loadHistory();
    }
  }, [activeTab]);

  const handleMark = (operatorId: string | number, status: AttendanceStatus, customTime?: string) => {
    setPendingAttendance(prev => ({ ...prev, [operatorId]: status }));
    
    // Find assigned shift
    const assignedShiftId = assignments.find(a => 
      String(a.operatorId) === String(operatorId) && 
      a.effectiveFrom <= date && 
      (!a.effectiveTo || a.effectiveTo >= date)
    )?.shiftId || (shiftFilter !== "ALL" ? shiftFilter : 1);
    
    const shiftObj = shifts.find(s => String(s.id) === String(assignedShiftId)) || shifts[0];
    const shiftStart = shiftObj?.startTime || "07:00:00";

    if (customTime) {
      setCustomCheckInTimes(prev => ({ ...prev, [operatorId]: customTime }));
    } else if (status === "LATE") {
      // Default late check-in to 15 minutes past shift start (e.g. 07:15 if shift is 07:00)
      const [sh = 7, sm = 0] = shiftStart.split(":").map(Number);
      const lateM = (sm + 15) % 60;
      const lateH = sh + Math.floor((sm + 15) / 60);
      const timeStr = `${String(lateH).padStart(2, "0")}:${String(lateM).padStart(2, "0")}:00`;
      setCustomCheckInTimes(prev => ({ ...prev, [operatorId]: timeStr }));
    } else if (status === "PRESENT") {
      setCustomCheckInTimes(prev => ({ ...prev, [operatorId]: shiftStart.slice(0, 5) + ":00" }));
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(pendingAttendance).length === 0) return;
    
    setLoading(true);
    let lateCount = 0;
    try {
      for (const [operatorId, status] of Object.entries(pendingAttendance)) {
        const assignedShiftId = assignments.find(a => 
          String(a.operatorId) === String(operatorId) && 
          a.effectiveFrom <= date && 
          (!a.effectiveTo || a.effectiveTo >= date)
        )?.shiftId || (shiftFilter !== "ALL" ? shiftFilter : 1);

        const checkInTime = customCheckInTimes[operatorId];
        if (status === "LATE") lateCount++;

        await attendanceApi.markAttendance({
          attendanceDate: date,
          shiftId: assignedShiftId || 1,
          operatorId,
          status,
          checkInTime: status === "ABSENT" || status === "ON_LEAVE" ? undefined : checkInTime
        });
      }
      setPendingAttendance({});
      setCustomCheckInTimes({});
      const attData = await attendanceApi.getAttendanceForDate(date, "");
      setAttendance(attData);

      if (lateCount > 0) {
        setNotificationBanner(`✓ Saved. Manager notification dispatched for ${lateCount} late check-in(s).`);
        setTimeout(() => setNotificationBanner(null), 5000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateSync = async () => {
    if (roster.length === 0) return;
    setSyncing(true);
    
    try {
      // Pick 5 random operators
      const shuffled = [...roster].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, Math.min(5, roster.length));
      
      const syncRequests = selected.map(op => {
        // Find shift start time
        const assignedShiftId = assignments.find(a => String(a.operatorId) === String(op.id))?.shiftId || 1;
        const shiftObj = shifts.find(s => String(s.id) === String(assignedShiftId)) || shifts[0];
        const [sh = 7, sm = 0] = (shiftObj?.startTime || "07:00").split(":").map(Number);

        // 50% chance of on-time (7:00), 50% chance of late (7:15 to 7:45)
        const isLate = Math.random() > 0.5;
        const lateMinutes = isLate ? 15 + Math.floor(Math.random() * 30) : 0;
        const totalMinutes = sm + lateMinutes;
        const finalHour = sh + Math.floor(totalMinutes / 60);
        const finalMin = totalMinutes % 60;
        const timeStr = `${String(finalHour).padStart(2, "0")}:${String(finalMin).padStart(2, "0")}:00`;
        
        return {
          employeeId: op.employeeId,
          attendanceDate: date,
          checkInTime: timeStr
        };
      });
      
      await attendanceApi.syncBiometric(syncRequests);
      
      // Reload data
      const attData = await attendanceApi.getAttendanceForDate(date, "");
      setAttendance(attData);
      setNotificationBanner("✓ Biometric punch synced. Late check-ins automatically triggered Manager Alerts.");
      setTimeout(() => setNotificationBanner(null), 6000);
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  // Metrics
  const getCombinedStatus = (operatorId: string | number) => pendingAttendance[operatorId] || attendance.find(a => String(a.operatorId) === String(operatorId))?.status;
  
  // Filtered Roster
  const filteredRoster = useMemo(() => {
    return roster.filter(op => {
      // 1. Shift Filter
      if (shiftFilter !== "ALL") {
        // Check if operator is assigned to this shift on this date
        const hasAssignment = assignments.some(a => 
          String(a.operatorId) === String(op.id) && 
          String(a.shiftId) === String(shiftFilter) &&
          a.effectiveFrom <= date &&
          (!a.effectiveTo || a.effectiveTo >= date)
        );
        
        // Also include if they have a raw attendance record for this shift today (in case of manual overrides without assignment)
        const hasAttendance = attendance.some(a => 
          String(a.operatorId) === String(op.id) && 
          String(a.shiftId) === String(shiftFilter)
        );
        
        if (!hasAssignment && !hasAttendance) return false;
      }

      // 2. Search Filter
      const query = searchQuery.toLowerCase();
      if (query && !op.name.toLowerCase().includes(query) && !op.employeeId.toLowerCase().includes(query)) {
        return false;
      }

      // 3. Status Filter
      if (statusFilter !== "ALL") {
        const status = getCombinedStatus(op.id);
        if (statusFilter === "PENDING" && status) return false;
        if (statusFilter !== "PENDING" && status !== statusFilter) return false;
      }
      return true;
    });
  }, [roster, attendance, pendingAttendance, searchQuery, statusFilter, shiftFilter, assignments, date]);

  // Calculate metrics based on the FILTERED roster (so managers see metrics for the selected shift)
  const presentCount = filteredRoster.filter(op => getCombinedStatus(op.id) === "PRESENT").length;
  const lateCount = filteredRoster.filter(op => getCombinedStatus(op.id) === "LATE").length;
  const absentCount = filteredRoster.filter(op => getCombinedStatus(op.id) === "ABSENT").length;
  const halfDayCount = filteredRoster.filter(op => getCombinedStatus(op.id) === "HALF_DAY").length;
  const leaveCount = filteredRoster.filter(op => getCombinedStatus(op.id) === "ON_LEAVE").length;
  const pendingCount = filteredRoster.length - (presentCount + lateCount + absentCount + halfDayCount + leaveCount);
  const hasUnsavedChanges = Object.keys(pendingAttendance).length > 0;

  // Pagination for Roster
  const paginatedRoster = useMemo(() => {
    const start = (rosterPage - 1) * rosterPageSize;
    return filteredRoster.slice(start, start + rosterPageSize);
  }, [filteredRoster, rosterPage, rosterPageSize]);
  const rosterTotalPages = Math.ceil(filteredRoster.length / rosterPageSize);

  return (
    <div className="space-y-6 w-full p-6 lg:p-8">
      <PageHeader
        eyebrow="Workforce"
        title="Attendance Dashboard"
        description="Monitor daily biometric punches and view historical attendance logs."
        action={
          activeTab === "TOOL" && (
            <Button onClick={handleSimulateSync} disabled={syncing} size="md">
              <Fingerprint className={`h-4 w-4 mr-1.5 ${syncing ? 'animate-pulse' : ''}`} />
              {syncing ? 'Syncing...' : 'Simulate Biometric Sync'}
            </Button>
          )
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E2E8F0]">
        <button
          onClick={() => setActiveTab("TOOL")}
          className={cn(
            "px-4 py-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors",
            activeTab === "TOOL" 
              ? "border-[#2563EB] text-[#0F172A]" 
              : "border-transparent text-[#64748B] hover:text-[#475569] hover:border-[#E2E8F0]"
          )}
        >
          <CalendarDays className="w-4 h-4" />
          Daily Roster
        </button>
        <button
          onClick={() => setActiveTab("HISTORY")}
          className={cn(
            "px-4 py-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors",
            activeTab === "HISTORY" 
              ? "border-[#2563EB] text-[#0F172A]" 
              : "border-transparent text-[#64748B] hover:text-[#475569] hover:border-[#E2E8F0]"
          )}
        >
          <History className="w-4 h-4" />
          Attendance History
        </button>
      </div>

      {activeTab === "TOOL" ? (
        <>
          {/* KPI Ribbon */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="bg-white border border-[#F1F5F9] rounded-sm p-4 flex flex-col justify-center items-center shadow-sm">
              <span className="text-[10px] uppercase font-semibold text-[#64748B] tracking-wider mb-1">Total Roster</span>
              <span className="text-2xl font-bold text-[#0F172A]">{filteredRoster.length}</span>
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
            <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-sm p-4 flex flex-col justify-center items-center shadow-sm">
              <span className="text-[10px] uppercase font-semibold text-[#475569] tracking-wider mb-1">Pending</span>
              <span className="text-2xl font-bold text-[#0F172A]">{pendingCount}</span>
            </div>
          </div>

          {/* Action Bar */}
          <DataCard className="overflow-visible z-10 relative">
            <div className="p-4 md:p-5 flex flex-col md:flex-row gap-4 items-end justify-between bg-white rounded-2xl">
              <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                <div className="w-full md:w-36">
                  <label className="text-[10.5px] font-semibold tracking-[0.1em] uppercase text-[#475569] block mb-1.5">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="h-10 bg-white border border-[#E2E8F0] rounded-sm px-3 text-sm text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20 w-full"
                  />
                </div>
                
                <div className="w-full md:w-40">
                  <label className="text-[10.5px] font-semibold tracking-[0.1em] uppercase text-[#475569] block mb-1.5">Shift</label>
                  <PremiumSelect
                    value={shiftFilter}
                    onChange={setShiftFilter}
                    options={shiftOptions}
                  />
                </div>

                <div className="w-full md:w-40">
                  <label className="text-[10.5px] font-semibold tracking-[0.1em] uppercase text-[#475569] block mb-1.5">Status</label>
                  <PremiumSelect
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={statusOptions}
                  />
                </div>

                <div className="flex-1 md:w-56">
                  <label className="text-[10.5px] font-semibold tracking-[0.1em] uppercase text-[#475569] block mb-1.5">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
                    <input
                      type="text"
                      placeholder="Name or ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-10 bg-white border border-[#E2E8F0] rounded-sm pl-9 pr-3 text-sm text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-2 w-full md:w-auto mt-4 md:mt-0 shrink-0">
                <Button 
                  onClick={handleSubmit} 
                  disabled={!hasUnsavedChanges || loading}
                  className="w-full"
                >
                  Save Overrides {hasUnsavedChanges ? `(${Object.keys(pendingAttendance).length})` : ''}
                </Button>
              </div>
            </div>
          </DataCard>

          {/* Manager Notification Toast Banner */}
          {notificationBanner && (
            <div className="p-3.5 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl flex items-center justify-between shadow-2xs animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2.5 text-xs font-bold">
                <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                <span>{notificationBanner}</span>
              </div>
              <button
                type="button"
                onClick={() => setNotificationBanner(null)}
                className="text-amber-700 hover:text-amber-950 p-1 rounded-md hover:bg-amber-100/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Table View */}
          {loading && roster.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center space-y-3">
                <div className="w-8 h-8 border-4 border-[#DBEAFE] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-[#64748B]">Loading roster data...</p>
              </div>
            </div>
          ) : roster.length === 0 ? (
            <EmptyState title="No active operators" description="There are no active operators in the system." />
          ) : filteredRoster.length === 0 ? (
            <EmptyState title="No operators found" description="Try adjusting your search query or status filter." />
          ) : (
            <DataCard>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#FFFFFF] border-b border-[#E2E8F0]">
                      <th className="py-3 px-4 text-[10px] font-bold tracking-wider text-[#64748B] uppercase">Employee ID</th>
                      <th className="py-3 px-4 text-[10px] font-bold tracking-wider text-[#64748B] uppercase">Name</th>
                      <th className="py-3 px-4 text-[10px] font-bold tracking-wider text-[#64748B] uppercase">Check In</th>
                      <th className="py-3 px-4 text-[10px] font-bold tracking-wider text-[#64748B] uppercase">Check Out</th>
                      <th className="py-3 px-4 text-[10px] font-bold tracking-wider text-[#64748B] uppercase">Status</th>
                      <th className="py-3 px-4 text-[10px] font-bold tracking-wider text-[#64748B] uppercase text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {paginatedRoster.map((operator) => {
                      const status = getCombinedStatus(operator.id);
                      const isUnsaved = !!pendingAttendance[operator.id];
                      const attRecord = attendance.find(a => String(a.operatorId) === String(operator.id));
                      const isLate = status === "LATE";

                      return (
                        <tr key={operator.id} className={cn("hover:bg-[#FFFFFF]/50 transition-colors", isUnsaved && "bg-orange-50/30", isLate && "bg-amber-50/20")}>
                          <td className="py-3 px-4">
                            <span className="font-mono text-xs font-medium text-[#475569]">{operator.employeeId}</span>
                            {isUnsaved && <span className="ml-2 w-2 h-2 inline-block rounded-full bg-[#2563EB] animate-pulse" title="Unsaved Change"></span>}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-[#0F172A] text-sm">{operator.name}</div>
                            <div className="text-[11px] text-[#64748B]">{operator.department}</div>
                          </td>
                          <td className="py-3 px-4">
                            {attRecord?.checkInTime ? (
                              <div className="flex items-center gap-1.5 font-mono text-xs">
                                <span className={isLate ? "text-amber-800 font-bold" : "text-[#0F172A]"}>
                                  {attRecord.checkInTime.slice(0, 5)}
                                </span>
                                {isLate && (
                                  <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200">
                                    +{attRecord.lateMinutes || 15}m
                                  </span>
                                )}
                              </div>
                            ) : customCheckInTimes[operator.id] && status !== "ABSENT" && status !== "ON_LEAVE" ? (
                              <div className="flex items-center gap-1.5 font-mono text-xs">
                                <span className="text-blue-700 font-bold">{customCheckInTimes[operator.id].slice(0, 5)}</span>
                                <span className="text-[10px] text-slate-400 font-sans">(pending)</span>
                              </div>
                            ) : (
                              <span className="font-mono text-xs text-slate-400">--:--</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono text-xs text-[#0F172A]">{attRecord?.checkOutTime ? attRecord.checkOutTime.slice(0, 5) : '--:--'}</span>
                          </td>
                          <td className="py-3 px-4">
                            {getStatusBadge(status, attRecord?.lateMinutes)}
                          </td>
                          <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                            <button
                              onClick={() => handleMark(operator.id, "PRESENT")}
                              className={cn(
                                "px-2.5 py-1 text-[11px] font-semibold rounded-sm border transition-colors",
                                status === "PRESENT" ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white border-[#E2E8F0] text-[#475569] hover:bg-emerald-50 hover:text-emerald-700"
                              )}
                              title="Mark Present on-time"
                            >
                              P
                            </button>
                            <button
                              onClick={() => handleMark(operator.id, "LATE")}
                              className={cn(
                                "px-2.5 py-1 text-[11px] font-semibold rounded-sm border transition-colors",
                                status === "LATE" ? "bg-amber-500 border-amber-500 text-white" : "bg-white border-[#E2E8F0] text-[#475569] hover:bg-amber-50 hover:text-amber-700"
                              )}
                              title="Mark Late Check-in (triggers Manager Alert)"
                            >
                              L
                            </button>
                            <button
                              onClick={() => handleMark(operator.id, "ABSENT")}
                              className={cn(
                                "px-2.5 py-1 text-[11px] font-semibold rounded-sm border transition-colors",
                                status === "ABSENT" ? "bg-red-600 border-red-600 text-white" : "bg-white border-[#E2E8F0] text-[#475569] hover:bg-red-50 hover:text-red-700"
                              )}
                              title="Mark Absent"
                            >
                              A
                            </button>
                            <button
                              onClick={() => handleMark(operator.id, "ON_LEAVE")}
                              className={cn(
                                "px-2.5 py-1 text-[11px] font-semibold rounded-sm border transition-colors",
                                status === "ON_LEAVE" ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-[#E2E8F0] text-[#475569] hover:bg-blue-50 hover:text-blue-700"
                              )}
                              title="Mark On Leave"
                            >
                              LV
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-[#F1F5F9] rounded-b-2xl">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-semibold tracking-[0.1em] text-[#64748B] uppercase">Rows per page:</span>
                  <select 
                    value={rosterPageSize} 
                    onChange={(e) => { setRosterPageSize(Number(e.target.value)); setRosterPage(1); }}
                    className="text-xs bg-white border border-[#E2E8F0] rounded-sm h-7 px-2 focus:ring-[#2563EB] focus:border-[#2563EB] text-[#0F172A]"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={150}>150</option>
                  </select>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-medium text-[#64748B]">
                    {filteredRoster.length === 0 ? 0 : (rosterPage - 1) * rosterPageSize + 1}-{Math.min(filteredRoster.length, rosterPage * rosterPageSize)} of {filteredRoster.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" onClick={() => setRosterPage(p => Math.max(1, p - 1))} disabled={rosterPage === 1} className="h-7 w-7 p-0 flex items-center justify-center"><ChevronLeft className="w-4 h-4" /></Button>
                    <Button variant="outline" size="sm" onClick={() => setRosterPage(p => Math.min(rosterTotalPages, p + 1))} disabled={rosterPage === rosterTotalPages || rosterTotalPages === 0} className="h-7 w-7 p-0 flex items-center justify-center"><ChevronRight className="w-4 h-4" /></Button>
                  </div>
                </div>
              </div>
            </DataCard>
          )}
        </>
      ) : (
        /* History Tab */
        <DataCard>
          <div className="p-4 md:p-5 flex flex-col md:flex-row gap-4 items-center justify-between border-b border-[#E2E8F0] bg-white">
            <h3 className="font-semibold text-[#0F172A] text-sm">Recent Attendance Records</h3>
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
                <input
                  type="text"
                  placeholder="Search Name or ID..."
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  className="w-full h-9 bg-white border border-[#E2E8F0] rounded-sm pl-9 pr-3 text-sm text-[#0F172A] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20"
                />
              </div>
              <Button variant="outline" size="sm" onClick={() => setHistoryLoading(true)}>
                Refresh
              </Button>
            </div>
          </div>
          {historyLoading ? (
             <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-[#DBEAFE] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : history.filter(h => !historySearchQuery || (h.operatorName && h.operatorName.toLowerCase().includes(historySearchQuery.toLowerCase())) || (h.employeeId && h.employeeId.toLowerCase().includes(historySearchQuery.toLowerCase()))).length === 0 ? (
            <EmptyState title="No historical records found" description="Try adjusting your search query." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FFFFFF] border-b border-[#E2E8F0]">
                    <th className="py-3 px-4 text-[10px] font-bold tracking-wider text-[#64748B] uppercase">Date</th>
                    <th className="py-3 px-4 text-[10px] font-bold tracking-wider text-[#64748B] uppercase">Employee ID</th>
                    <th className="py-3 px-4 text-[10px] font-bold tracking-wider text-[#64748B] uppercase">Name</th>
                    <th className="py-3 px-4 text-[10px] font-bold tracking-wider text-[#64748B] uppercase">Status</th>
                    <th className="py-3 px-4 text-[10px] font-bold tracking-wider text-[#64748B] uppercase">Check In</th>
                    <th className="py-3 px-4 text-[10px] font-bold tracking-wider text-[#64748B] uppercase">Check Out</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {history.filter(h => !historySearchQuery || (h.operatorName && h.operatorName.toLowerCase().includes(historySearchQuery.toLowerCase())) || (h.employeeId && h.employeeId.toLowerCase().includes(historySearchQuery.toLowerCase()))).slice((historyPage - 1) * historyPageSize, historyPage * historyPageSize).map((record) => {
                    const isLate = record.status === "LATE";
                    return (
                      <tr key={record.id} className={cn("hover:bg-[#FFFFFF]/50 transition-colors", isLate && "bg-amber-50/20")}>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-sm text-[#0F172A]">{record.attendanceDate}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-xs text-[#475569]">{record.employeeId || `ID: ${record.operatorId}`}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm font-medium text-[#0F172A]">{record.operatorName || 'Unknown'}</span>
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(record.status, record.lateMinutes)}
                        </td>
                        <td className="py-3 px-4">
                          {record.checkInTime ? (
                            <div className="flex items-center gap-1.5 font-mono text-xs">
                              <span className={isLate ? "text-amber-800 font-bold" : "text-[#475569]"}>
                                {record.checkInTime.slice(0, 5)}
                              </span>
                              {isLate && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200">
                                  +{record.lateMinutes || 15}m
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="font-mono text-xs text-slate-400">--:--</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-xs text-[#475569]">{record.checkOutTime ? record.checkOutTime.slice(0, 5) : '--:--'}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-[#F1F5F9] rounded-b-2xl">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-semibold tracking-[0.1em] text-[#64748B] uppercase">Rows per page:</span>
                  <select 
                    value={historyPageSize} 
                    onChange={(e) => { setHistoryPageSize(Number(e.target.value)); setHistoryPage(1); }}
                    className="text-xs bg-white border border-[#E2E8F0] rounded-sm h-7 px-2 focus:ring-[#2563EB] focus:border-[#2563EB] text-[#0F172A]"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={150}>150</option>
                  </select>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-medium text-[#64748B]">
                    {(() => {
                      const filteredHistory = history.filter(h => !historySearchQuery || (h.operatorName && h.operatorName.toLowerCase().includes(historySearchQuery.toLowerCase())) || (h.employeeId && h.employeeId.toLowerCase().includes(historySearchQuery.toLowerCase())));
                      if (filteredHistory.length === 0) return 0;
                      return `${(historyPage - 1) * historyPageSize + 1}-${Math.min(filteredHistory.length, historyPage * historyPageSize)} of ${filteredHistory.length}`;
                    })()}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" onClick={() => setHistoryPage(p => Math.max(1, p - 1))} disabled={historyPage === 1} className="h-7 w-7 p-0 flex items-center justify-center"><ChevronLeft className="w-4 h-4" /></Button>
                    <Button variant="outline" size="sm" onClick={() => {
                      const filteredHistory = history.filter(h => !historySearchQuery || (h.operatorName && h.operatorName.toLowerCase().includes(historySearchQuery.toLowerCase())) || (h.employeeId && h.employeeId.toLowerCase().includes(historySearchQuery.toLowerCase())));
                      setHistoryPage(p => Math.min(Math.ceil(filteredHistory.length / historyPageSize), p + 1));
                    }} disabled={historyPage === Math.ceil(history.filter(h => !historySearchQuery || (h.operatorName && h.operatorName.toLowerCase().includes(historySearchQuery.toLowerCase())) || (h.employeeId && h.employeeId.toLowerCase().includes(historySearchQuery.toLowerCase()))).length / historyPageSize) || Math.ceil(history.filter(h => !historySearchQuery || (h.operatorName && h.operatorName.toLowerCase().includes(historySearchQuery.toLowerCase())) || (h.employeeId && h.employeeId.toLowerCase().includes(historySearchQuery.toLowerCase()))).length / historyPageSize) === 0} className="h-7 w-7 p-0 flex items-center justify-center"><ChevronRight className="w-4 h-4" /></Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DataCard>
      )}
    </div>
  );
}
