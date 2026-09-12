import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle2, Clock, Calculator, ShieldAlert, Cpu, Trash2, AlertCircle, Layers } from "lucide-react";
import { pieceProductionApi, type PieceProductionLog } from "./api";
import type { Operator } from "../../features/operators/api";
import type { Operation } from "../../features/operations/api";
import type { Order } from "../../features/orders/api";

export interface StationExecutionInfo {
  stationNum: number;
  operationId: number | string;
  operationName: string;
  totalGood: number;
  rawGood: number;
}

interface RecordPieceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onDelete?: (id: number) => Promise<void> | void;
  operators: Operator[];
  operations: Operation[];
  orders?: Order[];
  stationFlowList?: StationExecutionInfo[];
  initialDate?: string;
  initialOperatorId?: string;
  initialOperationId?: string;
  initialOrderId?: string;
  initialMachineCode?: string;
  initialStartTime?: string;
  editingLog?: PieceProductionLog | null;
}

export function RecordPieceModal({
  isOpen,
  onClose,
  onSuccess,
  onDelete,
  operators,
  operations,
  orders = [],
  stationFlowList = [],
  initialDate = new Date().toISOString().split("T")[0],
  initialOperatorId,
  initialOperationId,
  initialOrderId,
  initialMachineCode,
  initialStartTime,
  editingLog,
}: RecordPieceModalProps) {
  const [mounted, setMounted] = useState(false);
  const [operatorId, setOperatorId] = useState<string>("");
  const [operationId, setOperationId] = useState<string>("");
  const [orderId, setOrderId] = useState<string>("");
  
  const [completedQty, setCompletedQty] = useState<string>("");
  const [goodQty, setGoodQty] = useState<string>("");
  const [rejectQty, setRejectQty] = useState<string>("0");
  
  const [startTime, setStartTime] = useState<string>("08:00");
  const [endTime, setEndTime] = useState<string>("09:00");
  const [samMinutes, setSamMinutes] = useState<number>(0.5);
  const [machineCode, setMachineCode] = useState<string>("");
  const [logDate, setLogDate] = useState<string>(initialDate);
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Initialize or reset form state based on editingLog or initial props
  useEffect(() => {
    if (editingLog) {
      setOperatorId(String(editingLog.operatorId));
      setOperationId(editingLog.operationId ? String(editingLog.operationId) : "");
      setOrderId(editingLog.orderId ? String(editingLog.orderId) : "");
      setCompletedQty(String(editingLog.completedQty || ""));
      setGoodQty(String(editingLog.goodQty || ""));
      setRejectQty(String(editingLog.rejectQty || "0"));
      setStartTime(editingLog.startTime ? editingLog.startTime.slice(0, 5) : "08:00");
      setEndTime(editingLog.endTime ? editingLog.endTime.slice(0, 5) : "09:00");
      setSamMinutes(Number(editingLog.samMinutes) || 0.5);
      setMachineCode(editingLog.machineCode || "");
      setLogDate(editingLog.logDate || initialDate);
      setNotes(editingLog.notes || "");
    } else {
      setOperatorId(initialOperatorId || (operators.length > 0 ? String(operators[0].id) : ""));
      const chosenOpId = initialOperationId || (operations.length > 0 ? String(operations[0].id) : "");
      setOperationId(chosenOpId);
      setOrderId(initialOrderId || "");
      setCompletedQty("");
      setGoodQty("");
      setRejectQty("0");
      
      const st = initialStartTime || "08:00";
      setStartTime(st);
      const [h, m] = st.split(":").map(Number);
      const endH = (h + 1) % 24;
      setEndTime(`${String(endH).padStart(2, "0")}:${String(m || 0).padStart(2, "0")}`);

      const matchedOp = operations.find(o => String(o.id) === String(chosenOpId));
      if (matchedOp && matchedOp.standardSmv) {
        setSamMinutes(Number(matchedOp.standardSmv));
      } else {
        setSamMinutes(0.5);
      }
      setMachineCode(initialMachineCode || "");
      setLogDate(initialDate);
      setNotes("");
    }
    setErrorMsg("");
  }, [editingLog, isOpen, initialOperatorId, initialOperationId, initialOrderId, initialMachineCode, initialStartTime, initialDate, operators, operations]);

  const handleOperationChange = (opId: string) => {
    setOperationId(opId);
    const op = operations.find(o => String(o.id) === String(opId));
    if (op && op.standardSmv) {
      setSamMinutes(Number(op.standardSmv));
    } else {
      setSamMinutes(0.5);
    }
  };

  const handleCompletedChange = (valStr: string) => {
    setCompletedQty(valStr);
    const val = Number(valStr) || 0;
    const currentGood = Number(goodQty) || 0;
    if (currentGood > val) {
      setGoodQty(String(val));
      setRejectQty("0");
    } else if (val > 0 && (!goodQty || Number(goodQty) === 0)) {
      setGoodQty(String(val));
      setRejectQty("0");
    } else {
      setRejectQty(String(Math.max(0, val - currentGood)));
    }
  };

  const handleGoodChange = (valStr: string) => {
    setGoodQty(valStr);
    const val = Number(valStr) || 0;
    const currentComp = Number(completedQty) || 0;
    if (currentComp >= val) {
      setRejectQty(String(currentComp - val));
    }
  };

  const numGood = Number(goodQty) || 0;
  const numCompleted = Number(completedQty) || 0;
  const numReject = Number(rejectQty) || 0;

  // Precedence constraint calculation based on line workstation sequence
  const precedenceInfo = useMemo(() => {
    if (!stationFlowList || stationFlowList.length === 0 || !operationId) {
      return null;
    }

    const sorted = [...stationFlowList].sort((a, b) => a.stationNum - b.stationNum);
    const currIndex = sorted.findIndex(s => String(s.operationId) === String(operationId));
    if (currIndex === -1) return null;

    const currentStation = sorted[currIndex];
    if (currIndex === 0) {
      // First operation in sequence: Line Inflow
      return {
        isFirstStation: true,
        stationNum: currentStation.stationNum,
        operationName: currentStation.operationName,
        maxAllowedGood: Infinity,
        predecessorStationNum: null,
        predecessorOperationName: null,
        predecessorCompleted: null,
        availableWip: null,
        currentStationLogged: currentStation.rawGood ?? currentStation.totalGood,
      };
    }

    const predecessorStation = sorted[currIndex - 1];
    const predecessorCompleted = predecessorStation.totalGood; // flow-bounded completed pieces of upstream operation
    const editingGood = (editingLog && String(editingLog.operationId) === String(operationId)) ? (editingLog.goodQty || 0) : 0;
    const currentLoggedWithoutThis = Math.max(0, (currentStation.rawGood ?? currentStation.totalGood) - editingGood);
    const maxAllowedGood = Math.max(0, predecessorCompleted - currentLoggedWithoutThis);
    const availableWip = Math.max(0, predecessorCompleted - (currentStation.rawGood ?? currentStation.totalGood));

    return {
      isFirstStation: false,
      stationNum: currentStation.stationNum,
      operationName: currentStation.operationName,
      predecessorStationNum: predecessorStation.stationNum,
      predecessorOperationName: predecessorStation.operationName,
      predecessorCompleted,
      availableWip,
      currentStationLogged: currentStation.rawGood ?? currentStation.totalGood,
      maxAllowedGood,
    };
  }, [stationFlowList, operationId, editingLog]);

  const isPrecedenceViolated = Boolean(
    precedenceInfo &&
    !precedenceInfo.isFirstStation &&
    precedenceInfo.maxAllowedGood !== Infinity &&
    numGood > precedenceInfo.maxAllowedGood
  );

  const handleCapToMaxAllowed = () => {
    if (!precedenceInfo || precedenceInfo.isFirstStation || precedenceInfo.maxAllowedGood === Infinity) return;
    const maxVal = precedenceInfo.maxAllowedGood;
    setCompletedQty(String(maxVal));
    setGoodQty(String(maxVal));
    setRejectQty("0");
    setErrorMsg("");
  };

  // Quality Pass Rate % = (Good Qty / Completed Qty) * 100
  const qualityRatePercent = useMemo(() => {
    if (numCompleted <= 0) return 100;
    return Number(((numGood / numCompleted) * 100).toFixed(1));
  }, [numGood, numCompleted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!operatorId) {
      setErrorMsg("Please select an operator");
      return;
    }
    if (!operationId) {
      setErrorMsg("Please select an operation");
      return;
    }
    if (numCompleted <= 0) {
      setErrorMsg("Completed quantity must be greater than 0");
      return;
    }
    if (precedenceInfo && !precedenceInfo.isFirstStation && numGood > precedenceInfo.maxAllowedGood) {
      setErrorMsg(
        `Precedence Limit Exceeded: Station #${precedenceInfo.stationNum} (${precedenceInfo.operationName}) cannot output more than predecessor Station #${precedenceInfo.predecessorStationNum} (${precedenceInfo.predecessorOperationName}) completed output of ${precedenceInfo.predecessorCompleted} pieces. Maximum allowed good quantity for this entry is ${precedenceInfo.maxAllowedGood} pcs (prevents negative WIP).`
      );
      return;
    }
    const [sh = 0, sm = 0] = startTime.split(":").map(Number);
    const [eh = 0, em = 0] = endTime.split(":").map(Number);
    const diffMins = (eh * 60 + em) - (sh * 60 + sm);
    if (diffMins <= 0) {
      setErrorMsg("End time must be after start time");
      return;
    }
    if (numGood + numReject !== numCompleted) {
      setErrorMsg("Good quantity + Reject quantity must equal Completed quantity");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    const payload = {
      operatorId: Number(operatorId),
      operationId: Number(operationId),
      orderId: orderId ? Number(orderId) : undefined,
      targetQty: numCompleted,
      completedQty: numCompleted,
      goodQty: numGood,
      rejectQty: numReject,
      startTime: startTime.length === 5 ? `${startTime}:00` : startTime,
      endTime: endTime.length === 5 ? `${endTime}:00` : endTime,
      samMinutes,
      machineCode: machineCode.trim() || undefined,
      logDate,
      notes: notes.trim() || undefined,
    };

    try {
      if (editingLog) {
        await pieceProductionApi.updateLog(editingLog.id, payload);
      } else {
        await pieceProductionApi.recordPiece(payload);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to save piece production log:", err);
      setErrorMsg(err.response?.data?.message || err.message || "Failed to save production log");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-xl max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-[#E6DDCE] overflow-hidden my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#F0EAE0] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F6F1E8] border border-[#E6DDCE] flex items-center justify-center text-[#9C5B3C] shadow-2xs">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#8C7E6E]">
                  Shopfloor Timesheet
                </span>
                <span className="text-[#E6DDCE]">/</span>
                <span className="text-[10.5px] font-bold text-[#9C5B3C]">
                  {editingLog ? "Edit Production Run" : "New Piece Batch"}
                </span>
              </div>
              <h3 className="text-base font-black text-[#221912]">
                {editingLog ? "Modify Recorded Pieces" : "Record Completed Pieces"}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8C7E6E] hover:text-[#221912] p-1.5 rounded-xl hover:bg-[#F6F1E8] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
          )}

          {/* Row 1: Operator & Operation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold tracking-wider uppercase text-[#8C7E6E] mb-1.5">
                Operator <span className="text-rose-500">*</span>
              </label>
              <select
                value={operatorId}
                onChange={e => setOperatorId(e.target.value)}
                required
                className="w-full h-10 bg-white border border-[#E6DDCE] rounded-xl px-3 text-xs font-semibold text-[#221912] focus:outline-none focus:border-[#9C5B3C] shadow-2xs cursor-pointer"
              >
                <option value="">— Select Operator —</option>
                {operators.map(op => (
                  <option key={op.id} value={op.id}>
                    {op.employeeId} — {op.name} ({op.department || "Sewing"})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold tracking-wider uppercase text-[#8C7E6E] mb-1.5">
                Operation <span className="text-rose-500">*</span>
              </label>
              <select
                value={operationId}
                onChange={e => handleOperationChange(e.target.value)}
                required
                className="w-full h-10 bg-white border border-[#E6DDCE] rounded-xl px-3 text-xs font-semibold text-[#221912] focus:outline-none focus:border-[#9C5B3C] shadow-2xs cursor-pointer"
              >
                <option value="">— Select Operation —</option>
                {operations.map(op => (
                  <option key={op.id} value={op.id}>
                    {op.operationCode || (op as any).code || `OP-${op.id}`} — {op.name} (SMV: {op.standardSmv || "0.5"}m)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Machine, Order & Production Date */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold tracking-wider uppercase text-[#8C7E6E] mb-1.5 flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-[#9C5B3C]" /> Machine Code
              </label>
              <input
                type="text"
                value={machineCode}
                onChange={e => setMachineCode(e.target.value)}
                placeholder="e.g. SN-001, OL-002"
                className="w-full h-10 bg-white border border-[#E6DDCE] rounded-xl px-3 text-xs font-medium text-[#221912] focus:outline-none focus:border-[#9C5B3C] shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold tracking-wider uppercase text-[#8C7E6E] mb-1.5">
                Production Order
              </label>
              <select
                value={orderId}
                onChange={e => setOrderId(e.target.value)}
                className="w-full h-10 bg-white border border-[#E6DDCE] rounded-xl px-3 text-xs font-medium text-[#221912] focus:outline-none focus:border-[#9C5B3C] shadow-2xs cursor-pointer"
              >
                <option value="">— Optional Order —</option>
                {orders.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.orderNo} ({o.buyer || "General"})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold tracking-wider uppercase text-[#8C7E6E] mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={logDate}
                onChange={e => setLogDate(e.target.value)}
                required
                className="w-full h-10 bg-white border border-[#E6DDCE] rounded-xl px-3 text-xs font-semibold text-[#221912] focus:outline-none focus:border-[#9C5B3C] shadow-2xs cursor-pointer"
              />
            </div>
          </div>

          {/* Workstation Precedence & WIP Buffer Flow Banner */}
          {precedenceInfo && (
            <div className={`p-4 rounded-2xl border transition-all ${
              precedenceInfo.isFirstStation
                ? "bg-emerald-50/60 border-emerald-200"
                : precedenceInfo.maxAllowedGood === 0
                  ? "bg-rose-50/70 border-rose-200"
                  : isPrecedenceViolated
                    ? "bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/30"
                    : "bg-[#F6F1E8]/70 border-[#E6DDCE]"
            }`}>
              {precedenceInfo.isFirstStation ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs border border-emerald-300 shadow-2xs">
                      #1
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-emerald-950">
                          Workstation #{precedenceInfo.stationNum}: Line Inflow
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.2 bg-emerald-100 text-emerald-800 rounded-md border border-emerald-200">
                          Initial Process
                        </span>
                      </div>
                      <p className="text-[10.5px] text-emerald-700 mt-0.5">
                        First operation in assembly line — feeds cut pieces into progressive sewing flow.
                      </p>
                    </div>
                  </div>
                  <div className="text-right font-mono text-[11px] text-emerald-800 font-bold shrink-0">
                    Logged: {precedenceInfo.currentStationLogged} pcs
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#9C5B3C]" />
                      <span className="text-xs font-bold text-[#221912]">
                        Station #{precedenceInfo.stationNum} Sequential Precedence Flow
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-md border ${
                      precedenceInfo.maxAllowedGood === 0
                        ? "bg-rose-100 text-rose-800 border-rose-300"
                        : "bg-[#FDFBF7] text-[#9C5B3C] border-[#E6DDCE]"
                    }`}>
                      Predecessor: Station #{precedenceInfo.predecessorStationNum}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Metric 1: Predecessor Output */}
                    <div className="p-2.5 bg-white rounded-xl border border-[#E6DDCE] shadow-2xs">
                      <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#8C7E6E] block truncate">
                        Upstream Completed
                      </span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="font-mono font-black text-sm text-[#221912]">
                          {precedenceInfo.predecessorCompleted}
                        </span>
                        <span className="text-[9.5px] text-slate-400">pcs</span>
                      </div>
                      <span className="text-[9px] text-[#8C7E6E] truncate block mt-0.5" title={precedenceInfo.predecessorOperationName || ""}>
                        Stn #{precedenceInfo.predecessorStationNum} ({precedenceInfo.predecessorOperationName})
                      </span>
                    </div>

                    {/* Metric 2: Available Queue WIP */}
                    <div className="p-2.5 bg-white rounded-xl border border-[#E6DDCE] shadow-2xs">
                      <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#8C7E6E] block truncate">
                        Queue WIP Buffer
                      </span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className={`font-mono font-black text-sm ${
                          (precedenceInfo.availableWip || 0) > 0 ? "text-amber-700" : "text-slate-700"
                        }`}>
                          {precedenceInfo.availableWip}
                        </span>
                        <span className="text-[9.5px] text-slate-400">pcs</span>
                      </div>
                      <span className="text-[9px] text-slate-400 truncate block mt-0.5">
                        Available in buffer
                      </span>
                    </div>

                    {/* Metric 3: Max Allowed for this Run */}
                    <div className={`p-2.5 rounded-xl border shadow-2xs ${
                      precedenceInfo.maxAllowedGood === 0
                        ? "bg-rose-50 border-rose-200"
                        : "bg-emerald-50/50 border-emerald-200"
                    }`}>
                      <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#8C7E6E] block truncate">
                        Max Allowed for Run
                      </span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className={`font-mono font-black text-sm ${
                          precedenceInfo.maxAllowedGood === 0 ? "text-rose-700" : "text-emerald-800"
                        }`}>
                          {precedenceInfo.maxAllowedGood}
                        </span>
                        <span className="text-[9.5px] text-slate-400">pcs</span>
                      </div>
                      <span className="text-[9px] text-emerald-700 font-medium truncate block mt-0.5">
                        Precedence Limit
                      </span>
                    </div>
                  </div>

                  {/* Warning / Cap helpers */}
                  {precedenceInfo.maxAllowedGood === 0 ? (
                    <div className="p-2.5 bg-rose-100/70 border border-rose-200 rounded-xl text-rose-800 text-[11px] flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span className="font-semibold">
                        WIP Buffer Empty: Station #{precedenceInfo.predecessorStationNum} has no remaining output. Station #{precedenceInfo.predecessorStationNum} must produce more pieces before this station can log additional units.
                      </span>
                    </div>
                  ) : isPrecedenceViolated ? (
                    <div className="p-2.5 bg-amber-100/90 border border-amber-300 rounded-xl text-amber-900 text-[11px] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-amber-700" />
                        <span className="font-semibold">
                          Exceeds predecessor output! Max allowed is {precedenceInfo.maxAllowedGood} pcs (prevents negative WIP).
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCapToMaxAllowed}
                        className="px-2.5 py-1 bg-amber-800 text-white rounded-lg text-[10.5px] font-bold hover:bg-amber-900 transition-colors shrink-0 cursor-pointer shadow-2xs"
                      >
                        Cap to {precedenceInfo.maxAllowedGood} pcs
                      </button>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}

          {/* Row 3: Quantities */}
          <div className="p-4 bg-[#FDFBF7] border border-[#E6DDCE] rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-bold tracking-wider uppercase text-[#221912] block">
                Production Quantities
              </span>
              <div className="flex items-center gap-2">
                {precedenceInfo && !precedenceInfo.isFirstStation && precedenceInfo.maxAllowedGood > 0 && (
                  <button
                    type="button"
                    onClick={handleCapToMaxAllowed}
                    className="text-[10px] font-bold text-[#9C5B3C] hover:underline cursor-pointer"
                  >
                    Quick Fill: Max Allowed ({precedenceInfo.maxAllowedGood} pcs)
                  </button>
                )}
                <span className="text-[10px] text-[#8C7E6E] font-medium">
                  Completed = Good + Rejects
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#9C5B3C] mb-1">
                  Completed Qty <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max={precedenceInfo && !precedenceInfo.isFirstStation && precedenceInfo.maxAllowedGood !== Infinity ? precedenceInfo.maxAllowedGood : undefined}
                  value={completedQty}
                  onChange={e => handleCompletedChange(e.target.value)}
                  required
                  placeholder="0"
                  className={`w-full h-9 border rounded-xl px-2.5 text-xs font-mono font-bold focus:outline-none ${
                    isPrecedenceViolated
                      ? "bg-amber-50 border-amber-400 text-amber-900 focus:border-amber-500"
                      : "bg-[#F6F1E8] border-[#E6DDCE] text-[#9C5B3C] focus:border-[#9C5B3C]"
                  }`}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-[#77876F] mb-1">
                  Good Qty <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max={precedenceInfo && !precedenceInfo.isFirstStation && precedenceInfo.maxAllowedGood !== Infinity ? precedenceInfo.maxAllowedGood : undefined}
                  value={goodQty}
                  onChange={e => handleGoodChange(e.target.value)}
                  required
                  placeholder="0"
                  className={`w-full h-9 border rounded-xl px-2.5 text-xs font-mono font-bold focus:outline-none ${
                    isPrecedenceViolated
                      ? "bg-amber-50 border-amber-400 text-amber-900 focus:border-amber-500"
                      : "bg-[#F3F5F2] border-[#d4decb] text-[#77876F] focus:border-[#77876F]"
                  }`}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-rose-600 mb-1">
                  Reject Qty
                </label>
                <input
                  type="number"
                  min="0"
                  value={rejectQty}
                  onChange={e => setRejectQty(e.target.value)}
                  placeholder="0"
                  className="w-full h-9 bg-rose-50 border border-rose-200 rounded-xl px-2.5 text-xs font-mono font-bold text-rose-700 focus:outline-none focus:border-rose-400"
                />
              </div>
            </div>
          </div>

          {/* Row 4: Time Tracking & Standard SMV */}
          <div className="space-y-2.5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold tracking-wider uppercase text-[#8C7E6E] mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#9C5B3C]" /> Start Time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  required
                  className="w-full h-10 bg-white border border-[#E6DDCE] rounded-xl px-3 text-xs font-bold text-[#221912] focus:outline-none focus:border-[#9C5B3C]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold tracking-wider uppercase text-[#8C7E6E] mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#9C5B3C]" /> End Time
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  required
                  className="w-full h-10 bg-white border border-[#E6DDCE] rounded-xl px-3 text-xs font-bold text-[#221912] focus:outline-none focus:border-[#9C5B3C]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold tracking-wider uppercase text-[#8C7E6E] mb-1.5">
                  Standard SMV (min)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={samMinutes}
                  onChange={e => setSamMinutes(Number(e.target.value))}
                  required
                  className="w-full h-10 bg-white border border-[#E6DDCE] rounded-xl px-3 text-xs font-bold text-[#9C5B3C] text-center focus:outline-none focus:border-[#9C5B3C]"
                />
              </div>
            </div>

            {/* Quick Duration Helper Buttons */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <span className="text-[10px] font-bold text-[#8C7E6E] uppercase">Quick Duration:</span>
              {[
                { label: "30 min", mins: 30 },
                { label: "1 hr", mins: 60 },
                { label: "2 hrs", mins: 120 },
                { label: "3 hrs", mins: 180 },
                { label: "4 hrs", mins: 240 },
              ].map(preset => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    const [h, m] = startTime.split(":").map(Number);
                    const totalM = (isNaN(h) ? 8 : h) * 60 + (isNaN(m) ? 0 : m) + preset.mins;
                    const endH = Math.floor((totalM / 60) % 24);
                    const endM = totalM % 60;
                    setEndTime(`${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#F6F1E8] hover:bg-[#EFE9DF] text-[10.5px] font-bold text-[#9C5B3C] border border-[#E6DDCE] transition-all cursor-pointer"
                >
                  +{preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-bold tracking-wider uppercase text-[#8C7E6E] mb-1.5">
              Production Notes / Remarks (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Side seam assembly run · Shift A"
              className="w-full h-10 bg-white border border-[#E6DDCE] rounded-xl px-3 text-xs text-[#221912] focus:outline-none focus:border-[#9C5B3C]"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#F0EAE0] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#8C7E6E]">
                Quality Pass Rate: <strong className="text-[#77876F] font-mono font-bold">{qualityRatePercent}%</strong>
              </span>

              {editingLog && onDelete && (
                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm("Are you sure you want to delete this piece production log?")) {
                      await onDelete(editingLog.id);
                      onClose();
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Run
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-[#8C7E6E] hover:text-[#221912] rounded-xl border border-[#E6DDCE] hover:bg-[#F6F1E8] transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#9C5B3C] hover:bg-[#B06C49] text-white rounded-xl text-xs font-bold shadow-sm shadow-[#9C5B3C]/20 hover:scale-[1.01] transition-all cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isSubmitting ? "Saving..." : editingLog ? "Update Piece Log" : "Save Piece Log"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
