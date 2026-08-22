import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Users, User, ArrowRight } from "lucide-react";
import { operationsApi, type Operation } from "../../features/operations/api";
import { operatorsApi, type Operator } from "../../features/operators/api";
import { ordersApi, type Order } from "../../features/orders/api";
import { bulletinsApi, type OperationBulletin } from "../../features/bulletins/api";
import { linePlanApi, type LinePlan } from "../../features/line-balance/mockApi";
import { PageHeader, DataCard, EmptyState } from "../../components/ui/PremiumUI";

export function OperatorPlacementPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [bulletins, setBulletins] = useState<OperationBulletin[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [linePlan, setLinePlan] = useState<LinePlan | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [ops, oprs, ords, bulls] = await Promise.all([
          operationsApi.getOperations(),
          operatorsApi.getOperators(),
          ordersApi.getOrders(),
          bulletinsApi.getBulletins(),
        ]);
        setOperations(ops);
        setOperators(oprs.filter(o => o.active));
        setOrders(ords);
        setBulletins(bulls);
        
        if (ords.length > 0) {
          setSelectedOrderId(String(ords[0].id));
        }
      } catch (err) {
        console.error("Failed to fetch placement dependencies:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  useEffect(() => {
    const fetchPlan = async () => {
      if (!selectedOrderId) {
        setLinePlan(null);
        return;
      }
      try {
        const plan = await linePlanApi.getPlanForOrder(String(selectedOrderId));
        setLinePlan(plan);
      } catch (err) {
        console.error("Failed to fetch line plan:", err);
      }
    };
    fetchPlan();
  }, [selectedOrderId]);

  const selectedOrder = useMemo(() => orders.find(o => String(o.id) === String(selectedOrderId)), [orders, selectedOrderId]);
  const selectedBulletin = useMemo(() => {
    if (!selectedOrder) return null;
    return bulletins.find(b => (b.styles || []).some(s => String(s.id) === String(selectedOrder.styleId))) || null;
  }, [bulletins, selectedOrder]);

  const placementData = useMemo(() => {
    if (!linePlan || !selectedBulletin) return [];

    return linePlan.assignments.map((assignment) => {
      const line = selectedBulletin.lines.find(l => String(l.id) === String(assignment.bulletinLineId));
      const op = operations.find(o => String(o.id) === String(assignment.operationId));
      const operator = assignment.operatorId ? operators.find(o => String(o.id) === String(assignment.operatorId)) : null;

      return {
        sequence: line?.sequence ?? 0,
        machineType: line?.machineType ?? "Unknown",
        operationName: op?.name ?? "Unknown Operation",
        operationCode: op?.operationCode ?? "N/A",
        operatorName: operator?.name ?? "Unassigned",
        operatorId: operator?.employeeId ?? null,
        isAssigned: !!operator
      };
    }).sort((a, b) => a.sequence - b.sequence);
  }, [linePlan, selectedBulletin, operations, operators]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-[#FFE5BF] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-[#8C7E6E]">Loading layout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7 w-full p-6 lg:p-8">
      <PageHeader
        eyebrow="Line Balancing"
        title="Operator Placement"
        description="Visual floor plan of operator assignments for active orders."
      />

      <DataCard>
        <div className="p-6 border-b border-[#F0EAE0] bg-[#FAFAF8]">
          <div className="max-w-sm">
            <label className="text-[10.5px] font-semibold tracking-[0.1em] uppercase text-[#475569] block mb-1.5">View Placement For Order</label>
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
        </div>

        <div className="p-6 bg-[#FEFCF9]">
          {!linePlan ? (
            <EmptyState 
              title="No Line Plan Found" 
              description="A line plan has not been saved for this order yet. Go to Planned Lines to assign operators."
            />
          ) : placementData.length === 0 ? (
            <EmptyState title="Empty Plan" description="The line plan has no assignments." />
          ) : (
            <div className="space-y-8">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-[#B48259]" />
                <h3 className="text-sm font-semibold text-[#221912]">Line Floor Plan (Sequential Layout)</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {placementData.map((station, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`relative p-5 rounded-sm border bg-white shadow-sm flex flex-col h-full ${station.isAssigned ? 'border-[#F0EAE0]' : 'border-amber-200 bg-amber-50/30'}`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-8 h-8 rounded-sm bg-[#F0EAE0] text-[#475569] flex items-center justify-center font-mono text-[10px] font-bold shrink-0">
                        S-{station.sequence}
                      </div>
                      <span className="text-[9px] uppercase tracking-wider font-semibold text-[#8C7E6E] bg-[#FAFAF8] px-1.5 py-0.5 rounded border border-[#F0EAE0]">
                        {station.machineType}
                      </span>
                    </div>

                    <div className="mb-4 flex-1">
                      <span className="font-mono text-[9px] text-[#B48259] font-bold">{station.operationCode}</span>
                      <h4 className="text-sm font-medium text-[#221912] leading-tight mt-1">{station.operationName}</h4>
                    </div>

                    <div className={`p-3 rounded-sm border flex items-center gap-3 mt-auto ${station.isAssigned ? 'bg-[#FAFAF8] border-[#F0EAE0]' : 'bg-white border-dashed border-amber-300'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center overflow-hidden shrink-0 ${station.isAssigned ? 'bg-[#F0EAE0]' : 'bg-amber-100 text-amber-500'}`}>
                        <User className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-semibold truncate ${station.isAssigned ? 'text-[#221912]' : 'text-amber-700 italic'}`}>
                          {station.operatorName}
                        </p>
                        {station.operatorId && (
                          <p className="text-[10px] text-[#8C7E6E] font-mono">{station.operatorId}</p>
                        )}
                      </div>
                    </div>

                    {idx < placementData.length - 1 && (
                      <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 items-center justify-center bg-white rounded-full border border-[#F0EAE0] text-[#B48259] shadow-sm">
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DataCard>
    </div>
  );
}



