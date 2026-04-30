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
        border: "hsla(219 45% 72% / 0.5)",
        input: "hsla(219 45% 72% / 0.5)",
        ring: "hsl(223 44% 35%)",
        background: "hsl(215 63% 92%)",
        foreground: "hsl(227 32% 18%)",
        primary: {
          DEFAULT: "hsl(236 33% 22%)",
          foreground: "hsl(0 0% 100%)"
        },
        secondary: {
          DEFAULT: "hsla(218 57% 95% / 0.7)",
          foreground: "hsl(227 32% 18%)"
        },
        muted: {
          DEFAULT: "hsla(221 56% 96% / 0.78)",
          foreground: "hsl(222 18% 42%)"
        },
        card: {
          DEFAULT: "hsla(0 0% 100% / 0.9)",
          foreground: "hsl(227 32% 18%)"
        }
      },
      borderRadius: {
        lg: "1.25rem",
        xl: "1.75rem"
      },
      boxShadow: {
        panel: "0 18px 60px rgba(39, 67, 120, 0.16)"
      },
      fontFamily: {
        sans: ["'Segoe UI'", "ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
