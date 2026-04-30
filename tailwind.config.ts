import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(30 10% 82%)",
        input: "hsl(30 10% 82%)",
        ring: "hsl(12 65% 44%)",
        background: "hsl(36 40% 96%)",
        foreground: "hsl(18 16% 14%)",
        primary: {
          DEFAULT: "hsl(12 65% 44%)",
          foreground: "hsl(36 40% 96%)"
        },
        secondary: {
          DEFAULT: "hsl(42 24% 89%)",
          foreground: "hsl(18 16% 18%)"
        },
        muted: {
          DEFAULT: "hsl(42 24% 92%)",
          foreground: "hsl(20 10% 38%)"
        },
        card: {
          DEFAULT: "hsla(0 0% 100% / 0.72)",
          foreground: "hsl(18 16% 14%)"
        }
      },
      borderRadius: {
        lg: "1rem",
        xl: "1.5rem"
      },
      boxShadow: {
        panel: "0 20px 50px rgba(67, 34, 11, 0.08)"
      },
      fontFamily: {
        sans: ["'Segoe UI'", "ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
