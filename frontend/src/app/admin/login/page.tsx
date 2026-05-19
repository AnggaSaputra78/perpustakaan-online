'use client';

import { useState } from 'react';

import { useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';

import { z } from 'zod';

import Link from 'next/link';

import { useRouter } from 'next/navigation';

import { authService } from '@/services/auth.service';

import { useAuthStore } from '@/store/authStore';

import toast from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().email(
    'Email tidak valid'
  ),

  password: z
    .string()
    .min(
      1,
      'Password harus diisi'
    ),
});

type LoginForm =
  z.infer<
    typeof loginSchema
  >;

export default function AdminLoginPage() {

  const router =
    useRouter();

  const { setAuth } =
    useAuthStore();

  const [loading, setLoading] =
    useState(false);

  const {
    register,
    handleSubmit,
    formState: {
      errors,
    },
  } =
    useForm<LoginForm>({
      resolver:
        zodResolver(
          loginSchema
        ),
    });

  const onSubmit = async (
    data: LoginForm
  ) => {

    setLoading(true);

    try {

      const response =
        await authService.login(
          data
        );

      /*
        FORMAT USER
      */

      const user = {
        id:
          response.data.user.id,

        fullName:
          response.data.user
            .fullName ||

          (response.data.user as any)
            .full_name ||

          (response.data.user as any)
            .name ||

          'Admin',

        // keep legacy key for compatibility
        full_name:
          response.data.user
            .fullName ||

          (response.data.user as any)
            .full_name ||

          (response.data.user as any)
            .name ||

          'Admin',

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

      /*
        VALIDASI ROLE
      */

      if (
        user.role !==
        'admin'
      ) {

        toast.error(
          'Akun ini bukan admin'
        );

        setLoading(false);

        return;

      }

      /*
        TOKEN
      */

      const token =
        response.data.token;

      /*
        SAVE TOKEN
      */

      localStorage.setItem(
        'token',
        token
      );

      /*
        SAVE USER
      */

      localStorage.setItem(
        'user',
        JSON.stringify(
          user
        )
      );

      /*
        SAVE AUTH
      */

      setAuth(
        user,
        token
      );

      /*
        SUCCESS
      */

      toast.success(
        'Login admin berhasil!'
      );

      /*
        REDIRECT
      */

      router.push(
        '/dashboard'
      );

    } catch (error: any) {

      console.log(
        'LOGIN ERROR:',
        error
      );

      toast.error(
        error?.response?.data
          ?.message ||
          'Login gagal'
      );

    } finally {

      setLoading(false);

    }

  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-blue-950 py-12 px-4">

      <div className="max-w-md w-full space-y-8 bg-gray-900 border border-gray-800 rounded-3xl shadow-2xl p-8">

        {/* HEADER */}
        <div className="text-center">

          <div className="flex justify-center">

            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">

              <span className="text-4xl">

                🛡️

              </span>

            </div>

          </div>

          <h2 className="mt-6 text-4xl font-black text-white">

            Admin Login

          </h2>

          <p className="mt-3 text-sm text-gray-400">

            Panel administrator
            perpustakaan digital

          </p>

        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit(
            onSubmit
          )}
          className="space-y-6"
        >

          {/* EMAIL */}
          <div>

            <label className="block text-sm text-gray-300 mb-2">

              Email Admin

            </label>

            <input
              {...register(
                'email'
              )}
              type="email"
              placeholder="admin@email.com"
              className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-4 text-white outline-none focus:border-blue-500"
            />

            {errors.email && (

              <p className="text-red-500 text-sm mt-2">

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

            <input
              {...register(
                'password'
              )}
              type="password"
              placeholder="••••••••"
              className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-4 text-white outline-none focus:border-blue-500"
            />

            {errors.password && (

              <p className="text-red-500 text-sm mt-2">

                {
                  errors
                    .password
                    .message
                }

              </p>

            )}

          </div>

          {/* BUTTON */}
          <button
            type="submit"
            disabled={
              loading
            }
            className="w-full bg-blue-600 hover:bg-blue-700 transition rounded-2xl py-4 text-white font-bold"
          >

            {loading
              ? 'Loading...'
              : 'Masuk sebagai Admin'}

          </button>

        </form>

        {/* FOOTER */}
        <div className="text-center">

          <Link
            href="/login"
            className="text-gray-400 hover:text-white transition"
          >

            Login sebagai Member

          </Link>

        </div>

      </div>

    </div>
  );

}