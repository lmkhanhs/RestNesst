import { pxToRem, responsiveFontSizes } from "@/shared/utils/getFontValue.js";

// ----------------------------------------------------------------------

const FONT_PRIMARY = '"Be Vietnam Pro", "Public Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'; // Google Font
// const FONT_SECONDARY = 'CircularStd, sans-serif'; // Local Font

const typography = {
  fontFamily: FONT_PRIMARY,
  fontWeightRegular: 400,
  fontWeightMedium: 600,
  fontWeightBold: 700,
  h1: {
    fontWeight: 800,
    lineHeight: 1.2,
    fontSize: pxToRem(34),
    letterSpacing: -0.5,
    ...responsiveFontSizes({ sm: 42, md: 48, lg: 52 }),
  },
  h2: {
    fontWeight: 700,
    lineHeight: 1.25,
    fontSize: pxToRem(28),
    letterSpacing: -0.3,
    ...responsiveFontSizes({ sm: 32, md: 36, lg: 40 }),
  },
  h3: {
    fontWeight: 700,
    lineHeight: 1.35,
    fontSize: pxToRem(22),
    ...responsiveFontSizes({ sm: 24, md: 28, lg: 30 }),
  },
  h4: {
    fontWeight: 700,
    lineHeight: 1.4,
    fontSize: pxToRem(19),
    ...responsiveFontSizes({ sm: 20, md: 22, lg: 24 }),
  },
  h5: {
    fontWeight: 700,
    lineHeight: 1.45,
    fontSize: pxToRem(17),
    ...responsiveFontSizes({ sm: 18, md: 19, lg: 20 }),
  },
  h6: {
    fontWeight: 700,
    lineHeight: 1.45,
    fontSize: pxToRem(16),
    ...responsiveFontSizes({ sm: 17, md: 18, lg: 18 }),
  },
  subtitle1: {
    fontWeight: 600,
    lineHeight: 1.5,
    fontSize: pxToRem(16),
  },
  subtitle2: {
    fontWeight: 600,
    lineHeight: 22 / 14,
    fontSize: pxToRem(14),
  },
  body1: {
    lineHeight: 1.6,
    fontSize: pxToRem(16),
  },
  body2: {
    lineHeight: 1.55,
    fontSize: pxToRem(14),
  },
  caption: {
    lineHeight: 1.5,
    fontSize: pxToRem(12),
  },
  overline: {
    fontWeight: 700,
    lineHeight: 1.5,
    fontSize: pxToRem(12),
    textTransform: " uppercase",
  },
  button: {
    fontWeight: 600,
    lineHeight: 24 / 14,
    fontSize: pxToRem(14),
    textTransform: "none",
  },
};

export default typography;
