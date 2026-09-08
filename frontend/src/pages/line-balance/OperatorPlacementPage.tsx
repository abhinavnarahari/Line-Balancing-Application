import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Users, User } from "lucide-react";
import { operationsApi, type Operation } from "../../features/operations/api";
import { operatorsApi, type Operator } from "../../features/operators/api";
import { ordersApi, type Order } from "../../features/orders/api";
import { bulletinsApi, type OperationBulletin } from "../../features/bulletins/api";
import { linePlanApi, type LinePlan } from "../../features/line-balance/api";
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
          <div className="w-8 h-8 border-4 border-[#E6DDCE] border-t-[#9C5B3C] rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#8C7E6E]">Loading layout...</p>
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

      <DataCard noPad className="border border-[#E6DDCE] shadow-[0_1px_3px_rgba(34,25,18,0.05)] rounded-2xl overflow-hidden bg-white">
        <div className="p-6 border-b border-[#F0EAE0] bg-[#FDFBF7]">
          <div className="max-w-sm">
            <label className="text-[10.5px] font-extrabold tracking-[0.1em] uppercase text-[#8C7E6E] block mb-1.5">View Placement For Order</label>
            <select
              value={selectedOrderId}
              onChange={e => setSelectedOrderId(e.target.value)}
              className="w-full h-10 bg-white border border-[#E6DDCE] rounded-xl px-3 text-xs font-semibold text-[#221912] focus:outline-none focus:border-[#9C5B3C] shadow-2xs"
            >
              <option value="">— Select Order —</option>
              {orders.map(o => (
                <option key={o.id} value={o.id}>{o.orderNo} ({o.buyer})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-6 bg-white">
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
                <Users className="h-4 w-4 text-[#9C5B3C]" />
                <h3 className="text-sm font-bold text-[#221912]">Line Floor Plan (Sequential Layout)</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {placementData.map((station, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`relative p-5 rounded-2xl border bg-white shadow-[0_1px_3px_rgba(34,25,18,0.05)] flex flex-col h-full ${station.isAssigned ? 'border-[#E6DDCE]' : 'border-[#fde68a] bg-[#fffbeb]/40'}`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-[#F6F1E8] border border-[#E6DDCE] text-[#9C5B3C] flex items-center justify-center font-mono text-xs font-black">
                          {station.sequence}
                        </span>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-[#8C7E6E]">
                          {station.machineType}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${station.isAssigned ? 'bg-[#F3F5F2] text-[#77876F] border-[#d4decb]' : 'bg-[#fffbeb] text-[#b45309] border-[#fde68a]'}`}>
                        {station.isAssigned ? 'Assigned' : 'Unassigned'}
                      </span>
                    </div>

                    <div className="space-y-1 mb-4 flex-1">
                      <p className="font-bold text-xs text-[#221912] line-clamp-2">{station.operationName}</p>
                      <p className="text-[10.5px] font-mono text-[#8C7E6E]">Code: {station.operationCode}</p>
                    </div>

                    <div className="pt-3 border-t border-[#F0EAE0] flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#F6F1E8] border border-[#E6DDCE] flex items-center justify-center text-[#9C5B3C]">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#221912]">{station.operatorName}</p>
                        <p className="text-[10px] font-mono text-[#8C7E6E]">{station.operatorId || '—'}</p>
                      </div>
                    </div>
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



