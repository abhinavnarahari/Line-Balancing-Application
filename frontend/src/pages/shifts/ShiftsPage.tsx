import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import type { Shift, CreateShiftDTO, UpdateShiftDTO } from "../../features/shifts/types";
import { shiftsApi } from "../../features/shifts/api";
import { ShiftList } from "../../features/shifts/ShiftList";
import { ShiftForm } from "../../features/shifts/ShiftForm";
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/ui/PremiumUI";
import { AuditedRecentActivityLog } from "../../components/common/AuditedRecentActivityLog";
import { Modal } from "../../components/ui/Modal";

export function ShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);

  const loadShifts = async () => {
    setLoading(true);
    try { setShifts(await shiftsApi.getShifts()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadShifts(); }, []);

  const handleToggleActive = async (id: string) => {
    await shiftsApi.toggleActive(id);
    loadShifts();
  };

  const handleEdit = (shift: Shift) => { setEditingShift(shift); setIsFormOpen(true); };
  const handleClose = () => { setIsFormOpen(false); setEditingShift(null); };

  const handleSubmit = async (data: CreateShiftDTO | UpdateShiftDTO) => {
    if (editingShift) await shiftsApi.updateShift(editingShift.id, data as UpdateShiftDTO);
    else await shiftsApi.createShift(data as CreateShiftDTO);
    handleClose();
    loadShifts();
  };

  return (
    <div className="space-y-7 w-full p-6 lg:p-8">
      <PageHeader
        showImportExport={true}
        exportData={shifts}
        onImport={(data) => {
          // TODO: handle bulk import later via API
          console.log("Imported shifts", data);
        }}
        eyebrow="Masters"
        title="Shift Master"
        description="Configure production shifts including overnight shifts. Timings are not hard-coded."
        action={
          !isFormOpen && (
            <Button onClick={() => { setEditingShift(null); setIsFormOpen(true); }} size="md">
              <Plus className="h-4 w-4 mr-1.5" />
              Add Shift
            </Button>
          )
        }
      />

      <Modal
        isOpen={isFormOpen}
        onClose={handleClose}
        title={editingShift ? "Edit Shift" : "Create New Shift"}
        subtitle="Overnight shifts (e.g. 23:00–07:00) are supported."
      >
        <ShiftForm initialData={editingShift} onSubmit={handleSubmit} onCancel={handleClose} />
      </Modal>

      <ShiftList shifts={shifts} onEdit={handleEdit} onToggleActive={handleToggleActive} loading={loading} />
    
      <AuditedRecentActivityLog entityName="Shift" />
    </div>
  );
}
