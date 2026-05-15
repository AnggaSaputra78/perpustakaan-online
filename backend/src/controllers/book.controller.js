const bookService = require('../services/book.service');
const { successResponse, errorResponse } = require('../utils/response');

class BookController {
  async getAllBooks(req, res) {
    try {
      const result = await bookService.getAllBooks(req.query);
      return successResponse(res, result);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async getBookById(req, res) {
    try {
      const book = await bookService.getBookById(req.params.id);
      return successResponse(res, book);
    } catch (error) {
      return errorResponse(res, error.message, 404);
    }
  }

  async createBook(req, res) {
    try {
      const book = await bookService.createBook(req.body, req.files);
      return successResponse(res, book, 'Buku berhasil ditambahkan', 201);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async updateBook(req, res) {
    try {
      const book = await bookService.updateBook(req.params.id, req.body, req.files);
      return successResponse(res, book, 'Buku berhasil diupdate');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async deleteBook(req, res) {
    try {
      const result = await bookService.deleteBook(req.params.id);
      return successResponse(res, result);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async getLatestBooks(req, res) {
    try {
      const books = await bookService.getLatestBooks();
      return successResponse(res, books);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }
}

module.exports = new BookController();  