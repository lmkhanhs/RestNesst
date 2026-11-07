import { BACKEND_URL } from '@/shared/config/environment.js';

// Local upload paths belong to the backend; cloud and browser preview URLs are complete.
export function getMediaUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const path = value.trim();
  if (/^(https?:\/\/|\/\/|data:image\/|blob:)/i.test(path)) return path;
  if (/^[a-z][a-z\d+.-]*:/i.test(path)) return undefined;
  return `${BACKEND_URL}/${path.replace(/^\/+/, '')}`;
}
