import React, { useState, useEffect } from "react";
import type { Shift, CreateShiftDTO, UpdateShiftDTO } from "./types";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";

interface ShiftFormProps {
  initialData?: Shift | null;
  onSubmit: (data: CreateShiftDTO | UpdateShiftDTO) => void;
  onCancel: () => void;
}

export function ShiftForm({ initialData, onSubmit, onCancel }: ShiftFormProps) {
  const [formData, setFormData] = useState({
    shiftCode: "",
    shiftName: "",
    startTime: "",
    endTime: "",
    active: true,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        shiftCode: initialData.shiftCode,
        shiftName: initialData.shiftName,
        startTime: initialData.startTime,
        endTime: initialData.endTime,
        active: initialData.active,
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
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
          placeholder="e.g. A"
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
      </div>
      
      {!initialData && (
        <div className="flex items-center space-x-3 mt-2">
          <input 
            type="checkbox" 
            id="active" 
            name="active"
            checked={formData.active}
            onChange={handleChange}
            className="h-4 w-4 rounded border-[#E0D8C0] bg-white text-[#B8763F] focus:ring-[#B8763F] focus:ring-offset-white"
          />
          <label htmlFor="active" className="text-sm font-medium text-[#6E6656]">
            Active immediately
          </label>
        </div>
      )}

      <div className="flex justify-end space-x-4 pt-6 mt-4 border-t border-[#E0D8C0]">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary">
          {initialData ? "Update Shift" : "Create Shift"}
        </Button>
      </div>
    </form>
  );
}
