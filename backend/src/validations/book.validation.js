const { z } = require('zod');

const createBookSchema = z.object({
  title: z.string().min(1, 'Judul buku harus diisi'),
  author: z.string().min(1, 'Nama penulis harus diisi'),
  isbn: z.string().min(1, 'ISBN harus diisi'),
  publisher: z.string().min(1, 'Penerbit harus diisi'),
  year: z.string().transform(val => parseInt(val)),
  synopsis: z.string().min(1, 'Sinopsis harus diisi'),
  pages: z.string().optional().transform(val => val ? parseInt(val) : null),
  stock: z.string().optional().transform(val => val ? parseInt(val) : 1),
  categoryId: z.string().transform(val => parseInt(val)),
});

const updateBookSchema = createBookSchema.partial();

module.exports = { createBookSchema, updateBookSchema };