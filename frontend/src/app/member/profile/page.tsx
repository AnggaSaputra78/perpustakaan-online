'use client';

import Link from 'next/link';

import { useAuthStore } from '@/store/authStore';

export default function ProfilePage() {

  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">

      <div className="flex items-center justify-between mb-10">

        <h1 className="text-4xl font-bold">
          Profil Saya
        </h1>

        <Link
          href="/member/dashboard"
          className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl"
        >
          Kembali
        </Link>

      </div>

      <div className="bg-gray-900 rounded-3xl p-8 max-w-2xl">

        <div className="space-y-5">

          <div>

            <p className="text-gray-400">
              Nama
            </p>

            <h2 className="text-2xl font-bold mt-1">
              {user?.name}
            </h2>

          </div>

          <div>

            <p className="text-gray-400">
              Email
            </p>

            <h2 className="text-2xl font-bold mt-1">
              {user?.email}
            </h2>

          </div>

          <div>

            <p className="text-gray-400">
              Role
            </p>

            <h2 className="text-2xl font-bold mt-1">
              {user?.role}
            </h2>

          </div>

        </div>

      </div>

    </div>
  );
}