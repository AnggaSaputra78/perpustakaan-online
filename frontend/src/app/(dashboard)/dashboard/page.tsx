'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Library,
  Bell,
  Search,
  LogOut,
  Plus,
  BookMarked,
  TrendingUp,
  Trash2,
  X,
  Menu,
  Download,
  Edit3,
  Upload,
  Layers,
  BarChart3,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { bookService } from '@/services/book.service';
import { categoryService } from '@/services/category.service';
import { Book, Category } from '@/types';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

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

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState('dashboard');

  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [stats, setStats] = useState({
    totalBooks: 0,
    totalStock: 0,
    totalAvailable: 0,
    totalCategories: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  // State untuk kategori modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', slug: '' });

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

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [booksRes, catRes] = await Promise.all([
        bookService.getAll({ limit: 100 }),
        categoryService.getAll(),
      ]);

      const bookList = booksRes.data.books || [];
      const catList = catRes.data || [];

      setBooks(bookList);
      setCategories(catList);

      setStats({
        totalBooks: bookList.length,
        totalStock: bookList.reduce((sum, b) => sum + (b.stock || 0), 0),
        totalAvailable: bookList.reduce((sum, b) => sum + (b.available || 0), 0),
        totalCategories: catList.length,
      });
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

  const filteredBooks = books.filter(
    (book) =>
      book.title.toLowerCase().includes(search.toLowerCase()) ||
      book.author.toLowerCase().includes(search.toLowerCase())
  );

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // ---------- BUKU ----------
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
      categoryId: categories[0]?.id?.toString() || '1',
    });
    setCoverFile(null);
    setPdfFile(null);
    setShowModal(true);
  };

  const openEditModal = (book: Book) => {
    setEditingBook(book);
    setFormData({
      title: book.title || '',
      author: book.author || '',
      isbn: book.isbn || '',
      publisher: book.publisher || '',
      year: String(book.year || ''),
      synopsis: book.synopsis || '',
      pages: String(book.pages || ''),
      stock: String(book.stock || 1),
      categoryId: String(book.categoryId || ''),
    });
    setCoverFile(null);
    setPdfFile(null);
    setShowModal(true);
  };

  const handleDeleteBook = async (id: number) => {
    if (!confirm('Yakin ingin menghapus buku ini?')) return;
    try {
      await bookService.delete(id);
      toast.success('Buku berhasil dihapus');
      fetchAllData();
    } catch (error) {
      toast.error('Gagal menghapus buku');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value);
      });
      if (coverFile) data.append('cover', coverFile);
      if (pdfFile) data.append('pdfFile', pdfFile);

      if (editingBook) {
        await bookService.update(editingBook.id, data);
        toast.success('Buku berhasil diperbarui');
      } else {
        await bookService.create(data);
        toast.success('Buku berhasil ditambahkan');
      }

      setShowModal(false);
      fetchAllData();
    } catch (error) {
      toast.error('Gagal menyimpan buku');
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- KATEGORI ----------
  const openCategoryModal = (cat?: Category) => {
    if (cat) {
      setEditingCategory(cat);
      setCategoryForm({ name: cat.name, slug: cat.slug });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: '', slug: '' });
    }
    setShowCategoryModal(true);
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Yakin ingin menghapus kategori ini?')) return;
    try {
      // Asumsikan ada service untuk delete category, jika belum bisa menggunakan fetch langsung
      await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      toast.success('Kategori berhasil dihapus');
      fetchAllData();
    } catch (error) {
      toast.error('Gagal menghapus kategori');
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      toast.error('Nama kategori harus diisi');
      return;
    }
    try {
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories';
      const method = editingCategory ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(categoryForm),
      });
      if (!res.ok) throw new Error();
      toast.success(editingCategory ? 'Kategori diperbarui' : 'Kategori ditambahkan');
      setShowCategoryModal(false);
      fetchAllData();
    } catch {
      toast.error('Gagal menyimpan kategori');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* ---------- SIDEBAR ---------- */}
      <aside
        className={`${sidebarOpen ? 'w-72' : 'w-24'} bg-gray-950 border-r border-gray-800 p-6 transition-all duration-300 flex flex-col`}
      >
        <div className="flex items-center justify-between mb-10">
          <div className={`${!sidebarOpen && 'hidden'}`}>
            <h1 className="text-2xl font-black text-blue-500">LIBRARY</h1>
            <p className="text-gray-400 text-sm">Admin Dashboard</p>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="bg-gray-800 hover:bg-gray-700 transition p-2 rounded-xl"
          >
            <Menu size={20} />
          </button>
        </div>

        <nav className="space-y-3 flex-1">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Library },
            { id: 'books', label: 'Kelola Buku', icon: BookOpen },
            { id: 'categories', label: 'Kategori', icon: Layers },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center gap-3 transition rounded-xl px-4 py-3 ${
                activePage === item.id
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-gray-800 text-gray-300'
              }`}
            >
              <item.icon size={22} />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="space-y-3 mt-10">
          <button className="w-full flex items-center gap-3 bg-gray-800 hover:bg-gray-700 transition rounded-xl px-4 py-3">
            <Bell size={20} />
            {sidebarOpen && <span>Notifikasi</span>}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 bg-red-600 hover:bg-red-700 transition rounded-xl px-4 py-3"
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ---------- MAIN CONTENT ---------- */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
          <div>
            <h1 className="text-4xl font-black">
              Halo, {user?.fullName}
            </h1>
            <p className="text-gray-400 mt-2">
              Kelola perpustakaan digital Anda.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Cari buku..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-gray-900 border border-gray-800 rounded-2xl pl-12 pr-4 py-3 w-72 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {activePage !== 'categories' && (
              <button
                onClick={openAddModal}
                className="bg-blue-600 hover:bg-blue-700 transition px-6 py-3 rounded-2xl flex items-center gap-3 font-semibold"
              >
                <Plus size={20} />
                Tambah Buku
              </button>
            )}
            {activePage === 'categories' && (
              <button
                onClick={() => openCategoryModal()}
                className="bg-blue-600 hover:bg-blue-700 transition px-6 py-3 rounded-2xl flex items-center gap-3 font-semibold"
              >
                <Plus size={20} />
                Tambah Kategori
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-600/20 border border-red-600 text-red-300 rounded-2xl p-4 mb-6">
            {error}
          </div>
        )}

        {/* ===== DASHBOARD ===== */}
        {!loading && activePage === 'dashboard' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
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
                    <p>Total Stok</p>
                    <h2 className="text-4xl font-bold mt-3">{stats.totalStock}</h2>
                  </div>
                  <BarChart3 size={42} />
                </div>
              </div>
              <div className="bg-gradient-to-br from-yellow-600 to-yellow-800 rounded-3xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p>Tersedia</p>
                    <h2 className="text-4xl font-bold mt-3">{stats.totalAvailable}</h2>
                  </div>
                  <BookMarked size={42} />
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-3xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p>Kategori</p>
                    <h2 className="text-4xl font-bold mt-3">{stats.totalCategories}</h2>
                  </div>
                  <TrendingUp size={42} />
                </div>
              </div>
            </div>

            {/* Tabel buku terbaru */}
            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6">
              <h2 className="text-2xl font-bold mb-6">Buku Terbaru</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-400">
                      <th className="pb-4">Judul</th>
                      <th className="pb-4">Penulis</th>
                      <th className="pb-4">Stok</th>
                      <th className="pb-4">Tersedia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {books.slice(0, 5).map((book) => (
                      <tr key={book.id} className="border-b border-gray-800 hover:bg-gray-800/40">
                        <td className="py-4">{book.title}</td>
                        <td>{book.author}</td>
                        <td>{book.stock}</td>
                        <td>{book.available}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ===== KELOLA BUKU ===== */}
        {!loading && activePage === 'books' && (
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold">Kelola Buku</h2>
              <button
                onClick={openAddModal}
                className="bg-blue-600 hover:bg-blue-700 transition px-5 py-3 rounded-2xl flex items-center gap-2"
              >
                <Plus size={18} />
                Tambah Buku
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400">
                    <th className="pb-4">Judul</th>
                    <th className="pb-4">Penulis</th>
                    <th className="pb-4">ISBN</th>
                    <th className="pb-4">Stok</th>
                    <th className="pb-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBooks.map((book) => (
                    <tr
                      key={book.id}
                      className="border-b border-gray-800 hover:bg-gray-800/40 transition"
                    >
                      <td className="py-5">{book.title}</td>
                      <td>{book.author}</td>
                      <td>{book.isbn}</td>
                      <td>{book.stock}</td>
                      <td>
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => openEditModal(book)}
                            className="bg-yellow-500 hover:bg-yellow-600 transition p-3 rounded-xl"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteBook(book.id)}
                            className="bg-red-600 hover:bg-red-700 transition p-3 rounded-xl"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredBooks.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-gray-400">
                        Tidak ada buku ditemukan
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== KATEGORI ===== */}
        {!loading && activePage === 'categories' && (
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8">
            <h2 className="text-3xl font-bold mb-8">Kategori Buku</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="bg-gray-800 rounded-2xl p-5 flex flex-col justify-between"
                >
                  <div>
                    <h3 className="text-xl font-bold">{category.name}</h3>
                    <p className="text-gray-400 mt-2 text-sm">Slug: {category.slug}</p>
                  </div>
                  <div className="flex gap-3 mt-5">
                    <button
                      onClick={() => openCategoryModal(category)}
                      className="flex-1 bg-yellow-500 hover:bg-yellow-600 transition py-2 rounded-xl text-sm font-semibold"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="flex-1 bg-red-600 hover:bg-red-700 transition py-2 rounded-xl text-sm font-semibold"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
              {categories.length === 0 && (
                <div className="col-span-3 text-center py-10 text-gray-400">
                  Tidak ada kategori
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ===== MODAL TAMBAH/EDIT BUKU ===== */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-gray-950 border border-gray-800 rounded-3xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold">
                {editingBook ? 'Edit Buku' : 'Tambah Buku'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-800 hover:bg-gray-700 transition p-3 rounded-xl"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <input
                  type="text"
                  placeholder="Judul Buku"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-gray-900 border border-gray-700 rounded-2xl px-5 py-4"
                  required
                />
                <input
                  type="text"
                  placeholder="Penulis"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  className="bg-gray-900 border border-gray-700 rounded-2xl px-5 py-4"
                  required
                />
                <input
                  type="text"
                  placeholder="ISBN"
                  value={formData.isbn}
                  onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                  className="bg-gray-900 border border-gray-700 rounded-2xl px-5 py-4"
                  required
                />
                <input
                  type="text"
                  placeholder="Penerbit"
                  value={formData.publisher}
                  onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                  className="bg-gray-900 border border-gray-700 rounded-2xl px-5 py-4"
                />
                <input
                  type="number"
                  placeholder="Tahun"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  className="bg-gray-900 border border-gray-700 rounded-2xl px-5 py-4"
                />
                <input
                  type="number"
                  placeholder="Jumlah Halaman"
                  value={formData.pages}
                  onChange={(e) => setFormData({ ...formData, pages: e.target.value })}
                  className="bg-gray-900 border border-gray-700 rounded-2xl px-5 py-4"
                />
                <input
                  type="number"
                  placeholder="Stok"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="bg-gray-900 border border-gray-700 rounded-2xl px-5 py-4"
                />
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="bg-gray-900 border border-gray-700 rounded-2xl px-5 py-4"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <textarea
                placeholder="Sinopsis Buku"
                value={formData.synopsis}
                onChange={(e) => setFormData({ ...formData, synopsis: e.target.value })}
                rows={5}
                className="w-full bg-gray-900 border border-gray-700 rounded-2xl px-5 py-4"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <label className="bg-gray-900 border border-dashed border-gray-700 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer">
                  <Upload className="mb-3" />
                  <span>Upload Cover</span>
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                  />
                </label>

                <label className="bg-gray-900 border border-dashed border-gray-700 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer">
                  <Download className="mb-3" />
                  <span>Upload PDF</span>
                  <input
                    type="file"
                    hidden
                    accept="application/pdf"
                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 transition py-4 rounded-2xl font-bold text-lg"
              >
                {submitting ? 'Menyimpan...' : editingBook ? 'Update Buku' : 'Tambah Buku'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL TAMBAH/EDIT KATEGORI ===== */}
      {showCategoryModal && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCategoryModal(false)}
        >
          <div
            className="bg-gray-950 border border-gray-800 rounded-3xl p-8 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">
                {editingCategory ? 'Edit Kategori' : 'Tambah Kategori'}
              </h2>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="bg-gray-800 hover:bg-gray-700 transition p-3 rounded-xl"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} className="space-y-5">
              <input
                type="text"
                placeholder="Nama Kategori"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded-2xl px-5 py-4"
                required
              />
              <input
                type="text"
                placeholder="Slug (otomatis jika dikosongkan)"
                value={categoryForm.slug}
                onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded-2xl px-5 py-4"
              />
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 transition py-4 rounded-2xl font-bold"
              >
                {editingCategory ? 'Update Kategori' : 'Tambah Kategori'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}