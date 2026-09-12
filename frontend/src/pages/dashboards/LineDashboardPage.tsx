import { useState, useEffect } from "react";
import { linesApi, type SewingLine } from "../../features/lines/api";
import { ordersApi, type Order } from "../../features/orders/api";
import { bulletinsApi, type OperationBulletin } from "../../features/bulletins/api";
import { linePlanApi, type LinePlan } from "../../features/line-balance/api";
import { operatorsApi, type Operator } from "../../features/operators/api";
import { LineLevelDashboard } from "../../features/dashboards/LineLevelDashboard";

export function LineDashboardPage() {
  const [lines, setLines] = useState<SewingLine[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [bulletins, setBulletins] = useState<OperationBulletin[]>([]);
  const [linePlans, setLinePlans] = useState<LinePlan[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [lns, ords, bulls, plans, oprs] = await Promise.allSettled([
        linesApi.getLines(true),
        ordersApi.getOrders(),
        bulletinsApi.getBulletins(),
        linePlanApi.getAllPlans(),
        operatorsApi.getOperators(),
      ]);

      if (lns.status === "fulfilled") setLines(lns.value || []);
      if (ords.status === "fulfilled") setOrders(ords.value || []);
      if (bulls.status === "fulfilled") setBulletins(bulls.value || []);
      if (plans.status === "fulfilled") setLinePlans(plans.value || []);
      if (oprs.status === "fulfilled") setOperators(oprs.value || []);
    } catch (err) {
      console.error("Failed to load line dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-[#F6F1E8] p-4 sm:p-6 lg:p-8">
      <LineLevelDashboard
        lines={lines}
        orders={orders}
        bulletins={bulletins}
        linePlans={linePlans}
        operators={operators}
        onRefresh={loadData}
        loading={loading}
      />
    </div>
  );
}
