import PropTypes from "prop-types";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Provider as ReduxProvider } from "react-redux";
import { PersistGate } from "redux-persist/lib/integration/react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { viVN } from "@mui/x-date-pickers/locales";
import "dayjs/locale/vi";

import { store, persistor } from "./store/store.js";
import { SearchProvider } from "@/features/search/context/SearchContext.jsx";
import { SettingsProvider } from "@/shared/contexts/SettingsContext.jsx";
import { CollapseDrawerProvider } from "@/shared/contexts/CollapseDrawerContext.jsx";
import ThemeProvider from "@/shared/theme/index.jsx";
import ThemeColorPresets from "@/shared/components/ThemeColorPresets.jsx";
import RtlLayout from "@/shared/components/RtlLayout.jsx";
import NotistackProvider from "@/shared/components/NotistackProvider.jsx";
import MotionLazyContainer from "@/shared/components/animate/MotionLazyContainer.jsx";

export default function AppProviders({ children }) {
  return (
    <HelmetProvider>
      <ReduxProvider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi"
            localeText={viVN.components.MuiLocalizationProvider.defaultProps.localeText}>
            <SettingsProvider>
              <CollapseDrawerProvider>
                <SearchProvider>
                  <BrowserRouter>
                    <ThemeProvider>
                      <ThemeColorPresets>
                        <RtlLayout>
                          <NotistackProvider>
                            <MotionLazyContainer>{children}</MotionLazyContainer>
                          </NotistackProvider>
                        </RtlLayout>
                      </ThemeColorPresets>
                    </ThemeProvider>
                  </BrowserRouter>
                </SearchProvider>
              </CollapseDrawerProvider>
            </SettingsProvider>
          </LocalizationProvider>
        </PersistGate>
      </ReduxProvider>
    </HelmetProvider>
  );
}

AppProviders.propTypes = {
  children: PropTypes.node.isRequired,
};
