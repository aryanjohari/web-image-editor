import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        panel: "#0a0a0a",
        stage: {
          bg: "var(--stage-bg)",
          panel: "var(--stage-panel)",
          elevated: "var(--stage-panel-elevated)",
          border: "var(--stage-panel-border)",
          text: "var(--stage-text)",
          muted: "var(--stage-muted)",
          accent: "var(--stage-accent)",
          canvas: "var(--stage-canvas)",
        },
      },
      borderRadius: {
        stage: "var(--stage-radius)",
        "stage-lg": "var(--stage-radius-lg)",
      },
      fontFamily: {
        stage: ['"DM Sans"', '"Segoe UI"', "system-ui", "sans-serif"],
        display: ['"Instrument Serif"', "Georgia", "serif"],
      },
      boxShadow: {
        stage: "0 12px 40px rgba(0, 0, 0, 0.35)",
      },
    },
  },
  plugins: [],
} satisfies Config;
