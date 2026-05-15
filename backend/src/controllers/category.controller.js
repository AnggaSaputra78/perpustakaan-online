const categoryService = require('../services/category.service');
const { successResponse, errorResponse } = require('../utils/response');

class CategoryController {
  async getAllCategories(req, res) {
    try {
      const categories = await categoryService.getAllCategories();
      return successResponse(res, categories);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async getCategoryBySlug(req, res) {
    try {
      const category = await categoryService.getCategoryBySlug(req.params.slug);
      return successResponse(res, category);
    } catch (error) {
      return errorResponse(res, error.message, 404);
    }
  }
}

module.exports = new CategoryController();