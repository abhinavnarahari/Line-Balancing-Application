import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronRight, Paperclip, FileText, Plus, X, PlusCircle, FileSpreadsheet, Clock, CheckCircle2, Send, Trash2, RotateCcw, Download } from "lucide-react";
import { motion } from "framer-motion";
import { operationsApi, type Operation } from "../../features/operations/api";
import { operatorsApi, type Operator } from "../../features/operators/api";
import { skillApi, cycleTimeToRating, type PerformanceLog } from "../../features/skill-matrix/api";
import { getBenchmarkForOperation } from "../../features/operations/ratingBenchmarks";
import { exportToExcel } from "../../utils/excel";
import { API_BASE_URL } from "../../lib/api";
import { ToggleSwitch } from "../../components/ui/ToggleSwitch";
import { RecentActivityLog } from "../../components/ui/PremiumUI";
import { RecordPerformanceTestModal } from "./RecordPerformanceTestModal";
import { UploadPerformanceExcelModal } from "./UploadPerformanceExcelModal";
import { OperationTestHistoryModal } from "./OperationTestHistoryModal";

type Tab = "Overview" | "Connections" | "Skill Matrix";

export function OperatorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [operator, setOperator] = useState<Operator | null>(null);
  const [allOperators, setAllOperators] = useState<Operator[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [skills, setSkills] = useState<Record<string, number>>({});
  
  // Real data states
  const [attachments, setAttachments] = useState<any[]>([]);
  const [performanceLogs, setPerformanceLogs] = useState<PerformanceLog[]>([]);

  // Modals for Performance Tests
  const [isRecordTestModalOpen, setIsRecordTestModalOpen] = useState(false);
  const [isUploadExcelModalOpen, setIsUploadExcelModalOpen] = useState(false);
  const [selectedHistoryOperation, setSelectedHistoryOperation] = useState<Operation | null>(null);

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Operator>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    if (!id) return;
    try {
      const ops = await operatorsApi.getOperators();
      setAllOperators(ops);
      const found = ops.find(o => o.employeeId === id || o.id.toString() === id);
      if (found) {
        setOperator(found);
        setEditData({
          age: found.age,
          gender: found.gender,
          department: found.department,
          joiningDate: found.joiningDate,
          active: found.active
        });

        // Load specific connections
        operatorsApi.getAttachments(found.id).then(setAttachments).catch(console.error);

        const allOps = await operationsApi.getOperations();
        setOperations(allOps);

        // Load skills directly matching Sewing Skill Matrix based on average cycle time
        const [currentSkills, perfLogs] = await Promise.all([
          skillApi.getCurrentMatrix(found.id),
          skillApi.getPerformanceLogs(found.id).catch(() => []),
        ]);
        setPerformanceLogs(perfLogs);

        const skillMap: Record<string, number> = {};

        // 1. Initial mapping from assessments (using average cycle time if present)
        currentSkills.forEach(skill => {
          const op = allOps.find(o => String(o.id) === String(skill.operationId));
          if (skill.cycleTimeSeconds && skill.cycleTimeSeconds > 0) {
            skillMap[String(skill.operationId)] = cycleTimeToRating(skill.cycleTimeSeconds, op?.name, op?.standardSmv);
          } else if (skill.rating && skill.rating > 0) {
            skillMap[String(skill.operationId)] = skill.rating;
          }
        });

        // 2. Derive rating from submitted performance test runs (average time of tests)
        const opPerfMap = new Map<string, number[]>();
        perfLogs.filter(l => l.status === "SUBMITTED" || !l.status).forEach(l => {
          const key = String(l.operationId);
          if (!opPerfMap.has(key)) opPerfMap.set(key, []);
          opPerfMap.get(key)!.push(l.actualCycleTimeSeconds);
        });

        opPerfMap.forEach((times, opId) => {
          if (times.length > 0) {
            const op = allOps.find(o => String(o.id) === String(opId));
            const avg = times.reduce((a, b) => a + b, 0) / times.length;
            const derivedRating = cycleTimeToRating(avg, op?.name, op?.standardSmv);
            skillMap[opId] = derivedRating;
          }
        });

        setSkills(skillMap);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [updatingMatrix, setUpdatingMatrix] = useState(false);

  const handleUpdateSkillMatrix = async () => {
    if (!operator) return;
    setUpdatingMatrix(true);
    try {
      const draftLogs = performanceLogs.filter(l => (l.status || "").toUpperCase() === "DRAFT");
      const draftLogIds = draftLogs.map(l => l.id);

      if (draftLogIds.length > 0) {
        // 1. Submit all draft logs in batch
        await skillApi.submitBatchPerformanceLogs(draftLogIds);

        // 2. Direct assessment write to guarantee matrix updates immediately
        const opTimesMap = new Map<string, number[]>();
        performanceLogs.forEach(l => {
          const key = String(l.operationId);
          if (!opTimesMap.has(key)) opTimesMap.set(key, []);
          opTimesMap.get(key)!.push(l.actualCycleTimeSeconds);
        });

        for (const [opId, times] of opTimesMap.entries()) {
          if (times.length > 0) {
            const op = operations.find(o => String(o.id) === String(opId));
            const avg = times.reduce((a, b) => a + b, 0) / times.length;
            const derivedRating = cycleTimeToRating(avg, op?.name, op?.standardSmv);
            await skillApi.addAssessment({
              operatorId: Number(operator.id),
              operationId: Number(opId),
              rating: derivedRating as 1 | 2 | 3 | 4 | 5,
              cycleTimeSeconds: Math.round(avg),
              effectiveDate: new Date().toISOString().split("T")[0],
              notes: `Submitted ${times.length} performance run(s) with average cycle time ${avg.toFixed(1)}s`,
            }).catch(console.warn);
          }
        }
      } else {
        // Run auto-update to ensure full sync
        await skillApi.autoUpdateSkillMatrix(operator.id).catch(console.warn);
      }

      await loadData();
    } catch (err: any) {
      console.error("Failed to update skill matrix:", err);
      alert(err?.response?.data?.message || err?.message || "Failed to update skill matrix. Please try again.");
    } finally {
      setUpdatingMatrix(false);
    }
  };

  const handleClearSkillData = async () => {
    if (!operator) return;
    const confirmed = window.confirm(
      `Are you sure you want to reset all skill matrix data and performance tests for ${operator.name}? This will clear all assessments and test runs so you can start fresh.`
    );
    if (!confirmed) return;

    setClearing(true);
    try {
      await skillApi.clearOperatorSkillData(operator.id);
      await loadData();
      alert(`Skill matrix and test history for ${operator.name} have been cleared.`);
    } catch (err: any) {
      console.error("Failed to clear skill data:", err);
      alert(err?.response?.data?.message || err?.message || "Failed to clear skill data. Please try again.");
    } finally {
      setClearing(false);
    }
  };

  const handleExportSkillMatrix = () => {
    if (!operator) return;

    const ratingLabels: Record<number, string> = {
      5: "Expert (0-10 sec)",
      4: "Good (11-20 sec)",
      3: "Standard (21-30 sec)",
      2: "Basic (31-40 sec)",
      1: "Beginner (41-50+ sec)",
    };

    const ratingBands: Record<number, string> = {
      5: "0-10 SEC",
      4: "11-20 SEC",
      3: "21-30 SEC",
      2: "31-40 SEC",
      1: "41-50+ SEC",
    };

    const exportRows = operations.map((op) => {
      const rating = skills[String(op.id)] || 0;
      const opLogs = performanceLogs.filter(
        (l) => String(l.operationId) === String(op.id) && (l.status === "SUBMITTED" || !l.status)
      );
      const avgSec = opLogs.length > 0
        ? (opLogs.reduce((a, b) => a + b.actualCycleTimeSeconds, 0) / opLogs.length).toFixed(1)
        : "-";

      return {
        "Employee ID": operator.employeeId,
        "Employee Name": operator.name,
        "Department": operator.department || "Sewing",
        "Operation Code": op.operationCode || (op as any).code || `OP-${op.id}`,
        "Operation Name": op.name,
        "Current Rating": rating > 0 ? rating : "Unrated",
        "Rating Band": rating > 0 ? (ratingBands[rating] || "-") : "-",
        "Skill Level": rating > 0 ? (ratingLabels[rating] || "-") : "Unrated",
        "Avg Tested Cycle Time (s)": avgSec,
        "Tests Recorded": opLogs.length,
      };
    });

    const cleanName = operator.name.replace(/[^a-zA-Z0-9_-]/g, "_");
    exportToExcel(exportRows, `Skill_Matrix_${operator.employeeId}_${cleanName}`);
  };

  const handleSaveProfile = async () => {
    if (!operator) return;
    try {
      setSaving(true);
      const payload = {
        name: operator.name, // Keep existing required fields
        employeeId: operator.employeeId,
        ...editData
      } as any;
      await operatorsApi.updateOperator(operator.id, payload);
      setIsEditing(false);
      await loadData(); // Reload to reflect changes
    } catch (err) {
      console.error("Failed to update profile", err);
      alert("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !operator) return;
    const file = e.target.files[0];
    try {
      await operatorsApi.uploadAttachment(operator.id, file);
      const newAttachments = await operatorsApi.getAttachments(operator.id);
      setAttachments(newAttachments);
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to upload file.");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!operator) return;
    try {
      await operatorsApi.deleteAttachment(attachmentId);
      setAttachments(attachments.filter(a => a.id !== attachmentId));
    } catch (err) {
      console.error("Delete failed", err);
      alert("Failed to delete attachment.");
    }
  };

  if (!operator) return <div className="p-8 text-center text-[#64748B]">Loading employee...</div>;

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] w-full relative">

      {/* Top Header Bar */}
      <header className="h-14 shrink-0 bg-white border-b border-[#F1F5F9] px-6 flex items-center gap-2 sticky top-0 z-10">
        <div className="flex items-center gap-1.5 text-[13px]">
          <Link to="/settings/operators" className="text-[#64748B] hover:text-[#0F172A] font-medium transition-colors">
            Employee
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
          <span className="font-semibold text-[#0F172A]">{operator.employeeId}</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-64 shrink-0 bg-[#F8FAFC] border-r border-[#F1F5F9] overflow-y-auto p-5 space-y-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#DBEAFE] to-[#4F46E5]/80 shadow-inner flex items-center justify-center text-3xl font-bold text-white border border-[#E2E8F0]">
              {operator.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </div>
            <div>
              <h2 className="font-bold text-[#0F172A] text-sm">{operator.name}</h2>
              <p className="text-[11px] font-medium text-[#64748B]">{operator.department}</p>
            </div>
            <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${operator.active ? "bg-[#F3F5F2] text-[#77876F] border-[#d4decb]" : "bg-[#fff1f2] text-[#be123c] border-[#fecaca]"}`}>
              {operator.active ? "Active" : "Inactive"}
            </span>
          </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-[10px] font-bold tracking-widest text-[#8C7E6E] uppercase mb-2">
                Assigned To
              </h3>
              <div className="flex items-center gap-2 p-2.5 bg-white border border-[#E6DDCE] rounded-xl shadow-2xs">
                <span className="w-5 h-5 rounded-md bg-[#F6F1E8] text-[#9C5B3C] border border-[#E6DDCE] text-[10px] font-bold flex items-center justify-center">
                  L1
                </span>
                <span className="text-xs font-bold text-[#221912]">Line 1 (Sewing)</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-bold tracking-widest text-[#8C7E6E] uppercase flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5" /> Attachments
                </h3>
                <button onClick={() => fileInputRef.current?.click()} className="text-[#8C7E6E] hover:text-[#9C5B3C]">
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
              </div>
              <ul className="space-y-1.5">
                {(attachments.length > 0 ? attachments : [
                  { id: "att-1", fileName: "Aadhar_Card.pdf" },
                  { id: "att-2", fileName: "Employment_Contract.pdf" },
                  { id: "att-3", fileName: "Bank_Passbook.pdf" },
                  { id: "att-4", fileName: "Stitching_Skill_Certificate.pdf" },
                  { id: "att-5", fileName: "Medical_Fitness_Report.pdf" },
                ]).map((file: any) => (
                  <li key={file.id} className="flex items-center justify-between group text-[11.5px] text-[#8C7E6E] hover:text-[#9C5B3C]">
                    <a href={`${API_BASE_URL}/operators/attachments/${file.id}/download`} target="_blank" rel="noreferrer" className="flex items-center gap-2 truncate cursor-pointer flex-1">
                      <FileText className="w-3 h-3 text-[#8C7E6E]" />
                      <span className="truncate" title={file.fileName}>{file.fileName}</span>
                    </a>
                    {attachments.length > 0 && (
                      <button onClick={() => handleDeleteAttachment(file.id)} className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 p-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-white flex flex-col">
          {/* Tabs */}
          <div className="px-8 pt-6 border-b border-[#F0EAE0]">
            <div className="flex items-center gap-6">
              {(["Overview", "Connections", "Skill Matrix"] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 text-xs font-bold transition-colors relative cursor-pointer ${
                    activeTab === tab ? "text-[#9C5B3C]" : "text-[#8C7E6E] hover:text-[#221912]"
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#9C5B3C]"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 p-8">
            {activeTab === "Overview" && (
              <div className="max-w-2xl space-y-6">
                <div className="flex justify-between items-center border-b border-[#F0EAE0] pb-2">
                  <h3 className="font-bold text-[#221912] text-base">Employee Details</h3>
                  {!isEditing ? (
                    <button onClick={() => setIsEditing(true)} className="px-3.5 py-1.5 bg-[#F6F1E8] text-[#221912] text-xs font-bold rounded-xl border border-[#E6DDCE] hover:bg-[#EFE9DF] cursor-pointer">
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => setIsEditing(false)} className="px-3.5 py-1.5 bg-transparent text-[#8C7E6E] text-xs font-semibold hover:text-[#221912] cursor-pointer">
                        Cancel
                      </button>
                      <button onClick={handleSaveProfile} disabled={saving} className="px-3.5 py-1.5 bg-[#9C5B3C] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#B06C49] disabled:opacity-50 cursor-pointer">
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-6 text-xs">
                  <div>
                    <label className="text-[#8C7E6E] text-[11px] font-bold uppercase tracking-wide">Age</label>
                    {isEditing ? (
                      <input type="number" value={editData.age || ""} onChange={e => setEditData({...editData, age: Number(e.target.value)})} className="mt-1 block w-full px-3 py-1.5 border border-[#E6DDCE] rounded-xl bg-white focus:outline-none focus:border-[#9C5B3C]" />
                    ) : (
                      <p className="font-semibold text-[#221912] mt-1">{operator.age} years</p>
                    )}
                  </div>
                  <div>
                    <label className="text-[#8C7E6E] text-[11px] font-bold uppercase tracking-wide">Gender</label>
                    {isEditing ? (
                      <select value={editData.gender || ""} onChange={e => setEditData({...editData, gender: e.target.value as any})} className="mt-1 block w-full px-3 py-1.5 border border-[#E6DDCE] rounded-xl bg-white focus:outline-none focus:border-[#9C5B3C]">
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      <p className="font-semibold text-[#221912] mt-1">{operator.gender}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-[#8C7E6E] text-[11px] font-bold uppercase tracking-wide">Department</label>
                    {isEditing ? (
                      <input type="text" value={editData.department || ""} onChange={e => setEditData({...editData, department: e.target.value})} className="mt-1 block w-full px-3 py-1.5 border border-[#E6DDCE] rounded-xl bg-white focus:outline-none focus:border-[#9C5B3C]" />
                    ) : (
                      <p className="font-semibold text-[#221912] mt-1">{operator.department}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-[#8C7E6E] text-[11px] font-bold uppercase tracking-wide">Joining Date</label>
                    {isEditing ? (
                      <input type="date" value={editData.joiningDate || ""} onChange={e => setEditData({...editData, joiningDate: e.target.value})} className="mt-1 block w-full px-3 py-1.5 border border-[#E6DDCE] rounded-xl bg-white focus:outline-none focus:border-[#9C5B3C]" />
                    ) : (
                      <p className="font-semibold text-[#221912] font-mono mt-1">{operator.joiningDate}</p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <label className="text-[#64748B] text-[11px] font-bold uppercase tracking-wide">Status</label>
                     {isEditing ? (
                       <div className="mt-2 flex items-center gap-3">
                         <ToggleSwitch
                           checked={editData.active === true}
                           onChange={(checked) => setEditData({ ...editData, active: checked })}
                         />
                         <span className="text-sm font-medium text-[#0F172A]">
                           {editData.active ? "Active" : "Inactive"}
                         </span>
                       </div>
                     ) : (
                       <div className="mt-2 flex items-center gap-3">
                         <ToggleSwitch
                           checked={operator.active}
                           onChange={() => {}}
                           disabled
                         />
                         <span className="text-sm font-medium text-[#0F172A]">
                           {operator.active ? "Active" : "Inactive"}
                         </span>
                       </div>
                     )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Skill Matrix" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Header Row: Master Operation Skills & Action Buttons */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="font-sans text-[22px] font-bold text-[#0F172A] tracking-tight">
                      Master Operation Skills & Qualification
                    </h3>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Operator competency grades evaluated against Industrial Engineering GSD cycle time benchmarks.
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                      type="button"
                      onClick={handleClearSkillData}
                      disabled={clearing}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-white text-rose-600 hover:text-rose-700 text-xs font-bold rounded-lg border border-rose-200 hover:border-rose-300 hover:bg-rose-50/50 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                      title="Clear all performance logs and ratings for this operator"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> {clearing ? "Resetting..." : "Reset Skills"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsRecordTestModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-[#0F172A] text-xs font-bold rounded-lg border border-[#E2E8F0] hover:border-[#2563EB] hover:text-[#2563EB] hover:bg-[#F8FAFC] transition-all shadow-2xs cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-[#2563EB]" /> Record Tests
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setIsUploadExcelModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-[#0F172A] text-xs font-bold rounded-lg border border-[#E2E8F0] hover:border-[#2563EB] hover:text-[#2563EB] hover:bg-[#F8FAFC] transition-all shadow-2xs cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-[#2563EB]" /> Upload Excel
                    </button>

                    <button
                      type="button"
                      onClick={handleExportSkillMatrix}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-[#0F172A] hover:text-[#2563EB] text-xs font-bold rounded-lg border border-[#E2E8F0] hover:border-[#2563EB] hover:bg-[#F8FAFC] transition-all shadow-2xs cursor-pointer"
                      title="Export this operator's skill matrix to Excel"
                    >
                      <Download className="w-3.5 h-3.5 text-[#2563EB]" /> Export Excel
                    </button>

                    {/* Update Skill Matrix Button - Submits drafts and reflects certified ratings */}
                    <button
                      type="button"
                      onClick={handleUpdateSkillMatrix}
                      disabled={updatingMatrix}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50"
                      title="Submit all draft tests and update skill matrix ratings"
                    >
                      <CheckCircle2 className={`w-3.5 h-3.5 ${updatingMatrix ? "animate-spin" : ""}`} />
                      <span>{updatingMatrix ? "Updating..." : "Update Skill Matrix"}</span>
                      {(() => {
                        const draftCount = performanceLogs.filter(l => (l.status || "").toUpperCase() === "DRAFT").length;
                        return draftCount > 0 ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-white/25 text-white border border-white/40">
                            {draftCount} {draftCount === 1 ? "Draft" : "Drafts"}
                          </span>
                        ) : null;
                      })()}
                    </button>
                  </div>
                </div>

                {/* ── Executive Skill Summary Metrics ──────────────────────── */}
                {(() => {
                  const ratingsArr = Object.values(skills).filter((r) => r > 0);
                  const ratedCount = ratingsArr.length;
                  const totalOps = operations.length;
                  const avgRating = ratingsArr.length > 0 ? (ratingsArr.reduce((a, b) => a + b, 0) / ratingsArr.length).toFixed(1) : "—";
                  const highestRating = ratingsArr.length > 0 ? Math.max(...ratingsArr) : 0;
                  const totalSubmittedRuns = performanceLogs.filter((l) => l.status === "SUBMITTED" || !l.status).length;

                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Qualification Coverage</div>
                        <div className="text-base font-bold text-slate-900 mt-1 font-mono">
                          {ratedCount} <span className="text-xs text-slate-400 font-sans">/ {totalOps} operations</span>
                        </div>
                        <div className="text-[10px] text-emerald-600 font-medium mt-0.5">
                          {totalOps > 0 ? Math.round((ratedCount / totalOps) * 100) : 0}% certified
                        </div>
                      </div>

                      <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Average Proficiency</div>
                        <div className="text-base font-bold text-blue-600 mt-1 font-mono">
                          {avgRating !== "—" ? `Grade ${avgRating}` : "Not Rated"}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Across all qualified ops
                        </div>
                      </div>

                      <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Highest Skill Tier</div>
                        <div className="text-base font-bold text-slate-900 mt-1">
                          {highestRating > 0 ? `Grade ${highestRating}` : "—"}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {highestRating === 5 ? "Expert" : highestRating === 4 ? "Skilled" : highestRating === 3 ? "Intermediate" : highestRating === 2 ? "Basic" : highestRating === 1 ? "Beginner" : "No ratings recorded"}
                        </div>
                      </div>

                      <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Verified Timing Runs</div>
                        <div className="text-base font-bold text-slate-900 mt-1 font-mono">
                          {totalSubmittedRuns} <span className="text-xs text-slate-400 font-sans">runs</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          IE work-study records
                        </div>
                      </div>
                    </div>
                  );
                })()}
                
                {/* ── Single-Column Master Operation Skills Table ───────────── */}
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[860px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10.5px] font-bold uppercase tracking-wider text-slate-500">
                          <th className="py-3 px-4 w-16 text-center">Seq</th>
                          <th className="py-3 px-4 w-28">Code</th>
                          <th className="py-3 px-4 min-w-[200px]">Operation & Specification</th>
                          <th className="py-3 px-4 w-28 text-center">Standard SMV</th>
                          <th className="py-3 px-4 min-w-[220px]">Current Skill Rating</th>
                          <th className="py-3 px-4 w-32 text-center">Tested Avg Time</th>
                          <th className="py-3 px-4 w-28 text-right pr-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                        {operations.map((op, index) => {
                          const currentSkill = skills[String(op.id)] || 0;
                          const benchmark = getBenchmarkForOperation(op.name);
                          const smv = Number(op.standardSmv || benchmark?.defaultSmv || 0.5);
                          const smvSec = smv * 60;

                          // Find submitted test logs for this operation
                          const opLogs = performanceLogs.filter(
                            (l) => String(l.operationId) === String(op.id) && (l.status === "SUBMITTED" || !l.status)
                          );
                          const avgTime = opLogs.length > 0
                            ? opLogs.reduce((a, b) => a + b.actualCycleTimeSeconds, 0) / opLogs.length
                            : null;

                          const qualifiedRange = currentSkill === 5
                            ? benchmark?.rating5?.label
                            : currentSkill === 4
                            ? benchmark?.rating4?.label
                            : currentSkill === 3
                            ? benchmark?.rating3?.label
                            : currentSkill === 2
                            ? benchmark?.rating2?.label
                            : currentSkill === 1
                            ? benchmark?.rating1?.label
                            : null;

                          return (
                            <tr key={op.id} className="hover:bg-slate-50/70 transition-colors">
                              {/* Seq */}
                              <td className="py-3.5 px-4 text-center align-middle">
                                <span className="font-mono text-xs text-slate-500 font-bold">
                                  #{op.sequence || index + 1}
                                </span>
                              </td>

                              {/* Code */}
                              <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                                  {op.operationCode}
                                </span>
                              </td>

                              {/* Operation Name */}
                              <td className="py-3.5 px-4 align-middle">
                                <button
                                  type="button"
                                  onClick={() => setSelectedHistoryOperation(op)}
                                  className="font-bold text-xs text-slate-900 hover:text-blue-600 hover:underline cursor-pointer text-left transition-colors block"
                                  title={`Click to view performance test history for ${op.name}`}
                                >
                                  {op.name}
                                </button>
                                {op.description && (
                                  <span className="text-[11px] text-slate-500 font-normal block line-clamp-1">
                                    {op.description}
                                  </span>
                                )}
                              </td>

                              {/* Standard SMV */}
                              <td className="py-3.5 px-4 text-center align-middle whitespace-nowrap">
                                <div className="flex flex-col items-center">
                                  <span className="font-mono font-bold text-xs text-slate-900">
                                    {smv.toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">SAM</span>
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-mono font-normal">
                                    ({smvSec.toFixed(0)}s target)
                                  </span>
                                </div>
                              </td>

                              {/* Current Skill Rating (Single Column) */}
                              <td className="py-3.5 px-4 align-middle">
                                {currentSkill > 0 ? (
                                  <div className="flex items-center gap-2.5">
                                    <span
                                      className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-mono font-bold text-xs text-white shadow-2xs shrink-0 ${
                                        currentSkill === 5 ? "bg-emerald-600" :
                                        currentSkill === 4 ? "bg-sky-600" :
                                        currentSkill === 3 ? "bg-amber-600" :
                                        currentSkill === 2 ? "bg-orange-600" :
                                        "bg-rose-600"
                                      }`}
                                    >
                                      {currentSkill}
                                    </span>
                                    <div>
                                      <span className="font-bold text-xs text-slate-900 block">
                                        {currentSkill === 5 ? "Grade 5 · Expert" :
                                         currentSkill === 4 ? "Grade 4 · Skilled" :
                                         currentSkill === 3 ? "Grade 3 · Intermediate" :
                                         currentSkill === 2 ? "Grade 2 · Basic" :
                                         "Grade 1 · Beginner"}
                                      </span>
                                      <span className="text-[10px] text-slate-500 font-mono">
                                        {qualifiedRange ? `Target: ${qualifiedRange}` : "Standard SMV"}
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="inline-flex items-center text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                                    Not Evaluated
                                  </span>
                                )}
                              </td>

                              {/* Tested Avg Time */}
                              <td className="py-3.5 px-4 text-center align-middle whitespace-nowrap">
                                {avgTime !== null ? (
                                  <div>
                                    <span className="font-mono font-bold text-xs text-slate-900">
                                      {avgTime.toFixed(1)}s
                                    </span>
                                    <span className="text-[10px] text-slate-500 block font-normal">
                                      {opLogs.length} {opLogs.length === 1 ? "run" : "runs"}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 font-mono text-xs">—</span>
                                )}
                              </td>

                              {/* Actions */}
                              <td className="py-3.5 px-4 text-right align-middle whitespace-nowrap pr-4">
                                <button
                                  type="button"
                                  onClick={() => setSelectedHistoryOperation(op)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 transition-colors cursor-pointer shadow-2xs"
                                  title="View Test History"
                                >
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  <span>History</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {operations.length === 0 && (
                    <div className="py-12 text-center text-[#64748B] text-xs">No operations available.</div>
                  )}
                </div>

                {/* Daily Performance Tests Breakdown Table */}
                <div className="space-y-3 pt-2">
                  {(() => {
                    // Group performance logs by operation, date, and status
                    const map = new Map<string, { ids: (string | number)[]; operationId: number | string; opName: string; opCode: string; date: string; status: "DRAFT" | "SUBMITTED"; times: number[]; tester: string }>();
                    performanceLogs.forEach((l) => {
                      const status = (l.status || "DRAFT").toUpperCase() as "DRAFT" | "SUBMITTED";
                      const key = `${l.operationId}_${l.logDate}_${status}`;
                      if (!map.has(key)) {
                        map.set(key, {
                          ids: [],
                          operationId: l.operationId,
                          opName: l.operationName || (operations.find(o => o.id === l.operationId)?.name || "Operation"),
                          opCode: l.operationCode || (operations.find(o => o.id === l.operationId)?.operationCode || ""),
                          date: l.logDate,
                          status,
                          times: [],
                          tester: l.recordedBy || "Manager",
                        });
                      }
                      const entry = map.get(key)!;
                      entry.ids.push(l.id);
                      entry.times.push(l.actualCycleTimeSeconds);
                    });

                    const testGroups = Array.from(map.entries()).map(([key, data]) => {
                      const avg = data.times.reduce((a, b) => a + b, 0) / data.times.length;
                      const rating = cycleTimeToRating(avg, data.opName);
                      return {
                        key,
                        ...data,
                        count: data.times.length,
                        avgTime: avg.toFixed(1),
                        rating,
                      };
                    });

                    const draftEntries = testGroups.filter(g => g.status === "DRAFT");
                    const allDraftIds = draftEntries.flatMap(g => g.ids);

                    const handleSubmitGroup = async (group: typeof testGroups[0]) => {
                      try {
                        // 1. Mark logs submitted
                        await skillApi.submitBatchPerformanceLogs(group.ids);
                        // 2. Direct assessment write to guarantee matrix updates immediately
                        await skillApi.addAssessment({
                          operatorId: Number(operator.id),
                          operationId: Number(group.operationId),
                          rating: group.rating as 1 | 2 | 3 | 4 | 5,
                          cycleTimeSeconds: Math.round(Number(group.avgTime)),
                          effectiveDate: group.date,
                          notes: `Submitted ${group.count} test run(s) with daily average ${group.avgTime}s`,
                        });
                        await loadData();
                      } catch (err) {
                        console.error("Failed to submit tests:", err);
                        alert("Failed to submit tests. Please try again.");
                      }
                    };

                    const handleSubmitAllDrafts = async () => {
                      try {
                        for (const group of draftEntries) {
                          await skillApi.submitBatchPerformanceLogs(group.ids);
                          await skillApi.addAssessment({
                            operatorId: Number(operator.id),
                            operationId: Number(group.operationId),
                            rating: group.rating as 1 | 2 | 3 | 4 | 5,
                            cycleTimeSeconds: Math.round(Number(group.avgTime)),
                            effectiveDate: group.date,
                            notes: `Submitted ${group.count} test run(s) with daily average ${group.avgTime}s`,
                          });
                        }
                        await loadData();
                      } catch (err) {
                        console.error("Failed to submit all drafts:", err);
                        alert("Failed to submit all drafts. Please try again.");
                      }
                    };

                    const handleDeleteGroup = async (ids: (string | number)[]) => {
                      if (!window.confirm("Are you sure you want to delete these test run(s)?")) return;
                      try {
                        for (const logId of ids) {
                          await skillApi.deletePerformanceLog(logId);
                        }
                        await loadData();
                      } catch (err) {
                        console.error("Failed to delete tests:", err);
                        alert("Failed to delete tests. Please try again.");
                      }
                    };

                    return (
                      <>
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-[#2563EB]" />
                            <h4 className="font-bold text-sm text-[#0F172A]">Daily Performance Tests & Document Status</h4>
                            <span className="text-xs text-[#64748B] font-medium">
                              ({performanceLogs.length} test run{performanceLogs.length === 1 ? "" : "s"})
                            </span>
                          </div>

                          {draftEntries.length > 0 && (
                            <button
                              type="button"
                              onClick={handleSubmitAllDrafts}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0F172A] text-white text-xs font-bold rounded-lg hover:bg-[#3A2E24] transition-all shadow-xs cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5 text-[#2563EB]" /> Submit All ({allDraftIds.length}) Drafts & Update Matrix
                            </button>
                          )}
                        </div>

                        {testGroups.length === 0 ? (
                          <div className="p-6 bg-[#F8FAFC] rounded-xl border border-dashed border-[#E2E8F0] text-center">
                            <p className="text-xs text-[#64748B]">
                              No timed performance tests recorded yet. Click <strong>Record Tests</strong> or <strong>Upload Excel</strong> to log test cycle times.
                            </p>
                          </div>
                        ) : (
                          <div className="border border-[#F1F5F9] rounded-xl overflow-hidden bg-white shadow-2xs">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-[#F8FAFC] border-b border-[#F1F5F9] text-[11px] font-bold text-[#64748B] uppercase">
                                  <th className="py-3 px-4">Date</th>
                                  <th className="py-3 px-4">Operation</th>
                                  <th className="py-3 px-4">Test Runs</th>
                                  <th className="py-3 px-2 text-center">Tests</th>
                                  <th className="py-3 px-3 text-center">Avg Time</th>
                                  <th className="py-3 px-4 text-center">Status / Matrix Rating</th>
                                  <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#F1F5F9]">
                                {testGroups.map((group) => {
                                  const isDraft = group.status === "DRAFT";
                                  return (
                                    <tr key={group.key} className="hover:bg-[#F8FAFC]/40 transition-colors">
                                      <td className="py-3 px-4 font-medium text-[#64748B]">{group.date}</td>
                                      <td className="py-3 px-4 font-bold text-[#0F172A]">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const op = operations.find((o) => String(o.id) === String(group.operationId));
                                            if (op) setSelectedHistoryOperation(op);
                                          }}
                                          className="font-bold text-xs text-[#0F172A] hover:text-[#2563EB] hover:underline cursor-pointer text-left transition-colors flex items-center gap-1.5 group"
                                          title={`Click to view past test history for ${group.opName}`}
                                        >
                                          <span>{group.opName}</span>
                                          {group.opCode && <span className="font-mono text-[10px] text-[#2563EB]">({group.opCode})</span>}
                                        </button>
                                      </td>
                                      <td className="py-3 px-4">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          {group.times.map((t, i) => (
                                            <span key={i} className="px-2 py-0.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-[11px] font-mono font-semibold text-[#0F172A]">
                                              {t}s
                                            </span>
                                          ))}
                                        </div>
                                      </td>
                                      <td className="py-3 px-2 text-center font-bold text-[#0F172A]">{group.count}</td>
                                      <td className="py-3 px-3 text-center font-mono font-bold text-[#2563EB]">{group.avgTime}s</td>
                                      <td className="py-3 px-4 text-center">
                                        {isDraft ? (
                                          <div className="inline-flex flex-col items-center">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-md font-bold text-[10px]">
                                              Draft (Rating {group.rating} Pending)
                                            </span>
                                            <span className="text-[9px] text-[#64748B] mt-0.5">Not in matrix until submitted</span>
                                          </div>
                                        ) : (
                                          <div className="inline-flex flex-col items-center">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#0F172A] text-white font-bold rounded-md text-[11px] shadow-2xs">
                                              <CheckCircle2 className="w-3 h-3 text-[#2563EB]" /> Rating {group.rating} · Submitted
                                            </span>
                                          </div>
                                        )}
                                      </td>
                                      <td className="py-3 px-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                          {isDraft && (
                                            <button
                                              type="button"
                                              onClick={() => handleSubmitGroup(group)}
                                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#0F172A] text-white text-[11px] font-bold rounded-md hover:bg-[#3A2E24] shadow-2xs cursor-pointer"
                                              title="Submit this test to update Skill Matrix rating"
                                            >
                                              <Send className="w-3 h-3 text-[#2563EB]" /> Submit
                                            </button>
                                          )}
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteGroup(group.ids)}
                                            className="p-1.5 text-[#C2B7AA] hover:text-rose-600 rounded-md hover:bg-rose-50 cursor-pointer transition-colors"
                                            title="Delete Test Run(s)"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {activeTab === "Connections" && (
              <div className="space-y-10 animate-in fade-in duration-300">
                {/* Connections Section */}
                <div>
                  <h3 className="font-sans text-[18px] font-bold text-[#0F172A] mb-6">
                    Connections
                  </h3>
                  <div className="grid grid-cols-3 gap-x-8 gap-y-6">
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-bold tracking-widest text-[#64748B] uppercase">Workforce</h4>
                      <div>
                        <Link to={`/attendance?employeeId=${operator.employeeId}`} className="inline-block px-3.5 py-2 bg-white border border-[#E2E8F0] hover:border-[#2563EB] rounded-md text-xs font-semibold text-[#0F172A] hover:text-[#2563EB] shadow-2xs transition-all">
                          Attendance Records
                        </Link>
                      </div>

                      <div className="pt-1">
                        <Link to={`/shift-assignment?employeeId=${operator.employeeId}`} className="inline-block px-3.5 py-2 bg-white border border-[#E2E8F0] hover:border-[#2563EB] rounded-md text-xs font-semibold text-[#0F172A] hover:text-[#2563EB] shadow-2xs transition-all">
                          Shift Assignment
                        </Link>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-bold tracking-widest text-[#64748B] uppercase">Performance</h4>
                      <div>
                        <button
                          type="button"
                          onClick={() => setActiveTab("Skill Matrix")}
                          className="px-3.5 py-2 bg-white border border-[#E2E8F0] hover:border-[#2563EB] rounded-md text-xs font-semibold text-[#0F172A] hover:text-[#2563EB] shadow-2xs transition-all cursor-pointer"
                        >
                          Skill Ratings
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-[10px] font-bold tracking-widest text-[#64748B] uppercase">Production</h4>
                      <div>
                        <Link
                          to="/line-balance"
                          className="inline-block px-3.5 py-2 bg-white border border-[#E2E8F0] hover:border-[#2563EB] rounded-md text-xs font-semibold text-[#0F172A] hover:text-[#2563EB] shadow-2xs transition-all"
                        >
                          Line Balance Placement
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Activity Feed Section */}
                <div className="pt-2 border-t border-[#F0EAE0]">
                  <RecentActivityLog
                    entityType="OPERATOR"
                    entityId={operator.id}
                  />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Record Performance Timing Tests Modal */}
      {isRecordTestModalOpen && (
        <RecordPerformanceTestModal
          isOpen={isRecordTestModalOpen}
          onClose={() => setIsRecordTestModalOpen(false)}
          operator={operator}
          operations={operations}
          performanceLogs={performanceLogs}
          onSuccess={() => {
            loadData();
          }}
        />
      )}

      {/* Upload Performance Excel Modal */}
      {isUploadExcelModalOpen && (
        <UploadPerformanceExcelModal
          isOpen={isUploadExcelModalOpen}
          onClose={() => setIsUploadExcelModalOpen(false)}
          operator={operator}
          allOperators={allOperators}
          allOperations={operations}
          onSuccess={() => {
            loadData();
          }}
        />
      )}

      {/* Dedicated Operation Test History Modal */}
      {selectedHistoryOperation && operator && (
        <OperationTestHistoryModal
          isOpen={!!selectedHistoryOperation}
          onClose={() => setSelectedHistoryOperation(null)}
          operator={operator}
          operation={selectedHistoryOperation}
          performanceLogs={performanceLogs}
          currentRating={skills[selectedHistoryOperation.id] || 0}
        />
      )}
    </div>
  );
}

