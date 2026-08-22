const categoryService = require('../services/treatment-category.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../middleware/asyncHandler');

/** GET /api/categories */
const getAll = asyncHandler(async (req, res) => {
  const categories = await categoryService.getCategories(req.query);
  return new ApiResponse(200, categories, 'Categories fetched').send(res);
});

/** POST /api/categories */
const create = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.body);
  return new ApiResponse(201, category, 'Category created').send(res);
});

/** PUT /api/categories/:id */
const update = asyncHandler(async (req, res) => {
  const category = await categoryService.updateCategory(req.params.id, req.body);
  return new ApiResponse(200, category, 'Category updated').send(res);
});

/** PATCH /api/categories/:id/toggle */
const toggle = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const category = await categoryService.toggleActive(req.params.id, isActive);
  const msg = isActive ? 'Category activated' : 'Category deactivated';
  return new ApiResponse(200, category, msg).send(res);
});

module.exports = { getAll, create, update, toggle };
