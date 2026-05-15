const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const bookRoutes = require('./book.routes');
const borrowingRoutes = require('./borrowing.routes');
const categoryRoutes = require('./category.routes');

router.use('/auth', authRoutes);
router.use('/books', bookRoutes);
router.use('/borrow', borrowingRoutes);
router.use('/categories', categoryRoutes);

module.exports = router;