const prisma = require('../config/database');

class BorrowingService {
  async borrowBook(userId, bookId) {
    // Check if user has active borrowing for this book
    const activeBorrowing = await prisma.borrowing.findFirst({
      where: {
        userId,
        bookId,
        status: 'active',
      },
    });

    if (activeBorrowing) {
      throw new Error('Anda masih meminjam buku ini');
    }

    // Check book availability
    const book = await prisma.book.findUnique({
      where: { id: bookId },
    });

    if (!book) {
      throw new Error('Buku tidak ditemukan');
    }

    if (book.available < 1) {
      throw new Error('Buku tidak tersedia');
    }

    // Create borrowing
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7); // 7 days borrowing period

    const borrowing = await prisma.borrowing.create({
      data: {
        userId,
        bookId,
        borrowDate: new Date(),
        dueDate,
        status: 'active',
      },
      include: {
        book: {
          include: {
            category: true,
          },
        },
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Update book availability
    await prisma.book.update({
      where: { id: bookId },
      data: {
        available: book.available - 1,
      },
    });

    return borrowing;
  }

  async returnBook(borrowingId, userId) {
    const borrowing = await prisma.borrowing.findFirst({
      where: {
        id: borrowingId,
        userId,
        status: 'active',
      },
    });

    if (!borrowing) {
      throw new Error('Peminjaman tidak ditemukan atau sudah dikembalikan');
    }

    // Update borrowing status
    const updatedBorrowing = await prisma.borrowing.update({
      where: { id: borrowingId },
      data: {
        status: 'returned',
        returnDate: new Date(),
      },
      include: {
        book: {
          include: {
            category: true,
          },
        },
      },
    });

    // Update book availability
    await prisma.book.update({
      where: { id: borrowing.bookId },
      data: {
        available: {
          increment: 1,
        },
      },
    });

    return updatedBorrowing;
  }

  async getBorrowingHistory(userId, query = {}) {
    // Parse dan validasi parameter
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where = { userId };
    if (query.status) {
      where.status = query.status;
    }

    const [borrowings, total] = await Promise.all([
      prisma.borrowing.findMany({
        where,
        include: {
          book: {
            include: {
              category: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.borrowing.count({ where }),
    ]);

    return {
      borrowings,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getDashboardStats() {
    const [totalBooks, totalMembers, activeBorrowings, totalBorrowings] = await Promise.all([
      prisma.book.count(),
      prisma.user.count({ where: { role: 'member' } }),
      prisma.borrowing.count({ where: { status: 'active' } }),
      prisma.borrowing.count(),
    ]);

    return {
      totalBooks,
      totalMembers,
      activeBorrowings,
      totalBorrowings,
    };
  }
}

module.exports = new BorrowingService();