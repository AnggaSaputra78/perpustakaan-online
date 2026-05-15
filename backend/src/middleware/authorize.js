const { errorResponse } = require('../utils/response');

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Unauthorized', 401);
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(res, 'Forbidden: Anda tidak memiliki akses', 403);
    }

    next();
  };
};

module.exports = { authorize };