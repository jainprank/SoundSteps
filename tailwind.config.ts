import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#fff8ef",
        ink: "#2b2340",
        coral: { DEFAULT: "#ff8a5c", dark: "#c2491b", soft: "#ffe3d6" },
        sky: { DEFAULT: "#7cc6fe", dark: "#1f6fb2", soft: "#e2f2ff" },
        mint: { DEFAULT: "#7fd8be", dark: "#1d7a5f", soft: "#dcf7ee" },
        sun: { DEFAULT: "#ffd166", dark: "#8a5a00", soft: "#fff3cf" },
        lilac: { DEFAULT: "#b8a1ff", dark: "#5b3fc4", soft: "#efe9ff" },
        rose: { DEFAULT: "#ff9fb8", dark: "#a8264b", soft: "#ffe6ee" },
      },
      fontFamily: {
        read: ["Andika", "ui-rounded", "system-ui", "sans-serif"],
        display: ["Fredoka", "ui-rounded", "system-ui", "sans-serif"],
      },
      borderRadius: { blob: "2rem" },
      boxShadow: { pop: "0 6px 0 rgba(43,35,64,0.15)", popsm: "0 3px 0 rgba(43,35,64,0.15)" },
    },
  },
  plugins: [],
} satisfies Config;
