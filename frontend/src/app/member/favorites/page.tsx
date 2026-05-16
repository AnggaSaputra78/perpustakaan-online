'use client';

import Link from 'next/link';

export default function FavoritesPage() {

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">

      <div className="flex items-center justify-between mb-10">

        <h1 className="text-4xl font-bold">
          Buku Favorit
        </h1>

        <Link
          href="/member/dashboard"
          className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl"
        >
          Kembali
        </Link>

      </div>

      <div className="bg-gray-900 rounded-3xl p-10 text-center">

        <h2 className="text-2xl font-bold">
          Belum ada buku favorit
        </h2>

        <p className="text-gray-400 mt-3">
          Tambahkan buku favoritmu nanti di sini
        </p>

      </div>

    </div>
  );
}
