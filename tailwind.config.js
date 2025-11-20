/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./components/**/*.{js,ts,jsx,tsx}', './apps/**/*.{js,ts,jsx,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {},
  },
  plugins: [],
}
