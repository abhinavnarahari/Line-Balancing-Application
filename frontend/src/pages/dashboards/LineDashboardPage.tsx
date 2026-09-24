import { useState, useEffect, useCallback } from "react";
import { linesApi, type SewingLine } from "../../features/lines/api";
import { ordersApi, type Order } from "../../features/orders/api";
import { bulletinsApi, type OperationBulletin } from "../../features/bulletins/api";
import { linePlanApi, type LinePlan } from "../../features/line-balance/api";
import { operatorsApi, type Operator } from "../../features/operators/api";
import { shiftsApi, type Shift } from "../../features/shifts/api";
import { attendanceApi, type AttendanceRecord } from "../../features/attendance/api";
import {
  pieceProductionApi,
  type OperatorTimesheet24h,
  type PieceProductionLog,
} from "../../features/production-logs/api";
import { useMasterDataSubscription } from "../../utils/masterDataEvents";
import { LineLevelDashboard } from "../../features/dashboards/LineLevelDashboard";

export function LineDashboardPage() {
  const [lines, setLines] = useState<SewingLine[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [bulletins, setBulletins] = useState<OperationBulletin[]>([]);
  const [linePlans, setLinePlans] = useState<LinePlan[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [timesheetData, setTimesheetData] = useState<OperatorTimesheet24h[]>([]);
  const [pieceLogs, setPieceLogs] = useState<PieceProductionLog[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const [lns, ords, bulls, plans, oprs, shfs, tms, logs, att] = await Promise.allSettled([
        linesApi.getLines(true),
        ordersApi.getOrders(),
        bulletinsApi.getBulletins(),
        linePlanApi.getAllPlans(),
        operatorsApi.getOperators(),
        shiftsApi.getShifts(),
        pieceProductionApi.get24hTimesheet(todayStr),
        pieceProductionApi.getLogs(todayStr),
        attendanceApi.getAttendanceByDate(todayStr),
      ]);

      if (lns.status === "fulfilled") setLines(lns.value || []);
      if (ords.status === "fulfilled") setOrders(ords.value || []);
      if (bulls.status === "fulfilled") setBulletins(bulls.value || []);
      if (plans.status === "fulfilled") setLinePlans(plans.value || []);
      if (oprs.status === "fulfilled") setOperators(oprs.value || []);
      if (shfs.status === "fulfilled") setShifts(shfs.value || []);
      if (tms.status === "fulfilled") setTimesheetData(tms.value || []);
      if (logs.status === "fulfilled") setPieceLogs(logs.value || []);
      if (att.status === "fulfilled") setAttendance(att.value || []);
    } catch (err) {
      console.error("Failed to load line dashboard data:", err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  // Master Data Real-time Sync & background refresh
  useMasterDataSubscription(["all"], () => {
    loadData(false);
  });

  return (
    <div className="min-h-screen bg-[#F6F1E8] p-4 sm:p-6 lg:p-8">
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
        onRefresh={() => loadData(true)}
        loading={loading}
      />
    </div>
  );
}
