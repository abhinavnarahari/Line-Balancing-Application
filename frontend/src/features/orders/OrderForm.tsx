import { useState, useMemo, useEffect } from "react";
import { Plus, Trash2, Layers, AlertCircle } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { PremiumSelect } from "../../components/ui/PremiumUI";
import { SearchableSelect } from "../../components/ui/SearchableSelect";
import type { CreateOrderDTO, Order } from "./api";
import { stylesApi, type Style } from "../styles/api";
import { sizesApi, type Size } from "../sizes/api";

interface OrderFormProps {
  styles: Style[];
  sizes: Size[];
  existingOrders?: any[];
  initialData?: Order | null;
  onSubmit: (data: CreateOrderDTO) => Promise<void>;
  onCancel: () => void;
}

interface SizeRow {
  id: string;
  sizeId: string;
  quantity: string | number;
}

export function OrderForm({ styles, sizes, existingOrders = [], initialData, onSubmit, onCancel }: OrderFormProps) {
  const currentYear = new Date().getFullYear();

  const autoOrderNo = useMemo(() => {
    const existing = existingOrders || [];
    const matchingNos = existing
      .map((o: any) => o.orderNo)
      .filter((no: string) => no && no.toUpperCase().startsWith(`PO-${currentYear}-`))
      .map((no: string) => {
        const parts = no.toUpperCase().split("-");
        const num = parseInt(parts[parts.length - 1], 10);
        return isNaN(num) ? 0 : num;
      });
    const maxNum = matchingNos.length > 0 ? Math.max(...matchingNos) : existing.length;
    return `PO-${currentYear}-${String(maxNum + 1).padStart(3, "0")}`;
  }, [existingOrders, currentYear]);

  const defaultDeliveryDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  }, []);

  const [formData, setFormData] = useState<Omit<CreateOrderDTO, "sizeLines">>(() => ({
    orderNo: initialData?.orderNo || autoOrderNo,
    buyer: initialData?.buyer || "",
    styleId: initialData?.styleId ? String(initialData.styleId) : "",
    color: initialData?.color || "",
    orderDate: initialData?.orderDate || new Date().toISOString().split("T")[0],
    deliveryDate: initialData?.deliveryDate || defaultDeliveryDate,
    plannedCompletionDate: initialData?.plannedCompletionDate || initialData?.deliveryDate || defaultDeliveryDate,
    status: initialData?.status || "PLANNED",
  }));

  useEffect(() => {
    if (!initialData && !formData.orderNo && autoOrderNo) {
      setFormData(prev => ({ ...prev, orderNo: autoOrderNo }));
    }
  }, [autoOrderNo, initialData]);

  const [availableSizes, setAvailableSizes] = useState<Size[]>(sizes || []);
  const [availableStyles, setAvailableStyles] = useState<Style[]>(styles || []);

  // Fetch latest sizes and styles from API directly to guarantee live sync with sizes section
  useEffect(() => {
    sizesApi.getSizes().then(res => {
      if (Array.isArray(res) && res.length > 0) {
        setAvailableSizes(res);
      }
    }).catch(console.error);

    stylesApi.getStyles().then(res => {
      if (Array.isArray(res) && res.length > 0) {
        setAvailableStyles(res);
      }
    }).catch(console.error);
  }, []);

  const sortedSizes = useMemo(() => {
    return [...availableSizes].sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
  }, [availableSizes]);

  const sortedStyles = useMemo(() => {
    return [...availableStyles];
  }, [availableStyles]);

  // Size Options for Dropdown
  const sizeOptions = useMemo(() => {
    return sortedSizes.map(s => ({
      value: String(s.id),
      label: s.code,
      sublabel: s.label || undefined,
    }));
  }, [sortedSizes]);

  // Style Options for Dropdown
  const styleOptions = useMemo(() => {
    return sortedStyles.map(s => ({
      value: String(s.id),
      label: s.styleNo,
      sublabel: s.description || undefined,
    }));
  }, [sortedStyles]);

  // Dynamic Size Rows: start with initial data or 1 row
  const [sizeRows, setSizeRows] = useState<SizeRow[]>(() => {
    if (initialData?.sizeLines && initialData.sizeLines.length > 0) {
      return initialData.sizeLines.map((sl, i) => ({
        id: `row-${i}-${Date.now()}`,
        sizeId: String(sl.sizeId),
        quantity: sl.quantity,
      }));
    }
    return [
      { id: "row-1", sizeId: sizes[0]?.id ? String(sizes[0].id) : "", quantity: "" }
    ];
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalQty = useMemo(() => {
    return sizeRows.reduce((acc, curr) => {
      const q = typeof curr.quantity === "number" ? curr.quantity : parseInt(curr.quantity, 10);
      return acc + (isNaN(q) ? 0 : Math.max(0, q));
    }, 0);
  }, [sizeRows]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddRow = () => {
    // Find first size that hasn't been selected yet, or fallback to first size
    const usedSizeIds = new Set(sizeRows.map(r => r.sizeId));
    const nextAvailable = sortedSizes.find(s => !usedSizeIds.has(String(s.id)));
    const defaultSizeId = nextAvailable ? String(nextAvailable.id) : (sortedSizes[0]?.id ? String(sortedSizes[0].id) : "");

    setSizeRows(prev => [
      ...prev,
      { id: `row-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`, sizeId: defaultSizeId, quantity: "" }
    ]);
  };

  const handleRemoveRow = (rowId: string) => {
    if (sizeRows.length === 1) {
      // If only 1 row, just clear it instead of deleting
      setSizeRows([{ id: "row-1", sizeId: "", quantity: "" }]);
      return;
    }
    setSizeRows(prev => prev.filter(r => r.id !== rowId));
  };

  const handleRowSizeChange = (rowId: string, sizeId: string) => {
    setSizeRows(prev => prev.map(r => r.id === rowId ? { ...r, sizeId } : r));
  };

  const handleRowQtyChange = (rowId: string, val: string) => {
    setSizeRows(prev => prev.map(r => r.id === rowId ? { ...r, quantity: val } : r));
  };

  const isDuplicateOrderNo = useMemo(() => {
    if (!formData.orderNo) return false;
    return (existingOrders || []).some(
      (o: any) =>
        String(o.id) !== String(initialData?.id) &&
        o.orderNo &&
        o.orderNo.trim().toUpperCase() === formData.orderNo.trim().toUpperCase()
    );
  }, [formData.orderNo, existingOrders, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.orderNo || !formData.orderNo.trim()) {
      setError("Order number is required.");
      return;
    }

    if (isDuplicateOrderNo) {
      setError(`Order number '${formData.orderNo.trim()}' already exists. Please choose a unique order number (e.g. ${autoOrderNo}).`);
      return;
    }

    if (!formData.styleId) {
      setError("Please select a Style.");
      return;
    }

    if (formData.deliveryDate && formData.orderDate && formData.deliveryDate < formData.orderDate) {
      setError("Delivery date cannot be earlier than the order date.");
      return;
    }

    if (formData.plannedCompletionDate && formData.orderDate && formData.plannedCompletionDate < formData.orderDate) {
      setError("Planned to complete date cannot be earlier than the order date.");
      return;
    }

    const validLines = sizeRows
      .map(r => ({
        sizeId: r.sizeId,
        quantity: typeof r.quantity === "number" ? r.quantity : parseInt(r.quantity as string, 10)
      }))
      .filter(line => line.sizeId && !isNaN(line.quantity) && line.quantity > 0);

    if (validLines.length === 0) {
      setError("Please enter quantity (> 0) for at least one size row.");
      return;
    }

    // Merge duplicate sizes if any
    const sizeMap: Record<string, number> = {};
    for (const line of validLines) {
      sizeMap[line.sizeId] = (sizeMap[line.sizeId] || 0) + line.quantity;
    }

    const sizeLines = Object.entries(sizeMap).map(([sizeId, quantity]) => ({
      sizeId,
      quantity
    }));

    setLoading(true);
    try {
      await onSubmit({ ...formData, orderNo: formData.orderNo.trim(), sizeLines });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to create order";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Header Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Input
            label="Order Number (PO)"
            name="orderNo"
            value={formData.orderNo}
            onChange={handleChange}
            required
            placeholder="e.g. PO-2026-001"
            className={isDuplicateOrderNo ? "border-amber-500 ring-1 ring-amber-500/20" : ""}
          />
          {isDuplicateOrderNo ? (
            <p className="text-[11px] text-amber-600 font-medium mt-1 flex items-center justify-between">
              <span>⚠️ Order number already exists in database.</span>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, orderNo: autoOrderNo }))}
                className="text-[#2563EB] font-bold hover:underline cursor-pointer"
              >
                Use {autoOrderNo}
              </button>
            </p>
          ) : (
            <p className="text-[10px] text-[#64748B] mt-1 flex items-center justify-between">
              <span>Unique purchase order identifier</span>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, orderNo: autoOrderNo }))}
                className="text-[#2563EB] font-medium hover:underline cursor-pointer"
              >
                Auto-generate
              </button>
            </p>
          )}
        </div>
        <Input
          label="Buyer Name"
          name="buyer"
          value={formData.buyer}
          onChange={handleChange}
          required
          placeholder="e.g. Acme Apparel Corp"
        />

        <div className="flex flex-col space-y-1.5 md:col-span-2">
          <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#475569]">
            Style <span className="text-red-500">*</span>
          </label>
          <SearchableSelect
            value={formData.styleId}
            onChange={(val) => setFormData(prev => ({ ...prev, styleId: val }))}
            options={styleOptions}
            placeholder="Search & select style..."
          />
        </div>

        <Input
          label="Color / Shade"
          name="color"
          value={formData.color}
          onChange={handleChange}
          required
          placeholder="e.g. Navy Blue"
        />

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

        <Input
          label="Order Date"
          name="orderDate"
          type="date"
          value={formData.orderDate}
          onChange={handleChange}
          required
        />
        <Input
          label="Planned to Complete Date"
          name="plannedCompletionDate"
          type="date"
          value={formData.plannedCompletionDate}
          onChange={handleChange}
          required
        />
        <Input
          label="Delivery Date"
          name="deliveryDate"
          type="date"
          value={formData.deliveryDate}
          onChange={handleChange}
          required
        />
      </div>

      {/* Dynamic Size-Wise Quantities Section */}
      <div className="border border-[#E2E8F0] rounded-xl bg-white shadow-2xs relative">
        <div className="bg-[#F8FAFC] px-4 py-3 border-b border-[#E2E8F0] rounded-t-xl flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#2563EB]" />
            <h3 className="text-sm font-bold text-[#0F172A]">Size-Wise Quantities</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#64748B] font-medium">Total Quantity:</span>
            <span className="font-mono font-bold text-xs bg-white px-2.5 py-1 rounded-md border border-[#E2E8F0] text-[#2563EB] shadow-2xs">
              {totalQty.toLocaleString()} pcs
            </span>
          </div>
        </div>

        <div className="p-4 bg-white space-y-3">
          {/* Table Header Labels */}
          <div className="grid grid-cols-12 gap-3 px-2 text-[11px] font-bold text-[#64748B] uppercase tracking-wide">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-6">Select Size</div>
            <div className="col-span-4 text-right">Quantity (Pcs)</div>
            <div className="col-span-1 text-center">Action</div>
          </div>

          {/* Row Items */}
          <div className="space-y-2.5">
            {sizeRows.map((row, index) => (
              <div
                key={row.id}
                className="grid grid-cols-12 gap-3 items-center p-2 rounded-lg bg-[#F8FAFC] hover:bg-[#F8FAFC]/50 border border-[#F1F5F9] transition-colors"
              >
                {/* Row Index */}
                <div className="col-span-1 text-center font-mono text-xs font-semibold text-[#64748B]">
                  {index + 1}
                </div>

                {/* Size Selector */}
                <div className="col-span-6">
                  <SearchableSelect
                    value={row.sizeId}
                    onChange={(val) => handleRowSizeChange(row.id, val)}
                    options={sizeOptions}
                    placeholder="Search size..."
                  />
                </div>

                {/* Quantity Input */}
                <div className="col-span-4">
                  <input
                    type="number"
                    min="1"
                    placeholder="Enter qty"
                    value={row.quantity}
                    onChange={(e) => handleRowQtyChange(row.id, e.target.value)}
                    className="w-full h-10 bg-white border border-[#E2E8F0] rounded-lg px-3 text-xs text-[#0F172A] text-right focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 font-mono font-semibold"
                  />
                </div>

                {/* Delete Row Button */}
                <div className="col-span-1 flex justify-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(row.id)}
                    className="p-2 rounded-lg text-[#64748B] hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer"
                    title="Remove row"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add New Row Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleAddRow}
              className="w-full py-2.5 px-4 rounded-xl border border-dashed border-[#2563EB]/60 hover:border-[#2563EB] bg-[#F8FAFC]/50 hover:bg-[#F8FAFC] text-[#2563EB] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Row</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-5 border-t border-[#F1F5F9]">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={loading} disabled={totalQty <= 0}>
          {initialData ? "Update Order" : "Create Order"}
        </Button>
      </div>
    </form>
  );
}


