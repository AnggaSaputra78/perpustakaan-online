'use client';

import { useState } from 'react';

import Link from 'next/link';

import { useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';

import { z } from 'zod';

import toast from 'react-hot-toast';

import {
  Eye,
  EyeOff,
  BookOpen,
  ShieldCheck,
} from 'lucide-react';

import { authService } from '@/services/auth.service';

import { useAuthStore } from '@/store/authStore';

const loginSchema = z.object({
  email: z
    .string()
    .email('Email tidak valid'),

  password: z
    .string()
    .min(1, 'Password wajib diisi'),
});

type LoginForm = z.infer<
  typeof loginSchema
>;

export default function LoginPage() {

  const { setAuth } =
    useAuthStore();

  const [loading, setLoading] =
    useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState('');

  const [debugLogs, setDebugLogs] =
    useState<string[]>([]);

  const addLog = (
    message: string
  ) => {

    console.log(message);

    setDebugLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] ${message}`,
    ]);

  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver:
      zodResolver(loginSchema),
  });

  const onSubmit = async (
    data: LoginForm
  ) => {

    setLoading(true);

    setErrorMessage('');

    setDebugLogs([]);

    addLog('====================');

    addLog(
      'LOGIN MEMBER DIMULAI'
    );

    addLog('====================');

    try {

      addLog(
        `Email: ${data.email}`
      );

      // REQUEST LOGIN
      const response =
        await authService.login(
          data
        );

      addLog(
        'Response backend diterima'
      );

      console.log(
        response.data
      );

      // VALIDASI
      if (!response.data) {

        throw new Error(
          'Response backend kosong'
        );

      }

      if (
        !response.data.user
      ) {

        throw new Error(
          'User tidak ditemukan'
        );

      }

      if (
        !response.data.token
      ) {

        throw new Error(
          'Token tidak ditemukan'
        );

      }

      addLog(
        'Token ditemukan'
      );

      // FORMAT USER
      const formattedUser = {

        id: Number(
          response.data.user.id
        ),

        name:
          response.data.user
            .fullName || 'User',

        email:
          response.data.user
            .email,

        role:
          response.data.user
            .role,

        avatar:
          response.data.user
            .avatar || '',
      };

      addLog(
        `Role user: ${formattedUser.role}`
      );

      console.log(
        'FORMATTED USER:',
        formattedUser
      );

      // SAVE AUTH
      setAuth(
        formattedUser,
        response.data.token
      );

      addLog(
        'Auth berhasil disimpan'
      );

      // CEK STORAGE
      const savedUser =
        localStorage.getItem(
          'library_user'
        );

      const savedToken =
        localStorage.getItem(
          'library_token'
        );

      console.log(
        savedUser
      );

      console.log(
        savedToken
      );

      if (
        !savedUser ||
        !savedToken
      ) {

        throw new Error(
          'Auth gagal tersimpan ke localStorage'
        );

      }

      addLog(
        'LocalStorage berhasil'
      );

      toast.success(
        'Login berhasil'
      );

      addLog(
        'Redirect ke dashboard member...'
      );

      // REDIRECT MEMBER
      setTimeout(() => {

        window.location.href =
          '/member/dashboard';

      }, 1500);

    } catch (error: any) {

      console.error(error);

      addLog('====================');

      addLog(
        'TERJADI ERROR'
      );

      addLog('====================');

      // AXIOS ERROR
      if (
        error.response
      ) {

        console.log(
          error.response.data
        );

        addLog(
          `Status: ${error.response.status}`
        );

        addLog(
          `Message: ${
            error.response.data
              .message ||
            'Login gagal'
          }`
        );

        setErrorMessage(
          error.response.data
            .message ||
            'Login gagal'
        );

      }

      // NETWORK ERROR
      else if (
        error.request
      ) {

        addLog(
          'Backend tidak merespon'
        );

        setErrorMessage(
          'Backend tidak aktif atau tidak merespon'
        );

      }

      // GENERAL ERROR
      else {

        addLog(
          error.message
        );

        setErrorMessage(
          error.message
        );

      }

      toast.error(
        'Login gagal'
      );

    } finally {

      setLoading(false);

      addLog('====================');

      addLog(
        'PROSES LOGIN SELESAI'
      );

      addLog('====================');

    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-gray-900 flex items-center justify-center px-4 py-10">

      <div className="w-full max-w-lg bg-gray-900 border border-gray-700 rounded-3xl shadow-2xl p-8">

        {/* HEADER */}
        <div className="text-center mb-8">

          <div className="flex justify-center mb-5">

            <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center">

              <BookOpen size={40} />

            </div>

          </div>

          <h1 className="text-4xl font-bold text-white">
            Login Member
          </h1>

          <p className="text-gray-400 mt-2">
            Masuk ke akun perpustakaan
          </p>

        </div>

        {/* STATUS */}
        <div className="grid grid-cols-2 gap-4 mb-6">

          <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700">

            <div className="flex items-center gap-3">

              <ShieldCheck className="text-green-400" />

              <div>

                <p className="text-gray-400 text-sm">
                  Auth Status
                </p>

                <h2 className="font-bold text-white">
                  Ready
                </h2>

              </div>

            </div>

          </div>

          <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700">

            <div className="flex items-center gap-3">

              <BookOpen className="text-blue-400" />

              <div>

                <p className="text-gray-400 text-sm">
                  Role
                </p>

                <h2 className="font-bold text-white">
                  Member
                </h2>

              </div>

            </div>

          </div>

        </div>

        {/* ERROR PANEL */}
        {errorMessage && (

          <div className="mb-6 bg-red-500/10 border border-red-500 rounded-2xl p-4">

            <h2 className="text-red-400 font-bold mb-2">
              ERROR
            </h2>

            <p className="text-red-300 text-sm">
              {errorMessage}
            </p>

          </div>

        )}

        {/* DEBUG LOG */}
        <div className="mb-6 bg-black rounded-2xl p-4 h-48 overflow-auto border border-gray-700">

          <h2 className="text-green-400 font-bold mb-3">
            DEBUG LOG
          </h2>

          <div className="space-y-2 text-sm text-green-300 font-mono">

            {debugLogs.length ===
            0 ? (

              <p>
                Belum ada log...
              </p>

            ) : (

              debugLogs.map(
                (
                  log,
                  index
                ) => (

                  <div
                    key={index}
                  >
                    {log}
                  </div>

                )
              )

            )}

          </div>

        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit(
            onSubmit
          )}
          className="space-y-5"
        >

          {/* EMAIL */}
          <div>

            <label className="block text-sm text-gray-300 mb-2">
              Email
            </label>

            <input
              {...register(
                'email'
              )}
              type="email"
              placeholder="Masukkan email"
              className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {errors.email && (

              <p className="text-red-400 text-sm mt-1">

                {
                  errors.email
                    .message
                }

              </p>

            )}

          </div>

          {/* PASSWORD */}
          <div>

            <label className="block text-sm text-gray-300 mb-2">
              Password
            </label>

            <div className="relative">

              <input
                {...register(
                  'password'
                )}
                type={
                  showPassword
                    ? 'text'
                    : 'password'
                }
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
              >

                {showPassword ? (

                  <EyeOff size={20} />

                ) : (

                  <Eye size={20} />

                )}

              </button>

            </div>

            {errors.password && (

              <p className="text-red-400 text-sm mt-1">

                {
                  errors.password
                    .message
                }

              </p>

            )}

          </div>

          {/* BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition disabled:opacity-50"
          >

            {loading
              ? 'Memproses...'
              : 'Login Member'}

          </button>

        </form>

        {/* FOOTER */}
        <div className="text-center mt-6">

          <p className="text-gray-400 text-sm">

            Belum punya akun?

            <Link
              href="/register"
              className="text-blue-400 hover:text-blue-300 ml-1"
            >
              Daftar
            </Link>

          </p>

          <Link
            href="/admin/login"
            className="block mt-4 text-sm text-gray-500 hover:text-white"
          >
            Login sebagai admin →
          </Link>

        </div>

      </div>

    </div>
  );

}