/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'mro-azul': '#001A70',
        'mro-azul-claro': '#0B2545',
        'mro-verde': '#00CE7C',
      },
    },
  },
  plugins: [],
}