

export const Colors = {
  
  primary: "#EC4899",        
  primaryLight: "#FCE7F3",   
  primaryDark: "#DB2777",    

  secondary: "#FDF2F8",      
  accent: "#A855F7",         
  accentLight: "#F5F3FF",    

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
  black: "#1F2937",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray300: "#D1D5DB",
  gray400: "#9CA3AF",
  gray500: "#6B7280",
  gray600: "#4B5563",
  gray700: "#374151",
  gray800: "#1F2937",

  gray: "#9CA3AF",
  lightGray: "#E5E7EB",
  darkGray: "#4B5563",

text: "#1F2937",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
  background: "#FFF5F7",
  card: "#FFFFFF",

catPink:    "#EC4899",  catPinkLight: "#FCE7F3",
  catPurple:  "#A855F7",  catPurpleLight: "#F3E8FF",
  catBlue:    "#3B82F6",  catBlueLight: "#DBEAFE",
  catTeal:    "#14B8A6",  catTealLight: "#CCFBF1",
  catOrange:  "#F97316",  catOrangeLight: "#FFEDD5",
  catYellow:  "#EAB308",  catYellowLight: "#FEF9C3",
  catRed:     "#EF4444",  catRedLight: "#FEE2E2",
  catGreen:   "#22C55E",  catGreenLight: "#DCFCE7",
  catIndigo:  "#6366F1",  catIndigoLight: "#E0E7FF",
};

export const Gradients = {
  
  heroPink:      ["#FF6FB5", "#EC4899", "#A855F7"],     
  heroSunset:    ["#FB923C", "#EC4899", "#A855F7"],     
  heroAurora:    ["#22D3EE", "#A855F7", "#EC4899"],     
  heroBerry:     ["#F472B6", "#A855F7", "#6366F1"],     

cardSoft:      ["#FFFFFF", "#FFF5F7"],                 
  cardGlow:      ["#FDF4FF", "#FCE7F3"],                 
  cardSky:       ["#EFF6FF", "#F0F9FF"],                 
  cardMint:      ["#ECFDF5", "#F0FDFA"],                 
  cardSunrise:   ["#FFFBEB", "#FFF7ED"],                 

success:       ["#10B981", "#34D399"],
  warning:       ["#F59E0B", "#FBBF24"],
  danger:        ["#EF4444", "#F87171"],
  info:          ["#0EA5E9", "#38BDF8"],
  primary:       ["#EC4899", "#F472B6"],

analytics:     ["#A855F7", "#7C3AED"],                 
  iot:           ["#0EA5E9", "#06B6D4"],                 
  alerts:        ["#F97316", "#FB923C"],                 
  health:        ["#22C55E", "#10B981"],                 
  diagnostics:   ["#EC4899", "#F472B6"],                 
  rules:         ["#8B5CF6", "#6366F1"],                 
  reports:       ["#F59E0B", "#EAB308"],                 
  ai:            ["#EC4899", "#A855F7", "#3B82F6"],      

blobPink:      ["#FBCFE8", "#F9A8D4"],
  blobPurple:    ["#E9D5FF", "#C4B5FD"],
  blobBlue:      ["#BFDBFE", "#93C5FD"],
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
    shadowColor: "#EC4899",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    
    shadowColor: "#EC4899",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 5,
  },
  lg: {
    shadowColor: "#EC4899",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 22,
    elevation: 9,
  },

colored: (color, opacity = 0.35) => ({
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
  display: 36,
};

export const FeatureColors = {
  diagnostics: { primary: Colors.catPink,    light: Colors.catPinkLight,    gradient: Gradients.diagnostics },
  report:      { primary: Colors.catOrange,  light: Colors.catOrangeLight,  gradient: Gradients.alerts },
  appliances:  { primary: Colors.catGreen,   light: Colors.catGreenLight,   gradient: Gradients.health },
  health:      { primary: Colors.catGreen,   light: Colors.catGreenLight,   gradient: Gradients.health },
  reminders:   { primary: Colors.catPurple,  light: Colors.catPurpleLight,  gradient: Gradients.analytics },
  iot:         { primary: Colors.catBlue,    light: Colors.catBlueLight,    gradient: Gradients.iot },
  rules:       { primary: Colors.catIndigo,  light: Colors.catIndigoLight,  gradient: Gradients.rules },
  analytics:   { primary: Colors.catTeal,    light: Colors.catTealLight,    gradient: Gradients.heroAurora },
  pdf:         { primary: Colors.catYellow,  light: Colors.catYellowLight,  gradient: Gradients.reports },
  ai:          { primary: Colors.catPink,    light: Colors.catPinkLight,    gradient: Gradients.ai },
};

export default { Colors, Gradients, Spacing, Radius, Shadow, FontSize, FeatureColors };
