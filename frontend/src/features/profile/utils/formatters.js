import dayjs from 'dayjs';

export function formatProfileDate(value) {
  if (!value || !dayjs(value).isValid()) return 'Chưa cập nhật';
  return dayjs(value).format('DD/MM/YYYY');
}

export function formatProfilePrice(value) {
  if (value == null || !Number.isFinite(Number(value))) return 'Chưa cập nhật';
  return `${Number(value).toLocaleString('vi-VN')} ₫`;
}
