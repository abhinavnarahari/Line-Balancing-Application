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
const getStatusBadge = (status?: AttendanceStatus) => {
  switch (status) {
    case "PRESENT": return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-sm text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200"><Check className="w-3 h-3"/> Present</span>;
    case "LATE": return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-sm text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200"><Clock className="w-3 h-3"/> Late</span>;
    case "ABSENT": return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-sm text-[10px] font-bold uppercase bg-red-50 text-red-700 border border-red-200"><X className="w-3 h-3"/> Absent</span>;
    case "HALF_DAY": return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-sm text-[10px] font-bold uppercase bg-orange-50 text-orange-700 border border-orange-200"><Clock className="w-3 h-3"/> Half Day</span>;
    case "ON_LEAVE": return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-sm text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200"><Calendar className="w-3 h-3"/> On Leave</span>;
    default: return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-sm text-[10px] font-bold uppercase bg-[#F0EAE0] text-[#475569] border border-[#E6DDCE]">Pending</span>;
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

  const handleMark = (operatorId: string | number, status: AttendanceStatus) => {
    setPendingAttendance(prev => ({ ...prev, [operatorId]: status }));
  };

  const handleSubmit = async () => {
    if (Object.keys(pendingAttendance).length === 0) return;
    
    setLoading(true);
    try {
      for (const [operatorId, status] of Object.entries(pendingAttendance)) {
        await attendanceApi.markAttendance({
          attendanceDate: date,
          shiftId: 1, // Fallback dummy shift for manual override
          operatorId,
          status
        });
      }
      setPendingAttendance({});
      const attData = await attendanceApi.getAttendanceForDate(date, "");
      setAttendance(attData);
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
        const hour = 8 + Math.floor(Math.random() * 2);
        const minute = Math.floor(Math.random() * 60);
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
        
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
      <div className="flex items-center gap-2 border-b border-[#E6DDCE]">
        <button
          onClick={() => setActiveTab("TOOL")}
          className={cn(
            "px-4 py-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors",
            activeTab === "TOOL" 
              ? "border-[#B48259] text-[#221912]" 
              : "border-transparent text-[#8C7E6E] hover:text-[#475569] hover:border-[#E6DDCE]"
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
              ? "border-[#B48259] text-[#221912]" 
              : "border-transparent text-[#8C7E6E] hover:text-[#475569] hover:border-[#E6DDCE]"
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
            <div className="bg-white border border-[#F0EAE0] rounded-sm p-4 flex flex-col justify-center items-center shadow-sm">
              <span className="text-[10px] uppercase font-semibold text-[#8C7E6E] tracking-wider mb-1">Total Roster</span>
              <span className="text-2xl font-bold text-[#221912]">{filteredRoster.length}</span>
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
            <div className="bg-[#FEFCF9] border border-[#E6DDCE] rounded-sm p-4 flex flex-col justify-center items-center shadow-sm">
              <span className="text-[10px] uppercase font-semibold text-[#475569] tracking-wider mb-1">Pending</span>
              <span className="text-2xl font-bold text-[#221912]">{pendingCount}</span>
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
                    className="h-10 bg-white border border-[#E6DDCE] rounded-sm px-3 text-sm text-[#221912] focus:outline-none focus:border-[#B48259] focus:ring-1 focus:ring-[#B48259]/20 w-full"
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
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8C7E6E]" />
                    <input
                      type="text"
                      placeholder="Name or ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-10 bg-white border border-[#E6DDCE] rounded-sm pl-9 pr-3 text-sm text-[#221912] focus:outline-none focus:border-[#B48259] focus:ring-1 focus:ring-[#B48259]/20"
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

          {/* Table View */}
          {loading && roster.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center space-y-3">
                <div className="w-8 h-8 border-4 border-[#FFE5BF] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-[#8C7E6E]">Loading roster data...</p>
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
                    <tr className="bg-[#FEFCF9] border-b border-[#E6DDCE]">
                      <th className="py-3 px-4 text-[10px] font-bold tracking-wider text-[#8C7E6E] uppercase">Employee ID</th>
                      <th className="py-3 px-4 text-[10px] font-bold tracking-wider text-[#8C7E6E] uppercase">Name</th>
                      <th className="py-3 px-4 text-[10px] font-bold tracking-wider text-[#8C7E6E] uppercase">Check In</th>
                      <th className="py-3 px-4 text-[10px] font-bold tracking-wider text-[#8C7E6E] uppercase">Check Out</th>
                      <th className="py-3 px-4 text-[10px] font-bold tracking-wider text-[#8C7E6E] uppercase">Status</th>
                      <th className="py-3 px-4 text-[10px] font-bold tracking-wider text-[#8C7E6E] uppercase text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EAE0]">
                    {paginatedRoster.map((operator) => {
                      const status = getCombinedStatus(operator.id);
                      const isUnsaved = !!pendingAttendance[operator.id];
                      const attRecord = attendance.find(a => String(a.operatorId) === String(operator.id));

                      return (
                        <tr key={operator.id} className={cn("hover:bg-[#FEFCF9]/50 transition-colors", isUnsaved && "bg-orange-50/30")}>
                          <td className="py-3 px-4">
                            <span className="font-mono text-xs font-medium text-[#475569]">{operator.employeeId}</span>
                            {isUnsaved && <span className="ml-2 w-2 h-2 inline-block rounded-full bg-[#B48259] animate-pulse" title="Unsaved Change"></span>}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-[#221912] text-sm">{operator.name}</div>
                            <div className="text-[11px] text-[#8C7E6E]">{operator.department}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono text-xs text-[#221912]">{attRecord?.checkInTime || '--:--:--'}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono text-xs text-[#221912]">{attRecord?.checkOutTime || '--:--:--'}</span>
                          </td>
                          <td className="py-3 px-4">
                            {getStatusBadge(status)}
                          </td>
                          <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                            <button
                              onClick={() => handleMark(operator.id, "PRESENT")}
                              className={cn(
                                "px-2.5 py-1 text-[11px] font-semibold rounded-sm border transition-colors",
                                status === "PRESENT" ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white border-[#E6DDCE] text-[#475569] hover:bg-emerald-50 hover:text-emerald-700"
                              )}
                            >
                              P
                            </button>
                            <button
                              onClick={() => handleMark(operator.id, "LATE")}
                              className={cn(
                                "px-2.5 py-1 text-[11px] font-semibold rounded-sm border transition-colors",
                                status === "LATE" ? "bg-amber-500 border-amber-500 text-white" : "bg-white border-[#E6DDCE] text-[#475569] hover:bg-amber-50 hover:text-amber-700"
                              )}
                            >
                              L
                            </button>
                            <button
                              onClick={() => handleMark(operator.id, "ABSENT")}
                              className={cn(
                                "px-2.5 py-1 text-[11px] font-semibold rounded-sm border transition-colors",
                                status === "ABSENT" ? "bg-red-600 border-red-600 text-white" : "bg-white border-[#E6DDCE] text-[#475569] hover:bg-red-50 hover:text-red-700"
                              )}
                            >
                              A
                            </button>
                            <button
                              onClick={() => handleMark(operator.id, "ON_LEAVE")}
                              className={cn(
                                "px-2.5 py-1 text-[11px] font-semibold rounded-sm border transition-colors",
                                status === "ON_LEAVE" ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-[#E6DDCE] text-[#475569] hover:bg-blue-50 hover:text-blue-700"
                              )}
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
              
              <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-[#F0EAE0] rounded-b-2xl">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-semibold tracking-[0.1em] text-[#8C7E6E] uppercase">Rows per page:</span>
                  <select 
                    value={rosterPageSize} 
                    onChange={(e) => { setRosterPageSize(Number(e.target.value)); setRosterPage(1); }}
                    className="text-xs bg-white border border-[#E6DDCE] rounded-sm h-7 px-2 focus:ring-[#B48259] focus:border-[#B48259] text-[#221912]"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={150}>150</option>
                  </select>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-medium text-[#8C7E6E]">
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
          <div className="p-4 md:p-5 flex flex-col md:flex-row gap-4 items-center justify-between border-b border-[#E6DDCE] bg-white">
            <h3 className="font-semibold text-[#221912] text-sm">Recent Attendance Records</h3>
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8C7E6E]" />
                <input
                  type="text"
                  placeholder="Search Name or ID..."
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  className="w-full h-9 bg-white border border-[#E6DDCE] rounded-sm pl-9 pr-3 text-sm text-[#221912] focus:outline-none focus:border-[#B48259] focus:ring-1 focus:ring-[#B48259]/20"
                />
              </div>
              <Button variant="outline" size="sm" onClick={() => setHistoryLoading(true)}>
                Refresh
              </Button>
            </div>
          </div>
          {historyLoading ? (
             <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-[#FFE5BF] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : history.filter(h => !historySearchQuery || (h.operatorName && h.operatorName.toLowerCase().includes(historySearchQuery.toLowerCase())) || (h.employeeId && h.employeeId.toLowerCase().includes(historySearchQuery.toLowerCase()))).length === 0 ? (
            <EmptyState title="No historical records found" description="Try adjusting your search query." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FEFCF9] border-b border-[#E6DDCE]">
                    <th className="py-3 px-4 text-[10px] font-bold tracking-wider text-[#8C7E6E] uppercase">Date</th>
                    <th className="py-3 px-4 text-[10px] font-bold tracking-wider text-[#8C7E6E] uppercase">Employee ID</th>
                    <th className="py-3 px-4 text-[10px] font-bold tracking-wider text-[#8C7E6E] uppercase">Name</th>
                    <th className="py-3 px-4 text-[10px] font-bold tracking-wider text-[#8C7E6E] uppercase">Status</th>
                    <th className="py-3 px-4 text-[10px] font-bold tracking-wider text-[#8C7E6E] uppercase">Check In</th>
                    <th className="py-3 px-4 text-[10px] font-bold tracking-wider text-[#8C7E6E] uppercase">Check Out</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EAE0]">
                  {history.filter(h => !historySearchQuery || (h.operatorName && h.operatorName.toLowerCase().includes(historySearchQuery.toLowerCase())) || (h.employeeId && h.employeeId.toLowerCase().includes(historySearchQuery.toLowerCase()))).slice((historyPage - 1) * historyPageSize, historyPage * historyPageSize).map((record) => (
                    <tr key={record.id} className="hover:bg-[#FEFCF9]/50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-semibold text-sm text-[#221912]">{record.attendanceDate}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs text-[#475569]">{record.employeeId || `ID: ${record.operatorId}`}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium text-[#221912]">{record.operatorName || 'Unknown'}</span>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(record.status)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs text-[#475569]">{record.checkInTime || '--:--:--'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs text-[#475569]">{record.checkOutTime || '--:--:--'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-[#F0EAE0] rounded-b-2xl">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-semibold tracking-[0.1em] text-[#8C7E6E] uppercase">Rows per page:</span>
                  <select 
                    value={historyPageSize} 
                    onChange={(e) => { setHistoryPageSize(Number(e.target.value)); setHistoryPage(1); }}
                    className="text-xs bg-white border border-[#E6DDCE] rounded-sm h-7 px-2 focus:ring-[#B48259] focus:border-[#B48259] text-[#221912]"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={150}>150</option>
                  </select>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-medium text-[#8C7E6E]">
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
