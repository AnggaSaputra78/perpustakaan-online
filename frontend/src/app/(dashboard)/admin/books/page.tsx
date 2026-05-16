'use client';

import {
  useState,
  useEffect,
} from 'react';

import {
  useForm,
} from 'react-hook-form';

import {
  zodResolver,
} from '@hookform/resolvers/zod';

import { z } from 'zod';

import { useAuth } from '@/hooks/useAuth';

import {
  bookService,
} from '@/services/book.service';

import {
  categoryService,
} from '@/services/category.service';

import {
  Book,
  Category,
} from '@/types';

import Loading from '@/components/ui/Loading';

import ErrorState from '@/components/ui/ErrorState';

import toast from 'react-hot-toast';

import {
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

// =========================
// VALIDATION
// =========================
const bookSchema = z.object({

  title: z.string()
    .min(1, 'Judul harus diisi'),

  author: z.string()
    .min(1, 'Penulis harus diisi'),

  isbn: z.string()
    .optional(),

  publisher: z.string()
    .optional(),

  year: z.string()
    .optional(),

  synopsis: z.string()
    .optional(),

  pages: z.string()
    .optional(),

  stock: z.string()
    .optional(),

  categoryId: z.string()
    .optional(),

});

type BookForm =
  z.infer<typeof bookSchema>;

// =========================
// PAGE
// =========================
export default function AdminBooksPage() {

  // =========================
  // AUTH
  // =========================
  const {
    user,
    loading: authLoading,
  } = useAuth();

  // =========================
  // STATES
  // =========================
  const [books, setBooks] =
    useState<Book[]>([]);

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [editingBook, setEditingBook] =
    useState<Book | null>(null);

  const [showForm, setShowForm] =
    useState(false);

  // =========================
  // FORM
  // =========================
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BookForm>({
    resolver:
      zodResolver(bookSchema),
  });

  // =========================
  // FETCH BOOKS
  // =========================
  const fetchBooks = async () => {

    try {

      const res =
        await bookService.getAll({
          limit: 100,
        });

      setBooks(res.data.books);

    } catch (error) {

      toast.error(
        'Gagal memuat buku'
      );

    }

  };

  // =========================
  // FETCH CATEGORY
  // =========================
  const fetchCategories =
    async () => {

      try {

        const res =
          await categoryService.getAll();

        setCategories(res.data);

      } catch (error) {

        toast.error(
          'Gagal memuat kategori'
        );

      }

    };

  // =========================
  // INIT
  // =========================
  useEffect(() => {

    if (!authLoading && user) {

      if (user.role !== 'admin') {

        window.location.href =
          '/dashboard';

        return;

      }

      setLoading(true);

      Promise.all([
        fetchBooks(),
        fetchCategories(),
      ]).finally(() =>
        setLoading(false)
      );

      // REALTIME REFRESH
      const interval =
        setInterval(() => {

          fetchBooks();

        }, 3000);

      return () =>
        clearInterval(interval);

    }

  }, [user, authLoading]);

  // =========================
  // SUBMIT
  // =========================
  const onSubmit = async (
    data: BookForm
  ) => {

    const formData =
      new FormData();

    Object.entries(data)
      .forEach(([key, value]) => {

        if (value) {

          formData.append(
            key,
            value
          );

        }

      });

    // =========================
    // FILES
    // =========================
    const coverInput =
      document.querySelector<HTMLInputElement>(
        '#cover'
      );

    const pdfInput =
      document.querySelector<HTMLInputElement>(
        '#pdfFile'
      );

    // COVER
    if (
      coverInput?.files?.[0]
    ) {

      formData.append(
        'cover',
        coverInput.files[0]
      );

    }

    // PDF ONLY
    if (
      pdfInput?.files?.[0]
    ) {

      const file =
        pdfInput.files[0];

      if (
        file.type !==
        'application/pdf'
      ) {

        toast.error(
          'File harus PDF'
        );

        return;

      }

      formData.append(
        'pdfFile',
        file
      );

    }

    try {

      if (editingBook) {

        await bookService.update(
          editingBook.id,
          formData
        );

        toast.success(
          'Buku berhasil diupdate'
        );

      } else {

        await bookService.create(
          formData
        );

        toast.success(
          'Buku berhasil ditambahkan'
        );

      }

      reset();

      setEditingBook(null);

      setShowForm(false);

      fetchBooks();

    } catch (error) {

      toast.error(
        'Gagal menyimpan buku'
      );

    }

  };

  // =========================
  // EDIT
  // =========================
  const handleEdit = (
    book: Book
  ) => {

    setEditingBook(book);

    reset({

      title: book.title,

      author: book.author,

      isbn: book.isbn || '',

      publisher:
        book.publisher || '',

      year:
        book.year?.toString() || '',

      synopsis:
        book.synopsis || '',

      pages:
        book.pages?.toString() || '',

      stock:
        book.stock?.toString() || '',

      categoryId:
        book.categoryId?.toString() || '',

    });

    setShowForm(true);

  };

  // =========================
  // DELETE
  // =========================
  const handleDelete = async (
    id: number
  ) => {

    const confirmed =
      confirm(
        'Hapus buku ini?'
      );

    if (!confirmed) return;

    try {

      await bookService.delete(id);

      toast.success(
        'Buku berhasil dihapus'
      );

      fetchBooks();

    } catch (error) {

      toast.error(
        'Gagal menghapus buku'
      );

    }

  };

  // =========================
  // LOADING
  // =========================
  if (
    authLoading ||
    loading
  ) {

    return <Loading />;

  }

  // =========================
  // NO ACCESS
  // =========================
  if (
    !user ||
    user.role !== 'admin'
  ) {

    return (
      <ErrorState
        message='Akses ditolak'
      />
    );

  }

  // =========================
  // UI
  // =========================
  return (

    <div className='space-y-6'>

      {/* HEADER */}
      <div className='flex items-center justify-between'>

        <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
          Manajemen Buku
        </h1>

        <button
          onClick={() => {

            setEditingBook(null);

            reset({});

            setShowForm(!showForm);

          }}
          className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg'
        >
          {
            showForm
              ? 'Tutup Form'
              : 'Tambah Buku'
          }
        </button>

      </div>

      {/* FORM */}
      {showForm && (

        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6'>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className='grid grid-cols-1 md:grid-cols-2 gap-4'
          >

            {/* TITLE */}
            <input
              {...register('title')}
              placeholder='Judul Buku'
              className='p-3 rounded-lg border'
            />

            {/* AUTHOR */}
            <input
              {...register('author')}
              placeholder='Penulis'
              className='p-3 rounded-lg border'
            />

            {/* ISBN */}
            <input
              {...register('isbn')}
              placeholder='ISBN'
              className='p-3 rounded-lg border'
            />

            {/* PUBLISHER */}
            <input
              {...register('publisher')}
              placeholder='Penerbit'
              className='p-3 rounded-lg border'
            />

            {/* YEAR */}
            <input
              type='number'
              {...register('year')}
              placeholder='Tahun'
              className='p-3 rounded-lg border'
            />

            {/* CATEGORY */}
            <select
              {...register('categoryId')}
              className='p-3 rounded-lg border'
            >

              <option value=''>
                Pilih kategori
              </option>

              {categories.map((cat) => (

                <option
                  key={cat.id}
                  value={cat.id}
                >
                  {cat.name}
                </option>

              ))}

            </select>

            {/* SYNOPSIS */}
            <textarea
              {...register('synopsis')}
              placeholder='Sinopsis'
              rows={4}
              className='p-3 rounded-lg border col-span-2'
            />

            {/* PAGES */}
            <input
              type='number'
              {...register('pages')}
              placeholder='Jumlah Halaman'
              className='p-3 rounded-lg border'
            />

            {/* STOCK */}
            <input
              type='number'
              {...register('stock')}
              placeholder='Stok'
              className='p-3 rounded-lg border'
            />

            {/* COVER */}
            <input
              id='cover'
              type='file'
              accept='image/*'
              className='col-span-1'
            />

            {/* PDF */}
            <input
              id='pdfFile'
              type='file'
              accept='application/pdf'
              className='col-span-1'
            />

            {/* BUTTON */}
            <div className='col-span-2 flex justify-end'>

              <button
                type='submit'
                className='px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg'
              >
                {
                  editingBook
                    ? 'Update Buku'
                    : 'Simpan Buku'
                }
              </button>

            </div>

          </form>

        </div>

      )}

    </div>

  );

}