import type { StationAssignment as AssignmentType } from "./types";
import type { Operation } from "../../features/operations/api";
import type { Operator } from "../../features/operators/api";

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
    <div className="bg-white border border-[#F1F5F9] shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-[#F1F5F9] bg-[#F8FAFC]">
        <h3 className="font-sans text-xl text-[#0F172A]">Station Assignments</h3>
      </div>
      
      <div className="divide-y divide-[#F1F5F9]/50 max-h-[600px] overflow-y-auto">
        {assignments.map((assignment) => {
          const operation = operations.find(o => o.id === assignment.operationId);
          const operator = operators.find(o => o.id === assignment.operatorId);
          
          if (!operation) return null;

          const smv = operation.standardSmv || (operation as any).smv || 0.5;
          const actualTime = operator ? smv / (((operator as any).efficiency || 100) / 100) : 0;

          return (
            <div key={assignment.id} className="p-4 flex items-center gap-6 hover:bg-[#F8FAFC]/50 transition-colors">
              <div className="flex-shrink-0 w-12 h-12 bg-[#F8FAFC] border border-[#F1F5F9] flex items-center justify-center font-mono text-lg text-[#2563EB]">
                {assignment.stationNumber}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#0F172A] truncate">{operation.name}</p>
                <div className="flex gap-4 mt-1 text-[11px] text-slate-500">
                  <span>{operation.operationCode}</span>
                  <span>SMV: {smv}</span>
                  <span>{operation.machineType || "Single Needle Lockstitch"}</span>
                </div>
              </div>

              <div className="flex-1 max-w-[240px]">
                <select
                  value={assignment.operatorId || ""}
                  onChange={(e) => onAssignOperator(assignment.id, e.target.value)}
                  className="w-full bg-transparent border-b border-[#F1F5F9] py-1 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-0"
                >
                  <option value="">Unassigned</option>
                  {operators.map(op => (
                    <option key={op.id} value={op.id}>
                      {op.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-24 text-right">
                {operator ? (
                  <div className="flex flex-col items-end">
                    <span className="font-mono text-lg text-[#0F172A]">{actualTime.toFixed(2)}</span>
                    <span className="text-[10px] text-[#F8FAFC]0 uppercase">Actual Min</span>
                  </div>
                ) : (
                  <span className="text-sm text-[#F8FAFC]0 italic">--</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

