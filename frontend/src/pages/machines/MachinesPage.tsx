import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "../../components/ui/PremiumUI";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { machinesApi, type Machine } from "../../features/machines/api";
import { linesApi, type SewingLine } from "../../features/lines/api";
import { MachineList } from "../../features/machines/MachineList";
import { MachineForm } from "../../features/machines/MachineForm";
import { exportToExcel, readFromExcel } from "../../utils/excel";
import { notifyMasterDataUpdated, useMasterDataSubscription } from "../../utils/masterDataEvents";

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

  useMasterDataSubscription(["line", "machine", "all"], loadData);

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
      notifyMasterDataUpdated("machine");
      loadData();
    } catch (err) {
      console.error("Failed to save machine:", err);
    }
  };

  const handleToggleActive = async (id: string | number) => {
    try {
      await machinesApi.toggleStatus(id);
      notifyMasterDataUpdated("machine");
      loadData();
    } catch (err) {
      console.error("Failed to toggle machine status:", err);
    }
  };

  const handleExport = () => {
    const data = machines.map((m) => ({
      "Machine Code": m.machineCode,
      "Machine Type": m.machineType,
      "Brand": m.brand || "",
      "Model": m.model || "",
      "Serial Number": m.serialNo || "",
      "Assigned Line": m.lineName || m.lineCode || "Unassigned",
      "Status": m.status || (m.active ? "AVAILABLE" : "IDLE"),
    }));
    exportToExcel(data, `Sewing_Machines_Inventory_${new Date().toISOString().split("T")[0]}`);
  };

  const handleImport = async (file: File) => {
    try {
      const data = await readFromExcel<any>(file);
      for (const row of data) {
        if (!row["Machine Code"] || !row["Machine Type"]) continue;
        await machinesApi.createMachine({
          machineCode: String(row["Machine Code"]).trim(),
          machineType: String(row["Machine Type"]).trim(),
          brand: row["Brand"] ? String(row["Brand"]).trim() : undefined,
          model: row["Model"] ? String(row["Model"]).trim() : undefined,
          serialNo: row["Serial Number"] ? String(row["Serial Number"]).trim() : undefined,
          status: (row["Status"] as any) || "AVAILABLE",
          active: row["Status"] !== "IDLE" && row["Status"] !== "UNDER_MAINTENANCE",
        });
      }
      await loadData();
      alert("Sewing machine inventory imported successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to import machines. Please verify Excel column headers.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        showImportExport={true}
        onExport={handleExport}
        onImport={handleImport}
        eyebrow="Equipment & Assets"
        title="Machine Master Inventory"
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
