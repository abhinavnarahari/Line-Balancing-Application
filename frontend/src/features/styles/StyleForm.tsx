import { useState, useEffect } from "react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import type { Style, CreateStyleDTO, UpdateStyleDTO } from "./mockApi";

interface StyleFormProps {
  initialData?: Style | null;
  onSubmit: (data: CreateStyleDTO | UpdateStyleDTO) => Promise<void>;
  onCancel: () => void;
}

export function StyleForm({ initialData, onSubmit, onCancel }: StyleFormProps) {
  const [formData, setFormData] = useState<CreateStyleDTO>({
    styleNo: "",
    buyer: "",
    description: "",
    season: "",
    productType: "",
    active: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        styleNo: initialData.styleNo,
        buyer: initialData.buyer,
        description: initialData.description,
        season: initialData.season,
        productType: initialData.productType,
        active: initialData.active,
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (err: any) {
      setError(err.message || "Failed to save style");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-sm text-sm text-red-700">
          <span className="font-semibold mr-1">Error:</span> {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Style Number"
          name="styleNo"
          value={formData.styleNo}
          onChange={handleChange}
          required
          placeholder="e.g. TS-1001"
          hint="Must be unique"
        />
        <Input
          label="Buyer / Client"
          name="buyer"
          value={formData.buyer}
          onChange={handleChange}
          required
          placeholder="e.g. Acme Corp"
        />
        <div className="md:col-span-2">
          <Input
            label="Style Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            placeholder="e.g. Men's Basic Crew Neck T-Shirt"
          />
        </div>
        <Input
          label="Season"
          name="season"
          value={formData.season}
          onChange={handleChange}
          required
          placeholder="e.g. SS26"
        />
        <Input
          label="Product Type"
          name="productType"
          value={formData.productType}
          onChange={handleChange}
          required
          placeholder="e.g. T-Shirt, Pants, Jacket"
        />
        <div className="md:col-span-2 flex items-center gap-2 mt-2">
          <input
            type="checkbox"
            id="active"
            name="active"
            checked={formData.active}
            onChange={handleChange}
            className="rounded-sm border-[#D0C8B4] text-[#B8763F] focus:ring-[#B8763F]"
          />
          <label htmlFor="active" className="text-sm text-[#26231D] font-medium cursor-pointer">
            Active Status
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-5 border-t border-[#E0D8C0]">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>Cancel</Button>
        <Button type="submit" variant="primary" loading={loading}>
          {initialData ? "Update Style" : "Create Style"}
        </Button>
      </div>
    </form>
  );
}
