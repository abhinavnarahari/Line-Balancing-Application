import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "../../components/ui/PremiumUI";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { OperationList } from "../../features/operations/OperationList";
import { OperationForm } from "../../features/operations/OperationForm";
import { operationsApi, type Operation } from "../../features/operations/mockApi";

export function OperationsPage() {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOperation, setEditingOperation] = useState<Operation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadOperations(); }, []);

  const loadOperations = async () => {
    setLoading(true);
    try { setOperations(await operationsApi.getOperations()); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (data: Omit<Operation, "id" | "createdAt" | "updatedAt">) => {
    try {
      if (editingOperation) await operationsApi.updateOperation(editingOperation.id, data);
      else await operationsApi.createOperation(data);
      await loadOperations();
      setIsFormOpen(false);
      setEditingOperation(null);
    } finally { }
  };

  const handleEdit = (op: Operation) => { setEditingOperation(op); setIsFormOpen(true); };
  const handleToggleActive = async (id: string) => { await operationsApi.toggleActive(id); await loadOperations(); };
  const handleClose = () => { setIsFormOpen(false); setEditingOperation(null); };

  return (
    <div className="space-y-7 max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Masters"
        title="Operation Master"
        description="Define all standard sewing operations used in production bulletins."
        action={
          !isFormOpen && (
            <Button onClick={() => { setEditingOperation(null); setIsFormOpen(true); }} size="md">
              <Plus className="h-4 w-4 mr-1.5" />
              Add Operation
            </Button>
          )
        }
      />

      <Modal
        isOpen={isFormOpen}
        onClose={handleClose}
        title={editingOperation ? "Edit Operation" : "Create New Operation"}
        subtitle="All fields are required unless noted."
      >
        <OperationForm
          initialData={editingOperation}
          onSubmit={handleSubmit}
          onCancel={handleClose}
        />
      </Modal>

      <OperationList
        operations={operations}
        onEdit={handleEdit}
        onToggleActive={handleToggleActive}
        loading={loading}
      />
    </div>
  );
}
