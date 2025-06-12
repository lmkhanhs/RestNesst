import { useContext } from "react";
import { SearchContext } from "./SearchContext";
import axios from "axios";

export const useFilter = () => {
  const { updateSearchResults } = useContext(SearchContext);

  const filterListings = async (params) => {
    // Xóa các trường rỗng hoặc không hợp lệ
    const cleanParams = {};
    Object.keys(params).forEach((key) => {
      if (Array.isArray(params[key]) && params[key].length > 0) {
        cleanParams[key] = params[key];
      } else if (
        typeof params[key] === "boolean" ||
        typeof params[key] === "number"
      ) {
        cleanParams[key] = params[key];
      } else if (typeof params[key] === "string" && params[key].trim() !== "") {
        cleanParams[key] = params[key];
      }
    });

    try {
      const response = await axios.get(
        "http://175.41.233.105:8080/api/listings/filter",
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
      updateSearchResults([], false);
    }
  };

  return { filterListings };
};
