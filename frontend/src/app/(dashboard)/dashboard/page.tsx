'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Users,
  Clock3,
  Library,
  Bell,
  Search,
  Settings,
  LogOut,
  Plus,
  BookMarked,
  TrendingUp,
  Trash2,
  X,
  Menu,
  UserPlus,
  Download,
  Shield,
  Edit3,
  Upload,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { bookService } from '@/services/book.service';
import { borrowingService } from '@/services/borrowing.service';
import { categoryService } from '@/services/category.service';
import { Book, Borrowing, Category, User } from '@/types';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

// Tipe data untuk form upload/edit buku
interface BookForm {
  title: string;
  author: string;
  isbn: string;
  publisher: string;
  year: string;
  synopsis: string;
  pages: string;
  stock: string;
  categoryId: string;
}

export default function AdminDashboardPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  // State navigasi
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState('dashboard');

  // Data dari API
  const [books, setBooks] = useState<Book[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalMembers: 0,
    activeBorrowings: 0,
    totalBorrowings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Modal
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [formData, setFormData] = useState<BookForm>({
    title: '',
    author: '',
    isbn: '',
    publisher: '',
    year: '',
    synopsis: '',
    pages: '',
    stock: '1',
    categoryId: '1',
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Ambil semua data dari backend
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [booksRes, borrowRes, catRes, statsRes] = await Promise.all([
        bookService.getAll({ limit: 100 }),
        borrowingService.getHistory({}),
        categoryService.getAll(),
        borrowingService.getStats(),
      ]);
      setBooks(booksRes.data.books);
      setBorrowings(borrowRes.data.borrowings);
      setCategories(catRes.data);
      setStats(statsRes.data);

      // Ambil data member (admin only) – fallback jika endpoint belum ada
      try {
        const res = await fetch('/api/users', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        if (res.ok) {
          const data = await res.json();
          setMembers(data.data || []);
        }
      } catch {
        // tidak apa-apa
      }
    } catch (err: any) {
      setError('Gagal memuat data. Pastikan backend berjalan.');
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/login');
      return;
    }
    fetchAllData();
  }, [user, router, fetchAllData]);

  // Filter buku berdasarkan pencarian
  const filteredBooks = books.filter(
    (book) =>
      book.title.toLowerCase().includes(search.toLowerCase()) ||
      book.author.toLowerCase().includes(search.toLowerCase())
  );

  // Logout
  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Buka modal tambah
  const openAddModal = () => {
    setEditingBook(null);
    setFormData({
      title: '',
      author: '',
      isbn: '',
      publisher: '',
      year: '',
      synopsis: '',
      pages: '',
      stock: '1',
      categoryId: categories[0]?.id.toString() || '1',
    });
    setCoverFile(null);
    setPdfFile(null);
    setShowModal(true);
  };

  // Buka modal edit
  const openEditModal = (book: Book) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      publisher: book.publisher,
      year: book.year.toString(),
      synopsis: book.synopsis,
      pages: book.pages?.toString() || '',
      stock: book.stock.toString(),
      categoryId: book.categoryId.toString(),
    });
    setCoverFile(null);
    setPdfFile(null);
    setShowModal(true);
  };

  // Submit form (create/update)
  const handleSubmitBook = async () => {
    if (!formData.title.trim() || !formData.author.trim()) {
      toast.error('Judul dan penulis wajib diisi');
      return;
    }

    const fd = new FormData();
    fd.append('title', formData.title.trim());
    fd.append('author', formData.author.trim());
    fd.append('isbn', formData.isbn.trim() || '-');
    fd.append('publisher', formData.publisher.trim() || 'Self Publishing');
    fd.append('year', formData.year || new Date().getFullYear().toString());
    fd.append('synopsis', formData.synopsis.trim() || '-');
    if (formData.pages) fd.append('pages', formData.pages);
    fd.append('stock', formData.stock || '1');
    fd.append('categoryId', formData.categoryId || '1');
    if (coverFile) fd.append('cover', coverFile);
    if (pdfFile) fd.append('pdfFile', pdfFile);

    setSubmitting(true);
    try {
      if (editingBook) {
        await bookService.update(editingBook.id, fd);
        toast.success('Buku berhasil diperbarui');
      } else {
        await bookService.create(fd);
        toast.success('Buku berhasil ditambahkan');
      }
      setShowModal(false);
      fetchAllData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan buku');
    } finally {
      setSubmitting(false);
    }
  };

  // Hapus buku
  const handleDeleteBook = async (id: number) => {
    if (!confirm('Yakin ingin menghapus buku ini?')) return;
    try {
      await bookService.delete(id);
      toast.success('Buku dihapus');
      fetchAllData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus buku');
    }
  };

  // Export JSON
  const handleExport = () => {
    const data = JSON.stringify(books, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'books.json';
    a.click();
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      {/* SIDEBAR */}
      {sidebarOpen && (
        <aside className="w-72 bg-gray-900 border-r border-gray-800 p-6 hidden lg:flex flex-col">
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-blue-400">Digital Library</h1>
            <p className="text-gray-400 text-sm mt-1">Admin Dashboard</p>
          </div>

          <nav className="space-y-3 flex-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Library },
              { id: 'books', label: 'Kelola Buku', icon: BookOpen },
              { id: 'members', label: 'Member', icon: Users },
              { id: 'borrowings', label: 'Peminjaman', icon: Clock3 },
              { id: 'categories', label: 'Kategori', icon: BookMarked },
              { id: 'settings', label: 'Pengaturan', icon: Settings },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`w-full flex items-center gap-3 transition rounded-xl px-4 py-3 ${
                  activePage === item.id ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'
                }`}
              >
                <item.icon size={20} />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="bg-gray-800 rounded-2xl p-4 mt-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-xl font-bold">
                {user.fullName?.charAt(0) || 'A'}
              </div>
              <div>
                <h3 className="font-semibold">{user.fullName}</h3>
                <p className="text-gray-400 text-sm">{user.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 transition rounded-xl py-3"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </aside>
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8 overflow-auto">
        {/* TOPBAR */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="bg-gray-800 hover:bg-gray-700 p-3 rounded-xl"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-4xl font-bold">Dashboard Admin</h1>
              <p className="text-gray-400 mt-2">Selamat datang, {user.fullName}</p>
            </div>
          </div>
          <div className="flex items-center bg-gray-900 border border-gray-800 rounded-2xl px-4 py-3 w-full lg:w-96">
            <Search size={20} className="text-gray-500" />
            <input
              type="text"
              placeholder="Cari buku..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent outline-none ml-3 flex-1 text-white"
            />
          </div>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500 rounded-xl p-4 mb-6 text-red-400">
            {error}
            <button onClick={fetchAllData} className="ml-4 underline">Coba lagi</button>
          </div>
        )}

        {/* DASHBOARD PAGE */}
        {!loading && activePage === 'dashboard' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p>Total Buku</p>
                    <h2 className="text-4xl font-bold mt-3">{stats.totalBooks}</h2>
                  </div>
                  <BookOpen size={42} />
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-3xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p>Total Member</p>
                    <h2 className="text-4xl font-bold mt-3">{stats.totalMembers}</h2>
                  </div>
                  <Users size={42} />
                </div>
              </div>
              <div className="bg-gradient-to-br from-orange-600 to-orange-800 rounded-3xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p>Dipinjam</p>
                    <h2 className="text-4xl font-bold mt-3">{stats.activeBorrowings}</h2>
                  </div>
                  <BookMarked size={42} />
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-3xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p>Total Peminjaman</p>
                    <h2 className="text-4xl font-bold mt-3">{stats.totalBorrowings}</h2>
                  </div>
                  <TrendingUp size={42} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button onClick={openAddModal} className="bg-blue-600 hover:bg-blue-700 transition rounded-3xl p-8 text-left">
                <Plus size={40} className="mb-4" />
                <h2 className="text-2xl font-bold">Tambah Buku</h2>
                <p className="text-blue-100 mt-2">Tambahkan koleksi buku baru</p>
              </button>
              <button onClick={() => setActivePage('members')} className="bg-green-600 hover:bg-green-700 transition rounded-3xl p-8 text-left">
                <UserPlus size={40} className="mb-4" />
                <h2 className="text-2xl font-bold">Kelola Member</h2>
                <p className="text-green-100 mt-2">Lihat data semua member</p>
              </button>
              <button onClick={handleExport} className="bg-purple-600 hover:bg-purple-700 transition rounded-3xl p-8 text-left">
                <Download size={40} className="mb-4" />
                <h2 className="text-2xl font-bold">Export Data</h2>
                <p className="text-purple-100 mt-2">Download data buku JSON</p>
              </button>
            </div>
          </>
        )}

        {/* BOOKS PAGE */}
        {!loading && activePage === 'books' && (
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold">Kelola Buku</h2>
              <button onClick={openAddModal} className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-2xl">
                Tambah Buku
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400">
                    <th className="pb-4 text-left">Judul</th>
                    <th className="pb-4 text-left">Penulis</th>
                    <th className="pb-4 text-left">ISBN</th>
                    <th className="pb-4 text-left">Stok</th>
                    <th className="pb-4 text-left">Tersedia</th>
                    <th className="pb-4 text-left">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBooks.map((book) => (
                    <tr key={book.id} className="border-b border-gray-800">
                      <td className="py-4">{book.title}</td>
                      <td className="py-4">{book.author}</td>
                      <td className="py-4">{book.isbn}</td>
                      <td className="py-4">{book.stock}</td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-sm ${book.available > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {book.available}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="flex gap-2">
                          <button onClick={() => openEditModal(book)} className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 p-2 rounded-xl">
                            <Edit3 size={18} />
                          </button>
                          <button onClick={() => handleDeleteBook(book.id)} className="bg-red-500/20 hover:bg-red-500/30 text-red-400 p-2 rounded-xl">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MEMBERS PAGE */}
        {!loading && activePage === 'members' && (
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8">
            <h2 className="text-3xl font-bold mb-8">Data Member</h2>
            <div className="space-y-5">
              {members.length === 0 && <p className="text-gray-400">Belum ada data member.</p>}
              {members.map((member) => (
                <div key={member.id} className="bg-gray-800 rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-xl">{member.fullName}</h3>
                    <p className="text-gray-400">{member.email}</p>
                  </div>
                  <span className="bg-green-500/20 text-green-400 px-4 py-2 rounded-xl">{member.role}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BORROWINGS PAGE */}
        {!loading && activePage === 'borrowings' && (
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8">
            <h2 className="text-3xl font-bold mb-8">Data Peminjaman</h2>
            <div className="space-y-4">
              {borrowings.length === 0 && <p className="text-gray-400">Belum ada peminjaman.</p>}
              {borrowings.map((borrow) => (
                <div key={borrow.id} className="bg-gray-800 rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg">{borrow.book?.title || 'Buku'}</h3>
                    <p className="text-gray-400 text-sm">
                      Oleh: {borrow.user?.fullName || 'User'} | Status: {borrow.status}
                    </p>
                    <p className="text-gray-500 text-xs">
                      Pinjam: {new Date(borrow.borrowDate).toLocaleDateString('id-ID')} | 
                      Jatuh tempo: {new Date(borrow.dueDate).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    borrow.status === 'active' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'
                  }`}>
                    {borrow.status === 'active' ? 'Aktif' : 'Dikembalikan'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CATEGORIES PAGE */}
        {!loading && activePage === 'categories' && (
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8">
            <h2 className="text-3xl font-bold mb-8">Kategori Buku</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((cat) => (
                <div key={cat.id} className="bg-gray-800 rounded-2xl p-5">
                  <h3 className="text-xl font-bold">{cat.name}</h3>
                  <p className="text-gray-400 text-sm mt-1">Slug: {cat.slug}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SETTINGS PAGE */}
        {!loading && activePage === 'settings' && (
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8">
            <h2 className="text-3xl font-bold mb-8">Pengaturan</h2>
            <div className="space-y-5">
              <button className="w-full bg-gray-800 hover:bg-gray-700 transition rounded-2xl p-5 flex items-center gap-4">
                <Shield /> Keamanan Akun
              </button>
              <button className="w-full bg-gray-800 hover:bg-gray-700 transition rounded-2xl p-5 flex items-center gap-4">
                <Settings /> Pengaturan Sistem
              </button>
            </div>
          </div>
        )}
      </main>

      {/* MODAL TAMBAH/EDIT BUKU */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-gray-900 rounded-3xl w-full max-w-2xl p-8 relative max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
              <X size={24} />
            </button>
            <h2 className="text-3xl font-bold mb-8">{editingBook ? 'Edit Buku' : 'Tambah Buku'}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Judul</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-gray-800 border border-gray-700 outline-none text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Penulis</label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-gray-800 border border-gray-700 outline-none text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">ISBN</label>
                <input
                  type="text"
                  value={formData.isbn}
                  onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-gray-800 border border-gray-700 outline-none text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Penerbit</label>
                <input
                  type="text"
                  value={formData.publisher}
                  onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-gray-800 border border-gray-700 outline-none text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Tahun</label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-gray-800 border border-gray-700 outline-none text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Kategori</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-gray-800 border border-gray-700 outline-none text-white"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-gray-400 mb-2">Sinopsis</label>
                <textarea
                  value={formData.synopsis}
                  onChange={(e) => setFormData({ ...formData, synopsis: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-2xl bg-gray-800 border border-gray-700 outline-none text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Halaman</label>
                <input
                  type="number"
                  value={formData.pages}
                  onChange={(e) => setFormData({ ...formData, pages: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-gray-800 border border-gray-700 outline-none text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Stok</label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-gray-800 border border-gray-700 outline-none text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Cover (opsional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-blue-600 file:text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">PDF (opsional)</label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-blue-600 file:text-white"
                />
              </div>
            </div>

            <button
              onClick={handleSubmitBook}
              disabled={submitting}
              className="w-full mt-8 bg-blue-600 hover:bg-blue-700 transition rounded-2xl py-4 font-semibold disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : editingBook ? 'Update Buku' : 'Simpan Buku'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}