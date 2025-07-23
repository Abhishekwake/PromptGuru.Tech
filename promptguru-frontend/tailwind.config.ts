import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      colors: {
        background: "#000000",
        foreground: "#ffffff",
        muted: "#999999",
      },
    },
  },
  plugins: [],
};

export default config;
