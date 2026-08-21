import { api } from "../../lib/api";

export interface Size {
  id: string | number;
  code: string;
  label: string;
  sequence: number;
  active: boolean;
}

export const sizesApi = {
  getSizes: async (active?: boolean): Promise<Size[]> => {
    const params = active !== undefined ? { active } : {};
    return await api.get("/sizes", { params });
  },

  createSize: async (size: Omit<Size, "id">): Promise<Size> => {
    return await api.post("/sizes", size);
  },

  updateSize: async (id: string | number, size: Omit<Size, "id">): Promise<Size> => {
    return await api.put(`/sizes/${id}`, size);
  },

  toggleActive: async (id: string | number): Promise<void> => {
    return await api.patch(`/sizes/${id}/toggle-status`);
  },
};
