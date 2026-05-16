import Image from 'next/image';
import Link from 'next/link';
import { Book } from '@/types';

interface BookCardProps {
  book: Book;
}

export default function BookCard({ book }: BookCardProps) {
  return (
    <Link href={`/books/${book.id}`}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group">
        <div className="relative h-48 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
          {book.cover ? (
            <Image
              src={`http://localhost:5000${book.cover}`}
              alt={book.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="text-center text-white p-4">
              <span className="text-4xl mb-2 block">📚</span>
              <p className="font-medium text-sm">{book.title}</p>
            </div>
          )}
          <div className="absolute top-2 right-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              book.available > 0
                ? 'bg-green-500 text-white'
                : 'bg-red-500 text-white'
            }`}>
              {book.available > 0 ? 'Tersedia' : 'Dipinjam'}
            </span>
          </div>
        </div>
        
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
            {book.title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            {book.author}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {book.category.name}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {book.year}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}