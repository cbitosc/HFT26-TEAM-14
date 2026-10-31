/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef7ff",
          100: "#d7ecff",
          200: "#b4ddff",
          300: "#82c5ff",
          400: "#4da6ff",
          500: "#1e7af7",
          600: "#135ad0",
          700: "#104aa8",
          800: "#123f8b",
          900: "#153972",
        },
      },
      boxShadow: {
        soft: "0 10px 30px rgba(15, 23, 42, 0.08)",
      }
    },
  },
  plugins: [],
};
