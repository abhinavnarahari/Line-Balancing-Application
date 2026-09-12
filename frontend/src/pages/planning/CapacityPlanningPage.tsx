import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  Calculator, 
  Clock, 
  Users, 
  Target, 
  TrendingUp, 
  ShieldCheck, 
  Save, 
  CheckCircle2, 
  Layers,
  ChevronRight,
  Pencil,
  Trash2,
  AlertTriangle,
  X
} from "lucide-react";

import { PageHeader, DataCard } from "../../components/ui/PremiumUI";
import { Button } from "../../components/ui/Button";

import { capacityApi, type CapacityPlan, type CapacityPlanRequest } from "../../features/capacity/api";
import { ordersApi, type Order } from "../../features/orders/api";
import { bulletinsApi, type OperationBulletin } from "../../features/bulletins/api";
import { shiftsApi, type Shift } from "../../features/shifts/api";

export function CapacityPlanningPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialOrderId = searchParams.get("orderId");

  const [orders, setOrders] = useState<Order[]>([]);
  const [bulletins, setBulletins] = useState<OperationBulletin[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [existingPlans, setExistingPlans] = useState<CapacityPlan[]>([]);
  
  const [selectedOrderId, setSelectedOrderId] = useState<string>(initialOrderId || "");
  const [selectedBulletinId, setSelectedBulletinId] = useState<string>("");
  const [selectedShiftId, setSelectedShiftId] = useState<string>("");
  
  // Planning Parameters
  const [targetMode, setTargetMode] = useState<"HORIZON" | "DIRECT_HOURLY">("HORIZON");
  const [orderQuantity, setOrderQuantity] = useState<number>(5000);
  const [availableDays, setAvailableDays] = useState<number>(10);
  const [directHourlyTarget, setDirectHourlyTarget] = useState<number>(70);
  const [plannedEfficiency, setPlannedEfficiency] = useState<number>(80); // 80% default

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [editingPlan, setEditingPlan] = useState<CapacityPlan | null>(null);
  const [planToDelete, setPlanToDelete] = useState<CapacityPlan | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [ordersRes, bulletinsRes, shiftsRes, plansRes] = await Promise.all([
          ordersApi.getOrders(),
          bulletinsApi.getBulletins(),
          shiftsApi.getShifts(),
          capacityApi.getPlans(),
        ]);
        setOrders(ordersRes || []);
        setBulletins(bulletinsRes || []);
        setShifts(shiftsRes || []);
        setExistingPlans(plansRes || []);

        if (ordersRes && ordersRes.length > 0 && !selectedOrderId) {
          setSelectedOrderId(String(ordersRes[0].id));
        }
      } catch (err) {
        console.error("Failed to load capacity planning dependencies:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // When selected order changes, auto-populate style, quantity, delivery horizon, and matched bulletin
  const currentOrder = useMemo(() => {
    return orders.find(o => String(o.id) === String(selectedOrderId)) || null;
  }, [orders, selectedOrderId]);

  // Compute planned completion target and working days horizon
  const orderScheduleDates = useMemo(() => {
    if (!currentOrder) return null;
    const targetCompStr = (currentOrder as any).plannedCompletionDate || currentOrder.deliveryDate;
    if (!targetCompStr) return null;

    const targetDate = new Date(targetCompStr);
    targetDate.setHours(23, 59, 59, 999);

    const deliveryDateObj = currentOrder.deliveryDate ? new Date(currentOrder.deliveryDate) : targetDate;
    deliveryDateObj.setHours(23, 59, 59, 999);

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Count working days (excluding Sundays) from today/start to planned completion date
    let workingDaysCount = 0;
    const cur = new Date(now);
    if (targetDate >= now) {
      while (cur <= targetDate) {
        if (cur.getDay() !== 0) { // Exclude Sundays
          workingDaysCount++;
        }
        cur.setDate(cur.getDate() + 1);
      }
    } else {
      workingDaysCount = 1;
    }

    const plannedCompletionFormatted = targetDate.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const deliveryFormatted = deliveryDateObj.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    return {
      targetDate,
      deliveryDateObj,
      workingDaysCount: Math.max(1, workingDaysCount),
      plannedCompletionFormatted,
      deliveryFormatted,
      hasExplicitPlannedDate: Boolean((currentOrder as any).plannedCompletionDate),
    };
  }, [currentOrder]);

  useEffect(() => {
    if (editingPlan) return; // Preserve loaded configuration during active edit mode
    if (currentOrder) {
      // Fix quantity mapping (totalQuantity or quantity)
      const qty = (currentOrder as any).totalQuantity || (currentOrder as any).quantity || 1000;
      setOrderQuantity(qty);

      // Compute available days from planned to complete data
      if (orderScheduleDates) {
        setAvailableDays(orderScheduleDates.workingDaysCount);
      } else if (currentOrder.deliveryDate) {
        const dTarget = new Date(currentOrder.deliveryDate).getTime();
        const dStart = currentOrder.orderDate ? new Date(currentOrder.orderDate).getTime() : new Date().getTime();
        const diffDays = Math.ceil((dTarget - dStart) / (1000 * 60 * 60 * 24));
        setAvailableDays(diffDays > 0 ? Math.min(60, diffDays) : 10);
      }

      if ((currentOrder as any).shiftId) setSelectedShiftId(String((currentOrder as any).shiftId));
      else if (shifts.length > 0 && !selectedShiftId) setSelectedShiftId(String(shifts[0].id));

      // Match bulletin by style
      const matchedBul = bulletins.find(b => 
        (b.styles || []).some(s => String(s.id) === String(currentOrder.styleId))
      );
      if (matchedBul) {
        setSelectedBulletinId(String(matchedBul.id));
      } else if (bulletins.length > 0 && !selectedBulletinId) {
        setSelectedBulletinId(String(bulletins[0].id));
      }
    }
  }, [currentOrder, orderScheduleDates, bulletins, shifts]);

  const currentBulletin = useMemo(() => {
    return bulletins.find(b => String(b.id) === String(selectedBulletinId)) || null;
  }, [bulletins, selectedBulletinId]);

  const currentShift = useMemo(() => {
    return shifts.find(s => String(s.id) === String(selectedShiftId)) || (shifts.length > 0 ? shifts[0] : null);
  }, [shifts, selectedShiftId]);

  // Industrial Engineering Calculations
  const calculations = useMemo(() => {
    // 1. Total Garment SMV in minutes and seconds
    let totalSmvMinutes = 0;
    if (currentBulletin) {
      if (currentBulletin.totalSmv && Number(currentBulletin.totalSmv) > 0) {
        totalSmvMinutes = Number(currentBulletin.totalSmv);
      } else if (currentBulletin.lines && currentBulletin.lines.length > 0) {
        totalSmvMinutes = currentBulletin.lines.reduce((acc, l) => acc + (Number(l.smv) || 0), 0);
      }
    }
    if (totalSmvMinutes <= 0) totalSmvMinutes = 4.25; // standard apparel default
    const totalSmvSeconds = totalSmvMinutes * 60;

    // 2. Net Available Working Time per Shift
    let shiftDurationMinutes = 480; // 8 hours default
    let breakDurationMinutes = 60;  // 60 mins default
    if (currentShift) {
      if (currentShift.startTime && currentShift.endTime) {
        const [sh, sm] = currentShift.startTime.split(":").map(Number);
        const [eh, em] = currentShift.endTime.split(":").map(Number);
        const startTotal = sh * 60 + sm;
        let endTotal = eh * 60 + em;
        if (endTotal < startTotal) endTotal += 24 * 60;
        shiftDurationMinutes = endTotal - startTotal;
      }
      if (currentShift.breakDurationMinutes !== undefined) {
        breakDurationMinutes = currentShift.breakDurationMinutes;
      }
    }
    const netAvailableMinutes = Math.max(60, shiftDurationMinutes - breakDurationMinutes);
    const netAvailableSeconds = netAvailableMinutes * 60;

    // 3. Target Output Calculation
    let targetShiftOutput = 0;
    let targetHourlyOutput = 0;
    if (targetMode === "HORIZON") {
      const days = Math.max(1, availableDays);
      targetShiftOutput = Math.ceil(orderQuantity / days);
      targetHourlyOutput = Number((targetShiftOutput / (netAvailableMinutes / 60)).toFixed(1));
    } else {
      targetHourlyOutput = directHourlyTarget;
      targetShiftOutput = Math.round(directHourlyTarget * (netAvailableMinutes / 60));
    }

    // 4. Customer Takt Time (Ttakt)
    const customerTaktSecs = targetShiftOutput > 0 ? (netAvailableSeconds / targetShiftOutput) : 0;

    // 5. Required Design Capacity (R_req)
    const effFraction = plannedEfficiency / 100.0;
    const requiredDesignCapacity = effFraction > 0 ? (targetHourlyOutput / effFraction) : 0;

    // 6. Designed Pitch Time (T_pitch)
    const designedPitchSecs = customerTaktSecs * effFraction;

    // 7. Theoretical Manpower (N_theo)
    const theoreticalManpower = customerTaktSecs > 0 ? (totalSmvSeconds / customerTaktSecs) : 0;

    // 8. Planned Manpower (N_planned)
    const plannedManpower = designedPitchSecs > 0 ? Math.ceil(totalSmvSeconds / designedPitchSecs) : 0;

    return {
      totalSmvMinutes,
      totalSmvSeconds,
      shiftDurationMinutes,
      breakDurationMinutes,
      netAvailableMinutes,
      netAvailableSeconds,
      targetShiftOutput,
      targetHourlyOutput,
      customerTaktSecs,
      requiredDesignCapacity,
      designedPitchSecs,
      theoreticalManpower,
      plannedManpower,
    };
  }, [
    currentBulletin, 
    currentShift, 
    targetMode, 
    orderQuantity, 
    availableDays, 
    directHourlyTarget, 
    plannedEfficiency
  ]);

  const handleEditPlan = (plan: CapacityPlan) => {
    setEditingPlan(plan);
    setSelectedOrderId(String(plan.orderId));
    if (plan.bulletinId) setSelectedBulletinId(String(plan.bulletinId));
    if (plan.shiftId) setSelectedShiftId(String(plan.shiftId));
    setOrderQuantity(plan.orderQuantity);
    setAvailableDays(plan.availableDays || 1);
    setPlannedEfficiency(plan.plannedEfficiency || 80);
    if (plan.targetHourlyOutput) {
      setDirectHourlyTarget(Math.round(plan.targetHourlyOutput));
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
    showToast(`Loaded plan '${plan.planCode}' for editing. Adjust parameters and click Update Plan.`);
  };

  const handleCancelEdit = () => {
    setEditingPlan(null);
    showToast("Edit mode cancelled.");
  };

  const handleSaveOrUpdatePlan = async () => {
    if (!selectedOrderId) {
      alert("Please select an Order");
      return;
    }
    setSaving(true);
    try {
      const payload: CapacityPlanRequest = {
        planCode: editingPlan ? editingPlan.planCode : undefined,
        orderId: selectedOrderId,
        styleId: currentOrder?.styleId,
        bulletinId: selectedBulletinId ? Number(selectedBulletinId) : undefined,
        shiftId: selectedShiftId ? Number(selectedShiftId) : undefined,
        orderQuantity: orderQuantity,
        availableDays: availableDays,
        targetHourlyOutput: calculations.targetHourlyOutput,
        plannedEfficiency: plannedEfficiency,
        totalSmvMinutes: calculations.totalSmvMinutes,
      };

      if (editingPlan && editingPlan.id) {
        const updated = await capacityApi.updatePlan(editingPlan.id, payload);
        showToast(`✓ Capacity Plan '${updated.planCode}' updated successfully!`);
        setEditingPlan(null);
        const refreshed = await capacityApi.getPlans();
        setExistingPlans(refreshed);
      } else {
        const saved = await capacityApi.savePlan(payload);
        showToast(`✓ Capacity Plan '${saved.planCode}' saved successfully!`);
        const refreshed = await capacityApi.getPlans();
        setExistingPlans(refreshed);

        setTimeout(() => {
          navigate(`/line-design?capacityPlanId=${saved.id}&orderId=${selectedOrderId}`);
        }, 1200);
      }
    } catch (err: any) {
      console.error("Failed to save/update capacity plan:", err);
      showToast(`❌ ${err?.response?.data?.message || err?.message || "Failed to save capacity plan"}`);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!planToDelete || !planToDelete.id) return;
    setDeleting(true);
    try {
      await capacityApi.deletePlan(planToDelete.id);
      showToast(`✓ Capacity Plan '${planToDelete.planCode}' deleted successfully.`);
      if (editingPlan && String(editingPlan.id) === String(planToDelete.id)) {
        setEditingPlan(null);
      }
      setPlanToDelete(null);
      const refreshed = await capacityApi.getPlans();
      setExistingPlans(refreshed);
    } catch (err: any) {
      console.error("Failed to delete capacity plan:", err);
      showToast(`❌ ${err?.response?.data?.message || err?.message || "Failed to delete capacity plan"}`);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] bg-[#F6F1E8]">
        <div className="flex flex-col items-center gap-3 text-[#8C7E6E]">
          <div className="w-8 h-8 border-3 border-[#9C5B3C] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold">Loading capacity planning parameters…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full p-4 sm:p-6 lg:p-8 font-sans bg-[#F6F1E8] min-h-screen">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-[#221912] text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* ── 1. Page Header ───────────────────────────────────────────── */}
      <PageHeader
        eyebrow="Industrial Engineering & Planning"
        title="Capacity Planning & Takt Engine"
        description="Calculate customer takt time, designed pitch time, required hourly capacity, and planned manpower sizing."
        action={
          <div className="flex items-center gap-3">
            {editingPlan && (
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelEdit}
                disabled={saving}
                className="border-[#E6DDCE] text-[#8C7E6E] hover:text-[#221912] hover:bg-[#F6F1E8] text-xs font-bold flex items-center gap-1.5"
              >
                <X className="w-4 h-4" />
                <span>Cancel Edit</span>
              </Button>
            )}
            <Button
              type="button"
              onClick={handleSaveOrUpdatePlan}
              disabled={saving}
              className="bg-[#9C5B3C] hover:bg-[#B06C49] text-white shadow-md shadow-[#9C5B3C]/20 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>
                {saving 
                  ? (editingPlan ? "Updating Plan..." : "Saving Plan...") 
                  : (editingPlan ? "Update Capacity Plan" : "Save Plan & Design Line")}
              </span>
              {!editingPlan && <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
        }
      />

      {/* Editing Mode Banner */}
      {editingPlan && (
        <div className="bg-[#9C5B3C]/10 border border-[#9C5B3C]/30 rounded-2xl p-4 flex items-center justify-between shadow-2xs animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-[#9C5B3C] text-white rounded-xl shadow-xs">
              <Pencil className="w-4 h-4" />
            </span>
            <div>
              <div className="text-xs font-extrabold text-[#221912] flex items-center gap-2">
                <span>Editing Capacity Plan:</span>
                <span className="font-mono text-[#9C5B3C] bg-white px-2 py-0.5 rounded-md border border-[#E6DDCE]">{editingPlan.planCode}</span>
                <span className="text-[#8C7E6E]">({editingPlan.orderNo || "Order"})</span>
              </div>
              <div className="text-[11px] text-[#8C7E6E] mt-0.5">
                Modify parameters below to recalculate Takt, Pitch, and Manpower. Click <strong>Update Capacity Plan</strong> when done.
              </div>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCancelEdit}
            className="border-[#E6DDCE] text-[#8C7E6E] hover:text-[#221912] hover:bg-white text-xs font-bold"
          >
            <X className="w-3.5 h-3.5 mr-1" />
            Cancel Edit
          </Button>
        </div>
      )}

      {/* ── 2. Order & Shift Input Configuration ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Order, Style & Shift Selection */}
        <div className="bg-white border border-[#E6DDCE] rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E6DDCE] pb-3">
            <span className="p-2 bg-[#9C5B3C]/10 text-[#9C5B3C] rounded-xl font-bold">
              <Calculator className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-extrabold text-[#221912]">Order &amp; Routing Profile</h3>
          </div>

          <div className="space-y-3 text-xs">
            {/* Order Selector */}
            <div className="space-y-1">
              <label className="font-bold text-[#8C7E6E] uppercase text-[10px]">Select Production Order *</label>
              <select
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className="w-full px-3 py-2 bg-[#F6F1E8] border border-[#E6DDCE] rounded-xl font-bold text-[#221912] focus:outline-hidden focus:border-[#9C5B3C]"
              >
                {orders.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.orderNo} - {o.buyer || "Buyer"} ({((o as any).totalQuantity || (o as any).quantity || 1000)} pcs)
                  </option>
                ))}
              </select>
            </div>

            {/* Linked Bulletin Selector */}
            <div className="space-y-1">
              <label className="font-bold text-[#8C7E6E] uppercase text-[10px]">Operation Bulletin (OB) *</label>
              <select
                value={selectedBulletinId}
                onChange={(e) => setSelectedBulletinId(e.target.value)}
                className="w-full px-3 py-2 bg-[#F6F1E8] border border-[#E6DDCE] rounded-xl font-bold text-[#221912] focus:outline-hidden focus:border-[#9C5B3C]"
              >
                {bulletins.map(b => {
                  const smv = b.totalSmv || (b.lines ? b.lines.reduce((a, l) => a + (Number(l.smv) || 0), 0) : 0);
                  return (
                    <option key={b.id} value={b.id}>
                      {b.bulletinCode} - {b.name} (SMV: {(smv * 60).toFixed(1)}s, {b.lines?.length || 0} ops)
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Shift & Available Time */}
            <div className="space-y-1">
              <label className="font-bold text-[#8C7E6E] uppercase text-[10px]">Production Shift</label>
              <select
                value={selectedShiftId}
                onChange={(e) => setSelectedShiftId(e.target.value)}
                className="w-full px-3 py-2 bg-[#F6F1E8] border border-[#E6DDCE] rounded-xl font-bold text-[#221912] focus:outline-hidden focus:border-[#9C5B3C]"
              >
                {shifts.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.shiftName} ({s.startTime} - {s.endTime})
                  </option>
                ))}
              </select>
            </div>

            {/* Shift Time Breakdown Card */}
            <div className="p-3 bg-[#F6F1E8]/70 border border-[#E6DDCE] rounded-xl space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between text-[#8C7E6E]">
                <span>Gross Shift Time:</span>
                <span className="font-bold text-[#221912]">{calculations.shiftDurationMinutes} min</span>
              </div>
              <div className="flex justify-between text-[#8C7E6E]">
                <span>Break Deduction:</span>
                <span className="font-bold text-rose-700">-{calculations.breakDurationMinutes} min</span>
              </div>
              <div className="flex justify-between text-[#221912] pt-1 border-t border-[#E6DDCE] font-bold">
                <span>Net Operating Time:</span>
                <span className="text-[#9C5B3C] font-black">{calculations.netAvailableMinutes} min ({calculations.netAvailableSeconds}s)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Column: Target Demand Mode & Planned Efficiency */}
        <div className="bg-white border border-[#E6DDCE] rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E6DDCE] pb-3">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-50 text-emerald-800 rounded-xl font-bold">
                <Target className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-extrabold text-[#221912]">Demand &amp; Horizon Sizing</h3>
            </div>

            {/* Mode Switcher */}
            <div className="flex bg-[#F6F1E8] p-0.5 rounded-lg border border-[#E6DDCE]">
              <button
                type="button"
                onClick={() => setTargetMode("HORIZON")}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${
                  targetMode === "HORIZON" ? "bg-white text-[#221912] shadow-2xs" : "text-[#8C7E6E]"
                }`}
              >
                Horizon (Days)
              </button>
              <button
                type="button"
                onClick={() => setTargetMode("DIRECT_HOURLY")}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${
                  targetMode === "DIRECT_HOURLY" ? "bg-white text-[#221912] shadow-2xs" : "text-[#8C7E6E]"
                }`}
              >
                Direct Pcs/Hr
              </button>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            {targetMode === "HORIZON" ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-[#8C7E6E] uppercase text-[10px]">Order Quantity (pcs)</label>
                    <input
                      type="number"
                      min="1"
                      value={orderQuantity}
                      onChange={(e) => setOrderQuantity(parseInt(e.target.value, 10) || 1)}
                      className="w-full px-3 py-2 bg-[#F6F1E8] border border-[#E6DDCE] rounded-xl font-mono font-bold text-[#221912]"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-[#8C7E6E] uppercase text-[10px]">Available Days</label>
                      {orderScheduleDates && (
                        <span className="text-[10px] text-[#9C5B3C] font-mono font-bold">
                          {orderScheduleDates.workingDaysCount}d
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={availableDays}
                      onChange={(e) => setAvailableDays(parseInt(e.target.value, 10) || 1)}
                      className="w-full px-3 py-2 bg-[#F6F1E8] border border-[#E6DDCE] rounded-xl font-mono font-bold text-[#221912]"
                    />
                  </div>
                </div>

                {orderScheduleDates && (
                  <div className="p-2.5 bg-[#FAF7F2] border border-[#E6DDCE] rounded-xl text-[11px] text-[#8C7E6E] flex items-center justify-between font-mono">
                    <span>Target: <strong className="text-[#221912] font-semibold">{orderScheduleDates.plannedCompletionFormatted}</strong></span>
                    <span>Ship Due: <strong className="text-[#9C5B3C] font-semibold">{orderScheduleDates.deliveryFormatted}</strong></span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                <label className="font-bold text-[#8C7E6E] uppercase text-[10px]">Direct Target Hourly Output (pcs/hr)</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={directHourlyTarget}
                  onChange={(e) => setDirectHourlyTarget(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 bg-[#F6F1E8] border border-[#E6DDCE] rounded-xl font-mono font-bold text-[#221912]"
                />
              </div>
            )}

            {/* Planned Line Efficiency (IE Standard Presets) */}
            <div className="space-y-2 pt-2 border-t border-[#E6DDCE]">
              <div className="flex items-center justify-between">
                <label className="font-bold text-[#8C7E6E] uppercase text-[10px] flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-[#9C5B3C]" /> Planned Line Efficiency (%)
                </label>
                <span className="font-mono font-black text-sm text-[#9C5B3C]">{plannedEfficiency}%</span>
              </div>

              {/* Quick Presets */}
              <div className="grid grid-cols-4 gap-1.5">
                {[65, 75, 80, 85].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setPlannedEfficiency(val)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-mono font-bold transition-all border ${
                      plannedEfficiency === val
                        ? "bg-[#9C5B3C] text-white border-[#9C5B3C] shadow-2xs"
                        : "bg-[#F6F1E8] text-[#8C7E6E] border-[#E6DDCE] hover:border-[#9C5B3C]"
                    }`}
                  >
                    {val}% {val === 80 && "★"}
                  </button>
                ))}
              </div>

              <input
                type="range"
                min="40"
                max="100"
                step="1"
                value={plannedEfficiency}
                onChange={(e) => setPlannedEfficiency(parseInt(e.target.value, 10))}
                className="w-full accent-[#9C5B3C] cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Key Industrial Engineering Calculations Summary */}
        <div className="bg-white border border-[#E6DDCE] rounded-2xl p-5 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#E6DDCE] pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-[#9C5B3C]/10 text-[#9C5B3C] rounded-xl font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-extrabold text-[#221912]">Industrial Engineering Plan</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10.5px] font-mono font-bold">
                {plannedEfficiency}% Feasible
              </span>
            </div>

            <div className="mt-4 space-y-2.5 text-xs">
              {/* Target Shift Output */}
              <div className="flex items-baseline justify-between p-2.5 bg-[#FAF7F2] rounded-xl border border-[#E6DDCE]">
                <span className="text-[#8C7E6E] font-bold">Target Shift Output:</span>
                <div className="text-right">
                  <span className="text-xl font-black font-mono text-[#221912]">{calculations.targetShiftOutput}</span>
                  <span className="text-[10px] text-[#8C7E6E] ml-1">pcs / shift</span>
                </div>
              </div>

              {/* Customer Takt Time */}
              <div className="flex items-baseline justify-between p-2.5 bg-[#F6F1E8]/50 rounded-xl border border-[#E6DDCE]">
                <span className="text-[#8C7E6E] font-bold">Customer Takt Time (Ttakt):</span>
                <div className="text-right">
                  <span className="text-xl font-black font-mono text-slate-800">{calculations.customerTaktSecs.toFixed(1)}</span>
                  <span className="text-[10px] text-[#8C7E6E] ml-1">sec/pc</span>
                </div>
              </div>

              {/* Designed Pitch Time */}
              <div className="flex items-baseline justify-between p-2.5 bg-[#FAF7F2] rounded-xl border border-[#E6DDCE]">
                <span className="text-[#8C7E6E] font-bold">Designed Pitch Time (Tpitch):</span>
                <div className="text-right">
                  <span className="text-2xl font-black font-mono text-[#9C5B3C]">{calculations.designedPitchSecs.toFixed(1)}</span>
                  <span className="text-[10px] text-[#8C7E6E] ml-1">sec/pc</span>
                </div>
              </div>

              {/* Planned Manpower Sizing */}
              <div className="flex items-baseline justify-between p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-emerald-900 font-bold">Planned Line Manpower:</span>
                <div className="text-right">
                  <span className="text-2xl font-black font-mono text-emerald-800">{calculations.plannedManpower}</span>
                  <span className="text-[10px] text-emerald-700 ml-1">operators</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#E6DDCE] text-[11px] text-[#8C7E6E]">
            Based on <strong className="text-[#221912] font-semibold">{calculations.totalSmvSeconds.toFixed(1)}s</strong> total SMV content and <strong className="text-[#221912] font-semibold">{plannedEfficiency}%</strong> planned efficiency baseline.
          </div>
        </div>

      </div>

      {/* ── 3. Four Core IE Transparent Engineering Cards (No LaTeX) ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Customer Takt Time */}
        <div className="bg-white border border-[#E6DDCE] rounded-2xl p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8C7E6E] flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#9C5B3C]" /> Customer Takt Time
            </span>
            <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
              Ttakt
            </span>
          </div>

          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black font-mono text-[#221912]">{calculations.customerTaktSecs.toFixed(1)}</span>
            <span className="text-xs font-mono font-bold text-[#8C7E6E]">sec / piece</span>
          </div>

          <div className="p-2.5 bg-[#F6F1E8] rounded-xl border border-[#E6DDCE] text-[11px] font-mono text-[#8C7E6E] space-y-0.5">
            <div className="text-[10px] font-bold text-[#221912]">Formula:</div>
            <div>Ttakt = Net Shift Secs / Target Shift Output</div>
            <div className="text-[#9C5B3C] font-bold">= {calculations.netAvailableSeconds}s / {calculations.targetShiftOutput} pcs</div>
          </div>
        </div>

        {/* Card 2: Required Design Capacity */}
        <div className="bg-white border border-[#E6DDCE] rounded-2xl p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Required Design Capacity
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              Rreq
            </span>
          </div>

          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black font-mono text-emerald-700">{calculations.requiredDesignCapacity.toFixed(1)}</span>
            <span className="text-xs font-mono font-bold text-[#8C7E6E]">pcs / hour</span>
          </div>

          <div className="p-2.5 bg-[#F6F1E8] rounded-xl border border-[#E6DDCE] text-[11px] font-mono text-[#8C7E6E] space-y-0.5">
            <div className="text-[10px] font-bold text-[#221912]">Formula:</div>
            <div>Rreq = Target Hourly Output / Planned Eff ({plannedEfficiency}%)</div>
            <div className="text-emerald-700 font-bold">= {calculations.targetHourlyOutput} / {(plannedEfficiency / 100).toFixed(2)}</div>
          </div>
        </div>

        {/* Card 3: Designed Pitch Time */}
        <div className="bg-white border border-[#E6DDCE] rounded-2xl p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#9C5B3C] flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-[#9C5B3C]" /> Designed Pitch Time
            </span>
            <span className="text-[10px] font-mono font-bold text-[#9C5B3C] bg-[#F6F1E8] px-1.5 py-0.5 rounded border border-[#E6DDCE]">
              Tpitch
            </span>
          </div>

          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black font-mono text-[#9C5B3C]">{calculations.designedPitchSecs.toFixed(1)}</span>
            <span className="text-xs font-mono font-bold text-[#8C7E6E]">sec / piece</span>
          </div>

          <div className="p-2.5 bg-[#F6F1E8] rounded-xl border border-[#E6DDCE] text-[11px] font-mono text-[#8C7E6E] space-y-0.5">
            <div className="text-[10px] font-bold text-[#221912]">Formula:</div>
            <div>Tpitch = 3600s / Required Design Capacity</div>
            <div className="text-[#9C5B3C] font-bold">= {calculations.customerTaktSecs.toFixed(1)}s × {(plannedEfficiency / 100).toFixed(2)}</div>
          </div>
        </div>

        {/* Card 4: Theoretical vs Planned Manpower */}
        <div className="bg-white border border-[#E6DDCE] rounded-2xl p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-800 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-indigo-600" /> Manpower Sizing
            </span>
            <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
              Nplan
            </span>
          </div>

          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black font-mono text-indigo-700">{calculations.plannedManpower}</span>
            <span className="text-xs font-mono font-bold text-[#8C7E6E]">operators (theo: {calculations.theoreticalManpower.toFixed(1)})</span>
          </div>

          <div className="p-2.5 bg-[#F6F1E8] rounded-xl border border-[#E6DDCE] text-[11px] font-mono text-[#8C7E6E] space-y-0.5">
            <div className="text-[10px] font-bold text-[#221912]">Formula:</div>
            <div>Nplan = Total SMV ({calculations.totalSmvSeconds.toFixed(1)}s) / Tpitch</div>
            <div className="text-indigo-700 font-bold">= {calculations.totalSmvSeconds.toFixed(1)}s / {calculations.designedPitchSecs.toFixed(1)}s</div>
          </div>
        </div>

      </div>

      {/* ── 4. Existing Capacity Plans Table ─────────────────────────── */}
      <DataCard noPad className="border border-[#E6DDCE] rounded-2xl overflow-hidden bg-white shadow-2xs">
        <div className="p-4 bg-[#FDFCFB] border-b border-[#E6DDCE] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#9C5B3C]" />
            <h3 className="text-xs font-extrabold text-[#221912] uppercase tracking-wider">
              Saved Capacity Plans ({existingPlans.length})
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E6DDCE] bg-[#F9F7F4] text-[10.5px] font-bold text-[#8C7E6E] uppercase tracking-wider">
                <th className="py-3 px-6">Plan Code</th>
                <th className="py-3 px-4">Order / Style</th>
                <th className="py-3 px-4 text-right">Order Qty</th>
                <th className="py-3 px-4 text-right">Target (pcs/hr)</th>
                <th className="py-3 px-4 text-right">Planned Eff</th>
                <th className="py-3 px-4 text-right">Takt (sec)</th>
                <th className="py-3 px-4 text-right">Pitch (sec)</th>
                <th className="py-3 px-4 text-center">Planned Ops</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6DDCE]">
              {existingPlans.map((plan) => (
                <tr key={plan.id} className="hover:bg-[#FFFDFB] transition-colors">
                  <td className="py-3 px-6 font-mono font-bold text-[#9C5B3C]">
                    {plan.planCode}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-[#221912]">{plan.orderNo || "Order"}</span>
                    <span className="text-[#8C7E6E] block text-[10px]">{plan.styleNo || "Style"}</span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-[#221912]">
                    {plan.orderQuantity}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                    {plan.targetHourlyOutput}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-[#221912]">
                    {plan.plannedEfficiency}%
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-amber-700">
                    {plan.customerTaktSecs ? plan.customerTaktSecs.toFixed(1) : "—"}s
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-[#9C5B3C]">
                    {plan.designedPitchSecs ? plan.designedPitchSecs.toFixed(1) : "—"}s
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 font-mono font-bold border border-indigo-200">
                      {plan.plannedManpower} ops
                    </span>
                  </td>
                  <td className="py-3 px-6 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditPlan(plan)}
                        className={`border-[#E6DDCE] text-xs font-bold px-2.5 py-1.5 flex items-center gap-1 transition-all ${
                          editingPlan?.id === plan.id
                            ? "bg-[#9C5B3C] text-white border-[#9C5B3C]"
                            : "text-[#8C7E6E] hover:text-[#9C5B3C] hover:border-[#9C5B3C] hover:bg-[#9C5B3C]/5"
                        }`}
                        title="Edit / Update Plan"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>{editingPlan?.id === plan.id ? "Editing" : "Edit"}</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPlanToDelete(plan)}
                        className="border-[#E6DDCE] text-[#8C7E6E] hover:text-rose-700 hover:border-rose-300 hover:bg-rose-50 text-xs font-bold px-2.5 py-1.5 flex items-center gap-1 transition-all"
                        title="Delete Plan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/line-design?capacityPlanId=${plan.id}&orderId=${plan.orderId}`)}
                        className="border-[#E6DDCE] text-[#221912] hover:bg-[#F6F1E8] text-xs font-bold px-3 py-1.5 flex items-center gap-1"
                      >
                        <span>Design Line</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {existingPlans.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-[#8C7E6E] italic">
                    No capacity plans created yet. Configure above and click "Save Plan &amp; Design Line".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </DataCard>

      {/* Delete Confirmation Modal */}
      {planToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-[#E6DDCE] shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#221912]">Delete Capacity Plan</h3>
                <p className="text-xs text-[#8C7E6E]">Are you sure you want to delete this plan?</p>
              </div>
            </div>

            <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-[#E6DDCE] text-xs space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-[#8C7E6E]">Plan Code:</span>
                <span className="font-bold text-[#9C5B3C]">{planToDelete.planCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8C7E6E]">Order:</span>
                <span className="font-bold text-[#221912]">{planToDelete.orderNo || "Order"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8C7E6E]">Style:</span>
                <span className="font-bold text-[#221912]">{planToDelete.styleNo || "Style"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8C7E6E]">Order Quantity:</span>
                <span className="font-bold text-[#221912]">{planToDelete.orderQuantity} pcs</span>
              </div>
            </div>

            <p className="text-[11px] text-[#8C7E6E]">
              This will permanently remove the saved capacity plan. Any associated line designs will be unlinked.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E6DDCE]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPlanToDelete(null)}
                disabled={deleting}
                className="border-[#E6DDCE] text-[#8C7E6E] hover:text-[#221912] text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm shadow-rose-600/20 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{deleting ? "Deleting..." : "Delete Plan"}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
