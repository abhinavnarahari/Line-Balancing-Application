import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, AlertTriangle, CheckCircle, Users, ChevronDown, ChevronUp, Zap } from "lucide-react";
import { operationsApi, type Operation } from "../../features/operations/api";
import { operatorsApi, type Operator } from "../../features/operators/api";
import { shiftsApi } from "../../features/shifts/api";
import { ordersApi, type Order } from "../../features/orders/api";
import { bulletinsApi, type OperationBulletin } from "../../features/bulletins/api";
import { skillApi, type SkillAssessment } from "../../features/skill-matrix/api";
import { linePlanApi } from "../../features/line-balance/mockApi";
import type { Shift } from "../../features/shifts/types";
import { PageHeader, DataCard, DataCardHeader } from "../../components/ui/PremiumUI";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";

// ─── Types ──────────────────────────────────────────────────
interface Assignment {
  bulletinLineId: string;
  operationId: string;
  operatorId: string | null;
}

// ─── Utility ────────────────────────────────────────────────
function calcActualTime(smv: number, efficiency: number): number {
  return smv / (efficiency / 100);
}

// Default efficiency until Skill Matrix is implemented (Phase 2)
// Will be replaced by actual Skill Matrix cycle times per operator + operation
const defaultEfficiency = 85; // 85% assumed standard

// ─── Stat Card ────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, accent = false, warning = false }:
  { label: string; value: string | number; sub?: string; icon: React.ElementType; accent?: boolean; warning?: boolean }) {
  return (
    <div className={`bg-white border rounded-sm p-5 flex items-start gap-4 shadow-sm ${warning ? "border-amber-300" : accent ? "border-[#B48259]" : "border-[#F0EAE0]"}`}>
      <div className={`w-9 h-9 rounded-sm flex items-center justify-center shrink-0 ${warning ? "bg-amber-50" : accent ? "bg-gradient-to-br from-[#C47F45] to-[#9B5A32]" : "bg-[#F0EAE0]"}`}>
        <Icon className={`h-4 w-4 ${warning ? "text-amber-600" : accent ? "text-white" : "text-[#475569]"}`} />
      </div>
      <div>
        <p className="text-[10.5px] text-[#8C7E6E] uppercase tracking-[0.1em] font-semibold">{label}</p>
        <p className={`text-2xl font-bold tracking-tight mt-0.5 ${warning ? "text-amber-600" : accent ? "text-[#B48259]" : "text-[#221912]"}`}>
          {value}
        </p>
        {sub && <p className="text-[10px] text-[#8C7E6E] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Yamazumi Chart ──────────────────────────────────────────
function YamazumiChart({ data, taktTime }: {
  data: { stationNum: number; label: string; actualTime: number; smv: number; isBottleneck: boolean; operatorName?: string }[];
  taktTime: number;
}) {
  const [tooltip, setTooltip] = useState<number | null>(null);
  const maxTime = Math.max(taktTime * 1.5, ...data.map(d => d.actualTime), 0.1);

  return (
    <div className="relative">
      {/* Chart area */}
      <div className="flex items-end gap-1.5 h-48 pt-8 pb-6 px-2 relative">
        {/* Takt time line */}
        <div
          className="absolute left-0 right-0 z-10 pointer-events-none"
          style={{ bottom: `calc(${(taktTime / maxTime) * 100}% + 24px)` }}
        >
          <div className="relative border-t-2 border-dashed border-[#8B4A3C]">
            <span className="absolute -top-5 right-0 text-[9px] font-bold text-[#8B4A3C] bg-white px-1.5 py-0.5 border border-[#8B4A3C]/30 rounded-sm">
              TAKT {taktTime.toFixed(2)}m
            </span>
          </div>
        </div>

        {data.map((d, i) => {
          const pct = (d.actualTime / maxTime) * 100;
          const overPct = d.isBottleneck ? ((d.actualTime - taktTime) / d.actualTime) * 100 : 0;

          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full relative group">
              {/* Tooltip */}
              <AnimatePresence>
                {tooltip === i && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute bottom-full mb-2 z-20 bg-[#221912] text-white text-[10px] px-2.5 py-1.5 rounded-sm whitespace-nowrap shadow-lg"
                  >
                    <p className="font-semibold">{d.label}</p>
                    {d.operatorName && <p className="text-[#FFE5BF]">{d.operatorName}</p>}
                    <p>Actual: <span className="font-mono">{d.actualTime.toFixed(3)}m</span></p>
                    <p>SMV: <span className="font-mono">{d.smv.toFixed(2)}m</span></p>
                    {d.isBottleneck && <p className="text-amber-400 font-bold">⚠ Bottleneck</p>}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                className="w-full relative overflow-hidden rounded-t-sm cursor-pointer"
                style={{ height: `${pct}%`, minHeight: d.actualTime > 0 ? 4 : 0 }}
                initial={{ scaleY: 0, originY: 1 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: i * 0.04, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                onMouseEnter={() => setTooltip(i)}
                onMouseLeave={() => setTooltip(null)}
              >
                {d.actualTime > 0 ? (
                  <>
                    <div className={`absolute inset-0 ${d.isBottleneck ? "bg-[#FFE5BF]" : "bg-[#3C5245]"}`} />
                    {d.isBottleneck && (
                      <motion.div
                        className="absolute top-0 left-0 right-0 bg-[#8B4A3C]"
                        style={{ height: `${overPct}%` }}
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ delay: i * 0.04 + 0.4, duration: 0.3 }}
                      />
                    )}
                  </>
                ) : (
                  <div className="absolute inset-0 border-2 border-dashed border-[#F0EAE0]" />
                )}
              </motion.div>

              <span className="mt-1.5 text-[9px] font-mono text-[#8C7E6E]">ST-{d.stationNum}</span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-2 pt-1 border-t border-[#F0EAE0]">
        <div className="flex items-center gap-1.5 text-[10px] text-[#475569]">
          <div className="w-3 h-3 bg-[#3C5245] rounded-sm" /> Balanced
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-[#475569]">
          <div className="w-3 h-3 bg-[#FFE5BF] rounded-sm" /> Near Takt
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-[#475569]">
          <div className="w-3 h-3 bg-[#8B4A3C] rounded-sm" /> Bottleneck
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-[#475569]">
          <div className="w-3 h-2.5 border-2 border-dashed border-[#F0EAE0] rounded-sm" /> Unassigned
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export function LineBalancePage() {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [bulletins, setBulletins] = useState<OperationBulletin[]>([]);
  const [assessments, setAssessments] = useState<SkillAssessment[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [showChart, setShowChart] = useState(true);

  // Config
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [selectedShiftId, setSelectedShiftId] = useState<string>("");
  const [allowance, setAllowance] = useState(10); // % personal allowance

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [ops, oprs, shfts, ords, bulls, skills] = await Promise.all([
          operationsApi.getOperations(),
          operatorsApi.getOperators(),
          shiftsApi.getShifts(),
          ordersApi.getOrders(),
          bulletinsApi.getBulletins(),
          skillApi.getCurrentMatrix(),
        ]);
        setOperations(ops);
        setOperators(oprs.filter(o => o.active));
        setAssessments(skills);
        
        const activeShifts = shfts.filter(s => s.active);
        setShifts(activeShifts);
        if (activeShifts.length > 0) setSelectedShiftId(activeShifts[0].id);

        setOrders(ords);
        setBulletins(bulls);
        
        if (ords.length > 0) {
          setSelectedOrderId(String(ords[0].id));
        }
      } catch (err) {
        console.error("Failed to fetch line balance dependencies:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Compute derived values based on selected Order
  const selectedOrder = useMemo(() => orders.find(o => String(o.id) === String(selectedOrderId)), [orders, selectedOrderId]);
  const targetOutput = selectedOrder?.totalQuantity || 0;

  // Find Operation Bulletin linked to the selected Order's Style
  const selectedBulletin = useMemo(() => {
    if (!selectedOrder) return null;
    return bulletins.find(b => (b.styles || []).some(s => String(s.id) === String(selectedOrder.styleId))) || null;
  }, [bulletins, selectedOrder]);

  // When selectedBulletin or Order changes, initialize assignments matching bulletin sequence
  useEffect(() => {
    const fetchPlan = async () => {
      if (!selectedOrder || !selectedBulletin) {
        setAssignments([]);
        return;
      }
      
      const existingPlan = await linePlanApi.getPlanForOrder(String(selectedOrder.id));
      if (existingPlan) {
        setAssignments(existingPlan.assignments);
      } else {
        setAssignments(
          selectedBulletin.lines
            .sort((a, b) => a.sequence - b.sequence)
            .map(line => ({
              bulletinLineId: String(line.id),
              operationId: String(line.operationId),
              operatorId: null
            }))
        );
      }
    };
    fetchPlan();
  }, [selectedBulletin, selectedOrder]);

  // ─── Takt Time Calculation ───────────────────────────────
  const shiftDurationMins = useMemo(() => {
    const shift = shifts.find(s => s.id === selectedShiftId);
    if (!shift) return 480;
    const [sh, sm] = shift.startTime.split(":").map(Number);
    const [eh, em] = shift.endTime.split(":").map(Number);
    let mins = (eh * 60 + em) - (sh * 60 + sm);
    if (mins <= 0) mins += 24 * 60;
    return mins;
  }, [shifts, selectedShiftId]);

  // Available time after personal allowance
  const availableTimeMins = shiftDurationMins * (1 - allowance / 100);
  const taktTime = targetOutput > 0 ? availableTimeMins / targetOutput : 0;

  // ─── Per-station metrics ─────────────────────────────────
  const stationData = useMemo(() => {
    if (!selectedBulletin) return [];

    return assignments.map((a, i) => {
      const line = selectedBulletin.lines.find(l => l.id === a.bulletinLineId);
      const op = operations.find(o => o.id === a.operationId);
      const operator = a.operatorId ? operators.find(o => o.id === a.operatorId) : null;
      
      // Use SMV from Bulletin Line directly!
      const smv = line?.smv ?? 0.5;
      
      // Look up operator's exact cycle time from Skill Matrix
      const assessment = operator ? assessments.find(s => String(s.operatorId) === String(operator.id) && String(s.operationId) === String(a.operationId)) : null;
      
      // If assessment exists, use recorded cycleTime (in seconds, so / 60 for minutes). Else fallback to default efficiency.
      const actualTime = operator 
        ? (assessment ? assessment.cycleTimeSeconds / 60 : calcActualTime(smv, defaultEfficiency)) 
        : 0;
        
      const efficiency = actualTime > 0 ? (smv / actualTime) * 100 : 0;
      const requiredOps = taktTime > 0 && actualTime > 0 ? Math.ceil(actualTime / taktTime) : 1;

      return {
        stationNum: line?.sequence ?? i + 1,
        bulletinLineId: a.bulletinLineId,
        operationId: a.operationId,
        operatorId: a.operatorId,
        label: op?.name ?? `Station ${i + 1}`,
        code: op?.operationCode ?? "",
        smv,
        efficiency,
        actualTime,
        operatorName: operator?.name,
        isBottleneck: actualTime > taktTime,
        requiredOps,
        assigned: !!a.operatorId,
      };
    });
  }, [assignments, selectedBulletin, operations, operators, taktTime]);

  // ─── Summary metrics ─────────────────────────────────────
  const totalSMV = stationData.reduce((s, d) => s + d.smv, 0);
  const assignedCount = stationData.filter(d => d.assigned).length;
  const bottleneckCount = stationData.filter(d => d.isBottleneck).length;
  const lineEfficiency = taktTime > 0 && stationData.some(d => d.assigned)
    ? (totalSMV / (taktTime * assignedCount)) * 100
    : 0;

  const handleAssign = (bulletinLineId: string, operatorId: string) => {
    setAssignments(prev =>
      prev.map(a => a.bulletinLineId === bulletinLineId ? { ...a, operatorId: operatorId || null } : a)
    );
  };

  const handleSave = async () => {
    if (!selectedOrder) return;
    setSaving(true);
    try {
      await linePlanApi.savePlan({
        orderId: String(selectedOrder.id),
        shiftId: selectedShiftId,
        allowance,
        assignments
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-[#FFE5BF] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-[#8C7E6E]">Loading line plan data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7 w-full p-6 lg:p-8">
      <PageHeader
        eyebrow="Line Balancing"
        title="Planned Lines"
        description="Configure target output, assign operators to operations, and visualize the Yamazumi chart."
        action={
          <Button onClick={handleSave} loading={saving} disabled={!selectedOrder} size="md">
            Save Line Plan
          </Button>
        }
      />

      {/* ─── Config Panel ─── */}
      <DataCard>
        <DataCardHeader title="Plan Configuration" subtitle="Set the production order for this line" />
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 items-end">
          <div className="lg:col-span-2">
            <label className="text-[10.5px] font-semibold tracking-[0.1em] uppercase text-[#475569] block mb-1.5">Production Order</label>
            <select
              value={selectedOrderId}
              onChange={e => setSelectedOrderId(e.target.value)}
              className="w-full h-10 bg-white border border-[#E6DDCE] px-3 text-sm text-[#221912] focus:outline-none focus:border-[#B48259] focus:ring-2 focus:ring-[#B48259]/15"
            >
              <option value="">— Select Order —</option>
              {orders.map(o => (
                <option key={o.id} value={o.id}>{o.orderNo} ({o.buyer})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10.5px] font-semibold tracking-[0.1em] uppercase text-[#475569] block mb-1.5">Shift</label>
            <select
              value={selectedShiftId}
              onChange={e => setSelectedShiftId(e.target.value)}
              className="w-full h-10 bg-white border border-[#E6DDCE] px-3 text-sm text-[#221912] focus:outline-none focus:border-[#B48259] focus:ring-2 focus:ring-[#B48259]/15"
            >
              {shifts.map(s => (
                <option key={s.id} value={s.id}>{s.shiftName} ({s.startTime}–{s.endTime})</option>
              ))}
            </select>
          </div>
          <Input
            label="Target Output (pcs)"
            type="number"
            value={targetOutput}
            onChange={() => {}}
            disabled
            hint="Auto-populated from Order"
          />
          <Input
            label="Allowance (%)"
            type="number"
            min="0"
            max="30"
            value={allowance}
            onChange={e => setAllowance(parseInt(e.target.value) || 0)}
            hint="Personal/fatigue allowance"
          />
        </div>

        {/* Calculated KPIs */}
        <div className="px-6 pb-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-[#F0EAE0] pt-5">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.12em] text-[#8C7E6E] font-semibold">Shift Duration</p>
            <p className="font-mono text-xl font-bold text-[#221912] mt-1">{shiftDurationMins}<span className="text-sm font-normal ml-1">min</span></p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.12em] text-[#8C7E6E] font-semibold">Available Time</p>
            <p className="font-mono text-xl font-bold text-[#221912] mt-1">{availableTimeMins.toFixed(0)}<span className="text-sm font-normal ml-1">min</span></p>
          </div>
          <div className="text-center border-x border-[#F0EAE0]">
            <p className="text-[10px] uppercase tracking-[0.12em] text-[#8C7E6E] font-semibold">Takt Time</p>
            <p className="font-mono text-2xl font-bold text-[#B48259] mt-1">{taktTime.toFixed(3)}<span className="text-sm font-normal ml-1">min</span></p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.12em] text-[#8C7E6E] font-semibold">Total SMV</p>
            <p className="font-mono text-xl font-bold text-[#221912] mt-1">{totalSMV.toFixed(2)}<span className="text-sm font-normal ml-1">min</span></p>
          </div>
        </div>
      </DataCard>

      {!selectedBulletin && selectedOrder && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-sm flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <p className="text-sm">No Operation Bulletin found for the Style associated with this Order. Please create a bulletin first.</p>
        </div>
      )}

      {/* ─── Stat Row ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Line Efficiency" value={`${lineEfficiency.toFixed(1)}%`} sub="Based on assigned stations" icon={TrendingUp} accent />
        <StatCard label="Assigned Stations" value={`${assignedCount} / ${stationData.length}`} sub="Operations with operators" icon={Users} />
        <StatCard label="Bottlenecks" value={bottleneckCount} sub={bottleneckCount > 0 ? "Stations above takt time" : "Line is balanced"} icon={AlertTriangle} warning={bottleneckCount > 0} />
        <StatCard label="Target Achievement" value={bottleneckCount === 0 && assignedCount === stationData.length ? "✓ Achievable" : "Review needed"} sub={`${targetOutput} pcs / shift`} icon={CheckCircle} />
      </div>

      {/* ─── Chart + Assignments ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Assignments Table */}
        <div className="xl:col-span-3">
          <DataCard noPad>
            <DataCardHeader
              title="Station Assignments"
              subtitle="Assign a sewing operator to each operation in the bulletin"
              count={assignedCount}
            />
            <div className="divide-y divide-[#F0EAE0] max-h-[600px] overflow-y-auto">
              {stationData.map((station, i) => (
                <motion.div
                  key={station.bulletinLineId}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#FEFCF9] transition-colors"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.025 }}
                >
                  {/* Station number */}
                  <div className={`w-8 h-8 shrink-0 flex items-center justify-center text-[10px] font-bold font-mono rounded-sm border ${station.isBottleneck ? "bg-amber-50 border-amber-300 text-amber-700" : station.assigned ? "bg-[#F0EAE0] border-[#E6DDCE] text-[#475569]" : "bg-white border-[#F0EAE0] text-[#8C7E6E]"}`}>
                    {station.stationNum}
                  </div>

                  {/* Operation info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px] text-[#B48259] font-bold bg-[#FBF4EC] px-1.5 py-0.5 rounded-sm">{station.code}</span>
                      <p className="text-sm font-medium text-[#221912] truncate">{station.label}</p>
                    </div>
                    <div className="flex gap-4">
                      <p className="text-[10px] text-[#8C7E6E] mt-0.5">SMV: <span className="font-mono">{station.smv.toFixed(2)}</span></p>
                      {station.assigned && (
                        <p className="text-[10px] text-[#8C7E6E] mt-0.5">Efficiency: <span className="font-mono text-[#3C5245] font-semibold">{station.efficiency.toFixed(1)}%</span></p>
                      )}
                    </div>
                  </div>

                  {/* Operator selector */}
                  <div className="w-48 shrink-0">
                    <select
                      value={station.operatorId || ""}
                      onChange={e => handleAssign(station.bulletinLineId, e.target.value)}
                      className="w-full text-xs bg-white border border-[#E6DDCE] px-2 py-1.5 text-[#221912] focus:outline-none focus:border-[#B48259] focus:ring-1 focus:ring-[#B48259]/20 transition-all"
                    >
                      <option value="">— Unassigned —</option>
                      {operators.map(op => (
                        <option key={op.id} value={op.id}>{op.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Actual time */}
                  <div className="w-20 text-right shrink-0">
                    {station.assigned ? (
                      <div>
                        <p className={`font-mono text-sm font-bold ${station.isBottleneck ? "text-amber-600" : "text-[#3C5245]"}`}>
                          {station.actualTime.toFixed(3)}
                        </p>
                        <p className="text-[9px] text-[#8C7E6E]">min / pc</p>
                        {station.isBottleneck && (
                          <div className="flex items-center justify-end gap-0.5 mt-0.5">
                            <AlertTriangle className="h-3 w-3 text-amber-500" />
                            <span className="text-[9px] text-amber-600 font-semibold">BOTTLENECK</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-[#8C7E6E] italic">—</span>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {stationData.length === 0 && (
                <div className="p-8 text-center text-[#8C7E6E] text-sm">
                  No operations found. Please check if an Order and its corresponding Operation Bulletin exist.
                </div>
              )}
            </div>
            <div className="px-5 py-2.5 border-t border-[#F0EAE0] bg-[#FAFAF8] flex justify-between items-center">
              <span className="text-[11px] font-mono text-[#8C7E6E]">{assignedCount} of {stationData.length} assigned</span>
              <span className="text-[11px] text-[#8C7E6E]">
                Required Operators = ⌈CT ÷ Takt⌉
              </span>
            </div>
          </DataCard>
        </div>

        {/* Yamazumi Chart */}
        <div className="xl:col-span-2 space-y-4">
          <DataCard noPad>
            <DataCardHeader
              title="Yamazumi Chart"
              subtitle="Line balance visualisation"
              action={
                <button
                  onClick={() => setShowChart(p => !p)}
                  className="text-[10px] text-[#8C7E6E] hover:text-[#221912] flex items-center gap-1 transition-colors"
                >
                  {showChart ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  {showChart ? "Hide" : "Show"}
                </button>
              }
            />
            <AnimatePresence>
              {showChart && stationData.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-5">
                    <YamazumiChart data={stationData} taktTime={taktTime} />
                  </div>
                </motion.div>
              )}
              {showChart && stationData.length === 0 && (
                <div className="p-8 text-center text-[#8C7E6E] text-sm italic">
                  Chart will appear once order is selected.
                </div>
              )}
            </AnimatePresence>
          </DataCard>

          {/* Guidance card */}
          <DataCard>
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-[#B48259]" />
                <h4 className="text-sm font-semibold text-[#221912]">How Line Balancing Works</h4>
              </div>
              <div className="space-y-2.5 text-[11.5px] text-[#475569] leading-relaxed">
                <p><strong className="text-[#221912] font-semibold">Takt Time</strong> = Available Time ÷ Target Output</p>
                <p><strong className="text-[#221912] font-semibold">Actual Time</strong> = SMV ÷ Operator Efficiency</p>
                <p><strong className="text-[#221912] font-semibold">Required Ops</strong> = ⌈Actual Time ÷ Takt Time⌉</p>
                <div className="h-px bg-[#F0EAE0] my-2" />
                <p className="text-[10.5px]">Assign operators so all bars fall below the dashed Takt Time line. Red bars indicate bottlenecks that will prevent the target from being met.</p>
              </div>
              {bottleneckCount === 0 && assignedCount > 0 && assignedCount === stationData.length && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-sm flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                  <p className="text-[11px] text-emerald-700 font-semibold">Line is balanced! Target is achievable.</p>
                </motion.div>
              )}
            </div>
          </DataCard>
        </div>
      </div>
    </div>
  );
}



