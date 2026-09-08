import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Plus, Search, ChevronDown, ShoppingBag, Activity,
  Clock, Package, Layers,
  Download, Copy, Check, AlertTriangle, Tag, X, RotateCcw,
  Edit2, Trash2, CalendarClock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../../components/ui/Button";
import { PageHeader, DataCard, EmptyState, SkeletonTable } from "../../components/ui/PremiumUI";
import { Modal } from "../../components/ui/Modal";
import { ordersApi, type Order, type CreateOrderDTO, type OrderStatus } from "../../features/orders/api";
import { OrderForm } from "../../features/orders/OrderForm";
import { stylesApi, type Style } from "../../features/styles/api";
import { sizesApi, type Size } from "../../features/sizes/api";
import { exportToExcel } from "../../utils/excel";

// Helper for Color Swatch
function getColorHex(colorName: string): string {
  const c = colorName.toLowerCase().trim();
  if (c.includes("navy")) return "#1E3A8A";
  if (c.includes("black")) return "#0F172A";
  if (c.includes("white")) return "#F8FAFC";
  if (c.includes("red")) return "#DC2626";
  if (c.includes("blue")) return "#2563EB";
  if (c.includes("green")) return "#16A34A";
  if (c.includes("yellow")) return "#CA8A04";
  if (c.includes("grey") || c.includes("gray")) return "#64748B";
  if (c.includes("pink")) return "#DB2777";
  if (c.includes("purple")) return "#9333EA";
  return "#94A3B8";
}

// Format Date nicely: "2026-08-25" -> "25 Aug 2026"
function formatDate(dateStr?: string) {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

// Calculate days remaining to delivery
function getDeliveryCountdown(deliveryDateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const del = new Date(deliveryDateStr);
  del.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((del.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays;
}

function getPlannedCountdown(plannedDateStr?: string): number | null {
  if (!plannedDateStr) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(plannedDateStr);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Buyer avatar initials
function getInitials(name: string) {
  if (!name) return "PO";
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

// Buyer avatar background color generator
function getAvatarBg(name: string) {
  const colors = [
    "bg-blue-100 text-blue-800 border-blue-200",
    "bg-indigo-100 text-indigo-800 border-indigo-200",
    "bg-purple-100 text-purple-800 border-purple-200",
    "bg-emerald-100 text-emerald-800 border-emerald-200",
    "bg-amber-100 text-amber-800 border-amber-200",
    "bg-teal-100 text-teal-800 border-teal-200",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return colors[Math.abs(hash) % colors.length];
}

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [styles, setStyles] = useState<Style[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [buyerFilter, setBuyerFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"delivery" | "orderDate" | "quantity" | "orderNo">("orderDate");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Expanded row details drawer
  const [expandedOrderId, setExpandedOrderId] = useState<string | number | null>(null);

  // Modal State & Edit/Delete state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordData, styleData, sizeData] = await Promise.all([
        ordersApi.getOrders(),
        stylesApi.getStyles(),
        sizesApi.getSizes(),
      ]);
      setOrders(ordData);
      setStyles(styleData);
      setSizes(sizeData);
    } catch (e) {
      console.error("Failed to load orders data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (data: CreateOrderDTO) => {
    try {
      if (editingOrder && editingOrder.id) {
        await ordersApi.updateOrder(editingOrder.id, data);
      } else {
        await ordersApi.createOrder(data);
      }
      setIsFormOpen(false);
      setEditingOrder(null);
      await loadData();
    } catch (err: any) {
      console.error("Failed to save order:", err);
      throw err;
    }
  };

  const handleExecuteDelete = async () => {
    if (!deletingOrder || !deletingOrder.id) return;
    try {
      await ordersApi.deleteOrder(deletingOrder.id);
      showToast(`✓ Order "${deletingOrder.orderNo}" deleted successfully`);
      setDeletingOrder(null);
      await loadData();
    } catch (err: any) {
      console.error("Failed to delete order:", err);
      showToast(`❌ ${err?.response?.data?.message || err?.message || "Failed to delete order"}`);
    }
  };

  const handleStatusChange = async (id: string | number, status: string) => {
    try {
      await ordersApi.updateOrderStatus(id, status as OrderStatus);
      setOrders(prev =>
        prev.map(o => (String(o.id) === String(id) ? { ...o, status: status as OrderStatus } : o))
      );
    } catch (e) {
      console.error("Failed to update status", e);
      loadData();
    }
  };

  const handleCopyOrderNo = (orderNo: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(orderNo);
    setCopiedId(orderNo);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStyle = useCallback((id: string | number) => styles.find(s => String(s.id) === String(id)), [styles]);
  const getStyleName = useCallback((id: string | number) => getStyle(id)?.styleNo || "Unknown Style", [getStyle]);

  // Distinct Buyers for dropdown filter
  const distinctBuyers = useMemo(() => {
    const buyers = Array.from(new Set(orders.map(o => o.buyer).filter(Boolean)));
    return buyers.sort();
  }, [orders]);

  // Executive KPI summary stats
  const kpiStats = useMemo(() => {
    const totalOrders = orders.length;
    const inProduction = orders.filter(o => o.status === "IN_PRODUCTION");
    const planned = orders.filter(o => o.status === "PLANNED");
    const completed = orders.filter(o => o.status === "COMPLETED");
    const totalUnits = orders.reduce((sum, o) => sum + (o.totalQuantity || 0), 0);
    const inProductionUnits = inProduction.reduce((sum, o) => sum + (o.totalQuantity || 0), 0);

    return {
      totalOrders,
      inProductionCount: inProduction.length,
      inProductionUnits,
      plannedCount: planned.length,
      completedCount: completed.length,
      totalUnits,
    };
  }, [orders]);

  // Filtered & Sorted orders list
  const filteredOrders = useMemo(() => {
    return orders
      .filter(o => {
        // Status filter
        if (statusFilter !== "ALL" && o.status !== statusFilter) return false;
        // Buyer filter
        if (buyerFilter !== "ALL" && o.buyer !== buyerFilter) return false;
        // Search query
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          o.orderNo.toLowerCase().includes(q) ||
          o.buyer.toLowerCase().includes(q) ||
          (o.color && o.color.toLowerCase().includes(q)) ||
          getStyleName(o.styleId).toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === "delivery") {
          return new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime();
        }
        if (sortBy === "quantity") {
          return (b.totalQuantity || 0) - (a.totalQuantity || 0);
        }
        if (sortBy === "orderNo") {
          return a.orderNo.localeCompare(b.orderNo);
        }
        // default: orderDate newest first
        return new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime();
      });
  }, [orders, statusFilter, buyerFilter, search, sortBy, getStyleName]);

  // Export to Excel
  const handleExport = () => {
    const exportData = filteredOrders.map(o => {
      const style = getStyle(o.styleId);
      const countdown = getDeliveryCountdown(o.deliveryDate);
      return {
        "Order No": o.orderNo,
        "Style No": style?.styleNo || "N/A",
        "Style Description": style?.description || "",
        "Color": o.color,
        "Buyer": o.buyer,
        "Total Quantity": o.totalQuantity,
        "Order Date": o.orderDate,
        "Plan to Complete Date": o.plannedCompletionDate || o.deliveryDate,
        "Delivery Date": o.deliveryDate,
        "Days to Delivery": countdown !== null ? countdown : "—",
        "Status": o.status,
      };
    });
    exportToExcel(exportData, `Order_Register_${new Date().toISOString().split("T")[0]}`);
  };

  return (
    <div className="space-y-6 w-full p-6 lg:p-8 bg-slate-50 min-h-screen">
      {/* ── Page Header ───────────────────────────────────────────── */}
      <PageHeader
        eyebrow="Production Management"
        title="Order Register & Breakdown"
        description="Track commercial garment purchase orders, size distributions, delivery schedules, and line balancing readiness."
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              disabled={orders.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-500" />
              Export Excel
            </button>
            <Button
              onClick={() => {
                setEditingOrder(null);
                loadData();
                setIsFormOpen(true);
              }}
              size="md"
              className="bg-[#9C5B3C] hover:bg-[#B06C49] text-white shadow-sm shadow-[#9C5B3C]/20"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Create Order
            </Button>
          </div>
        }
      />

      {/* ── Top Executive KPI Cards ───────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Orders */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl border border-[#E6DDCE] bg-white p-4 shadow-[0_1px_3px_rgba(34,25,18,0.05)] flex items-center justify-between"
        >
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C7E6E]">Total Orders</p>
            <p className="text-2xl font-extrabold text-[#221912] font-mono">{kpiStats.totalOrders}</p>
            <p className="text-[11px] font-medium text-[#8C7E6E]">{distinctBuyers.length} active buyers</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#F6F1E8] border border-[#E6DDCE] flex items-center justify-center text-[#9C5B3C] shadow-2xs">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </motion.div>

        {/* In Production */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
          className="rounded-2xl border border-[#fde68a] bg-[#fffbeb] p-4 shadow-[0_1px_3px_rgba(34,25,18,0.05)] flex items-center justify-between"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#d97706] animate-pulse" />
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#b45309]">In Production</p>
            </div>
            <p className="text-2xl font-extrabold text-[#b45309] font-mono">{kpiStats.inProductionCount}</p>
            <p className="text-[11px] font-medium text-[#b45309]">{kpiStats.inProductionUnits.toLocaleString()} units on floor</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-white/60 border border-[#fde68a] flex items-center justify-center text-[#d97706] shadow-2xs">
            <Activity className="w-5 h-5" />
          </div>
        </motion.div>

        {/* Planned */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="rounded-2xl border border-[#E6DDCE] bg-white p-4 shadow-[0_1px_3px_rgba(34,25,18,0.05)] flex items-center justify-between"
        >
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C7E6E]">Planned Queue</p>
            <p className="text-2xl font-extrabold text-[#221912] font-mono">{kpiStats.plannedCount}</p>
            <p className="text-[11px] font-medium text-[#8C7E6E]">Ready for line balancing</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#EFE9DF] border border-[#D8C9B8] flex items-center justify-center text-[#8B5E3C] shadow-2xs">
            <Clock className="w-5 h-5" />
          </div>
        </motion.div>

        {/* Total Booked Volume */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.15 }}
          className="rounded-2xl border border-[#E6DDCE] bg-white p-4 shadow-[0_1px_3px_rgba(34,25,18,0.05)] flex items-center justify-between"
        >
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C7E6E]">Booked Volume</p>
            <p className="text-2xl font-extrabold text-[#77876F] font-mono">{kpiStats.totalUnits.toLocaleString()}</p>
            <p className="text-[11px] font-medium text-[#8C7E6E]">Total garment pieces</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#F3F5F2] border border-[#d4decb] flex items-center justify-center text-[#77876F] shadow-2xs">
            <Package className="w-5 h-5" />
          </div>
        </motion.div>
      </div>

      {/* ── Main Data Card & Filter Controls ──────────────────────── */}
      <DataCard noPad className="border border-[#E6DDCE] shadow-[0_1px_3px_rgba(34,25,18,0.05)] rounded-2xl overflow-hidden bg-white">
        {/* Controls Toolbar */}
        <div className="p-4 sm:p-5 border-b border-[#F0EAE0] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-[#FDFBF7]">
          {/* Status Segmented Tabs */}
          <div className="flex flex-wrap items-center gap-1 bg-white p-1 rounded-xl border border-[#E6DDCE] shadow-2xs">
            {[
              { id: "ALL", label: "All Orders", count: orders.length },
              { id: "PLANNED", label: "Planned", count: orders.filter(o => o.status === "PLANNED").length },
              { id: "IN_PRODUCTION", label: "In Production", count: orders.filter(o => o.status === "IN_PRODUCTION").length },
              { id: "COMPLETED", label: "Completed", count: orders.filter(o => o.status === "COMPLETED").length },
              { id: "ON_HOLD", label: "On Hold", count: orders.filter(o => o.status === "ON_HOLD").length },
            ].map(tab => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? "bg-[#9C5B3C] text-white shadow-xs"
                      : "text-[#8C7E6E] hover:text-[#221912] hover:bg-[#F6F1E8]"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      active ? "bg-[#8B5E3C] text-white" : "bg-[#F6F1E8] text-[#8C7E6E]"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Select Filters */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C7E6E]" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search PO, style, buyer, color..."
                className="w-full pl-9 pr-8 py-1.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-medium"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Buyer Filter */}
            <select
              value={buyerFilter}
              onChange={e => setBuyerFilter(e.target.value)}
              className="text-xs font-semibold px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
            >
              <option value="ALL">All Buyers</option>
              {distinctBuyers.map(b => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>

            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="text-xs font-semibold px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
            >
              <option value="orderDate">Order Date (Newest)</option>
              <option value="delivery">Delivery (Earliest First)</option>
              <option value="quantity">Quantity (Highest First)</option>
              <option value="orderNo">Order No (A-Z)</option>
            </select>
          </div>
        </div>

        {/* ── Table Container ─────────────────────────────────────── */}
        {loading ? (
          <SkeletonTable rows={5} cols={7} />
        ) : filteredOrders.length === 0 ? (
          <div className="py-12">
            <EmptyState
              title="No matching production orders found"
              description={
                search || statusFilter !== "ALL" || buyerFilter !== "ALL"
                  ? "Try resetting your search query or filter tags to see all orders."
                  : "Register a new order using the Create Order button to begin line balancing."
              }
              action={
                search || statusFilter !== "ALL" || buyerFilter !== "ALL" ? (
                  <button
                    onClick={() => {
                      setSearch("");
                      setStatusFilter("ALL");
                      setBuyerFilter("ALL");
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset Filters
                  </button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#E6DDCE] bg-[#F8FAFC]/90 text-[11px] font-bold uppercase tracking-wider text-[#8C7E6E] select-none">
                  <th className="py-3.5 px-5 whitespace-nowrap">Order No.</th>
                  <th className="py-3.5 px-5 whitespace-nowrap">Style & Spec</th>
                  <th className="py-3.5 px-5 whitespace-nowrap">Buyer</th>
                  <th className="py-3.5 px-5 whitespace-nowrap text-right">Quantity</th>
                  <th className="py-3.5 px-5 whitespace-nowrap">Timeline & Schedule</th>
                  <th className="py-3.5 px-5 whitespace-nowrap">Plan to Complete Date</th>
                  <th className="py-3.5 px-5 whitespace-nowrap">Status</th>
                  <th className="py-3.5 px-5 whitespace-nowrap text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EAE0] font-normal text-[#221912]">
                {filteredOrders.map((order, idx) => {
                  const isExpanded = expandedOrderId === order.id;
                  const colorHex = getColorHex(order.color || "");
                  const countdown = getDeliveryCountdown(order.deliveryDate);
                  const isCopied = copiedId === order.orderNo;

                  return (
                    <tr
                      key={order.id || idx}
                      className={`group transition-colors duration-150 ${
                        isExpanded ? "bg-[#F6F1E8]/50" : "bg-white hover:bg-[#FEFCF9]"
                      }`}
                    >
                      {/* Column 1: Order No. */}
                      <td className="py-3.5 px-5 align-middle whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setExpandedOrderId(isExpanded ? null : order.id || null)}
                            className="p-1 rounded-md text-[#8C7E6E] hover:text-[#221912] hover:bg-[#F6F1E8] transition-colors cursor-pointer"
                            title={isExpanded ? "Collapse breakdown" : "Expand size breakdown"}
                          >
                            <ChevronDown
                              className={`w-4 h-4 transition-transform duration-200 ${
                                isExpanded ? "rotate-180 text-[#9C5B3C]" : ""
                              }`}
                            />
                          </button>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[13px] font-bold text-[#221912] tracking-tight whitespace-nowrap">
                                {order.orderNo}
                              </span>
                              <button
                                onClick={e => handleCopyOrderNo(order.orderNo, e)}
                                className="opacity-0 group-hover:opacity-100 text-[#8C7E6E] hover:text-[#221912] p-0.5 rounded transition-opacity cursor-pointer"
                                title="Copy PO Number"
                              >
                                {isCopied ? (
                                  <Check className="w-3.5 h-3.5 text-[#77876F]" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Style & Spec */}
                      <td className="py-3.5 px-5 align-middle whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F6F1E8] text-[#9C5B3C] border border-[#E6DDCE] text-[11.5px] font-bold font-mono">
                              <Tag className="w-3 h-3 text-[#9C5B3C]" />
                              {getStyleName(order.styleId)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-[#8C7E6E] font-medium">
                            <span className="flex items-center gap-1.5">
                              <span
                                className="w-2.5 h-2.5 rounded-full border border-[#E6DDCE] shadow-2xs inline-block"
                                style={{ backgroundColor: colorHex }}
                              />
                              {order.color || "Standard"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Column 3: Buyer */}
                      <td className="py-3.5 px-5 align-middle whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[11px] border shrink-0 ${getAvatarBg(
                              order.buyer
                            )}`}
                          >
                            {getInitials(order.buyer)}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-[#221912] block capitalize">
                              {order.buyer}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Column 4: Quantity */}
                      <td className="py-3.5 px-5 align-middle text-right whitespace-nowrap">
                        <div className="flex flex-col items-end">
                          <span className="font-mono text-sm font-extrabold text-[#77876F] bg-[#F3F5F2] px-2 py-0.5 rounded-lg border border-[#d4decb] inline-block shadow-2xs">
                            {(order.totalQuantity || 0).toLocaleString()} <span className="text-[10px] font-medium uppercase">pcs</span>
                          </span>
                        </div>
                      </td>

                      {/* Column 5: Timeline & Schedule */}
                      <td className="py-3.5 px-5 align-middle whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs font-medium">
                            <span className="text-[#8C7E6E] text-[11px]">
                              {formatDate(order.orderDate)}
                            </span>
                            <span className="text-[#E6DDCE] font-bold">→</span>
                            <span className="text-[#221912] font-semibold text-[11.5px]">
                              {formatDate(order.deliveryDate)}
                            </span>
                          </div>
                          <div>
                            {countdown !== null && (
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  countdown < 0
                                    ? "bg-[#fff1f2] text-[#be123c] border-[#fecaca]"
                                    : countdown <= 7
                                    ? "bg-[#fffbeb] text-[#b45309] border-[#fde68a]"
                                    : "bg-[#F6F1E8] text-[#8C7E6E] border-[#E6DDCE]"
                                }`}
                              >
                                {countdown < 0 ? (
                                  <>
                                    <AlertTriangle className="w-3 h-3 text-[#be123c]" />
                                    {Math.abs(countdown)}d overdue
                                  </>
                                ) : countdown === 0 ? (
                                  <>
                                    <Clock className="w-3 h-3 text-[#b45309]" />
                                    Due today
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-3 h-3 text-[#8C7E6E]" />
                                    {countdown}d remaining
                                  </>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Column 6: Plan to Complete Date */}
                      <td className="py-3.5 px-5 align-middle whitespace-nowrap">
                        {(() => {
                          const plannedDate = order.plannedCompletionDate || order.deliveryDate;
                          const planCountdown = getPlannedCountdown(plannedDate);
                          const isEarlierThanDelivery = order.plannedCompletionDate && order.plannedCompletionDate < order.deliveryDate;

                          return (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 font-semibold text-[12px] text-[#221912] font-mono">
                                <CalendarClock className="w-3.5 h-3.5 text-[#9C5B3C]" />
                                <span>{formatDate(plannedDate)}</span>
                              </div>
                              <div>
                                {planCountdown !== null && (
                                  <span
                                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                      planCountdown < 0
                                        ? "bg-[#fff1f2] text-[#be123c] border-[#fecaca]"
                                        : planCountdown <= 7
                                        ? "bg-[#fffbeb] text-[#b45309] border-[#fde68a]"
                                        : isEarlierThanDelivery
                                        ? "bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold"
                                        : "bg-[#F6F1E8] text-[#8C7E6E] border-[#E6DDCE]"
                                    }`}
                                  >
                                    {planCountdown < 0 ? (
                                      <>
                                        <AlertTriangle className="w-3 h-3 text-[#be123c]" />
                                        {Math.abs(planCountdown)}d past target
                                      </>
                                    ) : planCountdown === 0 ? (
                                      <>
                                        <Clock className="w-3 h-3 text-[#b45309]" />
                                        Target due today
                                      </>
                                    ) : (
                                      <>
                                        <Clock className="w-3 h-3" />
                                        {planCountdown}d target left
                                      </>
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </td>

                      {/* Column 7: Status Selector */}
                      <td className="py-3.5 px-5 align-middle whitespace-nowrap">
                        <div className="relative inline-block">
                          <select
                            value={order.status}
                            onChange={e => handleStatusChange(order.id || 0, e.target.value)}
                            className={`text-xs font-bold tracking-tight px-3 py-1.5 rounded-xl border appearance-none pr-8 cursor-pointer focus:outline-none focus:ring-2 transition-all shadow-2xs ${
                              order.status === "PLANNED"
                                ? "bg-[#F3F5F2] text-[#77876F] border-[#d4decb] focus:ring-[#77876F]/20"
                                : order.status === "IN_PRODUCTION"
                                ? "bg-[#fffbeb] text-[#b45309] border-[#fde68a] focus:ring-[#b45309]/20"
                                : order.status === "COMPLETED"
                                ? "bg-[#F3F5F2] text-[#77876F] border-[#d4decb] focus:ring-[#77876F]/20"
                                : "bg-[#F6F1E8] text-[#8C7E6E] border-[#E6DDCE] focus:ring-[#9C5B3C]/20"
                            }`}
                          >
                            <option value="PLANNED">🔵 Planned</option>
                            <option value="IN_PRODUCTION">⚡ In Production</option>
                            <option value="COMPLETED">✅ Completed</option>
                            <option value="ON_HOLD">⏸️ On Hold</option>
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#8C7E6E]" />
                        </div>
                      </td>

                      {/* Column 7: Actions */}
                      <td className="py-3.5 px-5 align-middle text-right whitespace-nowrap pr-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingOrder(order);
                              setIsFormOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
                            title={`Edit Order ${order.orderNo}`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingOrder(order)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer shadow-2xs"
                            title={`Delete Order ${order.orderNo}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Expandable Size Breakdown Modal/Drawer ───────────────── */}
        <AnimatePresence>
          {expandedOrderId && (() => {
            const expOrder = orders.find(o => o.id === expandedOrderId);
            if (!expOrder) return null;
            const style = getStyle(expOrder.styleId);
            const totalQty = expOrder.totalQuantity || 0;

            return (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-blue-100 bg-slate-50/90 p-5 overflow-hidden"
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shadow-blue-500/20">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Size Distribution Breakdown — <span className="font-mono text-blue-700">{expOrder.orderNo}</span>
                      </h4>
                      <p className="text-xs text-slate-500">
                        Style: <strong className="text-slate-700">{style?.styleNo}</strong> ({style?.description || "No description"}) · Buyer: <strong className="text-slate-700">{expOrder.buyer}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/line-balance?orderId=${expOrder.id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-xs"
                    >
                      <Activity className="w-3.5 h-3.5" />
                      Configure Line Balancing
                    </Link>
                    <button
                      onClick={() => setExpandedOrderId(null)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Size Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {sizes
                    .filter(s => (expOrder.sizeLines || []).some(sl => String(sl.sizeId) === String(s.id)))
                    .map(size => {
                      const line = expOrder.sizeLines?.find(sl => String(sl.sizeId) === String(size.id));
                      const qty = line?.quantity || 0;
                      const percent = totalQty > 0 ? Math.round((qty / totalQty) * 100) : 0;

                      return (
                        <div
                          key={size.id}
                          className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs space-y-1 text-center"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold font-mono uppercase bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                              {size.code}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400">
                              {percent}%
                            </span>
                          </div>
                          <p className="text-lg font-extrabold text-slate-900 font-mono pt-1">
                            {qty.toLocaleString()}
                          </p>
                          <p className="text-[10px] text-slate-500 font-medium truncate">
                            {size.label || `Size ${size.code}`}
                          </p>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                            <div
                              className="bg-blue-600 h-full rounded-full"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </motion.div>
            );
          })()}
        </AnimatePresence>

        {/* Table Footer Summary */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-slate-500">
          <div className="flex items-center gap-2">
            <span>Showing <strong className="text-slate-900 font-mono">{filteredOrders.length}</strong> of <strong className="text-slate-900 font-mono">{orders.length}</strong> orders</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Total Units in View: <strong className="text-emerald-700 font-mono">{filteredOrders.reduce((s, o) => s + (o.totalQuantity || 0), 0).toLocaleString()} pcs</strong></span>
          </div>
        </div>
      </DataCard>

      {/* ── Create / Edit Order Modal ────────────────────────────── */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingOrder(null);
        }}
        title={editingOrder ? `Edit Order: ${editingOrder.orderNo}` : "Create New Production Order"}
        subtitle={editingOrder ? "Update buyer, style specifications, delivery deadlines, or size breakdown." : "Specify buyer, style specifications, delivery deadlines, and size quantity breakdown."}
        className="max-w-4xl"
      >
        <OrderForm
          styles={styles}
          sizes={sizes}
          existingOrders={orders}
          initialData={editingOrder}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingOrder(null);
          }}
        />
      </Modal>

      {/* ── Delete Confirmation Modal ──────────────────────────── */}
      <Modal
        isOpen={!!deletingOrder}
        onClose={() => setDeletingOrder(null)}
        title="Delete Production Order"
        subtitle="Permanent removal confirmation"
        className="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Delete Order {deletingOrder?.orderNo}?</h4>
              <p className="text-xs text-slate-500">
                Buyer: <strong className="text-slate-800">{deletingOrder?.buyer}</strong> · Total: <strong className="text-slate-800">{deletingOrder?.totalQuantity?.toLocaleString()} pcs</strong>
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
            Are you sure you want to permanently remove this production order? Any linked planned lines and balance configurations for this order will also be cleaned up.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setDeletingOrder(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleExecuteDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
            >
              Yes, Delete Order
            </Button>
          </div>
        </div>
      </Modal>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-[#221912] text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in slide-in-from-top-4 duration-200">
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
