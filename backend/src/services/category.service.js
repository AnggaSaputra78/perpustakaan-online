const prisma = require('../config/database');

class CategoryService {
  async getAllCategories() {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { books: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return categories;
  }

  async getCategoryBySlug(slug) {
    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        books: {
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { books: true },
        },
      },
    });

    if (!category) {
      throw new Error('Kategori tidak ditemukan');
    }

    return category;
  }
}

module.exports = new CategoryService();