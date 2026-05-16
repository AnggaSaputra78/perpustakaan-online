'use client';

import { Bars3Icon } from '@heroicons/react/24/outline';
import { useAuthStore } from '@/store/authStore';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export default function Navbar({ onToggleSidebar }: NavbarProps) {
  const { user } = useAuthStore();

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden"
        >
          <Bars3Icon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        </button>

        <div className="flex-1" />

        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium text-gray-900 dark:text-white">
              {user?.fullName}
            </span>
          </div>
          
          {user?.avatar ? (
            <img
              src={`http://localhost:5000${user.avatar}`}
              alt={user.fullName}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}   