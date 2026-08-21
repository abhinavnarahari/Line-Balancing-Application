import { useState } from "react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import type { Operator } from "./mockApi";

interface OperatorFormProps {
  initialData?: Operator | null;
  onSubmit: (data: Omit<Operator, "id" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
}

export function OperatorForm({ initialData, onSubmit, onCancel }: OperatorFormProps) {
  const [formData, setFormData] = useState({
    employeeId: initialData?.employeeId || "",
    name: initialData?.name || "",
    age: initialData?.age || 25,
    gender: initialData?.gender || ("Female" as "Male" | "Female" | "Other"),
    department: initialData?.department || "Sewing",
    joiningDate: initialData?.joiningDate || "",
    active: initialData?.active ?? true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
          label="Employee ID"
          id="employeeId"
          name="employeeId"
          value={formData.employeeId}
          onChange={handleChange}
          placeholder="e.g. EMP-1001"
          required
        />
        <Input
          label="Full Name"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g. Priya Sharma"
          required
        />
        <Input
          label="Age"
          id="age"
          name="age"
          type="number"
          min="18"
          max="60"
          value={formData.age}
          onChange={handleChange}
          required
        />

        <div className="flex flex-col space-y-2">
          <label htmlFor="gender" className="text-sm font-medium text-[#6E6656]">Gender</label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="flex h-11 w-full bg-white border border-[#E0D8C0] px-4 py-2 text-sm text-[#26231D] shadow-sm focus:outline-none focus:ring-1 focus:ring-[#B8763F] focus:border-[#B8763F]"
          >
            <option value="Female">Female</option>
            <option value="Male">Male</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="flex flex-col space-y-2">
          <label htmlFor="department" className="text-sm font-medium text-[#6E6656]">Department</label>
          <select
            id="department"
            name="department"
            value={formData.department}
            onChange={handleChange}
            className="flex h-11 w-full bg-white border border-[#E0D8C0] px-4 py-2 text-sm text-[#26231D] shadow-sm focus:outline-none focus:ring-1 focus:ring-[#B8763F] focus:border-[#B8763F]"
          >
            <option value="Sewing">Sewing</option>
            <option value="Finishing">Finishing</option>
            <option value="Packing">Packing</option>
            <option value="Quality Control">Quality Control</option>
          </select>
        </div>

        <Input
          label="Joining Date"
          id="joiningDate"
          name="joiningDate"
          type="date"
          value={formData.joiningDate}
          onChange={handleChange}
          required
        />

        <div className="flex flex-col space-y-2">
          <label htmlFor="active" className="text-sm font-medium text-[#6E6656]">Status</label>
          <select
            id="active"
            name="active"
            value={formData.active ? "true" : "false"}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, active: e.target.value === "true" }))
            }
            className="flex h-11 w-full bg-white border border-[#E0D8C0] px-4 py-2 text-sm text-[#26231D] shadow-sm focus:outline-none focus:ring-1 focus:ring-[#B8763F] focus:border-[#B8763F]"
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-6 mt-4 border-t border-[#E0D8C0]">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary">
          {initialData ? "Update Operator" : "Register Operator"}
        </Button>
      </div>
    </form>
  );
}
