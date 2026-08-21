import { api } from "../../lib/api";

export interface Style {
  id: string | number;
  styleNo: string;
  buyer: string;
  description: string;
  season: string;
  productType: string;
  active: boolean;
}

export type CreateStyleDTO = Omit<Style, "id">;
export type UpdateStyleDTO = Partial<CreateStyleDTO>;

export const stylesApi = {
  getStyles: async (active?: boolean): Promise<Style[]> => {
    const params = active !== undefined ? { active } : {};
    return await api.get("/styles", { params });
  },

  createStyle: async (style: CreateStyleDTO): Promise<Style> => {
    return await api.post("/styles", style);
  },

  updateStyle: async (id: string | number, style: UpdateStyleDTO): Promise<Style> => {
    return await api.put(`/styles/${id}`, style);
  },

  toggleActive: async (id: string | number): Promise<void> => {
    return await api.patch(`/styles/${id}/toggle-status`);
  },
};
