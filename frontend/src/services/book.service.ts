import api from '@/lib/axios';
import { ApiResponse, Book, PaginationData } from '@/types';

export const bookService = {
  async getAll(params?: { search?: string; category?: string; page?: number; limit?: number }) {
    const response = await api.get<ApiResponse<PaginationData<Book>>>('/books', { params });
    return response.data;
  },

  async getById(id: number) {
    const response = await api.get<ApiResponse<Book>>(`/books/${id}`);
    return response.data;
  },

  async getLatest() {
    const response = await api.get<ApiResponse<Book[]>>('/books/latest');
    return response.data;
  },

  async create(formData: FormData) {
    const response = await api.post<ApiResponse<Book>>('/books', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async update(id: number, formData: FormData) {
    const response = await api.put<ApiResponse<Book>>(`/books/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async delete(id: number) {
    const response = await api.delete<ApiResponse<null>>(`/books/${id}`);
    return response.data;
  },
};