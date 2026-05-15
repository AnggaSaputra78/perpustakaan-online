const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const { uploadProfile } = require('../middleware/upload');
const { validate } = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../validations/auth.validation');

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, uploadProfile.single('avatar'), authController.updateProfile);

module.exports = router;