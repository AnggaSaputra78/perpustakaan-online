const authService = require('../services/auth.service');
const { successResponse, errorResponse } = require('../utils/response');

class AuthController {
  async register(req, res) {
    try {
      const result = await authService.register(req.body);
      return successResponse(res, result, 'Registrasi berhasil', 201);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async login(req, res) {
    try {
      const result = await authService.login(req.body);
      return successResponse(res, result, 'Login berhasil');
    } catch (error) {
      return errorResponse(res, error.message, 401);
    }
  }

  async getProfile(req, res) {
    try {
      const user = await authService.getProfile(req.user.id);
      return successResponse(res, user);
    } catch (error) {
      return errorResponse(res, error.message, 404);
    }
  }

  async updateProfile(req, res) {
    try {
      const updateData = { ...req.body };
      
      if (req.file) {
        updateData.avatar = `/uploads/profiles/${req.file.filename}`;
      }

      const user = await authService.updateProfile(req.user.id, updateData);
      return successResponse(res, user, 'Profil berhasil diupdate');
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }
}

module.exports = new AuthController();