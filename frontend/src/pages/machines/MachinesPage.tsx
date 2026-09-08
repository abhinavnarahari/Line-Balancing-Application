import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "../../components/ui/PremiumUI";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { machinesApi, type Machine } from "../../features/machines/api";
import { linesApi, type SewingLine } from "../../features/lines/api";
import { MachineList } from "../../features/machines/MachineList";
import { MachineForm } from "../../features/machines/MachineForm";

export function MachinesPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [lines, setLines] = useState<SewingLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [machData, lineData] = await Promise.all([
        machinesApi.getMachines(),
        linesApi.getLines(true),
      ]);
      setMachines(machData);
      setLines(lineData);
    } catch (err) {
      console.error("Failed to load machines data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingMachine(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (machine: Machine) => {
    setEditingMachine(machine);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (data: Omit<Machine, "id" | "createdAt" | "updatedAt">) => {
    try {
      if (editingMachine) {
        await machinesApi.updateMachine(editingMachine.id, data);
      } else {
        await machinesApi.createMachine(data);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error("Failed to save machine:", err);
    }
  };

  const handleToggleActive = async (id: string | number) => {
    try {
      await machinesApi.toggleStatus(id);
      loadData();
    } catch (err) {
      console.error("Failed to toggle machine status:", err);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Equipment & Assets"
        title="Machine Master Inventory"
        description="Catalog of sewing machines, operational status, brand/models, and line allocations."
        action={
          <Button variant="primary" onClick={handleOpenCreate}>
            <Plus className="w-4 h-4 mr-1.5" />
            Register Machine
          </Button>
        }
      />

      <MachineList
        machines={machines}
        lines={lines}
        loading={loading}
        onEdit={handleOpenEdit}
        onToggleActive={handleToggleActive}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMachine ? "Edit Machine Asset" : "Register New Machine"}
        maxWidth="max-w-2xl"
      >
        <MachineForm
          existingMachines={machines}
          initialData={editingMachine}
          lines={lines}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
