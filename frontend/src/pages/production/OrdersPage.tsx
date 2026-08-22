import { useState, useEffect } from "react";
import { Plus, Search, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "../../components/ui/Button";
import { PageHeader, DataCard, DataCardHeader, EmptyState, SkeletonTable } from "../../components/ui/PremiumUI";
import { Modal } from "../../components/ui/Modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";

import { ordersApi, type Order, type CreateOrderDTO, type OrderStatus } from "../../features/orders/api";
import { OrderForm } from "../../features/orders/OrderForm";

import { stylesApi, type Style } from "../../features/styles/api";
import { sizesApi, type Size } from "../../features/sizes/api";

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [styles, setStyles] = useState<Style[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordData, styleData, sizeData] = await Promise.all([
        ordersApi.getOrders(),
        stylesApi.getStyles(),
        sizesApi.getSizes(),
      ]);
      setOrders(ordData.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()));
      setStyles(styleData);
      setSizes(sizeData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (data: CreateOrderDTO) => {
    await ordersApi.createOrder(data);
    setIsFormOpen(false);
    loadData();
  };
  
  const handleStatusChange = async (id: string | number, status: string) => {
    await ordersApi.updateOrderStatus(id, status as OrderStatus);
    loadData();
  };

  const getStyleName = (id: string | number) => styles.find(s => s.id === id)?.styleNo || "Unknown Style";

  const filteredOrders = orders.filter(o => 
    o.orderNo.toLowerCase().includes(search.toLowerCase()) || 
    o.buyer.toLowerCase().includes(search.toLowerCase()) ||
    getStyleName(o.styleId).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-7 w-full p-6 lg:p-8">
      <PageHeader
        eyebrow="Production"
        title="Order Details"
        description="Manage production orders and configure size-wise target quantities."
        action={
          !isFormOpen && (
            <Button onClick={() => setIsFormOpen(true)} size="md">
              <Plus className="h-4 w-4 mr-1.5" />
              Create Order
            </Button>
          )
        }
      />

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Create New Order"
        subtitle="Total quantity will be calculated from the size breakdown."
        className="max-w-4xl"
      >
        <OrderForm styles={styles} sizes={sizes} onSubmit={handleSubmit} onCancel={() => setIsFormOpen(false)} />
      </Modal>

      <DataCard noPad>
        <DataCardHeader 
          title="Order Register" 
          count={filteredOrders.length} 
          action={
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8C7E6E]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search orders..."
                className="pl-8 pr-4 py-1.5 text-[11px] bg-white border border-[#E6DDCE] text-[#221912] placeholder-[#B8A898] w-64 focus:outline-none focus:border-[#B48259] focus:ring-1 focus:ring-[#B48259]/20 transition-all rounded-sm"
              />
            </div>
          }
        />
        
        {loading ? (
          <SkeletonTable rows={5} cols={7} />
        ) : filteredOrders.length === 0 ? (
          <EmptyState title="No orders found" description="Try adjusting your search terms or create a new order." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Order No.</TableHead>
                <TableHead>Style & Color</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead className="w-24 text-right">Quantity</TableHead>
                <TableHead className="w-28">Dates</TableHead>
                <TableHead className="w-40">Status</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order, index) => (
                <motion.tr
                  key={order.id}
                  className="group bg-white hover:bg-[#FEFCF9] border-b border-[#F0EAE0] last:border-0 transition-colors duration-100"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03, duration: 0.2 }}
                >
                  <TableCell>
                    <span className="font-mono text-sm font-bold text-[#221912] tracking-wide">{order.orderNo}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-[#B48259] text-xs">{getStyleName(order.styleId)}</span>
                      <span className="text-[10px] text-[#8C7E6E] mt-0.5">{order.color}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-[#221912]">{order.buyer}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-mono font-bold text-[#3C5245] text-sm">{order.totalQuantity.toLocaleString()}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-[10px] font-mono">
                      <span className="text-[#8C7E6E]">Ord: {order.orderDate}</span>
                      <span className="text-[#221912] font-semibold mt-0.5">Del: {order.deliveryDate}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className={`text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded-sm border focus:outline-none transition-colors cursor-pointer ${
                        order.status === "PLANNED" ? "bg-blue-50 text-blue-700 border-blue-200" :
                        order.status === "IN_PRODUCTION" ? "bg-amber-50 text-amber-700 border-amber-300" :
                        order.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        "bg-red-50 text-red-700 border-red-200"
                      }`}
                    >
                      <option value="PLANNED">Planned</option>
                      <option value="IN_PRODUCTION">In Production</option>
                      <option value="ON_HOLD">On Hold</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </TableCell>
                  <TableCell className="text-right">
                    <button className="text-[#E6DDCE] hover:text-[#B48259] transition-colors p-1">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        )}
      </DataCard>
    </div>
  );
}



