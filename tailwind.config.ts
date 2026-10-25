import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        green: { DEFAULT: "#082F25", 900: "#06241C", 800: "#082F25", 700: "#0E4334", 600: "#145B46", 500: "#1F7A5E", 300: "#8FB8A8", 100: "#DCE8E2", 50: "#EEF4F1" },
        pink: { DEFAULT: "#F32F73", 700: "#C81E5B", 600: "#E0245F", 500: "#F32F73", 300: "#F98DB1", 100: "#FDE0EA", 50: "#FEF1F5" },
        paper: { DEFAULT: "#F5F0E8", card: "#FBF8F3", line: "#E7E3DD", deep: "#EDE7DD" },
        ink: { DEFAULT: "#242522", soft: "#4A4B46", mute: "#7A7A72" },
        amber: { DEFAULT: "#B7791F", 100: "#F8EBD3" },
      },
      fontFamily: {
        display: ["var(--font-display)", "Poppins", "sans-serif"],
        sans: ["var(--font-body)", "Inter", "system-ui", "sans-serif"],
      },
      borderRadius: { xl: "14px", "2xl": "20px" },
      keyframes: {
        rise: { from: { opacity: "0", transform: "translateY(6px)" }, to: { opacity: "1", transform: "none" } },
      },
      animation: { rise: "rise .35s ease-out both" },
    },
  },
  plugins: [],
};
export default config;
