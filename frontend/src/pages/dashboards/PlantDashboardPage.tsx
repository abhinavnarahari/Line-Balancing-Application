import { useState, useEffect } from "react";
import { ordersApi, type Order } from "../../features/orders/api";
import { bulletinsApi, type OperationBulletin } from "../../features/bulletins/api";
import { operatorsApi, type Operator } from "../../features/operators/api";
import { skillApi, type SkillAssessment } from "../../features/skill-matrix/api";
import { operationsApi, type Operation } from "../../features/operations/api";
import { linesApi, type SewingLine } from "../../features/lines/api";
import { linePlanApi, type LinePlan } from "../../features/line-balance/api";
import { PlantManagementDashboard } from "../../features/dashboards/PlantManagementDashboard";

export function PlantDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [bulletins, setBulletins] = useState<OperationBulletin[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [skillMatrix, setSkillMatrix] = useState<SkillAssessment[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [lines, setLines] = useState<SewingLine[]>([]);
  const [linePlans, setLinePlans] = useState<LinePlan[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ords, bulls, oprs, skills, ops, lns, plans] = await Promise.allSettled([
        ordersApi.getOrders(),
        bulletinsApi.getBulletins(),
        operatorsApi.getOperators(),
        skillApi.getCurrentMatrix(),
        operationsApi.getOperations(),
        linesApi.getLines(true),
        linePlanApi.getAllPlans(),
      ]);

      if (ords.status === "fulfilled") setOrders(ords.value || []);
      if (bulls.status === "fulfilled") setBulletins(bulls.value || []);
      if (oprs.status === "fulfilled") setOperators(oprs.value || []);
      if (skills.status === "fulfilled") setSkillMatrix(skills.value || []);
      if (ops.status === "fulfilled") setOperations(ops.value || []);
      if (lns.status === "fulfilled") setLines(lns.value || []);
      if (plans.status === "fulfilled") setLinePlans(plans.value || []);
    } catch (err) {
      console.error("Failed to load plant dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-[#F6F1E8] p-4 sm:p-6 lg:p-8">
      <PlantManagementDashboard
        orders={orders}
        bulletins={bulletins}
        operators={operators}
        skillMatrix={skillMatrix}
        operations={operations}
        lines={lines}
        linePlans={linePlans}
        onRefresh={loadData}
        loading={loading}
      />
    </div>
  );
}
