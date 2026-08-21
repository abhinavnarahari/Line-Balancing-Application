import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "../../components/ui/PremiumUI";
import { Modal } from "../../components/ui/Modal";
import { OperatorList } from "../../features/operators/OperatorList";
import { OperatorForm } from "../../features/operators/OperatorForm";
import { operatorsApi, type Operator } from "../../features/operators/api";
import { Button } from "../../components/ui/Button";

export function OperatorsPage() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOperator, setEditingOperator] = useState<Operator | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadOperators(); }, []);

  const loadOperators = async () => {
    setLoading(true);
    try { setOperators(await operatorsApi.getOperators()); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (data: Omit<Operator, "id" | "createdAt" | "updatedAt">) => {
    if (editingOperator) await operatorsApi.updateOperator(editingOperator.id, data);
    else await operatorsApi.createOperator(data);
    await loadOperators();
    setIsFormOpen(false);
    setEditingOperator(null);
  };

  const handleEdit = (op: Operator) => { setEditingOperator(op); setIsFormOpen(true); };
  const handleToggleActive = async (id: string) => { await operatorsApi.toggleActive(id); await loadOperators(); };
  const handleClose = () => { setIsFormOpen(false); setEditingOperator(null); };

  return (
    <div className="space-y-7 max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Masters"
        title="Sewing Operators"
        description="Register and manage all sewing operators on the factory floor."
        action={
          !isFormOpen && (
            <Button onClick={() => { setEditingOperator(null); setIsFormOpen(true); }} size="md">
              <Plus className="h-4 w-4 mr-1.5" />
              Register Operator
            </Button>
          )
        }
      />

      <Modal
        isOpen={isFormOpen}
        onClose={handleClose}
        title={editingOperator ? "Edit Operator Profile" : "Register New Operator"}
        subtitle="Employee ID must be unique."
      >
        <OperatorForm initialData={editingOperator} onSubmit={handleSubmit} onCancel={handleClose} />
      </Modal>

      <OperatorList operators={operators} onEdit={handleEdit} onToggleActive={handleToggleActive} loading={loading} />
    </div>
  );
}
