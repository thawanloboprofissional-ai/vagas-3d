/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'mro-azul': '#0B2545',
        'mro-azul-claro': '#1a3a6a',
      },
    },
  },
  plugins: [],
}
