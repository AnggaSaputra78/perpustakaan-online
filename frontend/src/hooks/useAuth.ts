'use client';

import { useEffect, useState } from 'react';

import { User } from '@/types';

// =========================
// AUTH HOOK
// =========================
export const useAuth = () => {

  // =========================
  // STATE
  // =========================
  const [user, setUser] =
    useState<User | null>(null);

  const [token, setToken] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  // =========================
  // LOAD USER FROM STORAGE
  // =========================
  useEffect(() => {

    try {

      const storedUser =
        localStorage.getItem(
          'library_user'
        );

      const storedToken =
        localStorage.getItem(
          'library_token'
        );

      if (storedUser) {

        setUser(
          JSON.parse(storedUser)
        );

      }

      if (storedToken) {

        setToken(storedToken);

      }

    } catch (error) {

      console.log(
        'Auth load error:',
        error
      );

    } finally {

      setLoading(false);

    }

  }, []);

  // =========================
  // LOGIN
  // =========================
  const login = (
    userData: User,
    authToken: string
  ) => {

    localStorage.setItem(
      'library_user',
      JSON.stringify(userData)
    );

    localStorage.setItem(
      'library_token',
      authToken
    );

    setUser(userData);

    setToken(authToken);

  };

  // =========================
  // LOGOUT
  // =========================
  const logout = () => {

    localStorage.removeItem(
      'library_user'
    );

    localStorage.removeItem(
      'library_token'
    );

    setUser(null);

    setToken(null);

    window.location.href =
      '/login';

  };

  // =========================
  // CHECK ROLE
  // =========================
  const isAdmin =
    user?.role === 'admin';

  const isMember =
    user?.role === 'member';

  // =========================
  // AUTH STATUS
  // =========================
  const isAuthenticated =
    !!user && !!token;

  // =========================
  // RETURN
  // =========================
  return {

    // state
    user,
    token,
    loading,
    isLoading: loading,

    // status
    isAuthenticated,
    isAdmin,
    isMember,

    // methods
    login,
    logout,
    setUser,

  };
};
