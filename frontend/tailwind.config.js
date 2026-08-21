/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#102A43",
        canvas: "#F5F7FA",
        teal: { 50: "#E8F7F5", 100: "#C7ECE7", 500: "#19A995", 600: "#128474", 700: "#0D675B" },
        coral: { 50: "#FFF0ED", 500: "#F46F5E", 600: "#DF5848" },
      },
      boxShadow: { card: "0 10px 35px rgba(16, 42, 67, 0.07)", lift: "0 18px 50px rgba(16, 42, 67, 0.14)" },
      fontFamily: { sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"], display: ["Manrope", "Inter", "sans-serif"] },
    },
  },
  plugins: [],
};

