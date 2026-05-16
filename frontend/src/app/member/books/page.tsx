'use client';

import Link from 'next/link';

export default function BooksPage() {

  const books = [
    {
      id: 1,
      title: 'Atomic Habits',
      author: 'James Clear',
    },
    {
      id: 2,
      title: 'Clean Code',
      author: 'Robert C. Martin',
    },
    {
      id: 3,
      title: 'Deep Work',
      author: 'Cal Newport',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">

      <div className="flex items-center justify-between mb-10">

        <h1 className="text-4xl font-bold">
          Koleksi Buku
        </h1>

        <Link
          href="/member/dashboard"
          className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl"
        >
          Kembali
        </Link>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {books.map((book) => (

          <div
            key={book.id}
            className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden"
          >

            <div className="h-52 bg-gradient-to-br from-blue-500 to-purple-700" />

            <div className="p-5">

              <h2 className="text-2xl font-bold">
                {book.title}
              </h2>

              <p className="text-gray-400 mt-2">
                {book.author}
              </p>

              <button className="mt-5 w-full bg-blue-600 hover:bg-blue-700 rounded-xl py-3">
                Baca Buku
              </button>

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}