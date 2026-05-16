'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';
import { borrowingService } from '@/services/borrowing.service';
import { Borrowing } from '@/types';
import Loading from '@/components/ui/Loading';
import toast from 'react-hot-toast';

const profileSchema = z.object({
  fullName: z.string().min(3, 'Nama minimal 3 karakter'),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter').or(z.literal('')),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [updating, setUpdating] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      email: user?.email || '',
      password: '',
    },
  });

  useEffect(() => {
    if (user) {
      setValue('fullName', user.fullName);
      setValue('email', user.email);
    }
    fetchBorrowings();
  }, [user]);

  const fetchBorrowings = async () => {
    try {
      const response = await borrowingService.getHistory({ limit: 5 });
      setBorrowings(response.data.borrowings);
    } catch (error) {
      console.error(error);
    }
  };

  const onSubmit = async (data: ProfileForm) => {
    setUpdating(true);
    try {
      const formData = new FormData();
      formData.append('fullName', data.fullName);
      formData.append('email', data.email);
      if (data.password) {
        formData.append('password', data.password);
      }
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const response = await authService.updateProfile(formData);
      setUser(response.data);
      toast.success('Profil berhasil diperbarui!');
    } catch (error) {
      // Error handled by interceptor
    } finally {
      setUpdating(false);
    }
  };

  if (!user) return <Loading />;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Profil Saya
      </h1>

      {/* Profile Form */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-6 mb-6">
          <div className="relative">
            {user.avatar ? (
              <img
                src={`http://localhost:5000${user.avatar}`}
                alt={user.fullName}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                {user.fullName.charAt(0)}
              </div>
            )}
            <label className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700">
              <span className="text-white text-sm">📷</span>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {user.fullName}
            </h2>
            <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
            <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs rounded-full">
              {user.role}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nama Lengkap
            </label>
            <input
              {...register('fullName')}
              className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
            />
            {errors.fullName && <p className="text-red-500 text-sm">{errors.fullName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              {...register('email')}
              type="email"
              className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
            />
            {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password Baru (kosongkan jika tidak ingin mengubah)
            </label>
            <input
              {...register('password')}
              type="password"
              className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
            />
          </div>
          <button
            type="submit"
            disabled={updating}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {updating ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </form>
      </div>

      {/* Recent Borrowings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Riwayat Peminjaman Terbaru
        </h3>
        {borrowings.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">Belum ada peminjaman</p>
        ) : (
          <div className="space-y-3">
            {borrowings.map((b) => (
              <div key={b.id} className="flex justify-between items-center py-2 border-b last:border-0">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{b.book.title}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(b.borrowDate).toLocaleDateString('id-ID')}
                  </p>
                </div>
                <span className={`text-sm px-2 py-1 rounded ${
                  b.status === 'active'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {b.status === 'active' ? 'Aktif' : 'Dikembalikan'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}