export interface Size {
  id: string;
  code: string;
  label: string;
  sequence: number;
  active: boolean;
}

let mockSizes: Size[] = [
  { id: "1", code: "XS",  label: "Extra Small", sequence: 1, active: true },
  { id: "2", code: "S",   label: "Small",        sequence: 2, active: true },
  { id: "3", code: "M",   label: "Medium",       sequence: 3, active: true },
  { id: "4", code: "L",   label: "Large",        sequence: 4, active: true },
  { id: "5", code: "XL",  label: "Extra Large",  sequence: 5, active: true },
  { id: "6", code: "XXL", label: "Double XL",    sequence: 6, active: true },
];

export const sizesApi = {
  getSizes: async (): Promise<Size[]> => {
    return new Promise((resolve) => setTimeout(() => resolve([...mockSizes]), 300));
  },

  createSize: async (s: Omit<Size, "id">): Promise<Size> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newSize = { ...s, id: Date.now().toString() };
        mockSizes = [...mockSizes, newSize];
        resolve(newSize);
      }, 400);
    });
  },

  updateSize: async (id: string, s: Omit<Size, "id">): Promise<Size> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        mockSizes = mockSizes.map((sz) => (sz.id === id ? { ...sz, ...s } : sz));
        resolve({ ...s, id });
      }, 400);
    });
  },

  toggleActive: async (id: string): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        mockSizes = mockSizes.map((sz) => (sz.id === id ? { ...sz, active: !sz.active } : sz));
        resolve();
      }, 300);
    });
  },
};
