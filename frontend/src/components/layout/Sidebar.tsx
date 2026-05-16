'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  BookOpenIcon, 
  UserIcon, 
  ClockIcon,
  ArrowLeftOnRectangleIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/store/authStore';

export default function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  // Menu dasar untuk semua user
  const baseMenuItems = [
    { name: 'Beranda', href: '/dashboard', icon: HomeIcon },
    { name: 'Katalog Buku', href: '/books', icon: BookOpenIcon },
    { name: 'Peminjaman', href: '/borrow', icon: ClockIcon },
    { name: 'Profil', href: '/profile', icon: UserIcon },
  ];

  // Menu admin tambahan
  const adminMenuItems = [
    { name: 'Manajemen Buku', href: '/admin/books', icon: Cog6ToothIcon },
  ];

  // Gabungkan menu berdasarkan role
  const menuItems = user?.role === 'admin' 
    ? [...baseMenuItems, ...adminMenuItems] 
    : baseMenuItems;

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-screen fixed left-0 top-0 z-30">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
          📚 DigiLib
        </h1>
      </div>
      
      <nav className="mt-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/50 dark:text-blue-400 border-r-4 border-blue-600'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-gray-700/50'
              }`}
            >
              <Icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-0 w-full p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={logout}
          className="flex items-center w-full px-4 py-2 text-sm text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
        >
          <ArrowLeftOnRectangleIcon className="w-5 h-5 mr-3" />
          Keluar
        </button>
      </div>
    </div>
  );
}