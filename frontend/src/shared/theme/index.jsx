import PropTypes from 'prop-types';
import { useMemo, useEffect } from 'react';
// @mui
import { CssBaseline } from '@mui/material';
import { createTheme, ThemeProvider as MUIThemeProvider, StyledEngineProvider } from '@mui/material/styles';
//
import palette from './palette.js';
import typography from './typography.js';
import breakpoints from './breakpoints.js';
import componentsOverride from '@/shared/theme/overrides/index.js';
import shadows, { customShadows } from './shadows.js';
import useSettings from '@/shared/hooks/useSettings.js';

// ----------------------------------------------------------------------

ThemeProvider.propTypes = {
  children: PropTypes.node,
};

export default function ThemeProvider({ children }) {
  const { themeMode, themeDirection } = useSettings();
  const isLight = themeMode === 'light';

  useEffect(() => {
    const mode = isLight ? 'light' : 'dark';
    document.documentElement.dataset.theme = mode;
    document.documentElement.style.colorScheme = mode;
  }, [isLight]);

  const themeOptions = useMemo(
    () => ({
      palette: isLight ? palette.light : palette.dark,
      typography,
      breakpoints,
      shape: { borderRadius: 8 },
      direction: themeDirection,
      shadows: isLight ? shadows.light : shadows.dark,
      customShadows: isLight ? customShadows.light : customShadows.dark,
    }),
    [isLight, themeDirection]
  );

  const theme = createTheme(themeOptions);
  theme.components = componentsOverride(theme);

  return (
    <StyledEngineProvider injectFirst>
      <MUIThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MUIThemeProvider>
    </StyledEngineProvider>
  );
}
