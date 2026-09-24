import { useState, useEffect, useMemo } from "react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import type { Operator } from "./api";

interface OperatorFormProps {
  existingOperators?: Operator[];
  initialData?: Operator | null;
  onSubmit: (data: Omit<Operator, "id" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
}

export function OperatorForm({ existingOperators = [], initialData, onSubmit, onCancel }: OperatorFormProps) {
  const sequentialCode = useMemo(() => {
    const list = existingOperators || [];
    const numbers = list
      .map(o => {
        const match = (o.employeeId || "").match(/\d+/g);
        return match ? parseInt(match[match.length - 1], 10) : 0;
      })
      .filter(n => !isNaN(n) && n > 0);
    const maxNum = numbers.length > 0 ? Math.max(...numbers) : list.length;
    return `EMP-${String(maxNum + 1).padStart(3, "0")}`;
  }, [existingOperators]);

  const [formData, setFormData] = useState({
    employeeId: initialData?.employeeId || sequentialCode,
    name: initialData?.name || "",
    age: initialData?.age || 25,
    gender: initialData?.gender || ("Female" as "Male" | "Female" | "Other"),
    department: initialData?.department || "Sewing",
    role: initialData?.role || ("OPERATOR" as "OPERATOR" | "HELPER" | "FLOATER" | "LINE_SUPERVISOR" | "QUALITY_CHECKER"),
    joiningDate: initialData?.joiningDate || "",
    active: initialData?.active ?? true,
  });

  useEffect(() => {
    if (!initialData && !formData.employeeId && sequentialCode) {
      setFormData(prev => ({ ...prev, employeeId: sequentialCode }));
    }
  }, [sequentialCode, initialData]);

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
          placeholder="e.g. EMP-001"
          required
          hint="Sequential operator employee identifier"
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
          <label htmlFor="gender" className="text-xs font-bold uppercase tracking-wider text-[#8C7E6E]">Gender</label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="flex h-10 w-full bg-white border border-[#E6DDCE] rounded-xl px-3.5 py-2 text-xs font-semibold text-[#221912] shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#9C5B3C]/15 focus:border-[#9C5B3C]"
          >
            <option value="Female">Female</option>
            <option value="Male">Male</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="flex flex-col space-y-2">
          <label htmlFor="role" className="text-xs font-bold uppercase tracking-wider text-[#8C7E6E]">Role / Designation</label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="flex h-10 w-full bg-white border border-[#E6DDCE] rounded-xl px-3.5 py-2 text-xs font-semibold text-[#221912] shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#9C5B3C]/15 focus:border-[#9C5B3C]"
          >
            <option value="OPERATOR">Sewing Operator</option>
            <option value="HELPER">Floor Helper</option>
            <option value="FLOATER">Floater / Reliever</option>
            <option value="LINE_SUPERVISOR">Line Supervisor</option>
            <option value="QUALITY_CHECKER">Quality Checker / QC</option>
          </select>
        </div>

        <div className="flex flex-col space-y-2">
          <label htmlFor="department" className="text-xs font-bold uppercase tracking-wider text-[#8C7E6E]">Department</label>
          <select
            id="department"
            name="department"
            value={formData.department}
            onChange={handleChange}
            className="flex h-10 w-full bg-white border border-[#E6DDCE] rounded-xl px-3.5 py-2 text-xs font-semibold text-[#221912] shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#9C5B3C]/15 focus:border-[#9C5B3C]"
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
          <label htmlFor="active" className="text-xs font-bold uppercase tracking-wider text-[#8C7E6E]">Status</label>
          <select
            id="active"
            name="active"
            value={formData.active ? "true" : "false"}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, active: e.target.value === "true" }))
            }
            className="flex h-10 w-full bg-white border border-[#E6DDCE] rounded-xl px-3.5 py-2 text-xs font-semibold text-[#221912] shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#9C5B3C]/15 focus:border-[#9C5B3C]"
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-6 mt-4 border-t border-[#F1F5F9]">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary">
          {initialData ? "Update Operator" : "Register Operator"}
        </Button>
      </div>
    </form>
  );
}

