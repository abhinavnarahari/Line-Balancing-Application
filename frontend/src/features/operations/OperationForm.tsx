import { useState } from "react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import type { Operation } from "./api";

interface OperationFormProps {
  initialData?: Operation | null;
  onSubmit: (data: Omit<Operation, "id" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
}

export function OperationForm({ initialData, onSubmit, onCancel }: OperationFormProps) {
  const [formData, setFormData] = useState({
    operationCode: initialData?.operationCode || "",
    name: initialData?.name || "",
    description: initialData?.description || "",
    sequence: initialData?.sequence || 1,
    active: initialData?.active ?? true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseInt(value, 10) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Operation Code"
          id="operationCode"
          name="operationCode"
          value={formData.operationCode}
          onChange={handleChange}
          placeholder="e.g. OP-001"
          required
        />
        <Input
          label="Sequence"
          id="sequence"
          name="sequence"
          type="number"
          min="1"
          value={formData.sequence}
          onChange={handleChange}
          required
        />
        <div className="md:col-span-2">
          <Input
            label="Operation Name"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Shoulder Join"
            required
          />
        </div>
        <div className="md:col-span-2 flex flex-col space-y-2">
          <label htmlFor="description" className="text-sm font-medium text-[#475569]">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            placeholder="Describe what this operation entails…"
            className="w-full bg-white border border-[#F0EAE0] px-4 py-2 text-sm text-[#221912] placeholder-[#8C7E6E] shadow-sm resize-none focus:outline-none focus:ring-1 focus:ring-[#B48259] focus:border-[#B48259]"
          />
        </div>
        <div className="flex flex-col space-y-2">
          <label htmlFor="active" className="text-sm font-medium text-[#475569]">Status</label>
          <select
            id="active"
            name="active"
            value={formData.active ? "true" : "false"}
            onChange={(e) => setFormData((p) => ({ ...p, active: e.target.value === "true" }))}
            className="flex h-11 w-full bg-white border border-[#F0EAE0] px-4 py-2 text-sm text-[#221912] shadow-sm focus:outline-none focus:ring-1 focus:ring-[#B48259] focus:border-[#B48259]"
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-6 mt-4 border-t border-[#F0EAE0]">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary">
          {initialData ? "Update Operation" : "Create Operation"}
        </Button>
      </div>
    </form>
  );
}

