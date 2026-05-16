'use client';

import { useState, useEffect } from 'react';
import { borrowingService } from '@/services/borrowing.service';
import { useAuth } from '@/hooks/useAuth';
import { Borrowing } from '@/types';
import Loading from '@/components/ui/Loading';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import toast from 'react-hot-toast';

export default function BorrowPage() {
  const { user, isLoading } = useAuth(); // ambil isLoading dari hook auth
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  const fetchBorrowings = async () => {
    setLoading(true);
    setError(null);
    try {
      const status = filter === 'all' ? undefined : filter;
      const response = await borrowingService.getHistory({ status });
      setBorrowings(response.data.borrowings);
    } catch (err) {
      setError('Gagal memuat data peminjaman');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Hanya fetch jika auth sudah selesai loading dan user ada
    if (!isLoading && user) {
      fetchBorrowings();
    }
  }, [filter, user, isLoading]);

  const handleReturn = async (id: number) => {
    try {
      await borrowingService.returnBook(id);
      toast.success('Buku berhasil dikembalikan!');
      fetchBorrowings();
    } catch (error) {
      // Error handled by interceptor
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // 1. Jika auth masih loading
  if (isLoading) return <Loading />;

  // 2. Jika auth selesai tapi user tidak ada (belum login)
  if (!user) {
    return <ErrorState message="Anda harus login untuk mengakses halaman ini." />;
  }

  // 3. Loading data peminjaman
  if (loading) return <Loading />;

  // 4. Error saat fetch data
  if (error) return <ErrorState message={error} onRetry={fetchBorrowings} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Riwayat Peminjaman
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Kelola peminjaman buku Anda
          </p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
        >
          <option value="all">Semua</option>
          <option value="active">Aktif</option>
          <option value="returned">Dikembalikan</option>
        </select>
      </div>

      {borrowings.length === 0 ? (
        <EmptyState message="Belum ada riwayat peminjaman" icon="📋" />
      ) : (
        <div className="space-y-4">
          {borrowings.map((borrowing) => (
            <div
              key={borrowing.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex space-x-4">
                  <div className="w-16 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    {borrowing.book.cover ? (
                      <img
                        src={`http://localhost:5000${borrowing.book.cover}`}
                        alt={borrowing.book.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <span className="text-2xl">📚</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {borrowing.book.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {borrowing.book.author}
                    </p>
                    <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <p>📅 Pinjam: {formatDate(borrowing.borrowDate)}</p>
                      <p>⏰ Jatuh Tempo: {formatDate(borrowing.dueDate)}</p>
                      {borrowing.returnDate && (
                        <p>✅ Kembali: {formatDate(borrowing.returnDate)}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      borrowing.status === 'active'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}
                  >
                    {borrowing.status === 'active' ? 'Dipinjam' : 'Dikembalikan'}
                  </span>
                  {borrowing.status === 'active' && (
                    <button
                      onClick={() => handleReturn(borrowing.id)}
                      className="mt-2 block w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Kembalikan
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}