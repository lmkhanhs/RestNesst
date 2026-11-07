import { useCallback, useEffect, useRef, useState } from 'react';
import { favoriteErrorMessage, getFavorites, updateFavorite } from '../api/favorites.js';

const FAVORITES_CHANGED = 'restnesst:favorites-changed';

export default function useFavorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingIds, setPendingIds] = useState(new Set());
  const pending = useRef(new Set());
  const request = useRef(null);
  const version = useRef(0);

  const reload = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const currentVersion = ++version.current;
    if (!localStorage.getItem('accessToken')) {
      setFavorites([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const rooms = await getFavorites(controller.signal);
      if (!controller.signal.aborted && currentVersion === version.current) setFavorites(rooms);
    } catch (failure) {
      if (!controller.signal.aborted && currentVersion === version.current) {
        setError(favoriteErrorMessage(failure, 'load'));
      }
    } finally {
      if (!controller.signal.aborted && currentVersion === version.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
    window.addEventListener(FAVORITES_CHANGED, reload);
    return () => {
      request.current?.abort();
      window.removeEventListener(FAVORITES_CHANGED, reload);
    };
  }, [reload]);

  const setSaved = async (listingId, saved) => {
    if (!localStorage.getItem('accessToken')) throw new Error('Vui lòng đăng nhập để lưu chỗ nghỉ yêu thích.');
    const key = String(listingId);
    if (pending.current.has(key)) return;
    pending.current.add(key);
    setPendingIds(new Set(pending.current));
    setError('');
    try {
      await updateFavorite(listingId, saved);
      setFavorites((rooms) => saved
        ? (rooms.some((room) => String(room.id) === key) ? rooms : [...rooms, { id: listingId }])
        : rooms.filter((room) => String(room.id) !== key));
      window.dispatchEvent(new Event(FAVORITES_CHANGED));
    } catch (failure) {
      const message = favoriteErrorMessage(failure, 'update');
      setError(message);
      throw new Error(message);
    } finally {
      pending.current.delete(key);
      setPendingIds(new Set(pending.current));
    }
  };

  return {
    favorites, loading, error, reload, setSaved,
    isSaved: (id) => favorites.some((room) => String(room.id) === String(id)),
    isPending: (id) => pendingIds.has(String(id)),
  };
}
