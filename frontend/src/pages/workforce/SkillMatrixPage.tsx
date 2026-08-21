import { useState, useEffect } from "react";
import { Search } from "lucide-react";

import { PageHeader, DataCard, DataCardHeader, EmptyState } from "../../components/ui/PremiumUI";
import { Modal } from "../../components/ui/Modal";


import { skillApi, type SkillAssessment } from "../../features/skill-matrix/mockApi";
import { SkillAssessmentForm } from "../../features/skill-matrix/SkillAssessmentForm";
import { operationsApi, type Operation } from "../../features/operations/mockApi";
import { operatorsApi, type Operator } from "../../features/operators/mockApi";

// Helper component for the skill cell
function SkillCell({ skill, onClick }: { skill?: SkillAssessment; onClick: () => void }) {
  if (!skill) {
    return (
      <button 
        onClick={onClick}
        className="w-full h-full min-h-[40px] flex items-center justify-center text-[#D0C8B4] hover:bg-[#F0EAE0] transition-colors"
      >
        <span className="text-[10px] opacity-0 group-hover:opacity-100">+</span>
      </button>
    );
  }

  const colors = {
    1: "bg-slate-100 text-slate-600 border-slate-200",
    2: "bg-teal-50 text-teal-700 border-teal-200",
    3: "bg-amber-50 text-amber-700 border-amber-200",
    4: "bg-blue-50 text-blue-700 border-blue-200",
    5: "bg-[#FBF4EC] text-[#9B5A32] border-[#D89A5C]",
  };

  return (
    <button 
      onClick={onClick}
      className="w-full h-full min-h-[40px] flex flex-col items-center justify-center p-1 hover:bg-[#F0EAE0] transition-colors group relative"
    >
      <div className={`w-6 h-6 rounded-sm border flex items-center justify-center text-[11px] font-bold font-mono ${colors[skill.rating]}`}>
        {skill.rating}
      </div>
      <span className="text-[9px] text-[#8A8270] mt-0.5 font-mono">{skill.cycleTime}s</span>
      
      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-20 w-max bg-[#26231D] text-white text-[10px] px-2 py-1 rounded-sm shadow-lg pointer-events-none">
        <p>Revision: {skill.revision}</p>
        <p>Effective: {skill.effectiveDate}</p>
        {skill.notes && <p className="text-[#D89A5C] mt-0.5 max-w-[150px] truncate">{skill.notes}</p>}
      </div>
    </button>
  );
}

export function SkillMatrixPage() {
  const [matrix, setMatrix] = useState<SkillAssessment[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [activeCell, setActiveCell] = useState<{ opId: string; oprId: string; opName: string; oprName: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [mat, ops, oprs] = await Promise.all([
        skillApi.getCurrentMatrix(),
        operationsApi.getOperations(),
        operatorsApi.getOperators(),
      ]);
      setMatrix(mat);
      setOperations(ops.filter(o => o.active).sort((a, b) => a.sequence - b.sequence));
      setOperators(oprs.filter(o => o.active));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (data: Omit<SkillAssessment, "id" | "revision">) => {
    await skillApi.addAssessment(data);
    setActiveCell(null);
    loadData();
  };

  const filteredOperators = operators.filter(o => 
    o.name.toLowerCase().includes(search.toLowerCase()) || 
    o.employeeId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-7 max-w-full mx-auto px-4 md:px-8">
      <PageHeader
        eyebrow="Workforce"
        title="Swing Skill Matrix"
        description="Track operator skill ratings (1-5) and cycle times for each operation. Updates create new revisions."
      />

      <Modal
        isOpen={!!activeCell}
        onClose={() => setActiveCell(null)}
        title="Record Skill Assessment"
        subtitle="Saving will create a new revision in the history log."
      >
        {activeCell && (
          <SkillAssessmentForm 
            operatorId={activeCell.oprId}
            operationId={activeCell.opId}
            operatorName={activeCell.oprName}
            operationName={activeCell.opName}
            onSubmit={handleSubmit}
            onCancel={() => setActiveCell(null)}
          />
        )}
      </Modal>

      <DataCard noPad>
        <DataCardHeader 
          title="Skill Matrix" 
          subtitle="Click any cell to record a new assessment"
          action={
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8A8270]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search operators..."
                className="pl-8 pr-4 py-1.5 text-[11px] bg-white border border-[#D0C8B4] text-[#26231D] placeholder-[#B8A898] w-52 focus:outline-none focus:border-[#B8763F] focus:ring-1 focus:ring-[#B8763F]/20"
              />
            </div>
          }
        />
        
        {loading ? (
          <div className="p-12 text-center text-[#6E6656]">Loading matrix...</div>
        ) : filteredOperators.length === 0 ? (
          <EmptyState title="No operators found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-[#FAF7F2] border-b-2 border-r-2 border-[#E0D8C0] p-4 text-left w-64 min-w-[250px] shadow-[2px_0_4px_rgba(0,0,0,0.02)]">
                    <span className="text-[10px] font-semibold tracking-widest text-[#8A8270] uppercase">Operators</span>
                  </th>
                  {operations.map(op => (
                    <th key={op.id} className="bg-[#FAF7F2] border-b-2 border-r border-[#E0D8C0] p-3 text-center min-w-[100px] w-[100px]">
                      <div className="flex flex-col items-center">
                        <span className="font-mono text-[9px] text-[#B8763F] font-bold bg-white px-1 py-0.5 rounded-sm border border-[#E0D8C0] mb-1">{op.code}</span>
                        <span className="text-[10px] font-medium text-[#26231D] leading-tight line-clamp-2" title={op.name}>{op.name}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredOperators.map(operator => (
                  <tr key={operator.id} className="border-b border-[#EDE8DF] hover:bg-[#FBF8F3] transition-colors group">
                    <td className="sticky left-0 z-10 bg-white group-hover:bg-[#FBF8F3] border-r-2 border-[#E0D8C0] p-3 shadow-[2px_0_4px_rgba(0,0,0,0.02)] transition-colors">
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm text-[#1E1B16] truncate">{operator.name}</span>
                        <span className="font-mono text-[10px] text-[#8A8270]">{operator.employeeId} · {operator.department}</span>
                      </div>
                    </td>
                    {operations.map(op => {
                      const skill = matrix.find(m => m.operatorId === operator.id && m.operationId === op.id);
                      return (
                        <td key={op.id} className="border-r border-[#EDE8DF] p-0 relative">
                          <SkillCell 
                            skill={skill} 
                            onClick={() => setActiveCell({
                              opId: op.id,
                              oprId: operator.id,
                              opName: op.name,
                              oprName: operator.name
                            })} 
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DataCard>
    </div>
  );
}
