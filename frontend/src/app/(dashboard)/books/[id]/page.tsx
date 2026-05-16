'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { bookService } from '@/services/book.service';
import { borrowingService } from '@/services/borrowing.service';
import { Book } from '@/types';
import Loading from '@/components/ui/Loading';
import ErrorState from '@/components/ui/ErrorState';
import toast from 'react-hot-toast';
import Image from 'next/image';

export default function BookDetailPage() {
  const { id } = useParams();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [borrowing, setBorrowing] = useState(false);

  const fetchBook = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await bookService.getById(Number(id));
      setBook(response.data);
    } catch (err) {
      setError('Gagal memuat detail buku');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBook();
  }, [id]);

  const handleBorrow = async () => {
    setBorrowing(true);
    try {
      await borrowingService.borrowBook(book!.id);
      toast.success('Buku berhasil dipinjam!');
      fetchBook(); // Refresh data
    } catch (error) {
      // Error handled by interceptor
    } finally {
      setBorrowing(false);
    }
  };

  if (loading) return <Loading />;
  if (error || !book) return <ErrorState message={error || 'Buku tidak ditemukan'} onRetry={fetchBook} />;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="md:flex">
          {/* Book Cover */}
          <div className="md:w-1/3 bg-gradient-to-br from-blue-400 to-purple-500 p-8 flex items-center justify-center">
            {book.cover ? (
              <Image
                src={`http://localhost:5000${book.cover}`}
                alt={book.title}
                width={300}
                height={400}
                className="rounded-lg shadow-lg"
              />
            ) : (
              <div className="text-center text-white">
                <span className="text-8xl mb-4 block">📚</span>
                <p className="text-lg font-medium">{book.title}</p>
              </div>
            )}
          </div>

          {/* Book Info */}
          <div className="md:w-2/3 p-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {book.title}
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  {book.author}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                book.available > 0
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {book.available > 0 ? `${book.available} Tersedia` : 'Dipinjam'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">ISBN</p>
                <p className="font-medium text-gray-900 dark:text-white">{book.isbn}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Penerbit</p>
                <p className="font-medium text-gray-900 dark:text-white">{book.publisher}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Tahun</p>
                <p className="font-medium text-gray-900 dark:text-white">{book.year}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Kategori</p>
                <p className="font-medium text-gray-900 dark:text-white">{book.category.name}</p>
              </div>
              {book.pages && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Halaman</p>
                  <p className="font-medium text-gray-900 dark:text-white">{book.pages}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Stok</p>
                <p className="font-medium text-gray-900 dark:text-white">{book.stock}</p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Sinopsis
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {book.synopsis}
              </p>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={handleBorrow}
                disabled={book.available < 1 || borrowing}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {borrowing ? 'Memproses...' : 'Pinjam Buku'}
              </button>
              
              {book.pdfFile && (
                <a
                  href={`http://localhost:5000${book.pdfFile}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
                >
                  Preview PDF
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}