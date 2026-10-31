/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('@tram/ui/tailwind-preset')],
  content: ['./index.html', './src/**/*.{ts,tsx}', '../ui/src/**/*.{ts,tsx}'],
};
