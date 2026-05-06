import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0a",
        surface: "#141414",
        surface2: "#1c1c1c",
        border: "#2a2a2a",
        primary: "#22c55e",
        danger: "#ef4444",
        warning: "#eab308",
        muted: "#6b7280",
        foreground: "#e5e5e5",
      },
    },
  },
  plugins: [],
};

export default config;
