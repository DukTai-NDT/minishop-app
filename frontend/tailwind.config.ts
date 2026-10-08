import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: { ink: "#23372f", sage: "#738476", paper: "#f8f7f3", clay: "#d87856" },
      fontFamily: { sans: ["Arial", "sans-serif"] },
    },
  },
  plugins: [],
};
export default config;
