/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#080c14",
        surface: "#0f172a",
        surfaceHover: "#1e293b",
        card: "rgba(15, 23, 42, 0.75)",
        border: "#1e293b",
        borderHighlight: "#334155",
        primary: {
          DEFAULT: "#0ea5e9", // Electric Sky / Teal Accent
          hover: "#0284c7",
          glow: "rgba(14, 165, 233, 0.15)",
        },
        accent: {
          DEFAULT: "#14b8a6", // Emerald Teal
          hover: "#0d9488",
        },
        success: {
          DEFAULT: "#10b981", // Confirmed payment
          glow: "rgba(16, 185, 129, 0.15)",
        },
        warning: {
          DEFAULT: "#f59e0b", // Pending approval
          glow: "rgba(245, 158, 11, 0.15)",
        },
        danger: {
          DEFAULT: "#ef4444", // Disputed / Error
          glow: "rgba(239, 68, 68, 0.15)",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "Courier New", "monospace"],
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        glow: "0 0 20px -5px rgba(14, 165, 233, 0.3)",
      },
    },
  },
  plugins: [],
}
