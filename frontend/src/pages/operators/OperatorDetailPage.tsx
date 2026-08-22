import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronRight, Paperclip, FileText, Plus, X, RefreshCw, TrendingUp, ClipboardList, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { operationsApi, type Operation } from "../../features/operations/api";
import { operatorsApi, type Operator } from "../../features/operators/api";
import { skillApi, type PerformanceLog } from "../../features/skill-matrix/api";
import { api } from "../../lib/api";
import { Modal } from "../../components/ui/Modal";
import { ToggleSwitch } from "../../components/ui/ToggleSwitch";

type Tab = "Overview" | "Skill Matrix" | "Connections";

export function OperatorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [operator, setOperator] = useState<Operator | null>(null);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [skills, setSkills] = useState<Record<string, number>>({});
  
  // Real data states
  const [attachments, setAttachments] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [shiftAssignments, setShiftAssignments] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [performanceLogs, setPerformanceLogs] = useState<PerformanceLog[]>([]);

  // Performance Log Modal
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logForm, setLogForm] = useState({ operationId: "", logDate: new Date().toISOString().split("T")[0], actualCycleTimeSeconds: "", recordedBy: "", notes: "" });
  const [logSaving, setLogSaving] = useState(false);
  const [autoUpdating, setAutoUpdating] = useState(false);
  const [autoUpdateResult, setAutoUpdateResult] = useState<{ changed: number; message: string } | null>(null);

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Operator>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    if (!id) return;
    try {
      const ops = await operatorsApi.getOperators();
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
        api.get(`/audit-logs->entityName=Operator&entityId=${found.id}`).then((res: any) => setAuditLogs(res)).catch(console.error);
        api.get(`/shift-assignments->operatorId=${found.id}`).then((res: any) => setShiftAssignments(res)).catch(console.error);
        api.get(`/attendance/operator/${found.id}`).then((res: any) => setAttendanceRecords(res)).catch(console.error);
        operatorsApi.getAttachments(found.id).then(setAttachments).catch(console.error);
        skillApi.getPerformanceLogs(found.id).then(setPerformanceLogs).catch(console.error);

        // Load skills
        const currentSkills = await skillApi.getCurrentMatrix(found.id);
        const skillMap: Record<string, number> = {};
        currentSkills.forEach(skill => {
          skillMap[skill.operationId.toString()] = skill.rating;
        });
        setSkills(skillMap);
      }

      const allOps = await operationsApi.getOperations();
      setOperations(allOps);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleSkillChange = (opId: string, value: number) => {
    setSkills(prev => ({ ...prev, [opId]: prev[opId] === value ? 0 : value }));
  };

  const [saving, setSaving] = useState(false);
  const handleSaveRatings = async () => {
    if (!operator) return;
    setSaving(true);
    try {
      const promises = Object.entries(skills).map(([opId, rating]) => {
        const cycleTimeSeconds = rating * 10;
        return skillApi.addAssessment({
          operatorId: operator.id,
          operationId: opId,
          rating: rating as 1|2|3|4|5,
          cycleTimeSeconds,
          effectiveDate: new Date().toISOString().split('T')[0]
        });
      });
      await Promise.all(promises);
      alert("Ratings saved successfully!");
    } catch (err) {
      console.error("Failed to save ratings:", err);
      alert("Failed to save ratings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogPerformance = async () => {
    if (!operator || !logForm.operationId || !logForm.actualCycleTimeSeconds) return;
    setLogSaving(true);
    try {
      await skillApi.addPerformanceLog({
        operatorId: operator.id,
        operationId: logForm.operationId,
        logDate: logForm.logDate,
        actualCycleTimeSeconds: parseInt(logForm.actualCycleTimeSeconds),
        recordedBy: logForm.recordedBy || "Manager",
        notes: logForm.notes,
      });
      const logs = await skillApi.getPerformanceLogs(operator.id);
      setPerformanceLogs(logs);
      setIsLogModalOpen(false);
      setLogForm({ operationId: "", logDate: new Date().toISOString().split("T")[0], actualCycleTimeSeconds: "", recordedBy: "", notes: "" });
    } catch (err) {
      console.error("Failed to log performance:", err);
      alert("Failed to log performance.");
    } finally {
      setLogSaving(false);
    }
  };

  const handleAutoUpdate = async () => {
    if (!operator) return;
    setAutoUpdating(true);
    setAutoUpdateResult(null);
    try {
      const updated = await skillApi.autoUpdateSkillMatrix(operator.id);
      const changedCount = Array.isArray(updated) ? updated.length : 0;
      setAutoUpdateResult({
        changed: changedCount,
        message: changedCount === 0
          ? "All ratings are already up to date."
          : `${changedCount} operation rating(s) updated from your performance logs!`
      });
      // Reload skills
      const currentSkills = await skillApi.getCurrentMatrix(operator.id);
      const skillMap: Record<string, number> = {};
      currentSkills.forEach(s => { skillMap[s.operationId.toString()] = s.rating; });
      setSkills(skillMap);
    } catch (err) {
      console.error("Auto-update failed:", err);
      alert("Auto-update failed. Please try again.");
    } finally {
      setAutoUpdating(false);
    }
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

  if (!operator) return <div className="p-8 text-center text-[#8C7E6E]">Loading employee...</div>;

  return (
    <div className="flex flex-col h-full bg-[#FAFAF8] w-full relative">
      {/* Log Performance Modal */}
      <Modal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} title="Log Performance" subtitle="Record the actual cycle time this operator took for an operation.">
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-[#8C7E6E] uppercase tracking-wide mb-1.5">Operation *</label>
            <select value={logForm.operationId} onChange={e => setLogForm(f => ({ ...f, operationId: e.target.value }))} className="w-full h-9 border border-[#E6DDCE] rounded-sm px-3 text-sm text-[#221912] bg-white focus:outline-none focus:border-[#B48259]">
              <option value="">Select operation...</option>
              {operations.map(op => (<option key={op.id} value={op.id}>{op.name}</option>))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#8C7E6E] uppercase tracking-wide mb-1.5">Date *</label>
              <input type="date" value={logForm.logDate} onChange={e => setLogForm(f => ({ ...f, logDate: e.target.value }))} className="w-full h-9 border border-[#E6DDCE] rounded-sm px-3 text-sm bg-white focus:outline-none focus:border-[#B48259]" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#8C7E6E] uppercase tracking-wide mb-1.5">Actual Cycle Time (seconds) *</label>
              <input type="number" min="1" placeholder="e.g. 35" value={logForm.actualCycleTimeSeconds} onChange={e => setLogForm(f => ({ ...f, actualCycleTimeSeconds: e.target.value }))} className="w-full h-9 border border-[#E6DDCE] rounded-sm px-3 text-sm bg-white focus:outline-none focus:border-[#B48259]" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#8C7E6E] uppercase tracking-wide mb-1.5">Logged By</label>
            <input type="text" placeholder="Manager / IE Engineer..." value={logForm.recordedBy} onChange={e => setLogForm(f => ({ ...f, recordedBy: e.target.value }))} className="w-full h-9 border border-[#E6DDCE] rounded-sm px-3 text-sm bg-white focus:outline-none focus:border-[#B48259]" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#8C7E6E] uppercase tracking-wide mb-1.5">Notes</label>
            <textarea rows={2} placeholder="Any observations..." value={logForm.notes} onChange={e => setLogForm(f => ({ ...f, notes: e.target.value }))} className="w-full border border-[#E6DDCE] rounded-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#B48259] resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setIsLogModalOpen(false)} className="flex-1 h-9 text-sm font-semibold text-[#8C7E6E] border border-[#E6DDCE] rounded-sm hover:bg-[#FAFAF8]">Cancel</button>
            <button onClick={handleLogPerformance} disabled={logSaving || !logForm.operationId || !logForm.actualCycleTimeSeconds} className="flex-1 h-9 text-sm font-semibold text-white bg-[#B48259] rounded-sm hover:bg-[#9B6B44] disabled:opacity-50">{logSaving ? "Saving..." : "Save Log Entry"}</button>
          </div>
        </div>
      </Modal>
      {/* Log Performance Modal */}
      <Modal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        title="Log Today's Performance"
        subtitle="Record the actual cycle time this operator took for an operation today."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-[#8C7E6E] uppercase tracking-wide mb-1.5">Operation *</label>
            <select
              value={logForm.operationId}
              onChange={e => setLogForm(f => ({ ...f, operationId: e.target.value }))}
              className="w-full h-9 border border-[#E6DDCE] rounded-sm px-3 text-sm text-[#221912] bg-white focus:outline-none focus:border-[#B48259]"
            >
              <option value="">Select operation...</option>
              {operations.map(op => (
                <option key={op.id} value={op.id}>{op.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#8C7E6E] uppercase tracking-wide mb-1.5">Date *</label>
              <input type="date" value={logForm.logDate} onChange={e => setLogForm(f => ({ ...f, logDate: e.target.value }))} className="w-full h-9 border border-[#E6DDCE] rounded-sm px-3 text-sm text-[#221912] bg-white focus:outline-none focus:border-[#B48259]" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#8C7E6E] uppercase tracking-wide mb-1.5">Actual Cycle Time (sec) *</label>
              <input type="number" min="1" placeholder="e.g. 35" value={logForm.actualCycleTimeSeconds} onChange={e => setLogForm(f => ({ ...f, actualCycleTimeSeconds: e.target.value }))} className="w-full h-9 border border-[#E6DDCE] rounded-sm px-3 text-sm text-[#221912] bg-white focus:outline-none focus:border-[#B48259]" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#8C7E6E] uppercase tracking-wide mb-1.5">Logged By</label>
            <input type="text" placeholder="Manager / IE Engineer..." value={logForm.recordedBy} onChange={e => setLogForm(f => ({ ...f, recordedBy: e.target.value }))} className="w-full h-9 border border-[#E6DDCE] rounded-sm px-3 text-sm text-[#221912] bg-white focus:outline-none focus:border-[#B48259]" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#8C7E6E] uppercase tracking-wide mb-1.5">Notes</label>
            <textarea rows={2} placeholder="Any observations..." value={logForm.notes} onChange={e => setLogForm(f => ({ ...f, notes: e.target.value }))} className="w-full border border-[#E6DDCE] rounded-sm px-3 py-2 text-sm text-[#221912] bg-white focus:outline-none focus:border-[#B48259] resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setIsLogModalOpen(false)} className="flex-1 h-9 text-sm font-semibold text-[#8C7E6E] border border-[#E6DDCE] rounded-sm hover:bg-[#FAFAF8]">Cancel</button>
            <button onClick={handleLogPerformance} disabled={logSaving || !logForm.operationId || !logForm.actualCycleTimeSeconds} className="flex-1 h-9 text-sm font-semibold text-white bg-[#B48259] rounded-sm hover:bg-[#9B6B44] disabled:opacity-50">
              {logSaving ? "Saving..." : "Save Log Entry"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Top Header Bar */}
      <header className="h-14 shrink-0 bg-white border-b border-[#F0EAE0] px-6 flex items-center gap-2 sticky top-0 z-10">
        <div className="flex items-center gap-1.5 text-[13px]">
          <Link to="/settings/operators" className="text-[#8C7E6E] hover:text-[#221912] font-medium transition-colors">
            Employee
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#B8A898]" />
          <span className="font-semibold text-[#221912]">{operator.employeeId}</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-64 shrink-0 bg-[#FAFAF8] border-r border-[#F0EAE0] overflow-y-auto p-5 space-y-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#FFE5BF] to-[#8B4A3C]/80 shadow-inner flex items-center justify-center text-3xl font-bold text-white border border-[#E6DDCE]">
              {operator.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </div>
            <div>
              <h2 className="font-bold text-[#221912] text-sm">{operator.name}</h2>
              <p className="text-[11px] font-medium text-[#8C7E6E]">{operator.department}</p>
            </div>
            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${operator.active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
              {operator.active ? "Active" : "Inactive"}
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-bold tracking-widest text-[#8C7E6E] uppercase flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5" /> Attachments
                </h3>
                <button onClick={() => fileInputRef.current?.click()} className="text-[#8C7E6E] hover:text-[#B48259]">
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
              </div>
              <ul className="space-y-1.5">
                {attachments.length === 0 ? (
                   <li className="text-[11px] text-[#A3998F] italic">No files attached</li>
                ) : (
                  attachments.map((file) => (
                    <li key={file.id} className="flex items-center justify-between group text-[11.5px] text-[#475569] hover:text-[#B48259]">
                      <a href={`http://localhost:8085/api/operators/attachments/${file.id}/download`} target="_blank" rel="noreferrer" className="flex items-center gap-2 truncate cursor-pointer flex-1">
                        <FileText className="w-3 h-3 text-[#B8A898]" />
                        <span className="truncate" title={file.fileName}>{file.fileName}</span>
                      </a>
                      <button onClick={() => handleDeleteAttachment(file.id)} className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 p-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-white flex flex-col">
          {/* Tabs */}
          <div className="px-8 pt-6 border-b border-[#F0EAE0]">
            <div className="flex items-center gap-6">
              {(["Overview", "Skill Matrix", "Connections"] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 text-[13px] font-semibold transition-colors relative ${
                    activeTab === tab ? "text-[#221912]" : "text-[#8C7E6E] hover:text-[#221912]"
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B48259]"
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
                  <h3 className="font-bold text-[#221912] text-lg">Employee Details</h3>
                  {!isEditing ? (
                    <button onClick={() => setIsEditing(true)} className="px-3 py-1.5 bg-[#FAFAF8] text-[#221912] text-xs font-semibold rounded-md border border-[#F0EAE0] hover:bg-[#F0EAE0]">
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 bg-transparent text-[#8C7E6E] text-xs font-semibold hover:text-[#221912]">
                        Cancel
                      </button>
                      <button onClick={handleSaveProfile} disabled={saving} className="px-3 py-1.5 bg-[#221912] text-white text-xs font-semibold rounded-md border border-[#221912] hover:bg-[#3A2E24] disabled:opacity-50">
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-6 text-[13px]">
                  <div>
                    <label className="text-[#8C7E6E] text-[11px] font-bold uppercase tracking-wide">Age</label>
                    {isEditing ? (
                      <input type="number" value={editData.age || ""} onChange={e => setEditData({...editData, age: Number(e.target.value)})} className="mt-1 block w-full px-3 py-1.5 border border-[#E6DDCE] rounded bg-white" />
                    ) : (
                      <p className="font-medium mt-1">{operator.age} years</p>
                    )}
                  </div>
                  <div>
                    <label className="text-[#8C7E6E] text-[11px] font-bold uppercase tracking-wide">Gender</label>
                    {isEditing ? (
                      <select value={editData.gender || ""} onChange={e => setEditData({...editData, gender: e.target.value as any})} className="mt-1 block w-full px-3 py-1.5 border border-[#E6DDCE] rounded bg-white">
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      <p className="font-medium mt-1">{operator.gender}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-[#8C7E6E] text-[11px] font-bold uppercase tracking-wide">Department</label>
                    {isEditing ? (
                      <input type="text" value={editData.department || ""} onChange={e => setEditData({...editData, department: e.target.value})} className="mt-1 block w-full px-3 py-1.5 border border-[#E6DDCE] rounded bg-white" />
                    ) : (
                      <p className="font-medium mt-1">{operator.department}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-[#8C7E6E] text-[11px] font-bold uppercase tracking-wide">Joining Date</label>
                    {isEditing ? (
                      <input type="date" value={editData.joiningDate || ""} onChange={e => setEditData({...editData, joiningDate: e.target.value})} className="mt-1 block w-full px-3 py-1.5 border border-[#E6DDCE] rounded bg-white" />
                    ) : (
                      <p className="font-medium mt-1">{operator.joiningDate}</p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <label className="text-[#8C7E6E] text-[11px] font-bold uppercase tracking-wide">Status</label>
                     {isEditing ? (
                       <div className="mt-2 flex items-center gap-3">
                         <ToggleSwitch
                           checked={editData.active === true}
                           onChange={(checked) => setEditData({ ...editData, active: checked })}
                         />
                         <span className="text-sm font-medium text-[#221912]">
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
                         <span className="text-sm font-medium text-[#221912]">
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
                {/* Auto-Update Result Banner */}
                <AnimatePresence>
                  {autoUpdateResult && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`flex items-center justify-between px-4 py-3 rounded-lg border text-sm font-medium ${
                        autoUpdateResult.changed > 0
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : "bg-sky-50 border-sky-200 text-sky-800"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        {autoUpdateResult.message}
                      </span>
                      <button onClick={() => setAutoUpdateResult(null)} className="text-current opacity-60 hover:opacity-100">
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Header Row */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-[#221912] text-lg">Skill Ratings</h3>
                    <p className="text-xs text-[#8C7E6E] mt-0.5">Click a rating to manually override. Or use Auto-Update to compute from daily logs.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsLogModalOpen(true)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#E6DDCE] text-[#221912] text-xs font-semibold rounded-md hover:bg-[#F0EAE0] transition-colors"
                    >
                      <ClipboardList className="w-3.5 h-3.5" />
                      Log Today's Performance
                    </button>
                    <button
                      onClick={handleAutoUpdate}
                      disabled={autoUpdating || performanceLogs.length === 0}
                      className="flex items-center gap-2 px-3 py-1.5 bg-[#B48259] text-white text-xs font-semibold rounded-md hover:bg-[#9B6B44] transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${autoUpdating ? 'animate-spin' : ''}`} />
                      {autoUpdating ? "Updating..." : `Auto-Update from Logs (${performanceLogs.length})`}
                    </button>
                    <button
                      onClick={handleSaveRatings}
                      disabled={saving}
                      className="px-3 py-1.5 bg-[#221912] text-white text-xs font-semibold rounded-md hover:bg-[#3A2E24] transition-colors disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save Manual Ratings"}
                    </button>
                  </div>
                </div>
                
                {/* Rating Table */}
                <div className="border border-[#F0EAE0] rounded-xl overflow-hidden bg-white">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#FAFAF8] border-b border-[#F0EAE0] text-[10px] font-bold tracking-widest text-[#8C7E6E] uppercase">
                        <th className="py-4 px-5">Operation</th>
                        <th className="py-4 px-2 text-center w-24 leading-snug">1 &mdash;<br/>Beginner</th>
                        <th className="py-4 px-2 text-center w-24 leading-snug">2 &mdash;<br/>Basic</th>
                        <th className="py-4 px-2 text-center w-24 leading-snug">3 &mdash;<br/>Standard</th>
                        <th className="py-4 px-2 text-center w-24 leading-snug">4 &mdash;<br/>Good</th>
                        <th className="py-4 px-2 text-center w-24 leading-snug">5 &mdash;<br/>Expert</th>
                      </tr>
                    </thead>
                    <tbody className="text-[13px] text-[#221912] font-medium">
                      {operations.map((op) => {
                        const currentSkill = skills[op.id] || 0;
                        const ratingColors = [
                          { bg: "bg-slate-100", border: "border-slate-300", text: "text-slate-700", ring: "ring-slate-200" },
                          { bg: "bg-teal-50", border: "border-teal-300", text: "text-teal-700", ring: "ring-teal-200" },
                          { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-700", ring: "ring-amber-200" },
                          { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-700", ring: "ring-blue-200" },
                          { bg: "bg-[#FBF4EC]", border: "border-[#D1BFA5]", text: "text-[#9B5A32]", ring: "ring-[#E6DDCE]" }
                        ];
                        return (
                          <tr key={op.id} className="border-b border-[#F0EAE0] last:border-0 hover:bg-[#FEFCF9] transition-colors group">
                            <td className="py-3 px-5">
                              <div className="flex flex-col">
                                <span className="font-bold text-sm text-[#221912]">{op.name}</span>
                                <span className="font-mono text-[10px] font-bold text-[#B48259] mt-0.5">{op.operationCode}</span>
                              </div>
                            </td>
                            {[1, 2, 3, 4, 5].map((rating) => {
                              const isActive = currentSkill === rating;
                              const c = ratingColors[rating - 1];
                              return (
                                <td key={rating} className="py-2 px-2 text-center">
                                  <button
                                    onClick={() => handleSkillChange(String(op.id), rating)}
                                    className={`w-10 h-10 rounded-xl mx-auto flex items-center justify-center font-bold text-sm transition-all duration-200 ${
                                      isActive
                                        ? `${c.bg} ${c.text} border-2 ${c.border} shadow-sm ring-4 ${c.ring} scale-110 z-10 relative`
                                        : "bg-white border border-[#E6DDCE] text-[#8C7E6E] hover:border-[#B48259] hover:text-[#B48259] hover:bg-[#FAFAF8] hover:shadow-sm"
                                    }`}
                                  >
                                    {rating}
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {operations.length === 0 && (
                    <div className="py-12 text-center text-[#8C7E6E] text-[13px]">No operations available.</div>
                  )}
                </div>

                {/* Daily Performance Log Section */}
                <div className="border border-[#F0EAE0] rounded-xl overflow-hidden bg-white">
                  <div className="px-4 py-3 border-b border-[#F0EAE0] bg-[#FAFAF8] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#B48259]" />
                      <span className="font-bold text-sm text-[#221912]">Daily Performance Log</span>
                      <span className="ml-1 px-2 py-0.5 bg-[#FFE5BF] text-[#9B5A32] text-[10px] font-bold rounded-full">{performanceLogs.length} entries</span>
                    </div>
                    <p className="text-[11px] text-[#8C7E6E]">Manager-entered actual cycle times per operation per day</p>
                  </div>
                  {performanceLogs.length === 0 ? (
                    <div className="py-10 text-center">
                      <ClipboardList className="w-8 h-8 text-[#E6DDCE] mx-auto mb-2" />
                      <p className="text-sm text-[#8C7E6E]">No performance logs yet.</p>
                      <button onClick={() => setIsLogModalOpen(true)} className="mt-2 text-xs text-[#B48259] hover:underline font-medium">Log the first one →</button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="text-[10px] font-bold tracking-wide text-[#8C7E6E] uppercase border-b border-[#F0EAE0]">
                            <th className="py-2 px-4">Date</th>
                            <th className="py-2 px-4">Operation</th>
                            <th className="py-2 px-4 text-right">Actual Time</th>
                            <th className="py-2 px-4">Logged By</th>
                            <th className="py-2 px-4">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {performanceLogs.slice(0, 10).map((log) => (
                            <tr key={log.id} className="border-b border-[#F0EAE0] last:border-0 hover:bg-[#FAFAF8]">
                              <td className="py-2 px-4 font-mono text-xs text-[#475569]">{log.logDate}</td>
                              <td className="py-2 px-4">
                                <span className="text-sm font-medium text-[#221912]">{log.operationName}</span>
                                <span className="ml-1.5 font-mono text-[10px] text-[#B48259]">{log.operationCode}</span>
                              </td>
                              <td className="py-2 px-4 text-right">
                                <span className="font-mono text-sm font-bold text-[#221912]">{log.actualCycleTimeSeconds}s</span>
                              </td>
                              <td className="py-2 px-4 text-xs text-[#475569]">{log.recordedBy || "—"}</td>
                              <td className="py-2 px-4 text-xs text-[#8C7E6E] italic">{log.notes || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {performanceLogs.length > 10 && (
                        <div className="px-4 py-2 text-center text-xs text-[#8C7E6E]">Showing 10 of {performanceLogs.length} entries</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "Connections" && (
              <div className="space-y-10 animate-in fade-in duration-300">
                {/* Connections Section */}
                <div>
                  <h3 className="font-bold text-[#221912] text-[14px] flex items-center gap-2 mb-4">
                    Connections
                  </h3>
                  <div className="grid grid-cols-3 gap-x-8 gap-y-6">
                    <div className="space-y-3">
                      <h4 className="text-[11px] font-bold text-[#8C7E6E] uppercase tracking-wide">Workforce</h4>
                      
                      <div className="space-y-2">
                        <Link to={`/attendance?employeeId=${operator.employeeId}`} className="block p-3 border border-[#F0EAE0] rounded-lg bg-white hover:border-[#B48259] hover:shadow-sm transition-all group">
                          <div className="text-xs font-bold text-[#221912] group-hover:text-[#B48259]">Attendance Records</div>
                          <p className="text-[11px] text-[#8C7E6E] mt-1">{attendanceRecords.length} records found</p>
                        </Link>
                      </div>

                      <div className="space-y-2 pt-2">
                        <Link to={`/shift-assignment?employeeId=${operator.employeeId}`} className="block p-3 border border-[#F0EAE0] rounded-lg bg-white hover:border-[#B48259] hover:shadow-sm transition-all group">
                          <div className="text-xs font-bold text-[#221912] group-hover:text-[#B48259]">Shift Assignments</div>
                          <p className="text-[11px] text-[#8C7E6E] mt-1">{shiftAssignments.length} records found</p>
                        </Link>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="text-[11px] font-bold text-[#8C7E6E] uppercase tracking-wide">Performance</h4>
                      <div className="space-y-2">
                        <Link to="/skill-matrix" className="block p-3 border border-[#F0EAE0] rounded-lg bg-white hover:border-[#B48259] hover:shadow-sm transition-all group">
                          <div className="text-xs font-bold text-[#221912] group-hover:text-[#B48259]">Skill Matrix Profile</div>
                          <p className="text-[11px] text-[#8C7E6E] mt-1">{Object.keys(skills).length} documented skills</p>
                        </Link>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-[11px] font-bold text-[#8C7E6E] uppercase tracking-wide">Production</h4>
                      <div className="text-xs font-bold text-[#221912]">Line Assignments</div>
                      <p className="text-[11px] text-[#8C7E6E] italic">No records</p>
                    </div>
                  </div>
                </div>

                {/* Activity Feed Section */}
                <div className="pt-2 border-t border-[#F0EAE0]">
                  <div className="flex items-center justify-between mb-6 mt-4">
                    <h3 className="font-bold text-[#221912] text-[14px]">Activity</h3>
                  </div>
                  
                  {auditLogs.length === 0 ? (
                     <div className="py-6 text-center text-[#8C7E6E] text-[13px] border border-dashed border-[#E6DDCE] rounded-lg">
                       No activity logs found for this employee.
                     </div>
                  ) : (
                    <div className="relative pl-4 space-y-5 before:absolute before:inset-0 before:left-5 before:-translate-x-px before:h-full before:w-px before:bg-[#E6DDCE]">
                      {auditLogs.map((log: any) => (
                        <div key={log.id} className="relative flex items-start gap-4">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#B8A898] shrink-0 mt-1.5 z-10 -ml-[5px]" />
                          <div className="text-[13px] text-[#475569]">
                            <span className="font-semibold text-[#221912]">{log.performedBy || "System"}</span> {log.action.toLowerCase()}d this operator <span className="text-[#8C7E6E]">Â· {new Date(log.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

