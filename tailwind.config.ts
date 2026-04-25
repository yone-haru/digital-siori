import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "var(--color-ink)",
        "ink-2": "var(--color-ink-2)",
        muted: "var(--color-muted)",
        "muted-2": "var(--color-muted-2)",
        line: "var(--color-line)",
        "line-2": "var(--color-line-2)",
        paper: "var(--color-paper)",
        bg: "var(--color-bg)",
      },
      fontFamily: {
        cormorant: ["var(--font-cormorant)", "Georgia", "serif"],
        shippori: ["var(--font-shippori)", "serif"],
        zen: ["var(--font-zen)", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "2px",
        sm: "2px",
        md: "2px",
        lg: "2px",
        xl: "4px",
        "2xl": "4px",
        shell: "48px",
      },
    },
  },
  plugins: [],
};

export default config;
