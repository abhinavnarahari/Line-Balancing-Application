import { useState, useEffect, useCallback } from "react";
import { ordersApi, type Order } from "../../features/orders/api";
import { bulletinsApi, type OperationBulletin } from "../../features/bulletins/api";
import { operatorsApi, type Operator } from "../../features/operators/api";
import { skillApi, type SkillAssessment } from "../../features/skill-matrix/api";
import { linesApi, type SewingLine } from "../../features/lines/api";
import { linePlanApi, type LinePlan } from "../../features/line-balance/api";
import { machinesApi, type Machine } from "../../features/machines/api";
import { attendanceApi, type AttendanceRecord } from "../../features/attendance/api";
import { shiftsApi, type Shift } from "../../features/shifts/api";
import { pieceProductionApi, type OperatorTimesheet24h, type PieceProductionLog } from "../../features/production-logs/api";
import { useMasterDataSubscription } from "../../utils/masterDataEvents";
import { OverallDashboard } from "../../features/dashboards/OverallDashboard";

/**
 * OverallDashboardPage — standalone route at /overall-dashboard and /
 *
 * Fetches all required manufacturing datasets independently and renders the
 * OverallDashboard executive command center with real-time sync.
 */
export function OverallDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [bulletins, setBulletins] = useState<OperationBulletin[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [skillMatrix, setSkillMatrix] = useState<SkillAssessment[]>([]);
  const [lines, setLines] = useState<SewingLine[]>([]);
  const [linePlans, setLinePlans] = useState<LinePlan[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [timesheetData, setTimesheetData] = useState<OperatorTimesheet24h[]>([]);
  const [pieceLogs, setPieceLogs] = useState<PieceProductionLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const [ords, bulls, oprs, skills, lns, plans, machs, atts, shfts, tsheets, logs] =
        await Promise.allSettled([
          ordersApi.getOrders(),
          bulletinsApi.getBulletins(),
          operatorsApi.getOperators(),
          skillApi.getCurrentMatrix(),
          linesApi.getLines(true),
          linePlanApi.getAllPlans(),
          machinesApi.getMachines(),
          attendanceApi.getAttendanceByDate(todayStr),
          shiftsApi.getShifts(),
          pieceProductionApi.get24hTimesheet(todayStr),
          pieceProductionApi.getLogs(todayStr),
        ]);

      if (ords.status === "fulfilled") setOrders(ords.value || []);
      if (bulls.status === "fulfilled") setBulletins(bulls.value || []);
      if (oprs.status === "fulfilled") setOperators(oprs.value || []);
      if (skills.status === "fulfilled") setSkillMatrix(skills.value || []);
      if (lns.status === "fulfilled") setLines(lns.value || []);
      if (plans.status === "fulfilled") setLinePlans(plans.value || []);
      if (machs.status === "fulfilled") setMachines(machs.value || []);
      if (atts.status === "fulfilled") setAttendance(atts.value || []);
      if (shfts.status === "fulfilled") setShifts(shfts.value || []);
      if (tsheets.status === "fulfilled") setTimesheetData(tsheets.value || []);
      if (logs.status === "fulfilled") setPieceLogs(logs.value || []);
    } catch (err) {
      console.error("Failed to load overall dashboard data:", err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  // Real-time Master Data Sync
  useMasterDataSubscription(["all"], () => {
    loadData(false);
  });

  // Background Live Piece & Status Polling (every 15s)
  useEffect(() => {
    const interval = setInterval(() => {
      loadData(false);
    }, 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  return (
    <div className="min-h-screen bg-[#F6F1E8] p-4 sm:p-6 lg:p-8">
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
        onRefresh={() => loadData(true)}
        loading={loading}
      />
    </div>
  );
}
