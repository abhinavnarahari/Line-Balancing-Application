import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "../../components/ui/PremiumUI";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";

import { shiftAssignmentApi, type ShiftAssignment } from "../../features/shift-assignments/api";
import { AssignmentList } from "../../features/shift-assignments/AssignmentList";
import { AssignmentForm } from "../../features/shift-assignments/AssignmentForm";

import { operatorsApi, type Operator } from "../../features/operators/api";
import { shiftsApi } from "../../features/shifts/api";
import type { Shift } from "../../features/shifts/types";

export function ShiftAssignmentPage() {
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [assData, opData, shData] = await Promise.all([
        shiftAssignmentApi.getAssignments(),
        operatorsApi.getOperators(),
        shiftsApi.getShifts(),
      ]);
      setAssignments(assData);
      setOperators(
        opData
          .filter(o => o.active)
          .sort((a, b) =>
            (a.employeeId || "").localeCompare(b.employeeId || "", undefined, { numeric: true, sensitivity: "base" })
          )
      );
      setShifts(shData.filter(s => s.active));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (assignments: Omit<ShiftAssignment, "id" | "status" | "createdAt">[]) => {
    setError(null);
    try {
      await Promise.all(assignments.map(data => shiftAssignmentApi.assignShift(data)));
      setIsFormOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to assign shifts");
    }
  };

  const handleEndAssignment = async (id: string | number, date: string) => {
    try {
      await shiftAssignmentApi.endAssignment(id, date);
      loadData();
    } catch (err) {
      console.error("Failed to end assignment", err);
    }
  };

  const handleUpdateAssignment = async (id: string | number, data: any) => {
    try {
      await shiftAssignmentApi.updateAssignment(id, data);
      loadData();
    } catch (err) {
      console.error("Failed to update assignment", err);
      throw err;
    }
  };

  return (
    <div className="space-y-7 w-full p-6 lg:p-8">
      <PageHeader
        eyebrow="Workforce"
        title="Shift Assignment"
        description="Assign operators to production shifts. Assignments are tracked over time to maintain historical records."
        action={
          <Button onClick={() => { setError(null); setIsFormOpen(true); }} size="md">
            <Plus className="h-4 w-4 mr-1.5" />
            Assign Shift
          </Button>
        }
      />

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Create Shift Assignment"
        subtitle="Schedule an operator for a specific shift. Overlapping active schedules are not permitted."
      >
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-sm text-sm text-red-700 mb-6">
            <span className="font-semibold mr-1">Error:</span> {error}
          </div>
        )}
        <AssignmentForm 
          operators={operators} 
          shifts={shifts} 
          assignments={assignments}
          onSubmit={handleSubmit} 
          onCancel={() => setIsFormOpen(false)} 
        />
      </Modal>

      <AssignmentList 
        assignments={assignments} 
        operators={operators} 
        shifts={shifts} 
        onEndAssignment={handleEndAssignment}
        onUpdateAssignment={handleUpdateAssignment}
        loading={loading} 
      />
    </div>
  );
}


