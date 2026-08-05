

export const Colors = {

  primary: "#4F46E5",
  primaryLight: "#EEF2FF",
  primaryDark: "#3730A3",

  secondary: "#F1F5F9",
  accent: "#0EA5E9",
  accentLight: "#E0F2FE",

  success: "#10B981",
  successLight: "#D1FAE5",
  warning: "#F59E0B",
  warningLight: "#FEF3C7",
  danger: "#EF4444",
  dangerLight: "#FEE2E2",
  error: "#EF4444",
  info: "#0EA5E9",
  infoLight: "#E0F2FE",

  white: "#FFFFFF",
  black: "#0F172A",
  gray100: "#F8FAFC",
  gray200: "#E2E8F0",
  gray300: "#CBD5E1",
  gray400: "#94A3B8",
  gray500: "#64748B",
  gray600: "#475569",
  gray700: "#334155",
  gray800: "#1E293B",

  gray: "#94A3B8",
  lightGray: "#E2E8F0",
  darkGray: "#475569",

  text: "#0F172A",
  textSecondary: "#64748B",
  border: "#E2E8F0",
  background: "#F8FAFC",
  card: "#FFFFFF",

  catPink:    "#EC4899",  catPinkLight: "#FCE7F3",
  catPurple:  "#8B5CF6",  catPurpleLight: "#EDE9FE",
  catBlue:    "#3B82F6",  catBlueLight: "#DBEAFE",
  catTeal:    "#14B8A6",  catTealLight: "#CCFBF1",
  catOrange:  "#F97316",  catOrangeLight: "#FFEDD5",
  catYellow:  "#EAB308",  catYellowLight: "#FEF9C3",
  catRed:     "#EF4444",  catRedLight: "#FEE2E2",
  catGreen:   "#22C55E",  catGreenLight: "#DCFCE7",
  catIndigo:  "#6366F1",  catIndigoLight: "#E0E7FF",
};

export const Gradients = {

  heroIndigo:   ["#4F46E5", "#3730A3", "#0F172A"],
  heroSlate:    ["#0F172A", "#1E293B", "#334155"],
  heroSky:      ["#0EA5E9", "#4F46E5", "#0F172A"],
  heroAurora:   ["#22D3EE", "#4F46E5", "#0F172A"],
  heroBerry:    ["#6366F1", "#4F46E5", "#3730A3"],

  cardSoft:     ["#FFFFFF", "#F8FAFC"],
  cardGlow:     ["#EEF2FF", "#E0E7FF"],
  cardSky:      ["#EFF6FF", "#F0F9FF"],
  cardMint:     ["#ECFDF5", "#F0FDFA"],
  cardSunrise:  ["#FFFBEB", "#FFF7ED"],

  success:      ["#10B981", "#34D399"],
  warning:      ["#F59E0B", "#FBBF24"],
  danger:       ["#EF4444", "#F87171"],
  info:         ["#0EA5E9", "#38BDF8"],
  primary:      ["#4F46E5", "#6366F1"],

  analytics:    ["#6366F1", "#4F46E5"],
  iot:          ["#0EA5E9", "#06B6D4"],
  alerts:       ["#F59E0B", "#F97316"],
  health:       ["#10B981", "#14B8A6"],
  diagnostics:  ["#4F46E5", "#6366F1"],
  rules:        ["#7C3AED", "#6366F1"],
  reports:      ["#0EA5E9", "#3B82F6"],
  ai:           ["#4F46E5", "#6366F1", "#0EA5E9"],

  blobIndigo:   ["#C7D2FE", "#A5B4FC"],
  blobBlue:     ["#BFDBFE", "#93C5FD"],
  blobSlate:    ["#CBD5E1", "#94A3B8"],
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 28,
  full: 999,
};

export const Shadow = {
  sm: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {

    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 14,
    elevation: 5,
  },
  lg: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 22,
    elevation: 9,
  },

  colored: (color, opacity = 0.30) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: opacity,
    shadowRadius: 16,
    elevation: 6,
  }),
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  display: 38,
};

export const FeatureColors = {
  diagnostics: { primary: Colors.primary,   light: Colors.primaryLight,   gradient: Gradients.diagnostics },
  report:      { primary: Colors.warning,   light: Colors.warningLight,   gradient: Gradients.alerts },
  appliances:  { primary: Colors.success,   light: Colors.successLight,   gradient: Gradients.health },
  health:      { primary: Colors.success,   light: Colors.successLight,   gradient: Gradients.health },
  reminders:   { primary: Colors.accent,    light: Colors.accentLight,    gradient: Gradients.iot },
  iot:         { primary: Colors.info,      light: Colors.infoLight,      gradient: Gradients.iot },
  rules:       { primary: Colors.catIndigo, light: Colors.catIndigoLight, gradient: Gradients.rules },
  analytics:   { primary: Colors.catTeal,   light: Colors.catTealLight,   gradient: Gradients.heroAurora },
  pdf:         { primary: Colors.warning,   light: Colors.warningLight,   gradient: Gradients.reports },
  ai:          { primary: Colors.primary,   light: Colors.primaryLight,   gradient: Gradients.ai },
};

export default { Colors, Gradients, Spacing, Radius, Shadow, FontSize, FeatureColors };
