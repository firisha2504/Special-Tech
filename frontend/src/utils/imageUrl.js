/**
 * Special Tech Image Resolution and Validation Utility
 *
 * Corrects and normalizes image URLs across the application:
 * - Immediate blob: preview URLs
 * - Base64 data: URIs
 * - Full HTTP/HTTPS URLs (e.g. Unsplash, external CDNs)
 * - Relative backend paths (e.g. /uploads/image-xxx.jpeg)
 * - Cleans duplicate path segments like /uploads/uploads/
 */

export const getImageUrl = (imagePath, fallback = '') => {
  if (!imagePath || typeof imagePath !== 'string') {
    return fallback;
  }

  const trimmed = imagePath.trim();
  if (!trimmed) {
    return fallback;
  }

  // Already a full external URL, blob preview, or base64 data URI
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }

  // Normalize duplicate /uploads/ or missing leading slash
  let cleanPath = trimmed;
  cleanPath = cleanPath.replace(/^\/?(uploads\/)+/i, '/uploads/');
  if (!cleanPath.startsWith('/')) {
    cleanPath = `/${cleanPath}`;
  }

  // Determine backend base origin
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5050/api';
  const backendBase = (
    import.meta.env.VITE_BACKEND_URL ||
    apiBase.replace(/\/api\/?$/, '') ||
    'http://localhost:5050'
  ).replace(/\/$/, '');

  return `${backendBase}${cleanPath}`;
};

/**
 * Validates whether a file is an accepted image type and within size limits.
 * Accepts: JPEG, JPG, PNG, WebP
 * Max Size: 10MB
 */
export const validateImageFile = (file, maxSizeMB = 10) => {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  const allowedExtensions = /\.(jpeg|jpg|png|webp)$/i;

  const hasValidType = allowedTypes.includes(file.type);
  const hasValidExt = allowedExtensions.test(file.name);

  if (!hasValidType && !hasValidExt) {
    return {
      valid: false,
      error: 'Please select a valid image file (JPEG, JPG, PNG, or WebP).',
    };
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `Image size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the maximum allowed limit of ${maxSizeMB}MB.`,
    };
  }

  return { valid: true, error: null };
};
