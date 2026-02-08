const { ApiError } = require("../utils");

const errorMiddleware = (err, req, res, next) => {
  let error = err;

  // unknown error -> convert to ApiError
  if (!(error instanceof ApiError)) {
    error = new ApiError({
      statusCode: 500,
      message: err.message || "Internal Server Error",
      code: "INTERNAL_SERVER_ERROR",
      isOperational: false,
    });
  }

  return res.status(error.statusCode).json({
    success: false,
    message: error.message,
    code: error.code,
    errors: error.errors,
  });
};

module.exports = errorMiddleware;
