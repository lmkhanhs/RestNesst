import { BACKEND_URL } from "@/shared/config/environment.js";
import { useCallback, useContext, useEffect, useRef } from "react";
import { SearchContext } from "@/features/search/context/SearchContext.jsx";
import axios from "axios";

const DEFAULT_FILTER_DEBOUNCE_MS = 450;

export const useFilter = () => {
  const { updateSearchResults, beginSearch, failSearch } = useContext(SearchContext);
  const debounceTimerRef = useRef(null);
  const pendingParamsRef = useRef(null);
  const abortControllerRef = useRef(null);

  const clearPendingTimer = useCallback(() => {
    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    pendingParamsRef.current = null;
  }, []);

  const cancelPendingFilter = useCallback(() => {
    clearPendingTimer();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, [clearPendingTimer]);

  useEffect(() => () => cancelPendingFilter(), [cancelPendingFilter]);

  const filterListings = useCallback(
    async (params = {}) => {
      clearPendingTimer();

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Xóa các trường rỗng hoặc không hợp lệ
      const cleanParams = {};
      Object.keys(params).forEach((key) => {
        if (Array.isArray(params[key]) && params[key].length > 0) {
          cleanParams[key] = params[key];
        } else if (
          typeof params[key] === "boolean" ||
          (typeof params[key] === "number" && Number.isFinite(params[key]))
        ) {
          cleanParams[key] = params[key];
        } else if (typeof params[key] === "string" && params[key].trim() !== "") {
          cleanParams[key] = params[key];
        }
      });

      beginSearch();
      try {
        const response = await axios.get(BACKEND_URL + "/api/listings/filter", {
          params: cleanParams,
          signal: controller.signal,
          paramsSerializer: (queryParams) => {
            const searchParams = new URLSearchParams();
            Object.keys(queryParams).forEach((key) => {
              if (Array.isArray(queryParams[key])) {
                // Đảm bảo mỗi ID được gửi dưới dạng số
                queryParams[key].forEach((val) => searchParams.append(key, val));
              } else {
                searchParams.append(key, queryParams[key]);
              }
            });
            return searchParams.toString();
          },
        });
        if (controller.signal.aborted) return;
        updateSearchResults(response.data.result, true);
      } catch (error) {
        if (
          controller.signal.aborted ||
          axios.isCancel?.(error) ||
          error?.code === "ERR_CANCELED" ||
          error?.name === "CanceledError"
        ) {
          return;
        }
        console.error("Filter error:", error);
        failSearch("Không tải được kết quả lọc. Vui lòng thử lại.");
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    },
    [beginSearch, clearPendingTimer, failSearch, updateSearchResults]
  );

  const debouncedFilterListings = useCallback(
    (params = {}, delayMs = DEFAULT_FILTER_DEBOUNCE_MS) => {
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current);
      }
      pendingParamsRef.current = params;
      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
        const latestParams = pendingParamsRef.current;
        pendingParamsRef.current = null;
        filterListings(latestParams || {});
      }, delayMs);
    },
    [filterListings]
  );

  const flushPendingFilter = useCallback(() => {
    if (debounceTimerRef.current !== null && pendingParamsRef.current !== null) {
      const latestParams = pendingParamsRef.current;
      clearPendingTimer();
      filterListings(latestParams);
    }
  }, [clearPendingTimer, filterListings]);

  return {
    filterListings,
    debouncedFilterListings,
    flushPendingFilter,
    cancelPendingFilter,
  };
};
