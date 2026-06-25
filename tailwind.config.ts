import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0A0E14",
        panel: "#10151D",
        line: "#1E2733",
        base: "#0052FF",
        baselight: "#5B8DEF",
        forge: "#FF6A3D",
        paper: "#EDEFF3",
        mute: "#7C8798",
        good: "#3FCF8E",
        warn: "#F2B84B",
      },
      fontFamily: {
        display: ["'Sora'", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["'Inter'", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "28px 28px",
      },
    },
  },
  plugins: [],
};
export default config;
