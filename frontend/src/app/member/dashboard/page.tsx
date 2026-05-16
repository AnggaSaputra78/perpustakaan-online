'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  AlertCircle,
  AlertTriangle,
  Award,
  BarChart2,
  Bell,
  BookOpen,
  Bookmark,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock3,
  Download,
  Edit3,
  ExternalLink,
  Filter,
  Grid,
  Heart,
  Info,
  Layers,
  Library,
  List,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  Search,
  SlidersHorizontal,
  Star,
  Sun,
  Tag,
  Upload,
  User,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { bookService } from '@/services/book.service';
import { borrowingService } from '@/services/borrowing.service';
import { categoryService } from '@/services/category.service';
import { Book, Borrowing, Category } from '@/types';

interface ExtendedBook extends Book {
  rating: number;
  totalReviews: number;
  categoryString: string;
  image?: string;
  pdf?: string;
}

interface Review {
  id: number;
  userId: number;
  userName: string;
  bookId: number;
  rating: number;
  comment: string;
  createdAt: string;
}

interface Notification {
  id: string;
  type: 'warning' | 'info' | 'success' | 'error';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

type ActiveMenu = 'dashboard' | 'favorites' | 'history' | 'borrowings' | 'categories' | 'profile';
type ThemeMode = 'dark' | 'light';

type SidebarItem = {
  id: ActiveMenu;
  icon: LucideIcon;
  label: string;
  badge?: number;
};

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
const FALLBACK_COVER = '/images/books/pengantar-pendidikan.png';

const STORAGE_KEYS = {
  activeMenu: 'member-dashboard-active-menu',
  favorites: 'member-dashboard-favorites',
  history: 'member-dashboard-history',
  reviews: 'member-dashboard-reviews',
  theme: 'theme',
};

const activeMenus: ActiveMenu[] = ['dashboard', 'favorites', 'history', 'borrowings', 'categories', 'profile'];

const fallbackCategories: Category[] = [
  { id: 1, name: 'Pendidikan', slug: 'pendidikan' },
  { id: 2, name: 'Akademik', slug: 'akademik' },
  { id: 3, name: 'Pemrograman', slug: 'pemrograman' },
  { id: 4, name: 'Fiksi & Sastra', slug: 'fiksi-sastra' },
];

// Untuk sementara, daftar buku bawaan dikosongkan.
const defaultBooks: ExtendedBook[] = [];

function isActiveMenu(value: string | null): value is ActiveMenu {
  return activeMenus.includes(value as ActiveMenu);
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function toAssetUrl(path?: string | null) {
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/books') || path.startsWith('/images')) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID');
}

function BookCover({ book, className }: { book: ExtendedBook; className: string }) {
  return (
    <img
      src={book.image || FALLBACK_COVER}
      alt={`Cover ${book.title}`}
      className={className}
      onError={(event) => {
        event.currentTarget.src = FALLBACK_COVER;
      }}
    />
  );
}

export default function MemberDashboardPage() {
  const { user, logout } = useAuthStore();

  const [mounted, setMounted] = useState(false);
  const [localDataReady, setLocalDataReady] = useState(false);
  const [displayUser, setDisplayUser] = useState<any>(null);
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [backendBooks, setBackendBooks] = useState<Book[]>([]);
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [errorData, setErrorData] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [selectedBook, setSelectedBook] = useState<ExtendedBook | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [history, setHistory] = useState<ExtendedBook[]>([]);
  const [activeMenu, setActiveMenu] = useState<ActiveMenu>('dashboard');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'title' | 'rating' | 'pages'>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [reviews, setReviews] = useState<Review[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewingBookId, setReviewingBookId] = useState<number | null>(null);

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({
    fullName: '',
    email: '',
    avatar: null as File | null,
  });

  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    author: '',
    isbn: '',
    synopsis: '',
    categoryId: '1',
  });
  const [uploadCover, setUploadCover] = useState<File | null>(null);
  const [uploadPdf, setUploadPdf] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const itemsPerPage = 9;

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem(STORAGE_KEYS.theme) as ThemeMode | null;
    if (savedTheme === 'dark' || savedTheme === 'light') setTheme(savedTheme);
    const savedMenu = localStorage.getItem(STORAGE_KEYS.activeMenu);
    if (isActiveMenu(savedMenu)) setActiveMenu(savedMenu);
    setFavorites(readJson<number[]>(STORAGE_KEYS.favorites, []));
    setHistory(readJson<ExtendedBook[]>(STORAGE_KEYS.history, []));
    setReviews(readJson<Review[]>(STORAGE_KEYS.reviews, []));
    setLocalDataReady(true);
  }, []);

  useEffect(() => {
    if (user) {
      setDisplayUser(user);
      return;
    }
    try {
      const storage = localStorage.getItem('auth-storage');
      if (storage) {
        const parsed = JSON.parse(storage);
        setDisplayUser(parsed?.state?.user || null);
      }
    } catch {
      setDisplayUser(null);
    }
  }, [user]);

  useEffect(() => {
    if (!localDataReady) return;
    localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(favorites));
  }, [favorites, localDataReady]);

  useEffect(() => {
    if (!localDataReady) return;
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history));
  }, [history, localDataReady]);

  useEffect(() => {
    if (!localDataReady) return;
    localStorage.setItem(STORAGE_KEYS.reviews, JSON.stringify(reviews));
  }, [reviews, localDataReady]);

  useEffect(() => {
    if (!localDataReady) return;
    localStorage.setItem(STORAGE_KEYS.activeMenu, activeMenu);
  }, [activeMenu, localDataReady]);

  const allBooks = useMemo(() => {
    const merged: ExtendedBook[] = backendBooks.map((book) => ({
      ...book,
      image: toAssetUrl(book.cover),
      pdf: toAssetUrl(book.pdfFile),
      rating: book.rating ?? 0,
      totalReviews: book.totalReviews ?? 0,
      categoryString: book.category?.name || book.categoryString || 'Lainnya',
    }));
    defaultBooks.forEach((book) => {
      if (!merged.some((item) => item.id === book.id)) merged.push(book);
    });
    return merged;
  }, [backendBooks]);

  const reviewSummary = useMemo(() => {
    return reviews.reduce<Record<number, { count: number; total: number }>>((acc, review) => {
      const current = acc[review.bookId] || { count: 0, total: 0 };
      acc[review.bookId] = {
        count: current.count + 1,
        total: current.total + review.rating,
      };
      return acc;
    }, {});
  }, [reviews]);

  const getBookRating = useCallback(
    (book: ExtendedBook) => {
      const localSummary = reviewSummary[book.id];
      if (localSummary?.count) return localSummary.total / localSummary.count;
      return book.rating || 4.5;
    },
    [reviewSummary]
  );

  const getBookReviewCount = useCallback(
    (book: ExtendedBook) => (book.totalReviews || 0) + (reviewSummary[book.id]?.count || 0),
    [reviewSummary]
  );

  const filteredBooks = useMemo(() => {
    const query = search.trim().toLowerCase();
    const sorted = allBooks.filter((book) => {
      const category = book.categoryString || book.category?.name || 'Lainnya';
      const matchQuery =
        !query ||
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        category.toLowerCase().includes(query);
      const matchCategory = filterCategory === 'all' || category === filterCategory;
      return matchQuery && matchCategory;
    });
    sorted.sort((a, b) => {
      const direction = sortOrder === 'asc' ? 1 : -1;
      if (sortBy === 'title') return a.title.localeCompare(b.title) * direction;
      if (sortBy === 'rating') return (getBookRating(a) - getBookRating(b)) * direction;
      return ((a.pages || 0) - (b.pages || 0)) * direction;
    });
    return sorted;
  }, [allBooks, filterCategory, getBookRating, search, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredBooks.length / itemsPerPage));
  const paginatedBooks = useMemo(
    () => filteredBooks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [currentPage, filteredBooks]
  );

  const activeBorrowings = useMemo(() => borrowings.filter((item) => item.status === 'active'), [borrowings]);
  const favoriteBooks = useMemo(() => allBooks.filter((book) => favorites.includes(book.id)), [allBooks, favorites]);
  const personalReviews = useMemo(
    () => reviews.filter((review) => review.userId === (displayUser?.id || 0)),
    [displayUser?.id, reviews]
  );

  const categoryCounts = useMemo(() => {
    return allBooks.reduce<Record<string, number>>((acc, book) => {
      const category = book.categoryString || book.category?.name || 'Lainnya';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
  }, [allBooks]);

  const categoryOptions = useMemo(() => {
    const names = new Set<string>();
    categories.forEach((category) => names.add(category.name));
    allBooks.forEach((book) => names.add(book.categoryString || book.category?.name || 'Lainnya'));
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [allBooks, categories]);

  const uploadCategories = categories.length > 0 ? categories : fallbackCategories;
  const unreadNotificationCount = notifications.filter((notification) => !notification.read).length;

  const sidebarItems = useMemo<SidebarItem[]>(
    () => [
      { id: 'dashboard', icon: Library, label: 'Dashboard', badge: allBooks.length },
      { id: 'favorites', icon: Bookmark, label: 'Favorit', badge: favorites.length },
      { id: 'history', icon: Clock3, label: 'Riwayat', badge: history.length },
      { id: 'borrowings', icon: Calendar, label: 'Peminjaman', badge: activeBorrowings.length },
      { id: 'categories', icon: Layers, label: 'Kategori', badge: Object.keys(categoryCounts).length },
      { id: 'profile', icon: User, label: 'Profil' },
    ],
    [activeBorrowings.length, allBooks.length, categoryCounts, favorites.length, history.length]
  );

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const fetchData = useCallback(async () => {
    if (!displayUser) {
      setLoadingData(false);
      return;
    }
    setLoadingData(true);
    setErrorData(null);
    try {
      const [booksRes, borrowRes, catRes] = await Promise.all([
        bookService.getAll({ limit: 100 }),
        borrowingService.getHistory({}),
        categoryService.getAll(),
      ]);
      const books = booksRes.data.books || [];
      const borrowingList = borrowRes.data.borrowings || [];
      setBackendBooks(books);
      setBorrowings(borrowingList);
      setCategories(catRes.data || []);
      const activeList = borrowingList.filter((item: Borrowing) => item.status === 'active');
      const overdueList = activeList.filter((item: Borrowing) => new Date(item.dueDate) < new Date());
      const nextNotifications: Notification[] = [];
      if (overdueList.length > 0) {
        nextNotifications.push({
          id: 'overdue',
          type: 'error',
          title: 'Buku Terlambat',
          message: `${overdueList.length} buku sudah melewati jatuh tempo.`,
          time: new Date().toISOString(),
          read: false,
        });
      }
      if (activeList.length > 0) {
        nextNotifications.push({
          id: 'active',
          type: 'warning',
          title: 'Peminjaman Aktif',
          message: `${activeList.length} buku sedang dipinjam.`,
          time: new Date().toISOString(),
          read: false,
        });
      }
      if (books.length > 0) {
        nextNotifications.push({
          id: 'newbooks',
          type: 'info',
          title: 'Koleksi Tersedia',
          message: `${books.length} buku dari server berhasil dimuat.`,
          time: new Date().toISOString(),
          read: false,
        });
      }
      setNotifications(nextNotifications);
    } catch {
      setBackendBooks([]);
      setBorrowings([]);
      setCategories([]);
      setErrorData('Gagal memuat data dari server. Koleksi lokal tetap bisa digunakan.');
    } finally {
      setLoadingData(false);
    }
  }, [displayUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleTheme = () => {
    const nextTheme: ThemeMode = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem(STORAGE_KEYS.theme, nextTheme);
  };

  const handleMenuClick = (menu: ActiveMenu) => {
    setActiveMenu(menu);
    setMobileMenuOpen(false);
    setShowNotifications(false);
  };

  const handleLogout = () => {
    logout();
    localStorage.removeItem('token');
    localStorage.removeItem('auth-storage');
    window.location.href = '/login';
  };

  const handleOpenBook = (book: ExtendedBook) => {
    setSelectedBook(book);
    setHistory((prev) => {
      const withoutDuplicate = prev.filter((item) => item.id !== book.id);
      return [book, ...withoutDuplicate].slice(0, 50);
    });
  };

  const toggleFavorite = (bookId: number) => {
    const isFavorite = favorites.includes(bookId);
    setFavorites((prev) => (isFavorite ? prev.filter((id) => id !== bookId) : [...prev, bookId]));
    toast.success(isFavorite ? 'Buku dihapus dari favorit' : 'Buku ditambahkan ke favorit');
  };

  const openReviewModal = (bookId: number) => {
    setReviewingBookId(bookId);
    setReviewForm({ rating: 5, comment: '' });
    setShowReviewModal(true);
  };

  const handleDownloadPdf = (book: ExtendedBook) => {
    if (!book.pdf) {
      toast.error('PDF tidak tersedia');
      return;
    }
    const link = document.createElement('a');
    link.href = book.pdf;
    link.download = `${book.title}.pdf`;
    link.click();
  };

  const handleReturnBook = async (borrowId: number) => {
    try {
      await borrowingService.returnBook(borrowId);
      toast.success('Buku dikembalikan');
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal mengembalikan buku');
    }
  };

  const handleMarkNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
  };

  const handleClearNotifications = () => setNotifications([]);

  const handleCategoryClick = (category: string) => {
    setFilterCategory(category);
    setSearch('');
    setCurrentPage(1);
    handleMenuClick('dashboard');
  };

  const handleUploadSubmit = async () => {
    if (!uploadForm.title.trim() || !uploadForm.author.trim()) {
      toast.error('Judul dan penulis wajib diisi');
      return;
    }
    const formData = new FormData();
    formData.append('title', uploadForm.title.trim());
    formData.append('author', uploadForm.author.trim());
    formData.append('publisher', 'Self Publishing');
    formData.append('year', new Date().getFullYear().toString());
    formData.append('synopsis', uploadForm.synopsis.trim() || '-');
    formData.append('categoryId', uploadForm.categoryId || uploadCategories[0]?.id.toString() || '1');
    formData.append('stock', '5');
    if (uploadForm.isbn.trim()) formData.append('isbn', uploadForm.isbn.trim());
    if (uploadCover) formData.append('cover', uploadCover);
    if (uploadPdf) formData.append('pdfFile', uploadPdf);
    setUploading(true);
    try {
      await bookService.create(formData);
      toast.success('Buku berhasil diupload');
      setShowUploadModal(false);
      setUploadForm({ title: '', author: '', isbn: '', synopsis: '', categoryId: '1' });
      setUploadCover(null);
      setUploadPdf(null);
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Upload gagal');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitReview = () => {
    if (!reviewingBookId || !reviewForm.comment.trim()) {
      toast.error('Komentar tidak boleh kosong');
      return;
    }
    const newReview: Review = {
      id: Date.now(),
      userId: displayUser?.id || 0,
      userName: displayUser?.fullName || displayUser?.name || 'Anonymous',
      bookId: reviewingBookId,
      rating: reviewForm.rating,
      comment: reviewForm.comment.trim(),
      createdAt: new Date().toISOString(),
    };
    setReviews((prev) => [newReview, ...prev]);
    toast.success('Review ditambahkan');
    setShowReviewModal(false);
    setReviewForm({ rating: 5, comment: '' });
    setReviewingBookId(null);
  };

  const getAuthToken = () => {
    const directToken = localStorage.getItem('token');
    if (directToken) return directToken;
    try {
      const storage = localStorage.getItem('auth-storage');
      return storage ? JSON.parse(storage)?.state?.token : null;
    } catch {
      return null;
    }
  };

  const handleEditProfile = async () => {
    try {
      const formData = new FormData();
      formData.append('fullName', editProfileForm.fullName);
      formData.append('email', editProfileForm.email);
      if (editProfileForm.avatar) formData.append('avatar', editProfileForm.avatar);
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        body: formData,
        headers: { Authorization: `Bearer ${getAuthToken() || ''}` },
      });
      if (!response.ok) throw new Error('Gagal memperbarui profil');
      const data = await response.json();
      setDisplayUser(data.data || { ...displayUser, ...editProfileForm, avatar: displayUser?.avatar });
      toast.success('Profil diperbarui');
    } catch {
      setDisplayUser({ ...displayUser, fullName: editProfileForm.fullName, email: editProfileForm.email });
      toast.success('Profil diperbarui secara lokal');
    } finally {
      setShowEditProfile(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedBook(null);
        setShowUploadModal(false);
        setShowReviewModal(false);
        setShowEditProfile(false);
        setShowNotifications(false);
      }
      if (event.ctrlKey && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        const input = document.querySelector('input[placeholder^="Cari buku"]') as HTMLInputElement | null;
        input?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const renderStars = (rating: number, size = 16) => (
    <div className="flex gap-1 text-yellow-400">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} size={size} fill={star <= Math.round(rating) ? 'currentColor' : 'none'} />
      ))}
    </div>
  );

  const renderEmptyState = (
    Icon: LucideIcon,
    title: string,
    description: string,
    actionLabel?: string,
    onAction?: () => void
  ) => (
    <div className="glass rounded-3xl p-10 md:p-12 text-center text-gray-400">
      <Icon size={48} className="mx-auto mb-4 opacity-60" />
      <p className="text-xl font-semibold text-gray-200">{title}</p>
      <p className="mt-2 text-sm">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="btn-animate mt-6 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );

  const renderBookCard = (book: ExtendedBook) => {
    const rating = getBookRating(book);
    const isFavorite = favorites.includes(book.id);

    return (
      <div key={book.id} className="glass gradient-border rounded-3xl overflow-hidden card-hover fade-up">
        <div className="relative overflow-hidden">
          <BookCover book={book} className="h-72 w-full object-cover transition-transform duration-500 hover:scale-110" />
          <div className="absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1 text-sm text-white">
            {rating.toFixed(1)}
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity hover:opacity-100">
            <button
              type="button"
              onClick={() => handleOpenBook(book)}
              className="rounded-full bg-white/90 px-6 py-3 font-semibold text-gray-900 transition hover:scale-105"
            >
              Baca Sekarang
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="mb-3">
            <p className="text-xs uppercase tracking-wide text-blue-300">{book.categoryString || book.category?.name}</p>
            <h2 className="mt-1 line-clamp-2 min-h-[64px] text-2xl font-black">{book.title}</h2>
            <p className="mt-2 text-gray-400">{book.author}</p>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-400">
            {renderStars(rating)}
            <span>{getBookReviewCount(book)} review</span>
          </div>
          <div className="mt-6 grid grid-cols-[1fr_auto_auto] gap-3">
            <button
              type="button"
              onClick={() => handleOpenBook(book)}
              className="btn-animate flex items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700"
            >
              <BookOpen size={18} />
              Baca
            </button>
            <button
              type="button"
              onClick={() => handleDownloadPdf(book)}
              aria-label="Download PDF"
              className="btn-animate rounded-2xl bg-green-600 px-4 text-white hover:bg-green-700"
            >
              <Download size={20} />
            </button>
            <button
              type="button"
              onClick={() => toggleFavorite(book.id)}
              aria-label={isFavorite ? 'Hapus dari favorit' : 'Tambah ke favorit'}
              className={`btn-animate rounded-2xl px-4 text-white ${isFavorite ? 'bg-red-600' : 'bg-gray-700'}`}
            >
              <Heart fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
            <button
              type="button"
              onClick={() => openReviewModal(book.id)}
              aria-label="Beri review"
              className="btn-animate rounded-2xl bg-purple-600 px-4 text-white hover:bg-purple-700"
            >
              <MessageSquare size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderDashboard = () => {
    const stats = [
      { label: 'Buku Dibaca', value: history.length, icon: BookOpen, color: 'text-blue-400', menu: 'history' as ActiveMenu },
      { label: 'Favorit', value: favorites.length, icon: Heart, color: 'text-red-400', menu: 'favorites' as ActiveMenu },
      { label: 'Dipinjam', value: activeBorrowings.length, icon: Calendar, color: 'text-green-400', menu: 'borrowings' as ActiveMenu },
      { label: 'Review', value: reviews.length, icon: Award, color: 'text-yellow-400', menu: 'profile' as ActiveMenu },
    ];

    return (
      <>
        <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <button
                key={stat.label}
                type="button"
                onClick={() => handleMenuClick(stat.menu)}
                className="glass card-hover shimmer rounded-3xl p-6 text-left"
              >
                <Icon size={40} className={`${stat.color} float`} />
                <h2 className="mt-6 text-4xl font-black">{stat.value}</h2>
                <p className="mt-2 text-gray-400">{stat.label}</p>
              </button>
            );
          })}
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <select
              value={filterCategory}
              onChange={(event) => {
                setFilterCategory(event.target.value);
                setCurrentPage(1);
              }}
              className="rounded-xl border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-white outline-none"
            >
              <option value="all">Semua Kategori</option>
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal size={18} className="text-gray-400" />
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as 'title' | 'rating' | 'pages')}
              className="rounded-xl border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-white outline-none"
            >
              <option value="title">Judul</option>
              <option value="rating">Rating</option>
              <option value="pages">Halaman</option>
            </select>
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="btn-animate rounded-xl border border-gray-700 bg-gray-800 p-2 text-white"
              aria-label="Ubah urutan"
            >
              {sortOrder === 'asc' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`btn-animate rounded-xl p-2 text-white ${viewMode === 'grid' ? 'bg-blue-600' : 'bg-gray-800'}`}
              aria-label="Tampilan grid"
            >
              <Grid size={18} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`btn-animate rounded-xl p-2 text-white ${viewMode === 'list' ? 'bg-blue-600' : 'bg-gray-800'}`}
              aria-label="Tampilan list"
            >
              <List size={18} />
            </button>
          </div>

          <span className="ml-auto text-sm text-gray-400">{filteredBooks.length} buku ditemukan</span>
        </div>

        {loadingData ? (
          <LoadingSkeleton />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
            {paginatedBooks.map((book) => renderBookCard(book))}
            {paginatedBooks.length === 0 &&
              renderEmptyState(Search, 'Buku tidak ditemukan', 'Coba kata kunci atau kategori yang berbeda.', 'Reset Filter', () => {
                setSearch('');
                setFilterCategory('all');
              })}
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedBooks.map((book) => {
              const rating = getBookRating(book);
              const isFavorite = favorites.includes(book.id);
              return (
                <div key={book.id} className="glass gradient-border card-hover flex flex-col gap-4 rounded-2xl p-4 md:flex-row md:items-center">
                  <BookCover book={book} className="h-32 w-24 rounded-xl object-cover md:h-28 md:w-20" />
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-wide text-blue-300">{book.categoryString || book.category?.name}</p>
                    <h2 className="text-xl font-black">{book.title}</h2>
                    <p className="text-gray-400">{book.author}</p>
                    <div className="mt-2 flex items-center gap-3">
                      {renderStars(rating, 14)}
                      <span className="text-sm text-gray-400">{rating.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenBook(book)}
                      className="btn-animate rounded-xl bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
                    >
                      Baca
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadPdf(book)}
                      className="btn-animate rounded-xl bg-green-600 px-5 py-3 text-white hover:bg-green-700"
                    >
                      Download PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleFavorite(book.id)}
                      className={`btn-animate rounded-xl px-4 text-white ${isFavorite ? 'bg-red-600' : 'bg-gray-700'}`}
                      aria-label={isFavorite ? 'Hapus dari favorit' : 'Tambah ke favorit'}
                    >
                      <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                </div>
              );
            })}
            {paginatedBooks.length === 0 &&
              renderEmptyState(Search, 'Buku tidak ditemukan', 'Coba kata kunci atau kategori yang berbeda.', 'Reset Filter', () => {
                setSearch('');
                setFilterCategory('all');
              })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="glass btn-animate rounded-xl px-4 py-2 disabled:opacity-50"
              aria-label="Halaman sebelumnya"
            >
              <ChevronLeft size={20} />
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`btn-animate rounded-xl px-4 py-2 ${currentPage === page ? 'bg-blue-600 text-white' : 'glass'}`}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="glass btn-animate rounded-xl px-4 py-2 disabled:opacity-50"
              aria-label="Halaman berikutnya"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </>
    );
  };

  const renderFavorites = () => (
    <div className="fade-up">
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-black">Buku Favorit</h2>
          <p className="mt-2 text-gray-400">Buku yang kamu tandai akan tersimpan di halaman ini.</p>
        </div>
        {favoriteBooks.length > 0 && (
          <button
            type="button"
            onClick={() => setFavorites([])}
            className="btn-animate rounded-xl bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
          >
            Kosongkan Favorit
          </button>
        )}
      </div>
      {favoriteBooks.length === 0 ? (
        renderEmptyState(Heart, 'Belum ada buku favorit', 'Klik tombol hati pada kartu buku untuk menyimpannya di sini.', 'Cari Buku', () =>
          handleMenuClick('dashboard')
        )
      ) : (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">{favoriteBooks.map((book) => renderBookCard(book))}</div>
      )}
    </div>
  );

  const renderHistory = () => (
    <div className="fade-up">
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-black">Riwayat Baca</h2>
          <p className="mt-2 text-gray-400">Buku yang pernah dibuka akan muncul otomatis di sini.</p>
        </div>
        {history.length > 0 && (
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = 'riwayat-baca.json';
                link.click();
                URL.revokeObjectURL(link.href);
              }}
              className="glass btn-animate flex items-center gap-2 rounded-xl px-4 py-2"
            >
              <Download size={18} />
              Export
            </button>
            <button
              type="button"
              onClick={() => setHistory([])}
              className="btn-animate rounded-xl bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            >
              Hapus Riwayat
            </button>
          </div>
        )}
      </div>
      {history.length === 0 ? (
        renderEmptyState(Clock3, 'Belum ada riwayat', 'Buka salah satu buku untuk mulai mengisi riwayat baca.', 'Mulai Baca', () =>
          handleMenuClick('dashboard')
        )
      ) : (
        <div className="space-y-4">
          {history.map((book) => (
            <div key={book.id} className="glass card-hover flex flex-col gap-4 rounded-2xl p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <BookCover book={book} className="h-20 w-16 rounded-lg object-cover" />
                <div>
                  <h3 className="text-lg font-bold">{book.title}</h3>
                  <p className="text-sm text-gray-400">{book.author}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenBook(book)}
                  className="btn-animate rounded-xl bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
                >
                  Buka Lagi
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadPdf(book)}
                  className="btn-animate rounded-xl bg-green-600 px-6 py-2 text-white hover:bg-green-700"
                >
                  Download PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderProfile = () => (
    <div className="fade-up space-y-8">
      <div className="glass rounded-3xl p-8">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-3xl font-black">Profil Saya</h2>
          <button
            type="button"
            onClick={() => {
              setEditProfileForm({
                fullName: displayUser?.fullName || displayUser?.name || '',
                email: displayUser?.email || '',
                avatar: null,
              });
              setShowEditProfile(true);
            }}
            className="glass btn-animate flex items-center justify-center gap-2 rounded-xl px-4 py-2"
          >
            <Edit3 size={18} />
            Edit Profil
          </button>
        </div>
        <div className="mb-10 flex flex-col gap-6 md:flex-row">
          <div className="pulse-ring flex h-32 w-32 flex-shrink-0 items-center justify-center rounded-full bg-gray-700">
            {displayUser?.avatar ? (
              <img src={toAssetUrl(displayUser.avatar)} alt="Avatar pengguna" className="h-32 w-32 rounded-full object-cover" />
            ) : (
              <User size={48} className="text-white" />
            )}
          </div>
          <div className="flex-1 space-y-4">
            <div className="rounded-xl bg-gray-800/50 p-4">
              <p className="text-sm text-gray-400">Nama Lengkap</p>
              <p className="text-xl font-medium">{displayUser?.fullName || displayUser?.name || '-'}</p>
            </div>
            <div className="rounded-xl bg-gray-800/50 p-4">
              <p className="text-sm text-gray-400">Email</p>
              <p className="break-all text-xl font-medium">{displayUser?.email || '-'}</p>
            </div>
            <div className="rounded-xl bg-gray-800/50 p-4">
              <p className="text-sm text-gray-400">Role</p>
              <p className="text-xl font-medium capitalize">{displayUser?.role || 'Member'}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="glass rounded-3xl p-8">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
            <BarChart2 className="h-5 w-5 text-blue-400" />
            Statistik Pribadi
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              ['Buku Dibaca', history.length],
              ['Favorit', favorites.length],
              ['Dipinjam', activeBorrowings.length],
              ['Review', personalReviews.length],
              ['Total Peminjaman', borrowings.length],
              ['Poin', history.length * 10 + favorites.length * 5],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-sm text-gray-400">{label}</p>
                <p className="text-2xl font-bold">{value}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="glass rounded-3xl p-8">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
            <MessageSquare className="h-5 w-5 text-purple-400" />
            Review Saya
          </h3>
          {personalReviews.length === 0 ? (
            <p className="text-gray-400">Belum ada review.</p>
          ) : (
            <div className="max-h-72 space-y-3 overflow-y-auto">
              {personalReviews.map((review) => (
                <div key={review.id} className="rounded-xl bg-gray-800/50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{allBooks.find((book) => book.id === review.bookId)?.title || 'Buku'}</p>
                    {renderStars(review.rating, 12)}
                  </div>
                  <p className="mt-1 text-sm text-gray-400">{review.comment}</p>
                  <p className="mt-2 text-xs text-gray-500">{formatDate(review.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderBorrowings = () => (
    <div className="fade-up">
      <h2 className="mb-8 text-3xl font-black">Peminjaman Saya</h2>
      {borrowings.length === 0 ? (
        renderEmptyState(Calendar, 'Belum ada peminjaman', 'Klik tombol Pinjam Buku pada koleksi untuk menambahkan peminjaman.', 'Cari Buku', () =>
          handleMenuClick('dashboard')
        )
      ) : (
        <div className="space-y-4">
          {borrowings.map((borrow) => {
            const isActive = borrow.status === 'active';
            const dueDate = new Date(borrow.dueDate);
            const overdue = isActive && dueDate < new Date();
            const borrowedBook: ExtendedBook = {
              ...borrow.book,
              image: toAssetUrl(borrow.book?.cover),
              pdf: toAssetUrl(borrow.book?.pdfFile),
              rating: borrow.book?.rating || 0,
              totalReviews: borrow.book?.totalReviews || 0,
              categoryString: borrow.book?.category?.name || 'Lainnya',
            };

            return (
              <div key={borrow.id} className="glass card-hover flex flex-col justify-between gap-4 rounded-2xl p-4 md:flex-row md:items-center">
                <div className="flex items-center gap-4">
                  <BookCover book={borrowedBook} className="h-20 w-14 rounded-lg object-cover" />
                  <div>
                    <h3 className="text-lg font-bold">{borrow.book?.title || 'Buku'}</h3>
                    <p className="text-sm text-gray-400">Pinjam: {formatDate(borrow.borrowDate)}</p>
                    <p className="text-sm text-gray-400">
                      Jatuh tempo: {formatDate(borrow.dueDate)}
                      {overdue && <span className="ml-2 text-red-400">(Terlambat)</span>}
                    </p>
                    {borrow.returnDate && <p className="text-sm text-green-400">Dikembalikan: {formatDate(borrow.returnDate)}</p>}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium ${
                      isActive
                        ? overdue
                          ? 'bg-red-600/20 text-red-400'
                          : 'bg-yellow-600/20 text-yellow-400'
                        : 'bg-green-600/20 text-green-400'
                    }`}
                  >
                    {isActive ? (overdue ? 'Terlambat' : 'Aktif') : 'Dikembalikan'}
                  </span>
                  {isActive && (
                    <button
                      type="button"
                      onClick={() => handleReturnBook(borrow.id)}
                      className="btn-animate rounded-xl bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
                    >
                      Kembalikan
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderCategories = () => (
    <div className="fade-up">
      <h2 className="mb-8 text-3xl font-black">Kategori Buku</h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(categoryCounts).map(([category, count]) => (
          <button
            key={category}
            type="button"
            onClick={() => handleCategoryClick(category)}
            className="glass card-hover cursor-pointer rounded-3xl p-6 text-left"
          >
            <Tag size={32} className="mb-4 text-blue-400" />
            <h3 className="text-xl font-bold">{category}</h3>
            <p className="mt-2 text-gray-400">{count} buku</p>
          </button>
        ))}
      </div>
    </div>
  );

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="glass animate-pulse overflow-hidden rounded-3xl">
          <div className="h-72 bg-gray-800" />
          <div className="space-y-3 p-6">
            <div className="h-6 w-3/4 rounded bg-gray-700" />
            <div className="h-4 w-1/2 rounded bg-gray-700" />
          </div>
        </div>
      ))}
    </div>
  );

  const renderContent = () => {
    switch (activeMenu) {
      case 'favorites':
        return renderFavorites();
      case 'history':
        return renderHistory();
      case 'profile':
        return renderProfile();
      case 'borrowings':
        return renderBorrowings();
      case 'categories':
        return renderCategories();
      case 'dashboard':
      default:
        return renderDashboard();
    }
  };

  const reviewingBook = allBooks.find((book) => book.id === reviewingBookId);

  if (!mounted) return null;

  return (
    <div
      className={`flex min-h-screen overflow-hidden transition-colors duration-300 ${
        theme === 'dark' ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'
      }`}
    >
      {mobileMenuOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileMenuOpen(false)} />}

      <aside
        className={`glass fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r p-6 transition-transform duration-300 lg:static ${
          theme === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="fade-up mb-10">
          <h1 className="text-4xl font-black text-blue-400">DigiLab</h1>
          <p className="mt-2 text-gray-400">Dashboard Member</p>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active = activeMenu === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleMenuClick(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`sidebar-item btn-animate flex w-full items-center justify-between rounded-2xl px-4 py-4 ${
                  active ? 'bg-blue-600 text-white' : theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon size={20} />
                  {item.label}
                </span>
                {!!item.badge && (
                  <span className={`rounded-full px-2 py-0.5 text-xs ${active ? 'bg-white/20 text-white' : 'bg-blue-600 text-white'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={toggleTheme}
          className="glass btn-animate mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-3"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          {theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
        </button>

        <div className={`fade-up mt-4 rounded-3xl border p-5 ${theme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white'}`}>
          <div className="flex items-center gap-4">
            <div className="pulse-ring flex h-14 w-14 items-center justify-center rounded-full bg-gray-700">
              <User size={28} className="text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-lg font-bold">{displayUser?.fullName || displayUser?.name || 'Pengguna'}</h3>
              <p className="truncate text-sm text-gray-400">{displayUser?.email || 'member@digilab.local'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="btn-animate mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 py-3 text-white hover:bg-red-700"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      <main className={`relative flex-1 overflow-auto p-4 md:p-8 ${theme === 'dark' ? '' : 'bg-gray-50'}`}>
        <div className="blur-bg blur-blue left-0 top-0" />
        <div className="blur-bg blur-purple bottom-0 right-0" />

        <div className="fade-up relative z-10 mb-4 flex items-center justify-between lg:hidden">
          <button type="button" onClick={() => setMobileMenuOpen(true)} className="glass rounded-xl p-3" aria-label="Buka menu">
            <Menu size={24} />
          </button>
          <h1 className="text-xl font-black">DigiLab</h1>
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="glass relative rounded-xl p-3"
            aria-label="Buka notifikasi"
          >
            <Bell size={24} />
            {unreadNotificationCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs text-white">
                {unreadNotificationCount}
              </span>
            )}
          </button>
        </div>

        <div className="glass relative z-10 mb-6 flex items-center rounded-2xl border border-gray-700 px-4 py-3 lg:hidden">
          <Search size={20} className="text-gray-400" />
          <input
            type="text"
            placeholder="Cari buku..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setCurrentPage(1);
            }}
            className="ml-3 flex-1 bg-transparent outline-none"
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} className="text-gray-400 hover:text-white" aria-label="Hapus pencarian">
              <X size={18} />
            </button>
          )}
        </div>

        <div className="fade-up relative z-10 mb-10 hidden items-center justify-between gap-6 lg:flex">
          <div>
            <h1 className="text-5xl font-black">Halo, {displayUser?.fullName || displayUser?.name || 'Pengguna'}</h1>
            <p className="mt-3 text-gray-400">Temukan buku favoritmu</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="glass flex w-96 items-center rounded-2xl border border-gray-700 px-5 py-4">
              <Search size={20} className="text-gray-400" />
              <input
                type="text"
                placeholder="Cari buku... (Ctrl+K)"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setCurrentPage(1);
                }}
                className="ml-3 flex-1 bg-transparent outline-none"
              />
              {search && (
                <button type="button" onClick={() => setSearch('')} className="text-gray-400 hover:text-white" aria-label="Hapus pencarian">
                  <X size={18} />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="glass btn-animate relative rounded-2xl p-4"
              aria-label="Buka notifikasi"
            >
              <Bell size={20} />
              {unreadNotificationCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs text-white">
                  {unreadNotificationCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {showNotifications && (
          <div ref={notificationRef} className="glass fade-up relative z-20 mb-8 max-h-96 overflow-y-auto rounded-3xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Notifikasi</h2>
              <button type="button" onClick={handleClearNotifications} className="text-sm text-red-400 hover:text-red-300">
                Hapus Semua
              </button>
            </div>
            {notifications.length === 0 ? (
              <p className="py-4 text-center text-gray-400">Tidak ada notifikasi</p>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => {
                  const Icon =
                    notification.type === 'error'
                      ? AlertCircle
                      : notification.type === 'warning'
                        ? AlertTriangle
                        : notification.type === 'info'
                          ? Info
                          : CheckCircle;
                  const iconColor =
                    notification.type === 'error'
                      ? 'text-red-400'
                      : notification.type === 'warning'
                        ? 'text-yellow-400'
                        : notification.type === 'info'
                          ? 'text-blue-400'
                          : 'text-green-400';
                  return (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => handleMarkNotificationRead(notification.id)}
                      className={`flex w-full cursor-pointer items-start gap-3 rounded-xl p-4 text-left transition ${
                        notification.read ? 'opacity-50' : 'bg-gray-800/50'
                      }`}
                    >
                      <Icon className={`${iconColor} flex-shrink-0`} />
                      <div>
                        <p className="text-sm font-semibold">{notification.title}</p>
                        <p className="mt-1 text-xs text-gray-400">{notification.message}</p>
                        <p className="mt-2 text-xs text-gray-500">{new Date(notification.time).toLocaleTimeString('id-ID')}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {!loadingData && errorData && (
          <div className="glass fade-up relative z-10 mb-6 flex items-center gap-2 rounded-2xl p-4 text-yellow-400">
            <AlertCircle />
            {errorData}
          </div>
        )}

        <div className="relative z-10">{renderContent()}</div>
      </main>

      {showUploadModal && (
        <div className="modal-animation fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setShowUploadModal(false)}>
          <div
            className="glass relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-gray-700 p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" onClick={() => setShowUploadModal(false)} className="absolute right-4 top-4 text-gray-400 hover:text-white">
              <X size={24} />
            </button>
            <h2 className="mb-8 text-3xl font-black">Upload Buku Baru</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-gray-400">Judul</label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(event) => setUploadForm((prev) => ({ ...prev, title: event.target.value }))}
                  className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-gray-400">Penulis</label>
                <input
                  type="text"
                  value={uploadForm.author}
                  onChange={(event) => setUploadForm((prev) => ({ ...prev, author: event.target.value }))}
                  className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-gray-400">ISBN (opsional)</label>
                <input
                  type="text"
                  value={uploadForm.isbn}
                  onChange={(event) => setUploadForm((prev) => ({ ...prev, isbn: event.target.value }))}
                  className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-gray-400">Kategori</label>
                <select
                  value={uploadForm.categoryId}
                  onChange={(event) => setUploadForm((prev) => ({ ...prev, categoryId: event.target.value }))}
                  className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none"
                >
                  {uploadCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm text-gray-400">Sinopsis</label>
                <textarea
                  value={uploadForm.synopsis}
                  onChange={(event) => setUploadForm((prev) => ({ ...prev, synopsis: event.target.value }))}
                  rows={3}
                  className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-gray-400">Cover (opsional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setUploadCover(event.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-400 file:mr-4 file:rounded-xl file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-white"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-gray-400">File PDF</label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(event) => setUploadPdf(event.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-400 file:mr-4 file:rounded-xl file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-white"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleUploadSubmit}
              disabled={uploading}
              className="btn-animate mt-8 w-full rounded-2xl bg-blue-600 py-4 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {uploading ? 'Mengupload...' : 'Upload Buku'}
            </button>
          </div>
        </div>
      )}

      {showEditProfile && (
        <div className="modal-animation fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setShowEditProfile(false)}>
          <div className="glass relative w-full max-w-lg rounded-3xl border border-gray-700 p-8" onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => setShowEditProfile(false)} className="absolute right-4 top-4 text-gray-400 hover:text-white">
              <X size={24} />
            </button>
            <h2 className="mb-8 text-3xl font-black">Edit Profil</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-gray-400">Nama Lengkap</label>
                <input
                  type="text"
                  value={editProfileForm.fullName}
                  onChange={(event) => setEditProfileForm((prev) => ({ ...prev, fullName: event.target.value }))}
                  className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-gray-400">Email</label>
                <input
                  type="email"
                  value={editProfileForm.email}
                  onChange={(event) => setEditProfileForm((prev) => ({ ...prev, email: event.target.value }))}
                  className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-gray-400">Avatar (opsional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setEditProfileForm((prev) => ({ ...prev, avatar: event.target.files?.[0] || null }))}
                  className="w-full text-sm text-gray-400 file:mr-4 file:rounded-xl file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-white"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleEditProfile}
              className="btn-animate mt-8 w-full rounded-2xl bg-blue-600 py-4 font-semibold text-white hover:bg-blue-700"
            >
              Simpan Perubahan
            </button>
          </div>
        </div>
      )}

      {showReviewModal && (
        <div className="modal-animation fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setShowReviewModal(false)}>
          <div className="glass relative w-full max-w-lg rounded-3xl border border-gray-700 p-8" onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => setShowReviewModal(false)} className="absolute right-4 top-4 text-gray-400 hover:text-white">
              <X size={24} />
            </button>
            <h2 className="text-3xl font-black">Beri Review</h2>
            {reviewingBook && <p className="mt-2 text-gray-400">{reviewingBook.title}</p>}
            <div className="mt-8 space-y-4">
              <div>
                <label className="mb-2 block text-sm text-gray-400">Rating</label>
                <div className="flex gap-2 text-yellow-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm((prev) => ({ ...prev, rating: star }))}
                      className="text-2xl"
                      aria-label={`Rating ${star}`}
                    >
                      <Star size={32} fill={star <= reviewForm.rating ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm text-gray-400">Komentar</label>
                <textarea
                  value={reviewForm.comment}
                  onChange={(event) => setReviewForm((prev) => ({ ...prev, comment: event.target.value }))}
                  rows={4}
                  className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none"
                  placeholder="Tulis komentar..."
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleSubmitReview}
              className="btn-animate mt-8 w-full rounded-2xl bg-purple-600 py-4 font-semibold text-white hover:bg-purple-700"
            >
              Kirim Review
            </button>
          </div>
        </div>
      )}

      {selectedBook && (
        <div className="modal-animation fixed inset-0 z-50 flex flex-col bg-black/90">
          <div className="flex min-h-20 flex-col gap-4 border-b border-gray-800 bg-gray-950 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
            <div className="flex min-w-0 items-center gap-4">
              <BookCover book={selectedBook} className="h-14 w-14 flex-shrink-0 rounded-xl object-cover" />
              <div className="min-w-0">
                <h2 className="truncate text-xl font-bold">{selectedBook.title}</h2>
                <p className="text-sm text-gray-400">{selectedBook.author}</p>
                <div className="flex items-center gap-2 text-sm text-yellow-400">
                  <Star size={14} fill="currentColor" />
                  <span>{getBookRating(selectedBook).toFixed(1)}</span>
                  <span className="text-gray-500">({getBookReviewCount(selectedBook)} review)</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {selectedBook.pdf ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleDownloadPdf(selectedBook)}
                    className="btn-animate flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
                  >
                    <Download size={18} />
                    Download PDF
                  </button>
                  <a
                    href={selectedBook.pdf}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-animate flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                  >
                    <ExternalLink size={18} />
                    Tab Baru
                  </a>
                </>
              ) : (
                <span className="rounded-xl bg-gray-800 px-4 py-2 text-sm text-gray-400">PDF belum tersedia</span>
              )}
              <button
                type="button"
                onClick={() => openReviewModal(selectedBook.id)}
                className="btn-animate flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-700"
              >
                <MessageSquare size={18} />
                Review
              </button>
              <button
                type="button"
                onClick={() => setSelectedBook(null)}
                className="btn-animate rounded-xl bg-red-600 p-3 text-white hover:bg-red-700"
                aria-label="Tutup pembaca"
              >
                <X size={22} />
              </button>
            </div>
          </div>
          <div className="flex-1">
            {selectedBook.pdf ? (
              <iframe src={selectedBook.pdf} title={selectedBook.title} className="h-full w-full" />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">File PDF belum tersedia.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}