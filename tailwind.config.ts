import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        panel: "#0a0a0a",
      },
    },
  },
  plugins: [],
} satisfies Config;
