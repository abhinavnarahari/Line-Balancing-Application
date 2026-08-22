import { useState, useMemo } from "react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { PremiumSelect } from "../../components/ui/PremiumUI";
import type { CreateOrderDTO } from "./api";
import type { Style } from "../styles/api";
import type { Size } from "../sizes/api";

interface OrderFormProps {
  styles: Style[];
  sizes: Size[];
  onSubmit: (data: CreateOrderDTO) => Promise<void>;
  onCancel: () => void;
}

export function OrderForm({ styles, sizes, onSubmit, onCancel }: OrderFormProps) {
  const [formData, setFormData] = useState<Omit<CreateOrderDTO, "sizeLines">>({
    orderNo: "",
    buyer: "",
    styleId: "",
    color: "",
    orderDate: new Date().toISOString().split("T")[0],
    deliveryDate: "",
    status: "PLANNED",
  });
  
  // Size quantities state: SizeID -> Quantity
  const [sizeQty, setSizeQty] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeSizes = useMemo(() => sizes.filter(s => s.active).sort((a, b) => a.sequence - b.sequence), [sizes]);
  const activeStyles = useMemo(() => styles.filter(s => s.active), [styles]);

  const totalQty = useMemo(() => {
    return Object.values(sizeQty).reduce((acc, curr) => acc + (curr || 0), 0);
  }, [sizeQty]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSizeChange = (sizeId: string, val: string) => {
    const parsed = parseInt(val, 10);
    setSizeQty(prev => ({
      ...prev,
      [sizeId]: isNaN(parsed) ? 0 : Math.max(0, parsed)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (totalQty <= 0) {
      setError("Total order quantity must be greater than zero.");
      return;
    }
    setLoading(true);
    try {
      const sizeLines = Object.entries(sizeQty)
        .filter(([_, quantity]) => quantity > 0)
        .map(([sizeId, quantity]) => ({ sizeId, quantity }));
        
      await onSubmit({ ...formData, sizeLines });
    } catch (err: any) {
      setError(err.message || "Failed to create order");
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

      {/* Header Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Input label="Order Number (PO)" name="orderNo" value={formData.orderNo} onChange={handleChange} required placeholder="e.g. PO-2026-001" />
        <Input label="Buyer" name="buyer" value={formData.buyer} onChange={handleChange} required placeholder="e.g. Acme Corp" />
        
        <div className="flex flex-col space-y-1.5 md:col-span-2">
          <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#475569]">Style</label>
          <PremiumSelect
            name="styleId"
            value={formData.styleId}
            onChange={(val) => setFormData(prev => ({ ...prev, styleId: val }))}
            options={[
              { value: "", label: "Select Style..." },
              ...activeStyles.map(s => ({ value: s.id, label: `${s.styleNo} - ${s.description}` }))
            ]}
          />
        </div>

        <Input label="Color" name="color" value={formData.color} onChange={handleChange} required placeholder="e.g. Navy Blue" />
        <div className="flex flex-col space-y-1.5">
          <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#475569]">Status</label>
          <PremiumSelect
            name="status"
            value={formData.status}
            onChange={(val) => setFormData(prev => ({ ...prev, status: val as any }))}
            options={[
              { value: "PLANNED", label: "Planned" },
              { value: "IN_PRODUCTION", label: "In Production" },
              { value: "ON_HOLD", label: "On Hold" }
            ]}
          />
        </div>

        <Input label="Order Date" name="orderDate" type="date" value={formData.orderDate} onChange={handleChange} required />
        <Input label="Delivery Date" name="deliveryDate" type="date" value={formData.deliveryDate} onChange={handleChange} required />
      </div>

      {/* Size Grid */}
      <div className="border border-[#F0EAE0] rounded-sm overflow-hidden mt-6">
        <div className="bg-[#FAFAF8] p-3 border-b border-[#F0EAE0] flex justify-between items-center">
          <h3 className="text-sm font-semibold text-[#221912]">Size-Wise Quantities</h3>
          <p className="text-[11px] font-mono font-bold text-[#8C7E6E] bg-white px-2 py-1 rounded-sm border border-[#E6DDCE]">
            TOTAL: <span className="text-[#B48259]">{totalQty}</span>
          </p>
        </div>
        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 bg-white">
          {activeSizes.map(size => (
            <div key={size.id} className="flex flex-col space-y-1">
              <label className="text-[11px] font-bold text-[#475569] flex items-center justify-between">
                <span>{size.code}</span>
                <span className="font-normal text-[9px] text-[#B8A898]">{size.label}</span>
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={sizeQty[size.id.toString()] || ""}
                onChange={(e) => handleSizeChange(size.id.toString(), e.target.value)}
                className="w-full h-9 bg-[#FEFCF9] border border-[#E6DDCE] rounded-sm px-3 text-sm text-[#221912] text-right focus:outline-none focus:border-[#B48259] focus:ring-1 focus:ring-[#B48259]/20 font-mono"
              />
            </div>
          ))}
          {activeSizes.length === 0 && (
            <div className="col-span-full text-sm text-[#8C7E6E] text-center py-4">
              No active sizes found in the master. Please add sizes first.
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-5 border-t border-[#F0EAE0]">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>Cancel</Button>
        <Button type="submit" variant="primary" loading={loading} disabled={totalQty <= 0}>Create Order</Button>
      </div>
    </form>
  );
}

