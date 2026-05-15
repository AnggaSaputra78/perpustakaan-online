const express = require('express');
const router = express.Router();
const borrowingController = require('../controllers/borrowing.controller');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, borrowingController.borrowBook);
router.get('/history', authenticate, borrowingController.getHistory);
router.get('/stats', authenticate, borrowingController.getDashboardStats);
router.put('/return/:id', authenticate, borrowingController.returnBook);

module.exports = router;