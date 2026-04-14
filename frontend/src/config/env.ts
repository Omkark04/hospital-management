/**
 * Typed wrapper around Vite environment variables.
 * All env vars must be prefixed with VITE_ in .env.local
 */
const env = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL as string,
  CLOUDINARY_CLOUD_NAME: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string,
  IS_DEV: import.meta.env.DEV as boolean,
}

if (!env.API_BASE_URL) {
  console.warn('[config/env] VITE_API_BASE_URL is not set — defaulting to /api/v1')
}

export default {
  ...env,
  API_BASE_URL: env.API_BASE_URL ?? '/api/v1',
}
