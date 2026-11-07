export { getMediaUrl as getPropertyMediaUrl } from '@/shared/utils/mediaUrl.js';

export function formatPropertyDate(value) {
  if (!value) return 'Chưa cập nhật';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Chưa cập nhật' : date.toLocaleDateString('vi-VN');
}
