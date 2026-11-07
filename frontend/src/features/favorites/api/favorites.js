import axiosInstance from '@/shared/api/httpClient.js';

export async function getFavorites(signal) {
  const response = await axiosInstance.get('/api/users/favorites', { signal });
  const favorites = response.data?.result?.favorites;
  if (!Array.isArray(favorites)) throw new Error('Không thể đọc danh sách yêu thích.');
  return favorites;
}

export function updateFavorite(listingId, saved) {
  return saved
    ? axiosInstance.post('/api/users/favorites', { listingId })
    : axiosInstance.delete('/api/users/favorites', { data: { listingId } });
}

export function favoriteErrorMessage(failure, action) {
  const status = failure.response?.status;
  if (status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để dùng danh sách yêu thích.';
  if (status === 403) return 'Bạn chưa có quyền thực hiện thao tác yêu thích này.';
  return action === 'load'
    ? 'Không thể tải danh sách yêu thích. Vui lòng thử lại sau.'
    : 'Không thể cập nhật yêu thích. Vui lòng thử lại sau.';
}
