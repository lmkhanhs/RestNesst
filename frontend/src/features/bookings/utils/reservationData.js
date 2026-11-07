import dayjs from 'dayjs';
import { getMediaUrl } from '@/shared/utils/mediaUrl.js';

function nonNegativeNumber(value) {
  if ((typeof value !== 'number' && typeof value !== 'string') || String(value).trim() === '') return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function bookingDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return dayjs(value).isValid() && dayjs(value).format('YYYY-MM-DD') === value ? value : null;
}

// Route state combines the booking response with display-only listing information.
// Missing required booking data must never reach formatting or payment code.
export function normalizeReservationData(value) {
  if (!value || typeof value !== 'object') return null;
  const price = nonNegativeNumber(value.price);
  const totalPrice = nonNegativeNumber(value.totalPrice);
  const bookingId = nonNegativeNumber(value.bookingId);
  const checkIn = bookingDate(value.checkIn ?? value.checkInDate);
  const checkOut = bookingDate(value.checkOut ?? value.checkOutDate);
  if (!bookingId || !Number.isInteger(bookingId) || price === null || totalPrice === null
      || !checkIn || !checkOut || dayjs(checkOut).isBefore(dayjs(checkIn), 'day')
      || typeof value.title !== 'string' || !value.title.trim()) return null;

  const images = Array.isArray(value.images) ? value.images : [];
  const imageUrl = images.map((image) => getMediaUrl(typeof image === 'string' ? image : image?.imageUrl))
    .find(Boolean) || getMediaUrl(value.primaryUrl);
  const reviewCount = Array.isArray(value.reviews) ? value.reviews.length : nonNegativeNumber(value.reviews) ?? 0;
  return {
    ...value,
    bookingId,
    price,
    totalPrice,
    checkIn,
    checkOut,
    imageUrl,
    reviewCount,
    avgStart: nonNegativeNumber(value.avgStart),
    numberOfNights: nonNegativeNumber(value.numberOfNights) || Math.max(1, dayjs(checkOut).diff(dayjs(checkIn), 'day')),
    guests: nonNegativeNumber(value.guests) || 1,
  };
}
