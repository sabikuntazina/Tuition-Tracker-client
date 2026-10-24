export function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Resource not found at ${req.originalUrl}`
  });
}

export function errorHandler(err, req, res, next) {
  console.error(`[Error] ${req.method} ${req.url}:`, err);

  // MongoDB duplicate key error
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'A duplicate record already exists with these details.',
      error: err.keyValue
    });
  }

  // Handle invalid ObjectId errors
  if (err.name === 'BSONError' || err.message?.includes('Argument passed in must be a string of 12 bytes or a string of 24 hex characters')) {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format provided.'
    });
  }

  const statusCode = err.statusCode || res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}
