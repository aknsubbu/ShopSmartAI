export const colors = {
  primary: "#007AFF",
  accent: "#5856D6",
  background: {
    light: "#FFFFFF",
    dark: "#000000",
  },
  text: {
    primary: "#000000",
    secondary: "#8E8E93",
    light: "#FFFFFF",
  },
  status: {
    success: "#34C759",
    error: "#FF3B30",
    warning: "#FF9500",
    info: "#007AFF",
  },
  voice: {
    idle: "#8E8E93",
    listening: "#FF4B4B",
    processing: "#FF9500",
    speaking: "#34C759",
  },
  border: "#E5E5EA",
  shadow: "#000000",
};

// Enhanced theme colors (add these to your theme file)
export const enhancedColors = {
  ...colors,
  accent: "#FF6B6B",
  success: "#4ECDC4",
  warning: "#FFD93D",
  error: "#FF4757",
};

export const typography = {
  fontFamily: {
    regular: "System",
    medium: "System",
    bold: "System",
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
    "4xl": 36,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  base: 16,
  lg: 24,
  xl: 32,
  "2xl": 48,
  "3xl": 64,
};

export const borderRadius = {
  sm: 4,
  base: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  base: {
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  lg: {
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
};

export const animation = {
  duration: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
  easing: {
    easeInOut: "ease-in-out",
    easeOut: "ease-out",
    easeIn: "ease-in",
  },
};
