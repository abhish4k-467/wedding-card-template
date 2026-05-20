/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./main.js",
    "./style.css"
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          light: '#F4E8C1',
          DEFAULT: '#D4AF37',
          dark: '#AA820A',
        },
        onyx: {
          light: '#1f1f21',
          DEFAULT: '#121214',
          dark: '#0a0a0c',
        }
      },
      fontFamily: {
        display: ['"Cinzel"', 'serif'],
        serif: ['"Cormorant Garamond"', '"Playfair Display"', 'serif'],
        sans: ['"Montserrat"', '"Inter"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
