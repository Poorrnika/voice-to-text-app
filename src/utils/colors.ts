export type ThemeType = "light" | "dark";

export interface ColorPalette {
  bgStart: string;
  bgEnd: string;
  bgMid: string;
  primary: string;
  primary1: string;
  primary2: string;
  primary3: string;
  secondary: string;
  accent: string;
  accent1: string;
  text: string;
  cardBg: string;
  border: string;
  muted: string;
  muted1: string;
  muted2: string;
  shadow: string;
  green: string;
  green1: string;
  red: string;
}

export const lightColors: ColorPalette = {
  bgStart: "#eef7fb", // very light blue tint
  bgMid: "#e3f2f9",
  bgEnd: "#f5fbff",

  cardBg: "rgba(255,255,255,0.96)",

  primary: "#026193", // base blue (your main color)
  primary1: "#4da3c7", // lighter blue
  primary2: "#80c2dc", // softer blue
  primary3: "#ffffff", // white surface

  secondary: "#014a70", // darker blue for depth

  accent: "#38a9e0", // vibrant accessible accent
  accent1: "#a6d8ef", // soft accent

  text: "#0f172a", // near-black (WCAG safe)
  muted: "#475569", // slate gray-blue
  muted1: "#1e293b",
  muted2: "#cbd5e1",
  shadow: "rgba(0,0,0,0.3)",
  green: "#2e9d5b",
  green1: "#22c55e",

  red: "#dc2626",

  border: "#64748b",
};

export const darkColors: ColorPalette = {
  bgStart: "#0b1e2d", // deep blue-black
  bgMid: "#0f2538",
  bgEnd: "#081824",

  cardBg: "#00263b",

  primary: "#4da3c7", // lighter for dark bg visibility
  primary1: "#80c2dc",
  primary2: "#026193", // base color used deeper
  primary3: "#00263b",

  secondary: "#38a9e0",

  accent: "#5cc4ff",
  accent1: "#2a6f8f",

  text: "#e6f0f7", // high contrast light text
  muted: "#9fb3c8",
  muted1: "#6b859c",
  muted2: "#334155",
  shadow: "rgba(0,0,0,0.5)",

  green: "#4ade80",
  green1: "#22c55e",

  red: "#f87171",

  border: "#64748b",
};

export const getColorsByTheme = (theme: ThemeType): ColorPalette =>
  theme === "dark" ? darkColors : lightColors;
