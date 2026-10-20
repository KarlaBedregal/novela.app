import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canon:        "#10b981",
        suggestion:   "#f59e0b",
        contradictory:"#ef4444",
        superseded:   "#9ca3af",
      },
      fontFamily: {
        immersive: ["Georgia", "Palatino Linotype", "serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
