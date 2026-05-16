import { create } from 'zustand';
import { Book, Category } from '@/types';

interface BookState {
  books: Book[];
  categories: Category[];
  loading: boolean;
  error: string | null;
  setBooks: (books: Book[]) => void;
  setCategories: (categories: Category[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useBookStore = create<BookState>((set) => ({
  books: [],
  categories: [],
  loading: false,
  error: null,
  setBooks: (books) => set({ books }),
  setCategories: (categories) => set({ categories }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));