const { errorResponse } = require('../utils/response');

const validate = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      const errors = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return errorResponse(res, 'Validasi gagal', 400, errors);
    }
  };
};

module.exports = { validate };