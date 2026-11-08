import PropTypes from 'prop-types';
import { useEffect, useMemo } from 'react';
// @mui
import { alpha, ThemeProvider, createTheme, useTheme } from '@mui/material/styles';
// hooks
import useSettings from '@/shared/hooks/useSettings.js';
//
import componentsOverride from '@/shared/theme/overrides/index.js';

// ----------------------------------------------------------------------

ThemeColorPresets.propTypes = {
  children: PropTypes.node,
};

export default function ThemeColorPresets({ children }) {
  const defaultTheme = useTheme();
  const { setColor } = useSettings();

  useEffect(() => {
    const root = document.documentElement;
    const isDark = defaultTheme.palette.mode === 'dark';
    root.style.setProperty('--rn-primary', setColor.main);
    root.style.setProperty('--rn-primary-hover', setColor.dark);
    root.style.setProperty('--rn-primary-contrast', setColor.contrastText || '#FFFFFF');
    root.style.setProperty(
      '--rn-primary-soft',
      isDark ? alpha(setColor.main, 0.22) : setColor.lighter || alpha(setColor.main, 0.12)
    );
  }, [setColor, defaultTheme.palette.mode]);

  const themeOptions = useMemo(
    () => ({
      ...defaultTheme,
      palette: {
        ...defaultTheme.palette,
        primary: setColor,
      },
      customShadows: {
        ...defaultTheme.customShadows,
        primary: `0 8px 16px 0 ${alpha(setColor.main, 0.24)}`,
      },
    }),
    [setColor, defaultTheme]
  );

  const theme = createTheme(themeOptions);
  theme.components = componentsOverride(theme);

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
