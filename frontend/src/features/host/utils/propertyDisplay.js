import dayjs from 'dayjs';

export function normalizeHostProperty(item) {
  return {
    ...item,
    title: item.title || item.name || 'Chỗ ở chưa đặt tên',
    address: item.address || '',
    status: String(item.status || '').trim().toUpperCase(),
    images: Array.isArray(item.images) ? item.images : [],
    amenites: Array.isArray(item.amenites) ? item.amenites : [],
    categories: Array.isArray(item.categories) ? item.categories : [],
  };
}

export function formatHostPrice(value) {
  if (value == null || !Number.isFinite(Number(value))) return 'Chưa cập nhật';
  return `${Number(value).toLocaleString('vi-VN')} ₫`;
}

export function formatHostDate(value) {
  return value && dayjs(value).isValid() ? dayjs(value).format('DD/MM/YYYY') : 'Chưa cập nhật';
}

export const propertyStatuses = {
  ACTIVE: { label: 'Đang hoạt động', color: 'success' },
  INACTIVE: { label: 'Tạm ngưng', color: 'warning' },
  OCCUPIED: { label: 'Đang có khách', color: 'info' },
  AVAILABLE: { label: 'Còn trống', color: 'success' },
};
