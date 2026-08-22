import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronRight, Paperclip, FileText, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { operationsApi, type Operation } from "../../features/operations/api";
import { operatorsApi, type Operator } from "../../features/operators/api";
import { skillApi } from "../../features/skill-matrix/api";

type Tab = "Overview" | "Connections" | "Skill Matrix";

export function OperatorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [operator, setOperator] = useState<Operator | null>(null);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("Connections");
  const [skills, setSkills] = useState<Record<string, number>>({});

  useEffect(() => {
    const loadData = async () => {
      try {
        const ops = await operatorsApi.getOperators();
        const found = ops.find(o => o.employeeId === id) || ops[0];
        setOperator(found);

        const allOps = await operationsApi.getOperations();
        setOperations(allOps);

        const currentSkills = await skillApi.getCurrentMatrix(id);
        const skillMap: Record<string, number> = {};
        currentSkills.forEach(skill => {
          skillMap[skill.operationId.toString()] = skill.rating;
        });
        setSkills(skillMap);
      } catch (err) {
        console.error(err);
      }
    };
    loadData();
  }, [id]);

  const handleSkillChange = (opId: string, value: number) => {
    setSkills(prev => ({ ...prev, [opId]: value }));
  };

  const [saving, setSaving] = useState(false);
  const handleSaveRatings = async () => {
    if (!operator) return;
    setSaving(true);
    try {
      const promises = Object.entries(skills).map(([opId, rating]) => {
        // Simple mapping: Rating 1 -> 10s, Rating 2 -> 20s, etc.
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

  if (!operator) return <div className="p-8 text-center text-[#8C7E6E]">Loading employee...</div>;

  const mockAttachments = [
    "Aadhar_Card.pdf",
    "Employment_Contract.pdf",
    "Bank_Passbook.pdf",
    "Stitching_Skill_Certificate.pdf",
    "Medical_Fitness_Report.pdf"
  ];

  return (
    <div className="flex flex-col h-full bg-[#FAFAF8] w-full relative">
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
              <h3 className="text-[10px] font-bold tracking-widest text-[#8C7E6E] uppercase mb-2">Assigned To</h3>
              <div className="text-[12px] font-medium text-[#221912] bg-white border border-[#F0EAE0] p-2 rounded-lg flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-blue-100 text-blue-700 flex items-center justify-center text-[9px] font-bold">L1</div>
                Line 1 (Sewing)
              </div>
            </div>

            <div>
              <h3 className="text-[10px] font-bold tracking-widest text-[#8C7E6E] uppercase mb-2 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5" /> Attachments
              </h3>
              <ul className="space-y-1.5">
                {mockAttachments.map((file, i) => (
                  <li key={i} className="flex items-center gap-2 text-[11.5px] text-[#475569] hover:text-[#B48259] cursor-pointer">
                    <FileText className="w-3 h-3 text-[#B8A898]" />
                    <span className="truncate" title={file}>{file}</span>
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
                <h3 className="font-bold text-[#221912] text-lg border-b border-[#F0EAE0] pb-2">Employee Details</h3>
                <div className="grid grid-cols-2 gap-6 text-[13px]">
                  <div>
                    <label className="text-[#8C7E6E] text-[11px] font-bold uppercase tracking-wide">Age</label>
                    <p className="font-medium mt-1">{operator.age} years</p>
                  </div>
                  <div>
                    <label className="text-[#8C7E6E] text-[11px] font-bold uppercase tracking-wide">Gender</label>
                    <p className="font-medium mt-1">{operator.gender}</p>
                  </div>
                  <div>
                    <label className="text-[#8C7E6E] text-[11px] font-bold uppercase tracking-wide">Joining Date</label>
                    <p className="font-medium mt-1">{operator.joiningDate}</p>
                  </div>
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
                      <div className="flex items-center gap-2">
                        <span className="bg-[#FAFAF8] border border-[#F0EAE0] px-2.5 py-1 rounded text-xs font-medium text-[#221912]">Attendance Records</span>
                        <button className="w-6 h-6 rounded bg-[#FAFAF8] border border-[#F0EAE0] flex items-center justify-center hover:bg-[#F0EAE0]"><Plus className="w-3 h-3"/></button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="bg-[#FAFAF8] border border-[#F0EAE0] px-2.5 py-1 rounded text-xs font-medium text-[#221912]">Shift Assignment</span>
                        <button className="w-6 h-6 rounded bg-[#FAFAF8] border border-[#F0EAE0] flex items-center justify-center hover:bg-[#F0EAE0]"><Plus className="w-3 h-3"/></button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-[11px] font-bold text-[#8C7E6E] uppercase tracking-wide">Performance</h4>
                      <div className="flex items-center gap-2">
                        <span className="bg-[#FAFAF8] border border-[#F0EAE0] px-2.5 py-1 rounded text-xs font-medium text-[#221912]">Skill Ratings</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-[11px] font-bold text-[#8C7E6E] uppercase tracking-wide">Production</h4>
                      <div className="flex items-center gap-2">
                        <span className="bg-[#FAFAF8] border border-[#F0EAE0] px-2.5 py-1 rounded text-xs font-medium text-[#221912]">Line Balance Placement</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Activity Feed Section */}
                <div className="pt-2 border-t border-[#F0EAE0]">
                  <div className="flex items-center justify-between mb-6 mt-4">
                    <h3 className="font-bold text-[#221912] text-[14px]">Activity</h3>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAFAF8] text-[#221912] text-xs font-semibold rounded-md border border-[#F0EAE0] hover:bg-[#F0EAE0]">
                      <Plus className="w-3.5 h-3.5" />
                      New Event
                    </button>
                  </div>
                  
                  <div className="relative pl-4 space-y-5 before:absolute before:inset-0 before:left-5 before:-translate-x-px before:h-full before:w-px before:bg-[#E6DDCE]">
                    {/* Event 1 */}
                    <div className="relative flex items-start gap-4">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#B8A898] shrink-0 mt-1.5 z-10 -ml-[5px]" />
                      <div className="text-[13px] text-[#475569]">
                        <span className="font-semibold text-[#221912]">System</span> recorded attendance as <span className="font-medium text-emerald-600">Present</span> <span className="text-[#8C7E6E]">· 1 day ago</span>
                      </div>
                    </div>
                    {/* Event 2 */}
                    <div className="relative flex items-start gap-4">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#B8A898] shrink-0 mt-1.5 z-10 -ml-[5px]" />
                      <div className="text-[13px] text-[#475569]">
                        <span className="font-semibold text-[#221912]">Admin</span> updated Skill Ratings for Top Stitching <span className="text-[#8C7E6E]">· 3 days ago</span>
                      </div>
                    </div>
                    
                    {/* Attachment Events */}
                    {mockAttachments.map((file, i) => (
                      <div key={i} className="relative flex items-start gap-4">
                        <div className="w-6 h-6 rounded-full bg-white border border-[#E6DDCE] shrink-0 flex items-center justify-center z-10 -ml-[12px] mt-0.5">
                          <Paperclip className="w-3 h-3 text-[#8C7E6E]" />
                        </div>
                        <div className="text-[13px] text-[#475569] pt-1">
                          <span className="font-semibold text-[#221912]">Admin</span> attached <span className="font-medium">{file}</span> 🔒 <span className="text-[#8C7E6E]">· {i + 1} months ago</span>
                        </div>
                      </div>
                    ))}

                    {/* Event Final */}
                    <div className="relative flex items-start gap-4">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#B8A898] shrink-0 mt-1.5 z-10 -ml-[5px]" />
                      <div className="text-[13px] text-[#475569]">
                        <span className="font-semibold text-[#221912]">Admin</span> created this sewing operator profile <span className="text-[#8C7E6E]">· 6 months ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Skill Matrix" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-[#221912] text-lg">Master Operation Skills</h3>
                  <button 
                    onClick={handleSaveRatings}
                    disabled={saving}
                    className="px-4 py-2 bg-[#221912] text-white text-[12px] font-bold rounded-lg hover:bg-[#3A2E24] transition-colors disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Ratings"}
                  </button>
                </div>
                
                <div className="border border-[#F0EAE0] rounded-xl overflow-hidden bg-white">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#FAFAF8] border-b border-[#F0EAE0] text-[11px] font-bold tracking-wide text-[#8C7E6E] uppercase">
                        <th className="py-3 px-4 w-1/3">Operation</th>
                        <th className="py-3 px-4 text-center">0-10 sec<br/><span className="text-[9px] text-[#B8A898]">(Rating 1)</span></th>
                        <th className="py-3 px-4 text-center">11-20 sec<br/><span className="text-[9px] text-[#B8A898]">(Rating 2)</span></th>
                        <th className="py-3 px-4 text-center">21-30 sec<br/><span className="text-[9px] text-[#B8A898]">(Rating 3)</span></th>
                        <th className="py-3 px-4 text-center">31-40 sec<br/><span className="text-[9px] text-[#B8A898]">(Rating 4)</span></th>
                        <th className="py-3 px-4 text-center">41-50 sec<br/><span className="text-[9px] text-[#B8A898]">(Rating 5)</span></th>
                      </tr>
                    </thead>
                    <tbody className="text-[13px] text-[#221912] font-medium">
                      {operations.map((op) => {
                        const currentSkill = skills[op.id] || 0;
                        return (
                          <tr key={op.id} className="border-b border-[#F0EAE0] last:border-0 hover:bg-[#FAFAF8]">
                            <td className="py-3 px-4 border-r border-[#F0EAE0] font-semibold">{op.name}</td>
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <td key={rating} className="py-2 px-2 text-center border-r border-[#F0EAE0] last:border-r-0">
                                <button
                                  onClick={() => handleSkillChange(String(op.id), rating)}
                                  className={`w-full py-2 rounded-md transition-all ${
                                    currentSkill === rating 
                                      ? "bg-[#B48259] text-white shadow-sm font-bold" 
                                      : "bg-transparent text-[#8C7E6E] hover:bg-[#F0EAE0] font-medium"
                                  }`}
                                >
                                  {rating}
                                </button>
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {operations.length === 0 && (
                    <div className="py-12 text-center text-[#8C7E6E] text-[13px]">
                      No operations available in master data.
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
