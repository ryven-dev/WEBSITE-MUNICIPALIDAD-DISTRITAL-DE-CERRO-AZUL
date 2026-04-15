/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // Añade esta sección "safelist"
  safelist: [
    {
      pattern: /bg-(green|blue|yellow|pink|red)-500\/(10|20)/,
    },
    {
      pattern: /text-(green|blue|yellow|pink|red)-500/,
    },
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}