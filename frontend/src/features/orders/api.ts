import { api } from "../../lib/api";

export type OrderStatus = "PLANNED" | "IN_PRODUCTION" | "COMPLETED" | "ON_HOLD";

export interface Order {
  id?: string | number;
  orderNo: string;
  buyer: string;
  styleId: string | number;
  styleNo?: string;
  color: string;
  orderDate: string;
  deliveryDate: string;
  plannedCompletionDate?: string;
  status: OrderStatus;
  sizeLines: { sizeId: string | number; quantity: number }[];
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
