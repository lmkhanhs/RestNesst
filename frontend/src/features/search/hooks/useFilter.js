import { BACKEND_URL } from "@/shared/config/environment.js";
import { useContext } from "react";
import { SearchContext } from "@/features/search/context/SearchContext.jsx";
import axios from "axios";

export const useFilter = () => {
  const { updateSearchResults, beginSearch, failSearch } = useContext(SearchContext);

  const filterListings = async (params) => {
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
      const response = await axios.get(
        (BACKEND_URL + "/api/listings/filter"),
        {
          params: cleanParams,
          paramsSerializer: (params) => {
            const searchParams = new URLSearchParams();
            Object.keys(params).forEach((key) => {
              if (Array.isArray(params[key])) {
                // Đảm bảo mỗi ID được gửi dưới dạng số
                params[key].forEach((val) => searchParams.append(key, val));
              } else {
                searchParams.append(key, params[key]);
              }
            });
            return searchParams.toString();
          },
        }
      );
      console.log("API trả về:", response.data.result);
      console.log("Request URL:", response.config.url);
      console.log("Request Params:", response.config.params);
      updateSearchResults(response.data.result, true);
    } catch (error) {
      console.error("Filter error:", error);
      failSearch("Không tải được kết quả lọc. Vui lòng thử lại.");
    }
  };

  return { filterListings };
};
