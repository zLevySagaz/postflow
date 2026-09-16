import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "#0B0B0E",
        surface: {
          DEFAULT: "#121216",
          raised: "#191A1F",
          border: "#25262C",
        },
        ink: {
          DEFAULT: "#F1F1F3",
          muted: "#9C9CA6",
          faint: "#6B6B75",
        },
        accent: {
          DEFAULT: "#6E5BF6",
          soft: "#8A7CFF",
          blue: "#4C8DF6",
        },
        state: {
          success: "#34C77B",
          warning: "#E8A33D",
          danger: "#EF5D5D",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        display: ["var(--font-fraunces)", "Georgia", "serif"],
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "14px",
        xl: "20px",
      },
      boxShadow: {
        panel: "0 1px 0 0 rgba(255,255,255,0.04) inset",
      },
    },
  },
  plugins: [],
};
export default config;
