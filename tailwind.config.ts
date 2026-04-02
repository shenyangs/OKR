import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" }
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.28s ease-out",
        "accordion-up": "accordion-up 0.22s ease-out"
      },
      colors: {
        border: "rgba(228, 228, 231, 0.6)",
        input: "rgba(255, 255, 255, 0.7)",
        ring: "rgba(59, 130, 246, 0.35)",
        background: "#f5f5f4",
        foreground: "#18181b"
      },
      boxShadow: {
        soft: "0 18px 50px -24px rgba(15, 23, 42, 0.16)",
        float: "0 30px 80px -36px rgba(15, 23, 42, 0.18)"
      },
      borderRadius: {
        "4xl": "2rem"
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(to right, rgba(255,255,255,0.55) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.5) 1px, transparent 1px)"
      }
    }
  },
  plugins: []
};

export default config;
