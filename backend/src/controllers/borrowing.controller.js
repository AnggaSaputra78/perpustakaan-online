const borrowingService = require('../services/borrowing.service');
const { successResponse, errorResponse } = require('../utils/response');

class BorrowingController {
  async borrowBook(req, res) {
    try {
      const { bookId } = req.body;
      const userId = req.user.id;
      const borrowing = await borrowingService.borrowBook(userId, parseInt(bookId));
      return successResponse(res, borrowing, 'Buku berhasil dipinjam', 201);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async returnBook(req, res) {
    try {
      const borrowing = await borrowingService.returnBook(
        parseInt(req.params.id),
        req.user.id
      );
      return successResponse(res, borrowing, 'Buku berhasil dikembalikan');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async getHistory(req, res) {
    try {
      const result = await borrowingService.getBorrowingHistory(
        req.user.id,
        req.query
      );
      return successResponse(res, result);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async getDashboardStats(req, res) {
    try {
      const stats = await borrowingService.getDashboardStats();
      return successResponse(res, stats);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }
}

module.exports = new BorrowingController();