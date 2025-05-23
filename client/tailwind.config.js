/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        fontFamily: {
          futuristic: ["Orbitron", "sans-serif"],
        },
        colors: {
          neon: "#00FFFF",
          darkBg: "#0A0A0A",
          // custom colors
          bgdark: '#0e0f0e',
          bglight: '#dedbd2', // previously #f0e7db
          lightAccent: '#f6f0e8',
        },
      },
    },
    plugins: [],
  };