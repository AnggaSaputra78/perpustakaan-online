import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800">
      <div className="container mx-auto px-4">
        {/* Navigation */}
        <nav className="flex items-center justify-between py-6">
          <div className="flex items-center space-x-2">
            <span className="text-3xl">📚</span>
            <h1 className="text-2xl font-bold text-white">DigiLib</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/login"
              className="px-6 py-2 text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="px-6 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Daftar
            </Link>
                        <Link
              href="/admin/login"
              className="px-5 py-2 border border-white/50 text-white rounded-lg font-medium hover:bg-white/20 transition-colors backdrop-blur-sm flex items-center space-x-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Admin</span>
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
          <div className="mb-8">
            <span className="text-8xl block mb-4">📚</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Perpustakaan Digital Modern
          </h1>
          
          <p className="text-xl text-blue-100 mb-8 max-w-2xl">
            Akses ribuan buku digital, pinjam dengan mudah, dan nikmati membaca
            kapan saja, di mana saja. Revolusi cara Anda membaca buku.
          </p>
          
          <div className="flex items-center space-x-4">
            <Link
              href="/register"
              className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg"
            >
              Mulai Sekarang
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 border-2 border-white text-white rounded-xl font-semibold text-lg hover:bg-white/10 transition-all"
            >
              Masuk
            </Link>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-4xl">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white">
              <span className="text-4xl block mb-3">📖</span>
              <h3 className="text-xl font-semibold mb-2">Ribuan Buku</h3>
              <p className="text-blue-100">Koleksi lengkap dari berbagai kategori</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white">
              <span className="text-4xl block mb-3">⚡</span>
              <h3 className="text-xl font-semibold mb-2">Pinjam Instan</h3>
              <p className="text-blue-100">Proses peminjaman cepat dan mudah</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white">
              <span className="text-4xl block mb-3">📱</span>
              <h3 className="text-xl font-semibold mb-2">Akses Digital</h3>
              <p className="text-blue-100">Baca ebook langsung dari perangkat Anda</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}