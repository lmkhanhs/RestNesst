import { useContext, useEffect } from "react";
import { SearchContext } from "@/features/search/context/SearchContext.jsx";
import { Box, Container, Grid } from "@mui/material";
import { SearchResults } from "@/features/search/components/results/index.js";
import Filter from "@/features/search/components/filters/SearchFilters.jsx";
import axios from "axios";

const Home = () => {
  const {
    searchResults,
    isSearching,
    defaultProperties,
    setDefaultProperties,
  } = useContext(SearchContext);

  useEffect(() => {
    // Fetch tất cả phòng khi load trang
    const fetchDefaultProperties = async () => {
      const res = await axios.get("http://175.41.233.105:8080/api/listings");
      setDefaultProperties(res.data.result);
    };
    fetchDefaultProperties();
  }, [setDefaultProperties]);

  return (
    <Container maxWidth="xl">
      <Box>
        <Grid container>
          <Grid item md={3} xs={12}>
            <Filter />
          </Grid>
          <Grid item md={9} xs={12}>
            <SearchResults
              properties={defaultProperties}
              searchResults={searchResults}
              isSearching={isSearching}
            />
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Home;
