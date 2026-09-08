import React, { useState, useEffect, useMemo } from "react";
import type { Shift, CreateShiftDTO, UpdateShiftDTO } from "./types";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";

interface ShiftFormProps {
  existingShifts?: Shift[];
  initialData?: Shift | null;
  onSubmit: (data: CreateShiftDTO | UpdateShiftDTO) => void;
  onCancel: () => void;
}

export function ShiftForm({ existingShifts = [], initialData, onSubmit, onCancel }: ShiftFormProps) {
  const sequentialCode = useMemo(() => {
    const list = existingShifts || [];
    const charCode = 65 + list.length;
    return `SH-${String.fromCharCode(charCode)}`;
  }, [existingShifts]);

  const [formData, setFormData] = useState({
    shiftCode: initialData?.shiftCode || sequentialCode,
    shiftName: initialData?.shiftName || "",
    startTime: initialData?.startTime || "08:00",
    endTime: initialData?.endTime || "16:30",
    breakDurationMinutes: initialData?.breakDurationMinutes ?? 60,
    active: initialData?.active ?? true,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        shiftCode: initialData.shiftCode,
        shiftName: initialData.shiftName,
        startTime: initialData.startTime,
        endTime: initialData.endTime,
        breakDurationMinutes: initialData.breakDurationMinutes ?? 60,
        active: initialData.active,
      });
    } else if (!formData.shiftCode && sequentialCode) {
      setFormData(prev => ({ ...prev, shiftCode: sequentialCode }));
    }
  }, [initialData, sequentialCode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : (type === "number" ? Number(value) : value)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Input 
          label="Shift Code" 
          name="shiftCode" 
          value={formData.shiftCode} 
          onChange={handleChange} 
          required 
          placeholder="e.g. SH-A"
          hint="Sequential shift code identifier"
        />
        <Input 
          label="Shift Name" 
          name="shiftName" 
          value={formData.shiftName} 
          onChange={handleChange} 
          required 
          placeholder="e.g. Morning Shift"
        />
        <Input 
          label="Start Time" 
          name="startTime" 
          type="time" 
          value={formData.startTime} 
          onChange={handleChange} 
          required 
        />
        <Input 
          label="End Time" 
          name="endTime" 
          type="time" 
          value={formData.endTime} 
          onChange={handleChange} 
          required 
        />
        <div className="md:col-span-2">
          <Input 
            label="Total Break Time (Minutes)" 
            name="breakDurationMinutes" 
            type="number"
            min="0"
            max="180"
            value={formData.breakDurationMinutes} 
            onChange={handleChange} 
            required 
            hint="Lunch & tea breaks (e.g. 60m). Deducted to compute net productive working time."
          />
        </div>
      </div>
      
      {!initialData && (
        <div className="flex items-center space-x-3 mt-2">
          <input 
            type="checkbox" 
            id="active" 
            name="active"
            checked={formData.active}
            onChange={handleChange}
            className="h-4 w-4 rounded border-[#F1F5F9] bg-[#FFFFFF] text-[#2563EB] focus:ring-[#2563EB] focus:ring-offset-white"
          />
          <label htmlFor="active" className="text-sm font-medium text-[#475569]">
            Active immediately
          </label>
        </div>
      )}

      <div className="flex justify-end space-x-4 pt-6 mt-4 border-t border-[#F1F5F9]">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary">
          {initialData ? "Update Shift" : "Create Shift"}
        </Button>
      </div>
    </form>
  );
}

