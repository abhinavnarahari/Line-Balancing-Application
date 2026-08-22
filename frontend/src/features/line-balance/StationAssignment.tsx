import type { StationAssignment as AssignmentType } from "./types";
import type { Operation } from "../../features/operations/mockApi";
import type { Operator } from "../../features/operators/mockApi";

interface StationAssignmentProps {
  assignments: AssignmentType[];
  operations: Operation[];
  operators: Operator[];
  onAssignOperator: (assignmentId: string, operatorId: string) => void;
}

export function StationAssignment({
  assignments,
  operations,
  operators,
  onAssignOperator
}: StationAssignmentProps) {
  return (
    <div className="bg-white border border-[#F0EAE0] shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-[#F0EAE0] bg-[#FAFAF8]">
        <h3 className="font-serif text-xl text-[#221912]">Station Assignments</h3>
      </div>
      
      <div className="divide-y divide-[#F0EAE0]/50 max-h-[600px] overflow-y-auto">
        {assignments.map((assignment) => {
          const operation = operations.find(o => o.id === assignment.operationId);
          const operator = operators.find(o => o.id === assignment.operatorId);
          
          if (!operation) return null;

          const actualTime = operator ? (operation as any).smv / ((operator as any).efficiency / 100) : 0;

          return (
            <div key={assignment.id} className="p-4 flex items-center gap-6 hover:bg-[#FAFAF8]/50 transition-colors">
              <div className="flex-shrink-0 w-12 h-12 bg-[slate-50] border border-[#F0EAE0] flex items-center justify-center font-mono text-lg text-[#8B4A3C]">
                {assignment.stationNumber}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#221912] truncate">{operation.name}</p>
                <div className="flex gap-4 mt-1 text-[11px] text-[#8C7E6E]">
                  <span>{operation.code}</span>
                  <span>SMV: {(operation as any).smv}</span>
                  <span>{(operation as any).machineType}</span>
                </div>
              </div>

              <div className="flex-1 max-w-[240px]">
                <select
                  value={assignment.operatorId || ""}
                  onChange={(e) => onAssignOperator(assignment.id, e.target.value)}
                  className="w-full bg-transparent border-b border-[#F0EAE0] py-1 text-sm text-[#221912] focus:border-[#B48259] focus:outline-none focus:ring-0"
                >
                  <option value="">Unassigned</option>
                  {operators.map(op => (
                    <option key={op.id} value={op.id}>
                      {op.name} ({(op as any).efficiency}%)
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-24 text-right">
                {operator ? (
                  <div className="flex flex-col items-end">
                    <span className="font-mono text-lg text-[#221912]">{actualTime.toFixed(2)}</span>
                    <span className="text-[10px] text-[#8C7E6E] uppercase">Actual Min</span>
                  </div>
                ) : (
                  <span className="text-sm text-[#8C7E6E] italic">--</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

