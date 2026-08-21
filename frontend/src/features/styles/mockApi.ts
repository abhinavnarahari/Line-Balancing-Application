export interface Style {
  id: string;
  styleNo: string;
  buyer: string;
  description: string;
  season: string;
  productType: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreateStyleDTO = Omit<Style, "id" | "createdAt" | "updatedAt">;
export type UpdateStyleDTO = Partial<CreateStyleDTO>;

let mockStyles: Style[] = [
  {
    id: "1",
    styleNo: "TS-1001",
    buyer: "Acme Corp",
    description: "Men's Basic Crew Neck T-Shirt",
    season: "SS26",
    productType: "T-Shirt",
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    styleNo: "HD-2045",
    buyer: "Globex",
    description: "Unisex Heavyweight Hoodie",
    season: "AW26",
    productType: "Hoodie",
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "3",
    styleNo: "PT-3002",
    buyer: "Acme Corp",
    description: "Women's Chino Pants",
    season: "SS26",
    productType: "Pants",
    active: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const stylesApi = {
  getStyles: async (): Promise<Style[]> => {
    await delay(400);
    return [...mockStyles];
  },

  getStyle: async (id: string): Promise<Style> => {
    await delay(200);
    const style = mockStyles.find(s => s.id === id);
    if (!style) throw new Error("Style not found");
    return { ...style };
  },

  createStyle: async (data: CreateStyleDTO): Promise<Style> => {
    await delay(400);
    if (mockStyles.some(s => s.styleNo.toLowerCase() === data.styleNo.toLowerCase())) {
      throw new Error("Style Number must be unique");
    }
    const newStyle: Style = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockStyles.push(newStyle);
    return newStyle;
  },

  updateStyle: async (id: string, data: UpdateStyleDTO): Promise<Style> => {
    await delay(400);
    const index = mockStyles.findIndex(s => s.id === id);
    if (index === -1) throw new Error("Style not found");

    if (data.styleNo && mockStyles.some(s => s.id !== id && s.styleNo.toLowerCase() === data.styleNo!.toLowerCase())) {
      throw new Error("Style Number must be unique");
    }

    const updatedStyle = {
      ...mockStyles[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    mockStyles[index] = updatedStyle;
    return updatedStyle;
  },

  toggleActive: async (id: string): Promise<Style> => {
    await delay(300);
    const index = mockStyles.findIndex(s => s.id === id);
    if (index === -1) throw new Error("Style not found");

    mockStyles[index].active = !mockStyles[index].active;
    mockStyles[index].updatedAt = new Date().toISOString();
    return mockStyles[index];
  }
};
