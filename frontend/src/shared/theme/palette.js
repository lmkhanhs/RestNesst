import { alpha } from "@mui/material/styles";

// ----------------------------------------------------------------------

function createGradient(color1, color2) {
  return `linear-gradient(to bottom, ${color1}, ${color2})`;
}

// SETUP COLORS
const PRIMARY = {
  lighter: "#FFE4E8",
  light: "#FB7185",
  main: "#D91B42",
  dark: "#B81436",
  darker: "#881337",
};
const SECONDARY = {
  lighter: "#CCFBF1",
  light: "#5EEAD4",
  main: "#0F766E",
  dark: "#115E59",
  darker: "#134E4A",
};
const INFO = {
  lighter: "#E0F2FE",
  light: "#38BDF8",
  main: "#0284C7",
  dark: "#0369A1",
  darker: "#075985",
};
const SUCCESS = {
  lighter: "#DCFCE7",
  light: "#4ADE80",
  main: "#15803D",
  dark: "#166534",
  darker: "#14532D",
};
const WARNING = {
  lighter: "#FEF3C7",
  light: "#FBBF24",
  main: "#B45309",
  dark: "#92400E",
  darker: "#78350F",
};
const ERROR = {
  lighter: "#FEE2E2",
  light: "#F87171",
  main: "#DC2626",
  dark: "#B91C1C",
  darker: "#7F1D1D",
};

const GREY = {
  0: "#FFFFFF",
  100: "#F8FAFC",
  200: "#F1F5F9",
  300: "#E2E8F0",
  400: "#CBD5E1",
  500: "#64748B",
  600: "#475569",
  700: "#334155",
  800: "#0F172A",
  900: "#090D16",
  500_8: alpha("#64748B", 0.08),
  500_12: alpha("#64748B", 0.12),
  500_16: alpha("#64748B", 0.16),
  500_24: alpha("#64748B", 0.24),
  500_32: alpha("#64748B", 0.32),
  500_48: alpha("#64748B", 0.48),
  500_56: alpha("#64748B", 0.56),
  500_80: alpha("#64748B", 0.8),
};

const GRADIENTS = {
  primary: createGradient(PRIMARY.light, PRIMARY.main),
  info: createGradient(INFO.light, INFO.main),
  success: createGradient(SUCCESS.light, SUCCESS.main),
  warning: createGradient(WARNING.light, WARNING.main),
  error: createGradient(ERROR.light, ERROR.main),
};

const CHART_COLORS = {
  violet: ["#826AF9", "#9E86FF", "#D0AEFF", "#F7D2FF"],
  blue: ["#2D99FF", "#83CFFF", "#A5F3FF", "#CCFAFF"],
  green: ["#2CD9C5", "#60F1C8", "#A4F7CC", "#C0F2DC"],
  yellow: ["#FFE700", "#FFEF5A", "#FFF7AE", "#FFF3D6"],
  red: ["#FF6C40", "#FF8F6D", "#FFBD98", "#FFF2D4"],
};

const COMMON = {
  common: { black: "#000", white: "#fff" },
  primary: { ...PRIMARY, contrastText: "#fff" },
  secondary: { ...SECONDARY, contrastText: "#fff" },
  info: { ...INFO, contrastText: "#fff" },
  success: { ...SUCCESS, contrastText: GREY[800] },
  warning: { ...WARNING, contrastText: GREY[800] },
  error: { ...ERROR, contrastText: "#fff" },
  grey: GREY,
  gradients: GRADIENTS,
  chart: CHART_COLORS,
  divider: GREY[500_24],
  action: {
    hover: GREY[500_8],
    selected: GREY[500_16],
    disabled: GREY[500_80],
    disabledBackground: GREY[500_24],
    focus: GREY[500_24],
    hoverOpacity: 0.08,
    disabledOpacity: 0.48,
  },
};

const palette = {
  light: {
    ...COMMON,
    mode: "light",
    text: { primary: GREY[800], secondary: GREY[600], disabled: GREY[500] },
    background: { paper: "#FFFFFF", default: "#F8FAFC", neutral: GREY[200] },
    action: { active: GREY[600], ...COMMON.action },
  },
  dark: {
    ...COMMON,
    mode: "dark",
    text: { primary: "#F8FAFC", secondary: "#CBD5E1", disabled: GREY[500] },
    background: { paper: "#1E293B", default: "#0F172A", neutral: "#334155" },
    action: { active: "#CBD5E1", ...COMMON.action },
  },
};

export default palette;
