export const errorHandler = (err, req, res, next) => {
  // CORS Security Policy Rejection: HTTP 403 Forbidden
  if (err.message && err.message.includes('CORS error')) {
    return res.status(403).json({
      success: false,
      message: err.message,
    });
  }

  // Zod / Input Validation Errors: HTTP 400 Bad Request
  if (err.name === 'ZodError' || (err.issues && Array.isArray(err.issues)) || err.errors) {
    const issues = err.issues || err.errors || [];
    const formatted = issues.map((i) => `${(i.path || []).join('.')}: ${i.message}`).join(', ') || err.message;
    return res.status(400).json({
      success: false,
      message: `Validation Error: ${formatted}`,
      errors: issues.map((i) => ({
        field: (i.path || []).join('.'),
        message: i.message,
      })),
    });
  }

  // Multer File Upload Errors: HTTP 400 Bad Request
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds the 10MB limit. Please upload an image under 10MB.',
      });
    }
    return res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`,
    });
  }

  // Multer file filter rejection
  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // Application-defined HTTP status codes (400, 401, 403, 404, etc.)
  const statusCode = err.statusCode || (err.status && typeof err.status === 'number' ? err.status : 500);
  const message = err.message || 'Internal Server Error';

  if (statusCode >= 500) {
    console.error('⚠️ Server Error:', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'development' && statusCode >= 500 ? err.stack : undefined,
  });
};

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.method} ${req.originalUrl}`,
  });
};
