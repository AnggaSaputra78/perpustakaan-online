import api from '@/lib/axios';
import { ApiResponse, Category } from '@/types';

export const categoryService = {
  async getAll() {
    const response = await api.get<ApiResponse<Category[]>>('/categories');
    return response.data;
  },
};