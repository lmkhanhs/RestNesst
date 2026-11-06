import { BACKEND_URL } from '@/shared/config/environment.js';

export function getPropertyMediaUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const path = value.trim();
  if (/^(https?:\/\/|data:image\/|blob:)/i.test(path)) return path;
  if (/^[a-z][a-z\d+.-]*:/i.test(path)) return undefined;
  return `${BACKEND_URL}/${path.replace(/^\/+/, '')}`;
}

export function formatPropertyDate(value) {
  if (!value) return 'Chưa cập nhật';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Chưa cập nhật' : date.toLocaleDateString('vi-VN');
}
