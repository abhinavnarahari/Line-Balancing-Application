import { useState, useEffect, Fragment } from "react";
import {
  Layers,
  Users,
  Sliders,
  TrendingUp,
  Cpu,
  History,
  ChevronRight,
  FolderOpen,
  X,
} from "lucide-react";
import { PageHeader } from "../../components/ui/PremiumUI";
import { allocationApi } from "../../features/allocation/api";
import { shiftsApi, type Shift } from "../../features/shifts/api";
import { useMasterDataSubscription } from "../../utils/masterDataEvents";
import type {
  PlanningContextResponse,
  OperatorPoolItem,
  LineRequirementItem,
  PreflightValidationResponse,
  OptimizationResponse,
  AllocationAssignmentItem,
  AuditLogItem,
  OptimizationRequest,
  RunSummaryItem,
} from "../../features/allocation/types";

import { PlanningContextStep } from "../../features/allocation/components/PlanningContextStep";
import { OperatorPoolStep } from "../../features/allocation/components/OperatorPoolStep";
import { LineRequirementsStep } from "../../features/allocation/components/LineRequirementsStep";
import { OptimizationSolverStep } from "../../features/allocation/components/OptimizationSolverStep";
import { OptimizationResultsStep } from "../../features/allocation/components/OptimizationResultsStep";
import { ManualOverrideModal } from "../../features/allocation/components/ManualOverrideModal";
import { ApprovalApplyModal } from "../../features/allocation/components/ApprovalApplyModal";
import { AllocationAuditHistory } from "../../features/allocation/components/AllocationAuditHistory";

export function OperatorAllocationPage() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [planningDate, setPlanningDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [selectedLineIds, setSelectedLineIds] = useState<number[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [selectedShiftId, setSelectedShiftId] = useState<number | undefined>(undefined);

  // Data States
  const [context, setContext] = useState<PlanningContextResponse | null>(null);
  const [operatorPool, setOperatorPool] = useState<OperatorPoolItem[]>([]);
  const [lineRequirements, setLineRequirements] = useState<LineRequirementItem[]>([]);
  const [validation, setValidation] = useState<PreflightValidationResponse | null>(null);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResponse | null>(null);

  // Historical Runs
  const [historicalRuns, setHistoricalRuns] = useState<RunSummaryItem[]>([]);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState<boolean>(false);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  // Loading States
  const [loadingContext, setLoadingContext] = useState<boolean>(true);
  const [loadingPool, setLoadingPool] = useState<boolean>(false);
  const [loadingLines, setLoadingLines] = useState<boolean>(false);
  const [isSolving, setIsSolving] = useState<boolean>(false);

  // Error & Status
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals
  const [overrideAssignment, setOverrideAssignment] = useState<AllocationAssignmentItem | null>(null);
  const [approvalModalMode, setApprovalModalMode] = useState<"APPROVE" | "APPLY" | null>(null);
  const [showAuditLogs, setShowAuditLogs] = useState<boolean>(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  // Load Shifts
  const fetchShifts = async () => {
    try {
      const activeShifts = await shiftsApi.getShifts(true);
      setShifts(activeShifts);
    } catch (err) {
      console.error("Failed to load shifts:", err);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  useMasterDataSubscription(["shift", "line", "operator", "attendance", "all"], () => {
    fetchShifts();
    if (planningDate) {
      loadContext(planningDate, selectedShiftId, selectedLineIds.length > 0 ? selectedLineIds : undefined);
    }
  });

  // 1. Load Initial Planning Context
  const loadContext = async (date: string, shiftId?: number, lines?: number[]) => {
    try {
      setLoadingContext(true);
      const res = await allocationApi.getPlanningContext(date, shiftId, lines);
      setContext(res);
      if (res.shiftId && (!selectedShiftId || selectedShiftId !== res.shiftId)) {
        setSelectedShiftId(res.shiftId);
      }
      if (selectedLineIds.length === 0 && res.selectedLines.length > 0) {
        setSelectedLineIds(res.selectedLines.map((l) => l.lineId));
      }
    } catch (err) {
      console.error("Failed to load planning context:", err);
    } finally {
      setLoadingContext(false);
    }
  };

  const loadPastRuns = async () => {
    try {
      setLoadingHistory(true);
      const runs = await allocationApi.getAllRuns();
      setHistoricalRuns(runs);
    } catch (err) {
      console.error("Failed to load historical runs:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadContext(planningDate, selectedShiftId);
    loadPastRuns();
  }, [planningDate, selectedShiftId]);

  // Load a historical run directly into Step 5
  const handleLoadPastRun = async (run: RunSummaryItem) => {
    try {
      setShowHistoryDrawer(false);
      const fullRun = await allocationApi.getRunDetail(run.runId);
      setOptimizationResult(fullRun);
      setCurrentStep(5);
    } catch (err) {
      console.error("Failed to load full run details:", err);
    }
  };

  // Toggle single line
  const handleToggleLine = (lineId: number) => {
    setSelectedLineIds((prev) => {
      const next = prev.includes(lineId)
        ? prev.filter((id) => id !== lineId)
        : [...prev, lineId];
      return next;
    });
  };

  // Select all lines
  const handleSelectAllLines = () => {
    if (!context) return;
    if (selectedLineIds.length === context.selectedLines.length) {
      setSelectedLineIds([]);
    } else {
      setSelectedLineIds(context.selectedLines.map((l) => l.lineId));
    }
  };

  // Step 2 Load: Operator Pool
  const handleGoToStep2 = async () => {
    setCurrentStep(2);
    try {
      setLoadingPool(true);
      const res = await allocationApi.getOperatorPool(planningDate, selectedShiftId);
      setOperatorPool(res);
    } catch (err) {
      console.error("Failed to load operator pool:", err);
    } finally {
      setLoadingPool(false);
    }
  };

  // Step 3 Load: Line Requirements & Preflight Validation
  const handleGoToStep3 = async () => {
    setCurrentStep(3);
    try {
      setLoadingLines(true);
      const [reqRes, valRes] = await Promise.all([
        allocationApi.getLineRequirements(selectedLineIds),
        allocationApi.validate({
          planningDate,
          shiftId: selectedShiftId,
          lineIds: selectedLineIds,
        }),
      ]);
      setLineRequirements(reqRes);
      setValidation(valRes);
    } catch (err) {
      console.error("Failed to load line requirements / validation:", err);
    } finally {
      setLoadingLines(false);
    }
  };

  // Rerun Preflight validation
  const handleRerunValidation = async () => {
    try {
      setLoadingLines(true);
      const valRes = await allocationApi.validate({
        planningDate,
        shiftId: selectedShiftId,
        lineIds: selectedLineIds,
      });
      setValidation(valRes);
    } catch (err) {
      console.error("Failed to validate:", err);
    } finally {
      setLoadingLines(false);
    }
  };

  // Step 4: Solver Trigger
  const handleRunOptimization = async (req: OptimizationRequest) => {
    try {
      setErrorMessage(null);
      setIsSolving(true);
      const payload: OptimizationRequest = {
        ...req,
        shiftId: req.shiftId || selectedShiftId,
      };
      const res = await allocationApi.optimize(payload);
      if (res && res.matrix) {
        setOptimizationResult(res);
        setCurrentStep(5);
        loadPastRuns(); // refresh history
      } else {
        throw new Error("Invalid optimization result received from engine.");
      }
    } catch (err: any) {
      console.error("Optimization failed:", err);
      const msg = err.response?.data?.message || err.message || "Optimization solver encountered an error. Please try again.";
      setErrorMessage(msg);
    } finally {
      setIsSolving(false);
    }
  };

  // Manual Override
  const handleSaveOverride = async (payload: {
    lineId: number;
    stationIndex: number;
    operatorId?: number | null;
    pinAsFixed?: boolean;
    justification?: string;
    performedBy?: string;
  }) => {
    if (!optimizationResult) return;
    try {
      const updated = await allocationApi.manualOverride(optimizationResult.runId, payload);
      setOptimizationResult(updated);
      setOverrideAssignment(null);
    } catch (err) {
      console.error("Failed to apply override:", err);
    }
  };

  // Approve & Apply
  const handleConfirmApprovalOrApply = async (payload: { name: string; notes: string }) => {
    if (!optimizationResult || !approvalModalMode) return;
    try {
      let updated: OptimizationResponse;
      if (approvalModalMode === "APPROVE") {
        updated = await allocationApi.approveRun(optimizationResult.runId, {
          approvedBy: payload.name,
          notes: payload.notes,
        });
      } else {
        updated = await allocationApi.applyRun(optimizationResult.runId, {
          appliedBy: payload.name,
          notes: payload.notes,
          updateFloorAssignments: true,
        });
      }
      setOptimizationResult(updated);
      setApprovalModalMode(null);
      loadPastRuns();
    } catch (err) {
      console.error("Approval/Apply failed:", err);
    }
  };

  // Load Audit Logs
  const handleOpenAuditLogs = async () => {
    if (!optimizationResult) return;
    try {
      const logs = await allocationApi.getAuditLogs(optimizationResult.runId);
      setAuditLogs(logs);
      setShowAuditLogs(true);
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    }
  };

  const steps = [
    { num: 1, title: "Planning Context", icon: Layers },
    { num: 2, title: "Operator Pool", icon: Users },
    { num: 3, title: "Line Demands", icon: Sliders },
    { num: 4, title: "Configure Solver", icon: Cpu },
    { num: 5, title: "Results & Governance", icon: TrendingUp },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Standardized Application PageHeader */}
      <PageHeader
        eyebrow="MULTI-LINE OPTIMIZATION • BALANCING"
        title="Multi-Line Operator Optimizer"
        action={
          <button
            type="button"
            onClick={() => {
              loadPastRuns();
              setShowHistoryDrawer(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-[#FAF7F2] border border-[#E6DDCE] text-xs font-semibold text-[#221912] shadow-2xs transition-colors cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-[#9C5B3C]" />
            <span>Optimization History ({historicalRuns.length})</span>
          </button>
        }
      />

      {/* Wizard Step Progress Tracker */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-[#E6DDCE] shadow-2xs">
        <div className="flex items-center justify-between overflow-x-auto gap-2 custom-scrollbar">
          {steps.map((s, idx) => {
            const isCurrent = currentStep === s.num;
            const isCompleted = currentStep > s.num;

            return (
              <Fragment key={s.num}>
                <div
                  onClick={() => {
                    if (s.num === 1) setCurrentStep(1);
                    else if (s.num === 2 && operatorPool.length > 0) setCurrentStep(2);
                    else if (s.num === 3 && lineRequirements.length > 0) setCurrentStep(3);
                    else if (s.num === 4) setCurrentStep(4);
                    else if (s.num === 5 && optimizationResult) setCurrentStep(5);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold select-none transition-all ${
                    isCurrent
                      ? "bg-[#9C5B3C] text-white shadow-sm shadow-[#9C5B3C]/30"
                      : isCompleted
                      ? "bg-[#F3F5F2] text-[#2E6F40] hover:bg-[#FAF7F2] cursor-pointer"
                      : "text-[#8C7E6E] opacity-60"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isCurrent
                        ? "bg-white text-[#9C5B3C]"
                        : isCompleted
                        ? "bg-[#2E6F40] text-white"
                        : "bg-[#E6DDCE] text-[#6B5E51]"
                    }`}
                  >
                    {isCompleted ? "✓" : s.num}
                  </div>
                  <span className="whitespace-nowrap">{s.title}</span>
                </div>

                {idx < steps.length - 1 && (
                  <div className="h-0.5 w-6 bg-[#E6DDCE] shrink-0 hidden sm:block" />
                )}
              </Fragment>
            );
          })}
        </div>
      </div>


      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="p-4 bg-[#FFF5F5] border border-[#f5c2c2] rounded-2xl flex items-center justify-between gap-3 text-xs font-semibold text-[#C53030] shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#C53030]" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="p-1 hover:bg-[#ffe5e5] rounded-lg text-[#C53030] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Step Views */}
      {currentStep === 1 && (
        <PlanningContextStep
          context={context}
          selectedLineIds={selectedLineIds}
          onToggleLine={handleToggleLine}
          onSelectAllLines={handleSelectAllLines}
          planningDate={planningDate}
          onChangeDate={setPlanningDate}
          shifts={shifts}
          selectedShiftId={selectedShiftId}
          onChangeShift={(id) => setSelectedShiftId(id)}
          onNext={handleGoToStep2}
          loading={loadingContext}
        />
      )}

      {currentStep === 2 && (
        <OperatorPoolStep
          operators={operatorPool}
          onNext={handleGoToStep3}
          onBack={() => setCurrentStep(1)}
          loading={loadingPool}
        />
      )}

      {currentStep === 3 && (
        <LineRequirementsStep
          lineRequirements={lineRequirements}
          validation={validation}
          onValidate={handleRerunValidation}
          onNext={() => setCurrentStep(4)}
          onBack={() => setCurrentStep(2)}
          loading={loadingLines}
        />
      )}

      {currentStep === 4 && (
        <OptimizationSolverStep
          selectedLineIds={selectedLineIds}
          planningDate={planningDate}
          shiftId={selectedShiftId}
          onRunOptimization={handleRunOptimization}
          onBack={() => setCurrentStep(3)}
          isSolving={isSolving}
        />
      )}

      {currentStep === 5 && optimizationResult && (
        <OptimizationResultsStep
          response={optimizationResult}
          onOpenOverride={(a) => setOverrideAssignment(a)}
          onOpenApprove={() => setApprovalModalMode("APPROVE")}
          onOpenApply={() => setApprovalModalMode("APPLY")}
          onOpenAuditLogs={handleOpenAuditLogs}
          onBackToConfig={() => setCurrentStep(4)}
        />
      )}


      {/* Modals */}
      {overrideAssignment && (
        <ManualOverrideModal
          assignment={overrideAssignment}
          availableOperators={operatorPool}
          onClose={() => setOverrideAssignment(null)}
          onSaveOverride={handleSaveOverride}
        />
      )}

      {approvalModalMode && optimizationResult && (
        <ApprovalApplyModal
          mode={approvalModalMode}
          runCode={optimizationResult.runCode}
          onClose={() => setApprovalModalMode(null)}
          onConfirm={handleConfirmApprovalOrApply}
        />
      )}

      {showAuditLogs && optimizationResult && (
        <AllocationAuditHistory
          logs={auditLogs}
          runCode={optimizationResult.runCode}
          onClose={() => setShowAuditLogs(false)}
        />
      )}

      {/* Historical Runs Slide-Over Drawer */}
      {showHistoryDrawer && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-end bg-black/40 backdrop-blur-xs p-0 sm:p-4">
          <div className="bg-white h-full sm:h-auto sm:max-h-[90vh] sm:rounded-2xl w-full max-w-md border border-[#E6DDCE] shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-[#E6DDCE] flex items-center justify-between bg-[#FAF7F2] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#9C5B3C]/10 flex items-center justify-center text-[#9C5B3C]">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#221912]">
                    Optimization Run History
                  </h3>
                  <p className="text-[11px] text-[#8C7E6E]">
                    {historicalRuns.length} recorded multi-line solutions
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowHistoryDrawer(false)}
                className="p-1 rounded-lg text-[#8C7E6E] hover:text-[#221912] hover:bg-[#E6DDCE]/50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto custom-scrollbar flex-1 space-y-3">
              {loadingHistory ? (
                <div className="py-12 text-center text-xs text-[#8C7E6E]">Loading runs...</div>
              ) : historicalRuns.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <FolderOpen className="w-8 h-8 text-[#C4B5A5] mx-auto" />
                  <p className="text-xs text-[#8C7E6E]">No optimization runs recorded yet.</p>
                </div>
              ) : (
                historicalRuns.map((r) => (
                  <div
                    key={r.runId}
                    className="p-4 rounded-xl border border-[#E6DDCE] bg-[#FAF7F2]/40 hover:bg-[#FAF7F2] hover:border-[#9C5B3C] transition-all space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-[#9C5B3C]">{r.runCode}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        r.status === "APPLIED"
                          ? "bg-[#2E6F40]/15 text-[#2E6F40]"
                          : r.status === "APPROVED"
                          ? "bg-[#77876F]/15 text-[#77876F]"
                          : "bg-[#B48259]/15 text-[#B48259]"
                      }`}>
                        {r.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#6B5E51]">
                      <span>Date: <span className="font-semibold text-[#221912]">{r.planningDate}</span></span>
                      <span>Lines: <span className="font-semibold text-[#221912]">{r.totalSelectedLines}</span></span>
                      <span>Efficiency: <span className="font-bold text-[#2E6F40]">{r.overallAchievableEfficiency}%</span></span>
                    </div>

                    <div className="pt-2 border-t border-[#E6DDCE]/60 flex items-center justify-between">
                      <span className="text-[10px] text-[#8C7E6E] font-mono">
                        {r.createdAt ? new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleLoadPastRun(r)}
                        className="text-xs font-bold text-[#9C5B3C] hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <span>Review Solution</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="px-6 py-3 border-t border-[#E6DDCE] bg-[#FAF7F2] flex justify-end shrink-0">
              <button
                onClick={() => setShowHistoryDrawer(false)}
                className="px-4 py-2 rounded-xl bg-white border border-[#E6DDCE] text-xs font-bold text-[#221912] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
