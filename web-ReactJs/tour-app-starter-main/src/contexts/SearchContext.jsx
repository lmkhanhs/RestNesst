import React, { createContext, useState } from "react";

export const SearchContext = createContext();

export const SearchProvider = ({ children }) => {
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [defaultProperties, setDefaultProperties] = useState([]);

  const updateSearchResults = (results, searching) => {
    setSearchResults(results);
    setIsSearching(searching);
  };

  return (
    <SearchContext.Provider
      value={{
        searchResults,
        isSearching,
        defaultProperties,
        setDefaultProperties,
        updateSearchResults,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};
