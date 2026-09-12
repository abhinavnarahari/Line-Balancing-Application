import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  Cpu, 
  Layers, 
  Users, 
  Target, 
  CheckCircle2, 
  AlertTriangle, 
  Save, 
  ChevronRight, 
  Sparkles,
  Pencil,
  Trash2,
  X,
  RotateCcw
} from "lucide-react";

import { PageHeader, DataCard } from "../../components/ui/PremiumUI";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";

import { lineDesignApi, type LineDesign, type LineDesignRequest } from "../../features/linedesign/api";
import { capacityApi, type CapacityPlan } from "../../features/capacity/api";
import { ordersApi, type Order } from "../../features/orders/api";
import { linesApi, type SewingLine } from "../../features/lines/api";
import { machinesApi, type Machine } from "../../features/machines/api";
import { bulletinsApi, type OperationBulletin } from "../../features/bulletins/api";
import { generateLineBalancingScenarios } from "../../features/bulletins/lineBalancingScenarios";
import { saveAppliedBulletinScenario } from "../../features/bulletins/bulletinScenarioStore";
import { WorkstationFlowPreview } from "../../features/linedesign/WorkstationFlowPreview";

export function LineDesignPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialCapacityPlanId = searchParams.get("capacityPlanId");
  const initialOrderId = searchParams.get("orderId");
  const initialScenarioId = searchParams.get("scenarioId") || "recommended";

  const [capacityPlans, setCapacityPlans] = useState<CapacityPlan[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [sewingLines, setSewingLines] = useState<SewingLine[]>([]);
  const [inventoryMachines, setInventoryMachines] = useState<Machine[]>([]);
  const [bulletins, setBulletins] = useState<OperationBulletin[]>([]);
  const [existingDesigns, setExistingDesigns] = useState<LineDesign[]>([]);

  const [selectedPlanId, setSelectedPlanId] = useState<string>(initialCapacityPlanId || "");
  const [selectedOrderId, setSelectedOrderId] = useState<string>(initialOrderId || "");
  const [selectedLineId, setSelectedLineId] = useState<string>("");
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(initialScenarioId);

  // Line Design Architecture State
  const [totalWorkstations, setTotalWorkstations] = useState<number>(22);
  const [totalOperators, setTotalOperators] = useState<number>(22);
  const [totalHelpers, setTotalHelpers] = useState<number>(2);
  const [totalQc, setTotalQc] = useState<number>(1);
  const [designCode, setDesignCode] = useState<string>("");

  // Edit and Delete States
  const [editingDesignId, setEditingDesignId] = useState<number | null>(null);
  const [editingDesignCode, setEditingDesignCode] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [designToDelete, setDesignToDelete] = useState<LineDesign | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [plansRes, ordersRes, linesRes, machinesRes, bulRes, designsRes] = await Promise.all([
          capacityApi.getPlans(),
          ordersApi.getOrders(),
          linesApi.getLines(true),
          machinesApi.getMachines({ active: true }),
          bulletinsApi.getBulletins(),
          lineDesignApi.getDesigns(),
        ]);

        setCapacityPlans(plansRes || []);
        setOrders(ordersRes || []);
        setSewingLines(linesRes || []);
        setInventoryMachines(machinesRes || []);
        setBulletins(bulRes || []);
        setExistingDesigns(designsRes || []);

        if (plansRes && plansRes.length > 0 && !selectedPlanId) {
          setSelectedPlanId(String(plansRes[0].id));
        }
        if (ordersRes && ordersRes.length > 0 && !selectedOrderId) {
          setSelectedOrderId(String(ordersRes[0].id));
        }
        if (linesRes && linesRes.length > 0 && !selectedLineId) {
          setSelectedLineId(String(linesRes[0].id));
        }
      } catch (err) {
        console.error("Failed to load line design dependencies:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const currentPlan = useMemo(() => {
    return capacityPlans.find(p => String(p.id) === String(selectedPlanId)) || null;
  }, [capacityPlans, selectedPlanId]);

  const currentOrder = useMemo(() => {
    if (currentPlan) {
      return orders.find(o => String(o.id) === String(currentPlan.orderId)) || null;
    }
    return orders.find(o => String(o.id) === String(selectedOrderId)) || (orders.length > 0 ? orders[0] : null);
  }, [orders, currentPlan, selectedOrderId]);

  const currentBulletin = useMemo(() => {
    if (currentPlan && currentPlan.bulletinId) {
      const found = bulletins.find(b => String(b.id) === String(currentPlan.bulletinId));
      if (found) return found;
    }
    if (currentOrder && currentOrder.styleId) {
      const found = bulletins.find(b => (b.styles || []).some(s => String(s.id) === String(currentOrder.styleId)));
      if (found) return found;
    }
    return bulletins.length > 0 ? bulletins[0] : null;
  }, [bulletins, currentPlan, currentOrder]);

  // Intelligent Balancing Scenarios Simulation
  const intelligentScenarios = useMemo(() => {
    if (!currentBulletin || !currentBulletin.lines || currentBulletin.lines.length === 0) {
      return [];
    }
    const opSteps = currentBulletin.lines.map((l, idx) => ({
      id: l.id || `op-${idx}`,
      sequence: l.sequence || idx + 1,
      name: l.operationName || `Operation ${idx + 1}`,
      code: l.operationCode || `OP-${String(idx + 1).padStart(3, "0")}`,
      smv: Number(l.smv) || 0.5,
      machineType: l.machineType || "Single Needle Lockstitch",
    }));

    const plannedEff = currentPlan?.plannedEfficiency || 80;
    const targetOps = currentPlan?.plannedManpower || undefined;
    const targetHourly = currentPlan?.targetHourlyOutput || undefined;
    const targetPitchSecs = currentPlan?.designedPitchSecs || undefined;
    return generateLineBalancingScenarios(opSteps, 8, targetOps, plannedEff, targetHourly, targetPitchSecs);
  }, [currentBulletin, currentPlan]);

  const activeScenario = useMemo(() => {
    return intelligentScenarios.find(s => s.id === selectedScenarioId) || intelligentScenarios[1] || intelligentScenarios[0] || null;
  }, [intelligentScenarios, selectedScenarioId]);

  // Sync parameters when scenario or plan changes
  useEffect(() => {
    if (editingDesignId) return; // Do not overwrite design code or custom headcount when actively editing a saved design

    if (activeScenario) {
      setTotalWorkstations(activeScenario.workstationCount);
      setTotalOperators(activeScenario.totalOperators);
      if (currentPlan) {
        setDesignCode(`LD-${currentPlan.planCode || "PLAN"}-${activeScenario.id.toUpperCase()}`);
      } else {
        setDesignCode(`LD-ORDER-${currentOrder?.id || 1}-${activeScenario.id.toUpperCase()}`);
      }
    } else if (currentPlan?.plannedManpower) {
      setTotalWorkstations(currentPlan.plannedManpower);
      setTotalOperators(currentPlan.plannedManpower);
      setDesignCode(`LD-${currentPlan.planCode || "PLAN"}`);
    }
  }, [activeScenario, currentPlan, currentOrder, editingDesignId]);

  // Machine Breakdown & Inventory Matching (based on active scenario or bulletin)
  const machineRequirements = useMemo(() => {
    const reqCounts: Record<string, number> = {};

    if (activeScenario && activeScenario.workstations) {
      activeScenario.workstations.forEach(ws => {
        const type = (ws.primaryMachineType || "Single Needle Lockstitch").trim();
        reqCounts[type] = (reqCounts[type] || 0) + (ws.allocatedMachines || 1);
      });
    } else if (currentBulletin && currentBulletin.lines) {
      currentBulletin.lines.forEach(l => {
        const type = (l.machineType || "Single Needle Lockstitch").trim();
        reqCounts[type] = (reqCounts[type] || 0) + 1;
      });
    }

    const invCounts: Record<string, number> = {};
    inventoryMachines.forEach(m => {
      const type = (m.machineType || "Single Needle Lockstitch").trim();
      invCounts[type] = (invCounts[type] || 0) + 1;
    });

    return Object.entries(reqCounts).map(([type, reqQty]) => {
      const availQty = invCounts[type] || 0;
      const shortage = Math.max(0, reqQty - availQty);
      return {
        machineType: type,
        requiredQty: reqQty,
        availableQty: availQty,
        shortageQty: shortage,
      };
    });
  }, [activeScenario, currentBulletin, inventoryMachines]);

  const totalRequiredMachines = useMemo(() => {
    return machineRequirements.reduce((acc, m) => acc + m.requiredQty, 0);
  }, [machineRequirements]);

  const totalShortage = useMemo(() => {
    return machineRequirements.reduce((acc, m) => acc + m.shortageQty, 0);
  }, [machineRequirements]);

  const handleEditDesign = (design: LineDesign) => {
    setEditingDesignId(design.id || null);
    setEditingDesignCode(design.designCode);
    setDesignCode(design.designCode);
    if (design.lineId) setSelectedLineId(String(design.lineId));
    if (design.capacityPlanId) {
      setSelectedPlanId(String(design.capacityPlanId));
    } else if (design.orderId) {
      setSelectedOrderId(String(design.orderId));
      setSelectedPlanId("");
    }
    setTotalWorkstations(design.totalWorkstations || 1);
    setTotalOperators(design.totalOperators || 1);
    setTotalHelpers(design.totalHelpers || 0);
    setTotalQc(design.totalQc || 0);
    if (design.strategyName) {
      setSelectedScenarioId(design.strategyName);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
    showToast(`Loaded design '${design.designCode}' for editing.`);
  };

  const handleCancelEdit = () => {
    setEditingDesignId(null);
    setEditingDesignCode(null);
    if (currentPlan) {
      setDesignCode(`LD-${currentPlan.planCode || "PLAN"}-${activeScenario?.id ? activeScenario.id.toUpperCase() : "RECOMMENDED"}`);
    }
    showToast("Cancelled design editing.");
  };

  const handleConfirmDelete = async () => {
    if (!designToDelete?.id) return;
    setDeleting(true);
    try {
      await lineDesignApi.deleteDesign(designToDelete.id);
      showToast(`✓ Line Design '${designToDelete.designCode}' deleted successfully.`);
      const refreshed = await lineDesignApi.getDesigns();
      setExistingDesigns(refreshed);
      setDeleteModalOpen(false);
      setDesignToDelete(null);
      if (editingDesignId === designToDelete.id) {
        handleCancelEdit();
      }
    } catch (err: any) {
      console.error("Failed to delete line design:", err);
      showToast(`❌ ${err?.response?.data?.message || err?.message || "Failed to delete line design"}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveLineDesign = async () => {
    if (!selectedLineId) {
      alert("Please select a Sewing Line");
      return;
    }
    setSaving(true);
    try {
      const selectedLine = sewingLines.find(l => String(l.id) === String(selectedLineId));
      const targetHourly = currentPlan?.targetHourlyOutput || (activeScenario ? activeScenario.hourlyOutputPlanned : 70);
      const plannedEff = currentPlan?.plannedEfficiency || (activeScenario?.lineBalanceEfficiency ? Number(activeScenario.lineBalanceEfficiency.toFixed(1)) : 80);
      const pitchSecs = currentPlan?.designedPitchSecs || (activeScenario ? Number((activeScenario.pitchTime * 60).toFixed(1)) : 41.1);

      const payload: LineDesignRequest = {
        designCode: designCode || `LD-LINE-${selectedLineId}`,
        capacityPlanId: currentPlan ? Number(currentPlan.id) : undefined,
        orderId: currentPlan ? Number(currentPlan.orderId) : currentOrder ? Number(currentOrder.id) : undefined,
        bulletinId: currentBulletin ? Number(currentBulletin.id) : undefined,
        lineId: Number(selectedLineId),
        shiftId: currentPlan ? Number(currentPlan.shiftId) : undefined,
        totalWorkstations: totalWorkstations,
        totalOperators: totalOperators,
        totalHelpers: totalHelpers,
        totalQc: totalQc,
        totalMachines: totalRequiredMachines,
        targetHourlyOutput: targetHourly,
        plannedEfficiency: plannedEff,
        designedPitchSecs: pitchSecs,
        lineBalanceEfficiency: activeScenario?.lineBalanceEfficiency || 0,
        strategyName: activeScenario?.id || "recommended",
        stationAllocations: activeScenario?.stationAllocations ? JSON.stringify(activeScenario.stationAllocations) : undefined,
        workstationsJson: activeScenario?.workstations ? JSON.stringify(activeScenario.workstations) : undefined,
        status: "DRAFT",
        machines: machineRequirements.map(m => ({
          machineType: m.machineType,
          requiredQty: m.requiredQty,
          availableQty: m.availableQty,
          notes: m.shortageQty > 0 ? `Shortage of ${m.shortageQty} units` : "Available in factory inventory",
        })),
      };

      let saved: LineDesign;
      if (editingDesignId) {
        saved = await lineDesignApi.updateDesign(editingDesignId, payload);
        showToast(`✓ Line Design '${saved.designCode}' updated successfully!`);
      } else {
        saved = await lineDesignApi.saveDesign(payload);
        showToast(`✓ Line Design '${saved.designCode}' saved successfully!`);
      }

      // Also persist to bulletin scenario store so line balance immediately reflects the strategy
      if (activeScenario) {
        saveAppliedBulletinScenario({
          targetLineId: selectedLineId,
          targetLineName: selectedLine?.lineName,
          bulletinId: currentBulletin?.id,
          bulletinCode: currentBulletin?.bulletinCode || "",
          styleIds: currentBulletin?.styles?.map(s => s.id) || (currentOrder?.styleId ? [currentOrder.styleId] : []),
          scenarioId: activeScenario.id,
          scenarioName: activeScenario.name,
          badge: activeScenario.badge,
          totalOperators: activeScenario.totalOperators,
          totalMachines: activeScenario.totalMachines,
          workstationCount: activeScenario.workstationCount,
          pitchTimeSecs: pitchSecs,
          lineBalanceEfficiency: activeScenario.lineBalanceEfficiency,
          hourlyOutput100: activeScenario.hourlyOutput100,
          dailyOutput100: activeScenario.dailyOutput100,
          stationAllocations: activeScenario.stationAllocations,
          appliedAt: new Date().toISOString(),
        });
      }

      const refreshed = await lineDesignApi.getDesigns();
      setExistingDesigns(refreshed);
      setEditingDesignId(null);
      setEditingDesignCode(null);

      setTimeout(() => {
        navigate(`/line-balance?lineDesignId=${saved.id}&orderId=${saved.orderId}&lineId=${saved.lineId || selectedLineId}&bulletinId=${currentBulletin?.id || ""}`);
      }, 1000);
    } catch (err: any) {
      console.error("Failed to save/update line design:", err);
      showToast(`❌ ${err?.response?.data?.message || err?.message || "Failed to save/update line design"}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] bg-[#F6F1E8]">
        <div className="flex flex-col items-center gap-3 text-[#8C7E6E]">
          <div className="w-8 h-8 border-3 border-[#9C5B3C] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold">Loading line design dependencies…</span>
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
        eyebrow="Industrial Engineering & Line Layout"
        title="Line Design & Workstation Architecture"
        description="Allocate sewing floor physical line, workstation count, operator budget, and reconcile machine equipment inventory."
        action={
          <div className="flex items-center gap-2.5">
            {editingDesignId && (
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelEdit}
                className="border-[#E6DDCE] text-[#221912] hover:bg-[#FAF7F2] text-xs font-bold flex items-center gap-1.5"
              >
                <X className="w-4 h-4 text-[#8C7E6E]" />
                <span>Cancel Edit</span>
              </Button>
            )}
            <Button
              type="button"
              onClick={handleSaveLineDesign}
              disabled={saving}
              className="bg-[#9C5B3C] hover:bg-[#B06C49] text-white shadow-md shadow-[#9C5B3C]/20 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>
                {saving 
                  ? (editingDesignId ? "Updating Design..." : "Saving Design...") 
                  : (editingDesignId ? "Update Design & Balance Line" : "Save Design & Balance Line")}
              </span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        }
      />

      {/* Active Editing Banner */}
      {editingDesignId && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-4 text-amber-900 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center font-bold shrink-0">
              <Pencil className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-xs">
                Editing Line Design: <span className="font-mono text-amber-950 font-black">{editingDesignCode}</span>
              </span>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Modify line parameters, workstation budget, equipment, or balancing strategy and click &quot;Update Design &amp; Balance Line&quot;.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancelEdit}
            className="border-amber-300 text-amber-900 hover:bg-amber-100 text-xs font-bold shrink-0"
          >
            Cancel Edit
          </Button>
        </div>
      )}

      {/* ── 2. Capacity Plan Link & Sewing Line Select ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Card: Plan Linkage & Line Selection */}
        <div className="bg-white border border-[#E6DDCE] rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E6DDCE] pb-3">
            <span className="p-2 bg-[#9C5B3C]/10 text-[#9C5B3C] rounded-xl font-bold">
              <Layers className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-extrabold text-[#221912]">Plan &amp; Floor Allocation</h3>
          </div>

          <div className="space-y-3 text-xs">
            {/* Capacity Plan Selector */}
            <div className="space-y-1">
              <label className="font-bold text-[#8C7E6E] uppercase text-[10px]">Source Capacity Plan</label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-3 py-2 bg-[#F6F1E8] border border-[#E6DDCE] rounded-xl font-bold text-[#221912] focus:outline-hidden focus:border-[#9C5B3C]"
              >
                <option value="">Direct Order Balancing (No Pre-Saved Plan)</option>
                {capacityPlans.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.planCode} - {p.orderNo || "Order"} ({p.plannedManpower} ops, {p.targetHourlyOutput} pcs/hr)
                  </option>
                ))}
              </select>
            </div>

            {/* Direct Order (if no plan selected) */}
            {!selectedPlanId && (
              <div className="space-y-1">
                <label className="font-bold text-[#8C7E6E] uppercase text-[10px]">Production Order *</label>
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
            )}

            {/* Sewing Line Selector */}
            <div className="space-y-1">
              <label className="font-bold text-[#8C7E6E] uppercase text-[10px]">Target Sewing Line *</label>
              <select
                value={selectedLineId}
                onChange={(e) => setSelectedLineId(e.target.value)}
                className="w-full px-3 py-2 bg-[#F6F1E8] border border-[#E6DDCE] rounded-xl font-bold text-[#221912] focus:outline-hidden focus:border-[#9C5B3C]"
              >
                {sewingLines.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.lineCode} - {l.lineName}
                  </option>
                ))}
              </select>
            </div>

            {/* Design Code */}
            <div className="space-y-1">
              <label className="font-bold text-[#8C7E6E] uppercase text-[10px]">Design Code Identifier</label>
              <input
                type="text"
                value={designCode}
                onChange={(e) => setDesignCode(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E6DDCE] rounded-xl font-mono font-bold text-[#221912] focus:outline-hidden focus:border-[#9C5B3C]"
              />
            </div>
          </div>
        </div>

        {/* Middle Card: Workstation & Headcount Budget */}
        <div className="bg-white border border-[#E6DDCE] rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E6DDCE] pb-3">
            <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl font-bold">
              <Users className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-extrabold text-[#221912]">Workstations &amp; Headcount Budget</h3>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-[#8C7E6E] uppercase text-[10px]">Total Workstations</label>
              <input
                type="number"
                min="1"
                max="100"
                value={totalWorkstations}
                onChange={(e) => setTotalWorkstations(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 bg-[#F6F1E8] border border-[#E6DDCE] rounded-xl font-mono font-bold text-[#221912]"
              />
              <span className="text-[10px] text-[#8C7E6E]">Physical stations (S01..S{String(totalWorkstations).padStart(2, "0")})</span>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#8C7E6E] uppercase text-[10px]">Sewing Operators</label>
              <input
                type="number"
                min="1"
                max="100"
                value={totalOperators}
                onChange={(e) => setTotalOperators(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 bg-[#F6F1E8] border border-[#E6DDCE] rounded-xl font-mono font-bold text-[#9C5B3C]"
              />
              <span className="text-[10px] text-[#8C7E6E]">Skilled sewing headcount</span>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#8C7E6E] uppercase text-[10px]">Line Helpers</label>
              <input
                type="number"
                min="0"
                max="20"
                value={totalHelpers}
                onChange={(e) => setTotalHelpers(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 bg-[#F6F1E8] border border-[#E6DDCE] rounded-xl font-mono font-bold text-[#221912]"
              />
              <span className="text-[10px] text-[#8C7E6E]">Feeding / bundle movement</span>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#8C7E6E] uppercase text-[10px]">Quality Checkers (QC)</label>
              <input
                type="number"
                min="0"
                max="10"
                value={totalQc}
                onChange={(e) => setTotalQc(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 bg-[#F6F1E8] border border-[#E6DDCE] rounded-xl font-mono font-bold text-[#221912]"
              />
              <span className="text-[10px] text-[#8C7E6E]">End-line inspection</span>
            </div>
          </div>
        </div>

        {/* Right Card: Design Target Pitch & Capacity Metrics */}
        <div className="bg-white border border-[#E6DDCE] rounded-2xl p-5 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#E6DDCE] pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-[#9C5B3C]/10 text-[#9C5B3C] rounded-xl font-bold">
                  <Target className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-extrabold text-[#221912]">Design Pace Ceiling</h3>
              </div>
              {activeScenario && currentPlan?.targetHourlyOutput ? (
                activeScenario.hourlyOutputPlanned >= currentPlan.targetHourlyOutput ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10.5px] font-mono font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Target Feasible
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-[10.5px] font-mono font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    Deficit: {activeScenario.hourlyOutputPlanned - currentPlan.targetHourlyOutput} pcs/hr
                  </span>
                )
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10.5px] font-mono font-bold">
                  Line Ready
                </span>
              )}
            </div>

            <div className="mt-4 space-y-2.5 text-xs">
              <div className="flex justify-between items-baseline p-2.5 bg-[#FAF7F2] rounded-xl border border-[#E6DDCE]">
                <span className="text-[#8C7E6E] font-bold">Designed Pitch Time:</span>
                <span className="text-2xl font-black font-mono text-[#9C5B3C]">
                  {currentPlan?.designedPitchSecs ? currentPlan.designedPitchSecs.toFixed(1) : (activeScenario ? (activeScenario.pitchTime * 60).toFixed(1) : "41.1")}s
                </span>
              </div>

              <div className="flex justify-between items-baseline p-2.5 bg-[#F6F1E8]/50 rounded-xl border border-[#E6DDCE]">
                <span className="text-[#8C7E6E] font-bold">Layout Bottleneck Pace:</span>
                <span className="text-xl font-black font-mono text-slate-800">
                  {activeScenario ? (activeScenario.bottleneckCycleTime * 60).toFixed(1) : (currentPlan?.customerTaktSecs ? currentPlan.customerTaktSecs.toFixed(1) : "51.4")}s
                </span>
              </div>

              <div className="flex justify-between items-baseline p-2.5 bg-[#FAF7F2] rounded-xl border border-[#E6DDCE]">
                <span className="text-[#8C7E6E] font-bold">Target Demand Output:</span>
                <span className="text-xl font-black font-mono text-emerald-700">
                  {currentPlan?.targetHourlyOutput || (activeScenario ? activeScenario.hourlyOutputPlanned : 70)} pcs/hr
                </span>
              </div>

              <div className="flex justify-between items-baseline p-2.5 bg-[#F6F1E8]/50 rounded-xl border border-[#E6DDCE]">
                <span className="text-[#8C7E6E] font-bold">Layout Output Capacity:</span>
                <div className="text-right">
                  <span className="text-xl font-black font-mono text-[#9C5B3C]">
                    {activeScenario ? activeScenario.hourlyOutputPlanned : (currentPlan?.targetHourlyOutput || 70)}
                  </span>
                  <span className="text-[10px] text-[#8C7E6E] ml-1">pcs/hr @ {currentPlan?.plannedEfficiency || (activeScenario?.plannedEfficiency || 80)}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#E6DDCE] text-[11px] text-[#8C7E6E]">
            Total Line Headcount: <strong className="text-[#221912] font-bold">{totalOperators + totalHelpers + totalQc} staff</strong> ({totalOperators} sewers + {totalHelpers} helpers + {totalQc} QC)
          </div>
        </div>

      </div>

      {/* ── 3. Intelligent Balancing Scenarios Selector ─────────────── */}
      {intelligentScenarios.length > 0 && (
        <div className="bg-white border border-[#E6DDCE] rounded-3xl p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E6DDCE] pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-2xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-[#221912]">
                  Select Intelligent Balancing Strategy for Physical Line Layout
                </h3>
                <p className="text-[11px] text-[#8C7E6E]">
                  Click a strategy to automatically configure workstations, parallel benches, and machine counts.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {intelligentScenarios.map((scenario) => {
              const isSelected = selectedScenarioId === scenario.id;
              return (
                <div
                  key={scenario.id}
                  onClick={() => setSelectedScenarioId(scenario.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? "bg-gradient-to-br from-[#FFFDFB] to-[#FDF9F5] border-[#9C5B3C] shadow-md ring-2 ring-[#9C5B3C]/20"
                      : "bg-[#FDFCFB] border-[#E6DDCE] hover:border-[#9C5B3C]/50 hover:bg-white"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-[#221912]">{scenario.name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        scenario.id === "recommended" ? "bg-emerald-100 text-emerald-800" : "bg-[#F6F1E8] text-[#8C7E6E]"
                      }`}>
                        {scenario.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#8C7E6E] mt-1 line-clamp-2">{scenario.tagline}</p>

                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#E6DDCE] text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-[#8C7E6E] block">Workstations</span>
                        <span className="font-black text-sm text-[#221912]">{scenario.workstationCount} benches</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#8C7E6E] block">Operators</span>
                        <span className="font-black text-sm text-[#9C5B3C]">{scenario.totalOperators} ops</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#8C7E6E] block">Parallel Splits</span>
                        <span className="font-bold text-xs text-indigo-700">{scenario.parallelStationCount || 0} benches</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#8C7E6E] block">Efficiency (LBE)</span>
                        <span className="font-bold text-xs text-emerald-700">{scenario.lineBalanceEfficiency.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 flex items-center justify-between text-[11px] font-bold border-t border-[#E6DDCE]">
                    <span className={isSelected ? "text-[#9C5B3C] font-extrabold" : "text-[#8C7E6E]"}>
                      {isSelected ? "✓ Applied to Layout" : "Select Strategy"}
                    </span>
                    <div className="text-right">
                      <span className="text-[#221912] font-mono font-bold">
                        {scenario.hourlyOutputPlanned} pcs/hr
                      </span>
                      {currentPlan?.targetHourlyOutput ? (
                        <span className={`text-[10px] ml-1.5 font-bold ${
                          scenario.hourlyOutputPlanned >= currentPlan.targetHourlyOutput
                            ? "text-emerald-700"
                            : "text-amber-700"
                        }`}>
                          ({scenario.hourlyOutputPlanned >= currentPlan.targetHourlyOutput 
                            ? "✓ Meets Target" 
                            : `${scenario.hourlyOutputPlanned - currentPlan.targetHourlyOutput} pcs/hr`})
                        </span>
                      ) : (
                        <span className="text-[#8C7E6E] text-[10px] ml-1 font-normal">@{scenario.plannedEfficiency || 80}%</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Workstations Structure Flow Pipeline Preview */}
          {activeScenario && activeScenario.workstations && (
            <WorkstationFlowPreview scenario={activeScenario} />
          )}
        </div>
      )}

      {/* ── 4. Machine Planning & Inventory Reconciliation ───────────── */}
      <DataCard noPad className="border border-[#E6DDCE] rounded-2xl overflow-hidden bg-white shadow-2xs">
        <div className="p-4 bg-[#FDFCFB] border-b border-[#E6DDCE] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#9C5B3C]" />
            <h3 className="text-xs font-extrabold text-[#221912] uppercase tracking-wider">
              Machine Layout &amp; Inventory Availability Reconciliation
            </h3>
          </div>

          {totalShortage > 0 ? (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-200 rounded-full text-xs font-bold text-rose-800">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Machine Shortage: {totalShortage} units</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-bold text-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>All Equipment Available in Floor Inventory</span>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E6DDCE] bg-[#F9F7F4] text-[10.5px] font-bold text-[#8C7E6E] uppercase tracking-wider">
                <th className="py-3 px-6">Machine Category / Type</th>
                <th className="py-3 px-4 text-right">Required (Scenario Layout)</th>
                <th className="py-3 px-4 text-right">Available (Factory Inventory)</th>
                <th className="py-3 px-4 text-right">Shortage</th>
                <th className="py-3 px-6 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6DDCE]">
              {machineRequirements.map((m, idx) => (
                <tr key={idx} className="hover:bg-[#FFFDFB] transition-colors">
                  <td className="py-3 px-6 font-bold text-[#221912]">
                    {m.machineType}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-[#221912]">
                    {m.requiredQty}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                    {m.availableQty}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold">
                    {m.shortageQty > 0 ? (
                      <span className="text-rose-600">-{m.shortageQty}</span>
                    ) : (
                      <span className="text-[#8C7E6E]">0</span>
                    )}
                  </td>
                  <td className="py-3 px-6 text-center">
                    {m.shortageQty > 0 ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-[10.5px] font-bold">
                        Shortage
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10.5px] font-bold">
                        Fulfilled
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {machineRequirements.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-[#8C7E6E] italic">
                    Select a Capacity Plan linked to an Operation Bulletin to view machine equipment breakdown.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </DataCard>

      {/* ── 5. Existing Line Designs Table ─────────────────────────── */}
      <DataCard noPad className="border border-[#E6DDCE] rounded-2xl overflow-hidden bg-white shadow-2xs">
        <div className="p-4 bg-[#FDFCFB] border-b border-[#E6DDCE] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#9C5B3C]" />
            <h3 className="text-xs font-extrabold text-[#221912] uppercase tracking-wider">
              Saved Line Designs ({existingDesigns.length})
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E6DDCE] bg-[#F9F7F4] text-[10.5px] font-bold text-[#8C7E6E] uppercase tracking-wider">
                <th className="py-3 px-6">Design Code</th>
                <th className="py-3 px-4">Sewing Line</th>
                <th className="py-3 px-4 text-center">Workstations</th>
                <th className="py-3 px-4 text-center">Sewers</th>
                <th className="py-3 px-4 text-center">Helpers</th>
                <th className="py-3 px-4 text-center">QC</th>
                <th className="py-3 px-4 text-right">Target (pcs/hr)</th>
                <th className="py-3 px-4 text-right">Planned Eff</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6DDCE]">
              {existingDesigns.map((design) => (
                <tr key={design.id} className="hover:bg-[#FFFDFB] transition-colors">
                  <td className="py-3 px-6 font-mono font-bold text-[#9C5B3C]">
                    {design.designCode}
                  </td>
                  <td className="py-3 px-4 font-bold text-[#221912]">
                    {design.lineName || `Line ${design.lineId}`}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-[#221912]">
                    {design.totalWorkstations}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-emerald-700">
                    {design.totalOperators}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-[#8C7E6E]">
                    {design.totalHelpers || 0}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-[#8C7E6E]">
                    {design.totalQc || 0}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-[#221912]">
                    {design.targetHourlyOutput || "—"}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-[#9C5B3C]">
                    {design.plannedEfficiency}%
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                      {design.status || "DRAFT"}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditDesign(design)}
                        title="Edit Design"
                        className="px-2.5 py-1 text-xs font-bold border-[#E6DDCE] text-[#9C5B3C] hover:bg-[#F6F1E8] hover:border-[#9C5B3C]/50"
                      >
                        <Pencil className="w-3.5 h-3.5 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setDesignToDelete(design);
                          setDeleteModalOpen(true);
                        }}
                        title="Delete Design"
                        className="px-2.5 py-1 text-xs font-bold border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1 text-rose-500" />
                        Delete
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/line-balance?lineDesignId=${design.id}&orderId=${design.orderId}&lineId=${design.lineId}`)}
                        className="border-[#E6DDCE] text-[#221912] hover:bg-[#F6F1E8] text-xs font-bold"
                      >
                        Balance Line →
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {existingDesigns.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-6 text-center text-[#8C7E6E] italic">
                    No line designs created yet. Configure above and click "Save Design &amp; Balance Line".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </DataCard>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => !deleting && setDeleteModalOpen(false)}
        title="Confirm Delete Line Design"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-50/80 border border-rose-200">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-900">
              <p className="font-bold">Are you sure you want to delete this Line Design?</p>
              <p className="mt-1 font-mono text-rose-700 font-bold">
                {designToDelete?.designCode}
              </p>
              <p className="mt-1 text-rose-600">
                This action cannot be undone. Any balancing configurations tied to this design will be permanently removed.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleting}
              className="border-[#E6DDCE] text-[#221912]"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-rose-600 hover:bg-rose-700 text-white border-none shadow-xs"
            >
              {deleting ? "Deleting..." : "Delete Design"}
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}

