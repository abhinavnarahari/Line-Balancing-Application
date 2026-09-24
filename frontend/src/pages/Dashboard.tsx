import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Clock, Factory, Layers, BarChart3 as BarChartIcon } from "lucide-react";
import { ordersApi, type Order } from "../features/orders/api";
import { operationsApi, type Operation } from "../features/operations/api";
import { operatorsApi, type Operator } from "../features/operators/api";
import { bulletinsApi, type OperationBulletin } from "../features/bulletins/api";
import { skillApi, type SkillAssessment } from "../features/skill-matrix/api";
import { linesApi, type SewingLine } from "../features/lines/api";
import { linePlanApi, type LinePlan } from "../features/line-balance/api";
import { machinesApi, type Machine } from "../features/machines/api";
import { attendanceApi, type AttendanceRecord } from "../features/attendance/api";
import { shiftsApi, type Shift } from "../features/shifts/api";
import { pieceProductionApi, type OperatorTimesheet24h, type PieceProductionLog } from "../features/production-logs/api";
import { useMasterDataSubscription } from "../utils/masterDataEvents";
import { PlantManagementDashboard } from "../features/dashboards/PlantManagementDashboard";
import { LineLevelDashboard } from "../features/dashboards/LineLevelDashboard";
import { OverallDashboard } from "../features/dashboards/OverallDashboard";

export function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") as "plant" | "line" | "overview") || "overview";
  const [activeTab, setActiveTab] = useState<"plant" | "line" | "overview">(initialTab);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [orders, setOrders] = useState<Order[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [bulletins, setBulletins] = useState<OperationBulletin[]>([]);
  const [skillMatrix, setSkillMatrix] = useState<SkillAssessment[]>([]);
  const [lines, setLines] = useState<SewingLine[]>([]);
  const [linePlans, setLinePlans] = useState<LinePlan[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [timesheetData, setTimesheetData] = useState<OperatorTimesheet24h[]>([]);
  const [pieceLogs, setPieceLogs] = useState<PieceProductionLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "plant" || tab === "line" || tab === "overview") {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tab: "plant" | "line" | "overview") => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Live real-time clock ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadDashboardData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const [
        ordersData,
        operationsData,
        operatorsData,
        bulletinsData,
        skillData,
        linesData,
        plansData,
        machinesData,
        attendanceData,
        shiftsData,
        timesheetRes,
        logsRes,
      ] = await Promise.allSettled([
        ordersApi.getOrders(),
        operationsApi.getOperations(),
        operatorsApi.getOperators(),
        bulletinsApi.getBulletins(),
        skillApi.getCurrentMatrix(),
        linesApi.getLines(true),
        linePlanApi.getAllPlans(),
        machinesApi.getMachines(),
        attendanceApi.getAttendanceByDate(todayStr),
        shiftsApi.getShifts(),
        pieceProductionApi.get24hTimesheet(todayStr),
        pieceProductionApi.getLogs(todayStr),
      ]);

      if (ordersData.status === "fulfilled") setOrders(ordersData.value || []);
      if (operationsData.status === "fulfilled") setOperations(operationsData.value || []);
      if (operatorsData.status === "fulfilled") setOperators(operatorsData.value || []);
      if (bulletinsData.status === "fulfilled") setBulletins(bulletinsData.value || []);
      if (skillData.status === "fulfilled") setSkillMatrix(skillData.value || []);
      if (linesData.status === "fulfilled") setLines(linesData.value || []);
      if (plansData.status === "fulfilled") setLinePlans(plansData.value || []);
      if (machinesData.status === "fulfilled") setMachines(machinesData.value || []);
      if (attendanceData.status === "fulfilled") setAttendance(attendanceData.value || []);
      if (shiftsData.status === "fulfilled") setShifts(shiftsData.value || []);
      if (timesheetRes.status === "fulfilled") setTimesheetData(timesheetRes.value || []);
      if (logsRes.status === "fulfilled") setPieceLogs(logsRes.value || []);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData(true);
  }, [loadDashboardData]);

  // Master Data Real-time Subscription
  useMasterDataSubscription(["all"], () => {
    loadDashboardData(false);
  });

  return (
    <div className="min-h-screen bg-[#F6F1E8] p-4 sm:p-6 lg:p-8 space-y-6 w-full">
      {/* ── Top Level View Switcher ────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-[#E6DDCE] shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5 bg-[#FAF8F5] p-1 rounded-xl border border-[#E6DDCE]">
          <button
            type="button"
            onClick={() => handleTabChange("overview")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
              activeTab === "overview"
                ? "bg-white text-[#9C5B3C] shadow-sm border border-[#E6DDCE]"
                : "text-[#8C7E6E] hover:text-[#221912]"
            }`}
          >
            <BarChartIcon className="w-3.5 h-3.5 text-[#9C5B3C]" />
            <span>Factory Overview Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("plant")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
              activeTab === "plant"
                ? "bg-white text-[#9C5B3C] shadow-sm border border-[#E6DDCE]"
                : "text-[#8C7E6E] hover:text-[#221912]"
            }`}
          >
            <Factory className="w-3.5 h-3.5 text-[#9C5B3C]" />
            <span>Plant Management Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("line")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
              activeTab === "line"
                ? "bg-white text-[#9C5B3C] shadow-sm border border-[#E6DDCE]"
                : "text-[#8C7E6E] hover:text-[#221912]"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#9C5B3C]" />
            <span>Line-Level Operations Dashboard</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 pr-2 text-xs font-mono font-bold text-[#8C7E6E]">
          <Clock className="w-3.5 h-3.5 text-[#9C5B3C]" />
          <span>{currentTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })} IST</span>
        </div>
      </div>

      {activeTab === "plant" && (
        <PlantManagementDashboard
          orders={orders}
          bulletins={bulletins}
          operators={operators}
          skillMatrix={skillMatrix}
          operations={operations}
          lines={lines}
          linePlans={linePlans}
          onRefresh={() => loadDashboardData(true)}
          loading={loading}
        />
      )}

      {activeTab === "line" && (
        <LineLevelDashboard
          lines={lines}
          orders={orders}
          bulletins={bulletins}
          linePlans={linePlans}
          operators={operators}
          shifts={shifts}
          timesheetData={timesheetData}
          pieceLogs={pieceLogs}
          attendance={attendance}
          onRefresh={() => loadDashboardData(true)}
          loading={loading}
        />
      )}

      {activeTab === "overview" && (
        <OverallDashboard
          orders={orders}
          bulletins={bulletins}
          operators={operators}
          skillMatrix={skillMatrix}
          lines={lines}
          linePlans={linePlans}
          machines={machines}
          attendance={attendance}
          shifts={shifts}
          timesheetData={timesheetData}
          pieceLogs={pieceLogs}
          onRefresh={() => loadDashboardData(true)}
          loading={loading}
        />
      )}
    </div>
  );
}
