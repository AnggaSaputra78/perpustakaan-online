'use client';

import Link from 'next/link';

export default function HistoryPage() {

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">

      <div className="flex items-center justify-between mb-10">

        <h1 className="text-4xl font-bold">
          Riwayat Peminjaman
        </h1>

        <Link
          href="/member/dashboard"
          className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl"
        >
          Kembali
        </Link>

      </div>

      <div className="space-y-5">

        <div className="bg-gray-900 rounded-2xl p-5">

          <h2 className="text-xl font-bold">
            Atomic Habits
          </h2>

          <p className="text-gray-400 mt-2">
            Dipinjam pada 12 Mei 2026
          </p>

        </div>

        <div className="bg-gray-900 rounded-2xl p-5">

          <h2 className="text-xl font-bold">
            Clean Code
          </h2>

          <p className="text-gray-400 mt-2">
            Dipinjam pada 1 Mei 2026
          </p>

        </div>

      </div>

    </div>
  );
}