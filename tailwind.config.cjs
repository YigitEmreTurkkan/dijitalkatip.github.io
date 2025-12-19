/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        "dk-blue": {
          50: "#f4f7fb",
          100: "#e4ecf7",
          200: "#c7d7ed",
          300: "#9fb9e0",
          400: "#7093d0",
          500: "#4a72be",
          600: "#3357a6",
          700: "#294482",
          800: "#243a6a",
          900: "#1f3157"
        }
      }
    }
  },
  plugins: []
};


