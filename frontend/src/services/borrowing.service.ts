import api from '@/lib/axios';
import { ApiResponse, Borrowing, DashboardStats } from '@/types';

export const borrowingService = {
  async borrowBook(bookId: number) {
    const response = await api.post<ApiResponse<Borrowing>>('/borrow', { bookId });
    return response.data;
  },

  async returnBook(id: number) {
    const response = await api.put<ApiResponse<Borrowing>>(`/borrow/return/${id}`);
    return response.data;
  },

  async getHistory(params?: { status?: string; page?: number; limit?: number }) {
    const response = await api.get<ApiResponse<{ borrowings: Borrowing[]; pagination: any }>>('/borrow/history', { params });
    return response.data;
  },

  async getStats() {
    const response = await api.get<ApiResponse<DashboardStats>>('/borrow/stats');
    return response.data;
  },
};