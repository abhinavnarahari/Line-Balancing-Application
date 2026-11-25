import { api } from "../../lib/api";

export type OrderStatus = "PLANNED" | "IN_PRODUCTION" | "COMPLETED" | "ON_HOLD";
/** SINGLE_COLOR: one colour, several sizes. MULTI_COLOR: several colours, each with its sizes. */
export type OrderType = "SINGLE_COLOR" | "MULTI_COLOR";

export interface OrderSizeLine {
  sizeId: string | number;
  quantity: number;
  /** Colour of this line (blank = the order's colour) */
  color?: string | null;
  sizeCode?: string;
  sizeLabel?: string;
}

export interface Order {
  id?: string | number;
  /** Optimistic-lock token from the server; send it back on update. */
  rowVersion?: number;
  orderNo: string;
  /** Optional */
  buyer?: string | null;
  styleId: string | number;
  styleNo?: string;
  /** The colour (single-colour order) or a summary such as "BLACK, WHITE" (multi-colour order) */
  color: string;
  /** Blank on create = decided from the number of colours */
  orderType?: OrderType;
  orderDate: string;
  deliveryDate: string;
  plannedCompletionDate?: string;
  status: OrderStatus;
  sizeLines: OrderSizeLine[];
  totalQuantity?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateOrderDTO = Omit<Order, "id" | "totalQuantity" | "createdAt" | "updatedAt" | "styleNo">;

export const ordersApi = {
  getOrders: async (): Promise<Order[]> => {
    return await api.get("/orders");
  },

  createOrder: async (data: CreateOrderDTO): Promise<Order> => {
    return await api.post("/orders", data);
  },
  
  /** Excel import: all orders are created together, or none are. */
  createOrdersBatch: async (data: CreateOrderDTO[]): Promise<Order[]> => {
    return await api.post("/orders/batch", data);
  },

  updateOrderStatus: async (id: string | number, status: OrderStatus): Promise<Order> => {
    return await api.patch(`/orders/${id}/status`, null, { params: { status } });
  },

  updateOrder: async (id: string | number, data: CreateOrderDTO): Promise<Order> => {
    return await api.put(`/orders/${id}`, data);
  },

  deleteOrder: async (id: string | number): Promise<void> => {
    await api.delete(`/orders/${id}`);
  }
};
