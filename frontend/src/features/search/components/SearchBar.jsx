import { Box, Button, CircularProgress, IconButton, TextField } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import { useState, useContext } from "react";
import axiosInstance from "@/shared/api/httpClient.js";
import { SearchContext } from "@/features/search/context/SearchContext.jsx";

export default function SearchBar() {
  const { updateSearchResults, beginSearch, failSearch, isSearchLoading } = useContext(SearchContext);
  const [keyword, setKeyword] = useState("");

  const handleSearch = async (event) => {
    event.preventDefault();
    beginSearch();
    try {
      const response = await axiosInstance.get("/api/listings/search", { params: { keyword: keyword.trim() } });
      updateSearchResults(response.data.result, true);
    } catch {
      failSearch("Không thể tìm kiếm lúc này. Vui lòng thử lại.");
    }
  };

  const handleClear = () => {
    setKeyword("");
    updateSearchResults([], false);
  };

  return (
    <Box
      component="form"
      role="search"
      aria-label="Tìm kiếm phòng và điểm đến"
      onSubmit={handleSearch}
      sx={{
        order: { xs: 3, sm: 0 },
        flex: { sm: 1 },
        width: { xs: "100%", sm: "auto" },
        minWidth: 0,
        maxWidth: 680,
        mx: "auto",
        p: 0.625,
        pl: { xs: 1.25, sm: 1.75 },
        display: "flex",
        alignItems: "center",
        gap: 0.75,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: "999px",
        bgcolor: "background.paper",
        boxShadow: "0 2px 10px rgba(15, 23, 42, 0.05)",
        transition: "border-color 180ms ease, box-shadow 180ms ease",
        "&:focus-within": {
          borderColor: "primary.main",
          boxShadow: "0 4px 16px rgba(217, 27, 66, 0.12)",
        },
      }}
    >
      <PlaceOutlinedIcon
        aria-hidden="true"
        sx={{ color: "primary.main", fontSize: 22, flexShrink: 0 }}
      />
      <TextField
        variant="standard"
        fullWidth
        placeholder="Tìm theo thành phố, địa chỉ hoặc tên chỗ ở..."
        value={keyword}
        onChange={(event) => setKeyword(event.target.value)}
        inputProps={{ "aria-label": "Tìm kiếm chỗ ở" }}
        InputProps={{
          disableUnderline: true,
          sx: {
            px: 0.75,
            fontSize: { xs: "0.9375rem", sm: "0.975rem" },
            fontWeight: 500,
            color: "text.primary",
          },
        }}
      />
      {keyword && (
        <IconButton
          type="button"
          aria-label="Xóa từ khóa tìm kiếm"
          onClick={handleClear}
          size="small"
          sx={{
            width: 36,
            height: 36,
            flexShrink: 0,
            color: "text.secondary",
          }}
        >
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      )}
      <Button
        type="submit"
        variant="contained"
        color="primary"
        aria-label="Tìm kiếm"
        disabled={isSearchLoading}
        className="rn-interactive-btn"
        sx={{
          minWidth: { xs: 44, sm: 112 },
          height: 44,
          px: { xs: 1.25, sm: 2.25 },
          borderRadius: "999px",
          flexShrink: 0,
          fontWeight: 700,
          gap: 0.75,
          boxShadow: "none",
        }}
      >
        {isSearchLoading ? (
          <CircularProgress size={20} color="inherit" />
        ) : (
          <>
            <SearchIcon sx={{ fontSize: 20 }} />
            <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
              Tìm phòng
            </Box>
          </>
        )}
      </Button>
    </Box>
  );
}
