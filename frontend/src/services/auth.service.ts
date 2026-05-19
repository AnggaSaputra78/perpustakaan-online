import api from '@/lib/axios';
import { ApiResponse } from '@/types';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  user: {
    id: number;
    fullName: string;
    email: string;
    role: string;
    avatar?: string;
  };
  token: string;
}

export const authService = {
  async login(data: LoginData) {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', data);
    return response.data; // Mengembalikan ApiResponse<AuthResponse>
  },

  async register(data: RegisterData) {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', data);
    return response.data;
  },

  async getProfile() {
    const response = await api.get<ApiResponse<AuthResponse['user']>>('/auth/profile');
    return response.data;
  },

  async updateProfile(formData: FormData) {
    const response = await api.put<ApiResponse<AuthResponse['user']>>('/auth/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};