import { useState, useEffect } from "react";
import { ordersApi, type Order } from "../../features/orders/api";
import { bulletinsApi, type OperationBulletin } from "../../features/bulletins/api";
import { operatorsApi, type Operator } from "../../features/operators/api";
import { skillApi, type SkillAssessment } from "../../features/skill-matrix/api";
import { linesApi, type SewingLine } from "../../features/lines/api";
import { linePlanApi, type LinePlan } from "../../features/line-balance/api";
import { OverallDashboard } from "../../features/dashboards/OverallDashboard";

/**
 * OverallDashboardPage — standalone route at /overall-dashboard
 *
 * Fetches all required data independently and renders the
 * OverallDashboard executive command center. This allows the dashboard
 * to be accessible directly without going through the tab switcher.
 */
export function OverallDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [bulletins, setBulletins] = useState<OperationBulletin[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [skillMatrix, setSkillMatrix] = useState<SkillAssessment[]>([]);
  const [lines, setLines] = useState<SewingLine[]>([]);
  const [linePlans, setLinePlans] = useState<LinePlan[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ords, bulls, oprs, skills, lns, plans] = await Promise.allSettled([
        ordersApi.getOrders(),
        bulletinsApi.getBulletins(),
        operatorsApi.getOperators(),
        skillApi.getCurrentMatrix(),
        linesApi.getLines(true),
        linePlanApi.getAllPlans(),
      ]);

      if (ords.status === "fulfilled") setOrders(ords.value || []);
      if (bulls.status === "fulfilled") setBulletins(bulls.value || []);
      if (oprs.status === "fulfilled") setOperators(oprs.value || []);
      if (skills.status === "fulfilled") setSkillMatrix(skills.value || []);
      if (lns.status === "fulfilled") setLines(lns.value || []);
      if (plans.status === "fulfilled") setLinePlans(plans.value || []);
    } catch (err) {
      console.error("Failed to load overall dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-[#F6F1E8] p-4 sm:p-6 lg:p-8">
      <OverallDashboard
        orders={orders}
        bulletins={bulletins}
        operators={operators}
        skillMatrix={skillMatrix}
        lines={lines}
        linePlans={linePlans}
        onRefresh={loadData}
        loading={loading}
      />
    </div>
  );
}
