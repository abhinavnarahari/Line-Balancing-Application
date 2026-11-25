import { useState, useMemo, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { PremiumSelect } from "../../components/ui/PremiumUI";
import { SearchableSelect } from "../../components/ui/SearchableSelect";
import type { CreateOrderDTO, Order, OrderType } from "./api";
import { ColourSizeMatrix } from "./ColourSizeMatrix";
import { checkColourRows, grandTotal, linesFromRows, rowsFromOrder, type ColourRow } from "./orderColours";
import { stylesApi, type Style } from "../styles/api";
import { sizesApi, type Size } from "../sizes/api";
import { toLocalDateString } from "../../utils/date";

interface OrderFormProps {
  styles: Style[];
  sizes: Size[];
  existingOrders?: any[];
  initialData?: Order | null;
  onSubmit: (data: CreateOrderDTO) => Promise<void>;
  onCancel: () => void;
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
    return toLocalDateString(d);
  }, []);

  const [formData, setFormData] = useState<Omit<CreateOrderDTO, "sizeLines">>(() => ({
    orderNo: initialData?.orderNo || "", // blank = the server numbers it
    buyer: initialData?.buyer || "",
    styleId: initialData?.styleId ? String(initialData.styleId) : "",
    color: initialData?.color || "",
    orderDate: initialData?.orderDate || toLocalDateString(),
    deliveryDate: initialData?.deliveryDate || defaultDeliveryDate,
    plannedCompletionDate: initialData?.plannedCompletionDate || initialData?.deliveryDate || defaultDeliveryDate,
    status: initialData?.status || "PLANNED",
  }));

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

  // Style Options for Dropdown
  const styleOptions = useMemo(() => {
    return sortedStyles.map(s => ({
      value: String(s.id),
      label: s.styleNo,
      sublabel: s.description || undefined,
    }));
  }, [sortedStyles]);

  // Colours and sizes: one row per colour (a single-colour order has one row)
  const [orderType, setOrderType] = useState<OrderType>(initialData?.orderType ?? "SINGLE_COLOR");
  const [colourRows, setColourRows] = useState<ColourRow[]>(() => rowsFromOrder(initialData));
  const colourSuggestions = useMemo(() => {
    const all = new Set<string>();
    for (const o of existingOrders || []) for (const l of o.sizeLines || []) if (l.color) all.add(String(l.color).trim());
    return [...all].sort();
  }, [existingOrders]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalQty = grandTotal(colourRows);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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

    const problems = checkColourRows(orderType, colourRows);
    if (problems.length > 0) {
      setError(problems.join(" "));
      return;
    }
    const sizeLines = linesFromRows(colourRows);
    const color = orderType === "SINGLE_COLOR" ? sizeLines[0]?.color ?? "" : "";

    setLoading(true);
    try {
      await onSubmit({ ...formData, color, orderType, orderNo: formData.orderNo.trim(), sizeLines });
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
            label="Order Number (PO) — optional"
            name="orderNo"
            value={formData.orderNo}
            onChange={handleChange}
            placeholder={initialData ? "Leave blank to keep the current number" : `Auto: ${autoOrderNo}`}
            className={isDuplicateOrderNo ? "border-amber-500 ring-1 ring-amber-500/20" : ""}
          />
            {isDuplicateOrderNo ? (
            <p className="text-[11px] text-amber-600 font-medium mt-1 flex items-center justify-between">
              <span>⚠️ Order number already exists in database.</span>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, orderNo: autoOrderNo }))}
                className="text-[#9C5B3C] font-bold hover:underline cursor-pointer"
              >
                Use {autoOrderNo}
              </button>
            </p>
          ) : (
            <p className="text-[10px] text-[#64748B] mt-1 flex items-center justify-between">
              <span>{formData.orderNo.trim() ? "Unique purchase order number" : "Leave blank to number it automatically"}</span>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, orderNo: autoOrderNo }))}
                className="text-[#9C5B3C] font-medium hover:underline cursor-pointer"
              >
                Use {autoOrderNo}
              </button>
            </p>
          )}
        </div>
        <Input
          label="Buyer Name (optional)"
          name="buyer"
          value={formData.buyer ?? ""}
          onChange={handleChange}
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

      {/* Colours & sizes */}
      <ColourSizeMatrix
        orderType={orderType}
        onOrderTypeChange={setOrderType}
        rows={colourRows}
        onRowsChange={setColourRows}
        sizes={sortedSizes.filter(sz => sz.active !== false || colourRows.some(r => r.qty[String(sz.id)]))}
        colourSuggestions={colourSuggestions}
      />

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


