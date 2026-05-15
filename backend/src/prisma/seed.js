const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Memulai seeding database...');

  // Bersihkan data yang ada
  await prisma.borrowing.deleteMany();
  await prisma.book.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // Reset auto increment
  await prisma.$executeRaw`ALTER TABLE borrowings AUTO_INCREMENT = 1`;
  await prisma.$executeRaw`ALTER TABLE books AUTO_INCREMENT = 1`;
  await prisma.$executeRaw`ALTER TABLE categories AUTO_INCREMENT = 1`;
  await prisma.$executeRaw`ALTER TABLE users AUTO_INCREMENT = 1`;

  // Seed Users
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const admin = await prisma.user.create({
    data: {
      fullName: 'Admin Perpustakaan',
      email: 'admin@library.com',
      password: hashedPassword,
      role: 'admin',
    },
  });

  const member1 = await prisma.user.create({
    data: {
      fullName: 'Budi Santoso',
      email: 'budi@example.com',
      password: hashedPassword,
      role: 'member',
    },
  });

  const member2 = await prisma.user.create({
    data: {
      fullName: 'Siti Nurhaliza',
      email: 'siti@example.com',
      password: hashedPassword,
      role: 'member',
    },
  });

  console.log('Users berhasil dibuat');

  // Seed Categories
  const categories = await Promise.all([
    prisma.category.create({
      data: { name: 'Pemrograman', slug: 'pemrograman' },
    }),
    prisma.category.create({
      data: { name: 'Desain Grafis', slug: 'desain-grafis' },
    }),
    prisma.category.create({
      data: { name: 'Bisnis & Ekonomi', slug: 'bisnis-ekonomi' },
    }),
    prisma.category.create({
      data: { name: 'Fiksi & Sastra', slug: 'fiksi-sastra' },
    }),
    prisma.category.create({
      data: { name: 'Sains & Teknologi', slug: 'sains-teknologi' },
    }),
    prisma.category.create({
      data: { name: 'Sejarah', slug: 'sejarah' },
    }),
  ]);

  console.log('Kategori berhasil dibuat');

  // Seed Books
  const books = await Promise.all([
    prisma.book.create({
      data: {
        title: 'JavaScript untuk Pemula',
        author: 'John Doe',
        isbn: '978-1234567890',
        publisher: 'TechPress',
        year: 2023,
        synopsis: 'Buku panduan lengkap mempelajari JavaScript dari dasar hingga mahir. Cocok untuk pemula yang ingin memulai karir di dunia web development.',
        pages: 350,
        stock: 5,
        available: 5,
        categoryId: categories[0].id,
      },
    }),
    prisma.book.create({
      data: {
        title: 'React.js Modern',
        author: 'Jane Smith',
        isbn: '978-1234567891',
        publisher: 'WebPub',
        year: 2024,
        synopsis: 'Pelajari React.js terbaru dengan hooks, context, dan state management modern. Dilengkapi studi kasus real-world.',
        pages: 420,
        stock: 3,
        available: 3,
        categoryId: categories[0].id,
      },
    }),
    prisma.book.create({
      data: {
        title: 'UI/UX Design Mastery',
        author: 'Alex Johnson',
        isbn: '978-1234567892',
        publisher: 'DesignPress',
        year: 2023,
        synopsis: 'Panduan lengkap mendesain user interface dan user experience yang profesional menggunakan Figma dan Adobe XD.',
        pages: 280,
        stock: 4,
        available: 4,
        categoryId: categories[1].id,
      },
    }),
    prisma.book.create({
      data: {
        title: 'Bisnis Digital 4.0',
        author: 'Robert Kiyosaki',
        isbn: '978-1234567893',
        publisher: 'BizBooks',
        year: 2024,
        synopsis: 'Strategi membangun bisnis digital di era industri 4.0. Lengkap dengan tips marketing online dan e-commerce.',
        pages: 310,
        stock: 6,
        available: 6,
        categoryId: categories[2].id,
      },
    }),
    prisma.book.create({
      data: {
        title: 'Laskar Pelangi',
        author: 'Andrea Hirata',
        isbn: '978-1234567894',
        publisher: 'Bentang Pustaka',
        year: 2005,
        synopsis: 'Kisah inspiratif tentang sepuluh anak dari keluarga miskin yang berjuang untuk mendapatkan pendidikan di Belitung.',
        pages: 529,
        stock: 8,
        available: 8,
        categoryId: categories[3].id,
      },
    }),
    prisma.book.create({
      data: {
        title: 'Kecerdasan Buatan',
        author: 'Prof. Budi Raharjo',
        isbn: '978-1234567895',
        publisher: 'SciencePress',
        year: 2024,
        synopsis: 'Pengantar komprehensif tentang artificial intelligence, machine learning, dan deep learning untuk pemula.',
        pages: 450,
        stock: 3,
        available: 3,
        categoryId: categories[4].id,
      },
    }),
    prisma.book.create({
      data: {
        title: 'Sejarah Indonesia Modern',
        author: 'Dr. Ani Wulandari',
        isbn: '978-1234567896',
        publisher: 'NusaPress',
        year: 2023,
        synopsis: 'Perjalanan sejarah Indonesia dari masa kolonial hingga era reformasi. Dilengkapi foto dan dokumen bersejarah.',
        pages: 600,
        stock: 4,
        available: 4,
        categoryId: categories[5].id,
      },
    }),
    prisma.book.create({
      data: {
        title: 'Node.js Backend Development',
        author: 'Michael Chen',
        isbn: '978-1234567897',
        publisher: 'TechPress',
        year: 2024,
        synopsis: 'Membangun REST API profesional dengan Node.js, Express, dan Prisma ORM. Termasuk authentication dan deployment.',
        pages: 380,
        stock: 5,
        available: 5,
        categoryId: categories[0].id,
      },
    }),
  ]);

  console.log('Buku berhasil dibuat');

  // Seed Borrowings
  await prisma.borrowing.create({
    data: {
      userId: member1.id,
      bookId: books[0].id,
      borrowDate: new Date('2024-01-15'),
      dueDate: new Date('2024-01-22'),
      returnDate: new Date('2024-01-20'),
      status: 'returned',
    },
  });

  await prisma.borrowing.create({
    data: {
      userId: member1.id,
      bookId: books[2].id,
      borrowDate: new Date('2024-02-01'),
      dueDate: new Date('2024-02-08'),
      status: 'active',
    },
  });

  await prisma.borrowing.create({
    data: {
      userId: member2.id,
      bookId: books[1].id,
      borrowDate: new Date('2024-02-10'),
      dueDate: new Date('2024-02-17'),
      status: 'active',
    },
  });

  // Update available books
  await prisma.book.update({
    where: { id: books[0].id },
    data: { available: 4 },
  });

  await prisma.book.update({
    where: { id: books[2].id },
    data: { available: 3 },
  });

  await prisma.book.update({
    where: { id: books[1].id },
    data: { available: 2 },
  });

  console.log('Peminjaman berhasil dibuat');
  console.log('✅ Seeding selesai!');
  
  console.log('\n📋 Akun untuk testing:');
  console.log('Admin: admin@library.com / password123');
  console.log('Member 1: budi@example.com / password123');
  console.log('Member 2: siti@example.com / password123');
}

main()
  .catch((e) => {
    console.error('Error saat seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });