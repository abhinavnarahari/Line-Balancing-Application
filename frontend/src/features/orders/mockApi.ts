export type OrderStatus = "PLANNED" | "IN_PRODUCTION" | "COMPLETED" | "ON_HOLD";

export interface Order {
  id: string;
  orderNo: string;
  buyer: string;
  styleId: string;
  color: string;
  orderDate: string;
  deliveryDate: string;
  status: OrderStatus;
  sizeQuantities: Record<string, number>; // Size ID -> Quantity
  totalQuantity: number;
  createdAt: string;
  updatedAt: string;
}

export type CreateOrderDTO = Omit<Order, "id" | "totalQuantity" | "createdAt" | "updatedAt">;

let mockOrders: Order[] = [
  {
    id: "o1",
    orderNo: "PO-2026-001",
    buyer: "Acme Corp",
    styleId: "1", // TS-1001
    color: "Navy Blue",
    orderDate: "2026-08-01",
    deliveryDate: "2026-09-15",
    status: "PLANNED",
    sizeQuantities: { "1": 500, "2": 1000, "3": 1000, "4": 500 }, // Assuming these are Size IDs
    totalQuantity: 3000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const ordersApi = {
  getOrders: async (): Promise<Order[]> => {
    await delay(400);
    return [...mockOrders];
  },

  createOrder: async (data: CreateOrderDTO): Promise<Order> => {
    await delay(500);
    if (mockOrders.some(o => o.orderNo.toLowerCase() === data.orderNo.toLowerCase())) {
      throw new Error("Order Number must be unique");
    }

    const totalQuantity = Object.values(data.sizeQuantities).reduce((sum, q) => sum + (q || 0), 0);

    if (totalQuantity <= 0) {
      throw new Error("Total quantity must be greater than 0");
    }

    const newOrder: Order = {
      ...data,
      id: Date.now().toString(),
      totalQuantity,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    mockOrders.push(newOrder);
    return newOrder;
  },
  
  updateOrderStatus: async (id: string, status: OrderStatus): Promise<Order> => {
    await delay(300);
    const idx = mockOrders.findIndex(o => o.id === id);
    if (idx === -1) throw new Error("Order not found");
    
    mockOrders[idx].status = status;
    mockOrders[idx].updatedAt = new Date().toISOString();
    return mockOrders[idx];
  }
};
