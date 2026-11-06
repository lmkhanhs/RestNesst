import { createContext, useCallback, useState } from "react";
import PropTypes from "prop-types";

export const SearchContext = createContext();

export const SearchProvider = ({ children }) => {
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [defaultProperties, setDefaultProperties] = useState([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  const beginSearch = useCallback(() => {
    setIsSearchLoading(true);
    setSearchError("");
  }, []);

  const updateSearchResults = useCallback((results, searching) => {
    setSearchResults(Array.isArray(results) ? results : []);
    setIsSearching(searching);
    setIsSearchLoading(false);
    setSearchError("");
  }, []);

  const failSearch = useCallback((message) => {
    setSearchError(message);
    setIsSearchLoading(false);
  }, []);

  return (
    <SearchContext.Provider value={{ searchResults, isSearching, defaultProperties,
      setDefaultProperties, updateSearchResults, isSearchLoading, searchError, beginSearch, failSearch }}>
      {children}
    </SearchContext.Provider>
  );
};

SearchProvider.propTypes = { children: PropTypes.node.isRequired };
