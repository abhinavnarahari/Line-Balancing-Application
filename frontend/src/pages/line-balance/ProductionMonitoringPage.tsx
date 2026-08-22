import { useState, useEffect, useMemo } from "react";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { ordersApi, type Order } from "../../features/orders/api";
import { shiftsApi as shiftApi } from "../../features/shifts/api";
import { linePlanApi, type LinePlan } from "../../features/line-balance/api";
import type { Shift } from "../../features/shifts/types";
import { PageHeader, DataCard, DataCardHeader, EmptyState } from "../../components/ui/PremiumUI";

// Array of 8 hours for a standard shift
const SHIFT_HOURS = Array.from({ length: 8 }, (_, i) => i + 1);

export function ProductionMonitoringPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [linePlan, setLinePlan] = useState<LinePlan | null>(null);
  
  // Map of hour (1-8) to actual output
  const [hourlyOutput, setHourlyOutput] = useState<Record<number, number>>({});

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const [ords, shfts] = await Promise.all([
        ordersApi.getOrders(),
        shiftApi.getShifts(),
      ]);
      setOrders(ords);
      setShifts(shfts.filter(s => s.active));
      
      if (ords.length > 0) {
        setSelectedOrderId(String(ords[0].id));
      }
      setLoading(false);
    };
    fetchAll();
  }, []);

  useEffect(() => {
    const fetchPlan = async () => {
      if (!selectedOrderId) {
        setLinePlan(null);
        return;
      }
      const plan = await linePlanApi.getPlanForOrder(selectedOrderId);
      setLinePlan(plan);
      // Reset outputs when order changes
      setHourlyOutput({});
    };
    fetchPlan();
  }, [selectedOrderId]);

  const selectedOrder = useMemo(() => orders.find(o => o.id === selectedOrderId), [orders, selectedOrderId]);
  
  // Calculate Target Takt and Hourly Target
  const shift = shifts.find(s => s.id === linePlan?.shiftId);
  
  const shiftDurationMins = useMemo(() => {
    if (!shift) return 480;
    const [sh, sm] = shift.startTime.split(":").map(Number);
    const [eh, em] = shift.endTime.split(":").map(Number);
    let mins = (eh * 60 + em) - (sh * 60 + sm);
    if (mins <= 0) mins += 24 * 60;
    return mins;
  }, [shift]);

  const targetOutput = selectedOrder?.totalQuantity || 0;
  
  // Target per hour
  const hourlyTarget = Math.floor(targetOutput / (shiftDurationMins / 60));

  const handleOutputChange = (hour: number, value: string) => {
    const num = parseInt(value, 10);
    setHourlyOutput(prev => ({
      ...prev,
      [hour]: isNaN(num) ? 0 : num
    }));
  };

  const totalActual = Object.values(hourlyOutput).reduce((sum, val) => sum + val, 0);
  const totalPlannedSoFar = Object.keys(hourlyOutput).length * hourlyTarget;
  const variance = totalActual - totalPlannedSoFar;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-[#FFE5BF] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-[#8C7E6E]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7 w-full p-6 lg:p-8">
      <PageHeader
        eyebrow="Line Balancing"
        title="Production Monitoring"
        description="Track actual production output against the line plan."
      />

      <DataCard>
        <div className="p-6 border-b border-[#F0EAE0] bg-[#FAFAF8]">
          <div className="max-w-sm">
            <label className="text-[10.5px] font-semibold tracking-[0.1em] uppercase text-[#475569] block mb-1.5">Select Order to Monitor</label>
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

        <div className="p-6">
          {!linePlan ? (
             <EmptyState 
               title="No Line Plan Found" 
               description="A line plan has not been saved for this order yet. Go to Planned Lines to assign operators."
             />
          ) : (
            <div className="space-y-8">
              
              {/* KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-[#F0EAE0] rounded-sm p-4">
                  <p className="text-[10px] text-[#8C7E6E] uppercase font-semibold">Total Target</p>
                  <p className="text-2xl font-bold text-[#221912] mt-1">{targetOutput}</p>
                </div>
                <div className="bg-white border border-[#F0EAE0] rounded-sm p-4">
                  <p className="text-[10px] text-[#8C7E6E] uppercase font-semibold">Hourly Target</p>
                  <p className="text-2xl font-bold text-[#B48259] mt-1">{hourlyTarget}</p>
                </div>
                <div className="bg-white border border-[#F0EAE0] rounded-sm p-4">
                  <p className="text-[10px] text-[#8C7E6E] uppercase font-semibold">Actual Output</p>
                  <p className="text-2xl font-bold text-[#3C5245] mt-1">{totalActual}</p>
                </div>
                <div className={`border rounded-sm p-4 ${variance < 0 ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                  <p className="text-[10px] uppercase font-semibold">Overall Variance</p>
                  <p className="text-2xl font-bold mt-1">
                    {variance > 0 ? '+' : ''}{variance}
                  </p>
                </div>
              </div>

              {/* Hourly Entry Table */}
              <DataCard noPad>
                <DataCardHeader title="Hourly Output Entry" subtitle="Enter actual pieces completed per hour" />
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#FAFAF8] border-b border-[#F0EAE0] text-[10.5px] uppercase tracking-wider font-semibold text-[#8C7E6E]">
                        <th className="p-4 w-24">Hour</th>
                        <th className="p-4 w-32">Target</th>
                        <th className="p-4 w-48">Actual Output</th>
                        <th className="p-4 w-32">Variance</th>
                        <th className="p-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0EAE0] text-sm text-[#221912]">
                      {SHIFT_HOURS.map((hour) => {
                        const actual = hourlyOutput[hour];
                        const hasEntry = actual !== undefined;
                        const hrVariance = hasEntry ? actual - hourlyTarget : 0;
                        
                        return (
                          <tr key={hour} className="hover:bg-[#FEFCF9] transition-colors">
                            <td className="p-4 font-mono font-medium">Hour {hour}</td>
                            <td className="p-4 font-mono text-[#8C7E6E]">{hourlyTarget}</td>
                            <td className="p-4">
                              <input
                                type="number"
                                min="0"
                                className="w-24 h-9 bg-white border border-[#E6DDCE] px-3 font-mono focus:outline-none focus:border-[#B48259] focus:ring-1 focus:ring-[#B48259]/20"
                                value={actual ?? ""}
                                onChange={e => handleOutputChange(hour, e.target.value)}
                                placeholder="—"
                              />
                            </td>
                            <td className={`p-4 font-mono font-bold ${hasEntry ? (hrVariance < 0 ? 'text-amber-600' : 'text-emerald-600') : 'text-[#E6DDCE]'}`}>
                              {hasEntry ? (hrVariance > 0 ? `+${hrVariance}` : hrVariance) : '—'}
                            </td>
                            <td className="p-4">
                              {hasEntry && hrVariance < 0 && (
                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200">
                                  <AlertTriangle className="w-3 h-3" /> Behind Target
                                </span>
                              )}
                              {hasEntry && hrVariance >= 0 && (
                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
                                  <CheckCircle className="w-3 h-3" /> On Track
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </DataCard>

            </div>
          )}
        </div>
      </DataCard>
    </div>
  );
}



