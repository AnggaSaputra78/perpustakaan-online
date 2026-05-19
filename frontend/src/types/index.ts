export interface User {
  id: number;
  fullName: string;
  email: string;
  avatar?: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  _count?: {
    books: number;
  };
}

export interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  publisher: string;
  year: number;
  synopsis: string;
  cover?: string;
  pdfFile?: string;
  pages?: number;
  stock: number;
  available: number;
  categoryId: number;
  category: Category;
  createdAt: string;
  updatedAt: string;
  // Properti tambahan untuk UI
  rating?: number;
  totalReviews?: number;
  categoryString?: string;   // ✅ Tambahkan ini untuk dashboard
}

export interface Borrowing {
  id: number;
  userId: number;
  bookId: number;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'active' | 'returned';
  book: Book;
  user?: User;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface PaginationData<T> {
  books: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface DashboardStats {
  totalBooks: number;
  totalMembers: number;
  activeBorrowings: number;
  totalBorrowings: number;
}