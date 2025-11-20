/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#4fc3f7', // Sky Blue
        secondary: '#2ecc71', // Emerald Green
        accent: '#b39ddb', // Lavender
      },
      fontFamily: {
        heading: ['Poppins', 'System'],
        body: ['Inter', 'System'],
      },
    },
  },
  plugins: [],
}
