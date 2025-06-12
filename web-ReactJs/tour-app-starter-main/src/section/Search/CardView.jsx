import { Box, Tab, Tabs } from "@mui/material";
import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import Properties from "./Properties"; // Import Properties component
import CategoryIcon from "@mui/icons-material/Category";
import { useFilter } from "../../contexts/useFilter"; // Thêm dòng này

CardView.propTypes = {
  value: PropTypes.number,
  handleChangeTab: PropTypes.func,
  searchResults: PropTypes.array, // Thêm prop cho kết quả tìm kiếm
  isSearching: PropTypes.bool, // Thêm prop để biết đang trong trạng thái tìm kiếm
  refreshKey: PropTypes.number, // Thêm refreshKey
};

function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

CustomTabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

export default function CardView(props) {
  const [tabData, setTabData] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const { filterListings } = useFilter(); // Thêm dòng này

  // Hàm gọi API để lấy dữ liệu các tab
  const fetchTabsData = async () => {
    try {
      const response = await fetch("http://175.41.233.105:8080/api/categories");
      const data = await response.json();
      // Thêm tab "Tất cả danh mục" vào đầu mảng
      const allCategoriesTab = {
        id: "all",
        name: "Tất cả danh mục",
        thumnailUrl: "/images/all-categories.png",
      };
      setTabData([allCategoriesTab, ...data.result]);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu danh mục: ", error);
    }
  };

  // Hàm gọi API để lấy dữ liệu properties theo id tab
  const fetchProperties = async (id) => {
    setLoading(true);
    try {
      let url = "http://175.41.233.105:8080/api/listings";
      if (id !== "all") {
        url = `http://175.41.233.105:8080/api/listings/filter?category_id=${id}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      console.log("API data:", data.result); // Thêm dòng này để kiểm tra
      setProperties(data.result);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu bất động sản: ", error);
    } finally {
      setLoading(false);
    }
  };

  // Gọi fetchTabsData khi component mount
  useEffect(() => {
    fetchTabsData();
  }, []);

  // Gọi fetchProperties khi tab thay đổi và không đang trong trạng thái tìm kiếm
  useEffect(() => {
    if (tabData.length > 0 && !props.isSearching) {
      const currentTabData = tabData[props.value];
      fetchProperties(currentTabData.id);
    }
  }, [props.value, tabData, props.isSearching, props.refreshKey]);

  // Cập nhật properties khi có kết quả tìm kiếm
  useEffect(() => {
    if (props.isSearching && props.searchResults) {
      setProperties(props.searchResults);
    }
  }, [props.searchResults, props.isSearching]);

  // Sửa hàm handleChangeTab để gọi filterListings
  const handleChangeTab = (event, newValue) => {
    if (tabData.length > 0) {
      const selectedCategory = tabData[newValue];
      // Gọi filterListings với category_id
      filterListings({
        category_id: selectedCategory.id === "all" ? "" : selectedCategory.id,
      });
    }
    // Gọi callback nếu cần thay đổi tab index ở parent
    if (props.handleChangeTab) props.handleChangeTab(event, newValue);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={props.value}
          onChange={handleChangeTab}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          {tabData.map((tab) => (
            <Tab
              key={tab.id}
              label={tab.name}
              icon={
                tab.id === "all" ? (
                  <CategoryIcon
                    sx={{
                      fontSize: 30,
                      marginRight: "15px",
                      color: "primary.main",
                    }}
                  />
                ) : (
                  <img
                    src={`http://175.41.233.105:8080${tab.thumnailUrl}`}
                    alt={tab.name}
                    style={{
                      width: "30px",
                      height: "30px",
                      objectFit: "cover",
                      marginRight: "15px",
                    }}
                  />
                )
              }
              style={{
                fontWeight: "bold",
                fontSize: "14px",
                padding: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textTransform: "none",
                minWidth: "120px",
              }}
            />
          ))}
        </Tabs>
      </Box>

      {tabData.map((tab, index) => (
        <CustomTabPanel value={props.value} index={index} key={tab.id}>
          {loading ? (
            <div>Đang tải...</div>
          ) : (
            <Properties properties={properties} />
          )}
        </CustomTabPanel>
      ))}
    </Box>
  );
}
