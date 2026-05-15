const express = require('express');
const router = express.Router();
const bookController = require('../controllers/book.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize'); // tambahkan
const { uploadBookCover, uploadBookPdf } = require('../middleware/upload');

const uploadFields = [
  { name: 'cover', maxCount: 1 },
  { name: 'pdfFile', maxCount: 1 },
];

// Public routes
router.get('/', bookController.getAllBooks);
router.get('/latest', bookController.getLatestBooks);
router.get('/:id', bookController.getBookById);

// Admin only routes
router.post('/', authenticate, authorize('admin'), uploadBookCover.fields(uploadFields), bookController.createBook);
router.put('/:id', authenticate, authorize('admin'), uploadBookCover.fields(uploadFields), bookController.updateBook);
router.delete('/:id', authenticate, authorize('admin'), bookController.deleteBook);

module.exports = router;