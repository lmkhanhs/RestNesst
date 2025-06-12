import { Box, Card, IconButton, TextField } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { styled } from "@mui/material/styles";
import { useState, useContext } from "react";
import axios from "axios";
import { SearchContext } from "../../contexts/SearchContext";

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  background: theme.palette.primary.main,
  color: "white",
  "&:hover": {
    backgroundColor: theme.palette.primary.dark,
  },
  height: 48,
  width: 48,
  borderRadius: "50%",
  boxShadow: "0 2px 8px rgba(255,56,92,0.15)",
  fontSize: 22,
  marginLeft: 12,
  transition: "background 0.2s",
}));

const Inputt = () => {
  const { updateSearchResults } = useContext(SearchContext);
  const [keyword, setKeyword] = useState("");

  const handleSearch = async () => {
    try {
      let url = "http://175.41.233.105:8080/api/listings/search?";
      const params = new URLSearchParams();
      if (keyword) params.append("keyword", keyword);
      const response = await axios.get(`${url}${params.toString()}`);
      updateSearchResults(response.data.result, true);
    } catch (error) {
      console.error("Lỗi khi tìm kiếm:", error);
      updateSearchResults([], false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <Box
      sx={{ width: "50%", maxWidth: 1400, mx: "auto", mt: 0.5, maxHeight: 70 }}
    >
      <Card
        sx={{
          p: 1.5,
          borderRadius: 8,
          boxShadow: 3,
          maxWidth: 1400,
          width: "100%",
          maxHeight: 880,
          mx: "auto",
          display: "flex",
          alignItems: "center",
          background: "rgba(24,24,24,0.95)",
        }}
      >
        <TextField
          variant="outlined"
          fullWidth
          placeholder="Tìm kiếm địa điểm, tên phòng, ..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyPress={handleKeyPress}
          InputProps={{
            sx: {
              borderRadius: 8,
              background: "#181818",
              color: "#fff",
              fontWeight: 500,
              fontSize: 18,
              maxHeight: 50,
              px: 2,
              boxShadow: "0 2px 8px rgba(255,56,92,0.08)",
              height: 56,
            },
          }}
        />
        <StyledIconButton onClick={handleSearch}>
          <SearchIcon />
        </StyledIconButton>
      </Card>
    </Box>
  );
};

export default Inputt;
