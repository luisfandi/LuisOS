/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,html}",
  ],
  theme: {
    extend: {
      colors: {
        'luis-black': '#0D0D0D',
        'luis-red': '#8B0000',
        'luis-crimson': '#4A0000',
      }
    },
  },
  plugins: [],
}
