const prisma = require('../config/database');
const fs = require('fs').promises;
const path = require('path');

class BookService {
  async getAllBooks(query = {}) {
    // Parse dan validasi parameter
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where = {};

    if (query.search) {
      where.OR = [
        { title: { contains: query.search } },
        { author: { contains: query.search } },
        { isbn: { contains: query.search } },
      ];
    }

    if (query.category) {
      const categoryId = parseInt(query.category);
      if (!isNaN(categoryId)) {
        where.categoryId = categoryId;
      }
    }

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.book.count({ where }),
    ]);

    return {
      books,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getBookById(id) {
    const bookId = parseInt(id);
    if (isNaN(bookId)) throw new Error('ID buku tidak valid');

    const book = await prisma.book.findUnique({
      where: { id: bookId },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!book) {
      throw new Error('Buku tidak ditemukan');
    }

    return book;
  }

  async createBook(data, files) {
    const { title, author, isbn, publisher, year, synopsis, pages, stock, categoryId } = data;

    // Check ISBN unique
    const existingBook = await prisma.book.findUnique({
      where: { isbn },
    });

    if (existingBook) {
      throw new Error('ISBN sudah terdaftar');
    }

    const bookData = {
      title,
      author,
      isbn,
      publisher,
      year: parseInt(year),
      synopsis,
      pages: pages ? parseInt(pages) : null,
      stock: stock ? parseInt(stock) : 1,
      available: stock ? parseInt(stock) : 1,
      categoryId: parseInt(categoryId),
    };

    if (files?.cover) {
      bookData.cover = `/uploads/books/${files.cover[0].filename}`;
    }

    if (files?.pdfFile) {
      bookData.pdfFile = `/uploads/books/${files.pdfFile[0].filename}`;
    }

    const book = await prisma.book.create({
      data: bookData,
      include: {
        category: true,
      },
    });

    return book;
  }

  async updateBook(id, data, files) {
    const bookId = parseInt(id);
    if (isNaN(bookId)) throw new Error('ID buku tidak valid');

    const existingBook = await prisma.book.findUnique({
      where: { id: bookId },
    });

    if (!existingBook) {
      throw new Error('Buku tidak ditemukan');
    }

    const updateData = { ...data };

    if (updateData.year) updateData.year = parseInt(updateData.year);
    if (updateData.pages) updateData.pages = parseInt(updateData.pages);
    if (updateData.stock) {
      updateData.stock = parseInt(updateData.stock);
      // Update available based on current borrowed
      const borrowedCount = await prisma.borrowing.count({
        where: { bookId, status: 'active' },
      });
      updateData.available = updateData.stock - borrowedCount;
    }
    if (updateData.categoryId) updateData.categoryId = parseInt(updateData.categoryId);

    if (files?.cover) {
      // Delete old cover
      if (existingBook.cover) {
        const oldCoverPath = path.join(__dirname, '../../', existingBook.cover);
        try {
          await fs.unlink(oldCoverPath);
        } catch (error) {
          console.log('Old cover not found');
        }
      }
      updateData.cover = `/uploads/books/${files.cover[0].filename}`;
    }

    if (files?.pdfFile) {
      // Delete old PDF
      if (existingBook.pdfFile) {
        const oldPdfPath = path.join(__dirname, '../../', existingBook.pdfFile);
        try {
          await fs.unlink(oldPdfPath);
        } catch (error) {
          console.log('Old PDF not found');
        }
      }
      updateData.pdfFile = `/uploads/books/${files.pdfFile[0].filename}`;
    }

    const book = await prisma.book.update({
      where: { id: bookId },
      data: updateData,
      include: {
        category: true,
      },
    });

    return book;
  }

  async deleteBook(id) {
    const bookId = parseInt(id);
    if (isNaN(bookId)) throw new Error('ID buku tidak valid');

    const book = await prisma.book.findUnique({
      where: { id: bookId },
    });

    if (!book) {
      throw new Error('Buku tidak ditemukan');
    }

    // Delete associated files
    if (book.cover) {
      const coverPath = path.join(__dirname, '../../', book.cover);
      try {
        await fs.unlink(coverPath);
      } catch (error) {
        console.log('Cover not found');
      }
    }

    if (book.pdfFile) {
      const pdfPath = path.join(__dirname, '../../', book.pdfFile);
      try {
        await fs.unlink(pdfPath);
      } catch (error) {
        console.log('PDF not found');
      }
    }

    await prisma.book.delete({
      where: { id: bookId },
    });

    return { message: 'Buku berhasil dihapus' };
  }

  async getLatestBooks(limit = 8) {
    const take = parseInt(limit) || 8;
    const books = await prisma.book.findMany({
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return books;
  }
}

module.exports = new BookService();