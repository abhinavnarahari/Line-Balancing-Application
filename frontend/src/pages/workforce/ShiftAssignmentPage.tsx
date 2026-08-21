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
      setOperators(opData.filter(o => o.active));
      setShifts(shData.filter(s => s.active));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (data: Omit<ShiftAssignment, "id" | "status" | "createdAt">) => {
    setError(null);
    try {
      await shiftAssignmentApi.assignShift(data);
      setIsFormOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to assign shift");
    }
  };

  const handleEndAssignment = async (id: string, date: string) => {
    try {
      await shiftAssignmentApi.endAssignment(id, date);
      loadData();
    } catch (err) {
      console.error("Failed to end assignment", err);
    }
  };

  return (
    <div className="space-y-7 max-w-7xl mx-auto">
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
          onSubmit={handleSubmit} 
          onCancel={() => setIsFormOpen(false)} 
        />
      </Modal>

      <AssignmentList 
        assignments={assignments} 
        operators={operators} 
        shifts={shifts} 
        onEndAssignment={handleEndAssignment}
        loading={loading} 
      />
    </div>
  );
}
