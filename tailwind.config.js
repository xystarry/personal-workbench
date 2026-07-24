/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        warm: {
          50: "#FFF8F5",
          100: "#FFF0E8",
          200: "#FFE0D0",
          300: "#FFC5A8",
          400: "#FFA88B",
          500: "#F5A88B",
          600: "#E08868",
          700: "#C06848",
          800: "#A04828",
          900: "#802808"
        },
        cream: {
          50: "#FFFEFB",
          100: "#FFF9F0",
          200: "#FFF3E0"
        },
        sage: {
          100: "#E8F0E5",
          200: "#C5D5BE",
          300: "#9BB591",
          400: "#7A956F",
          500: "#5C7552"
        },
        lavender: {
          100: "#EEEAF5",
          200: "#D5CCE8",
          300: "#B8A8D0"
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', '"PingFang SC"', '"Hiragino Sans GB"', '"Microsoft YaHei"', 'sans-serif']
      },
      boxShadow: {
        'soft': '0 2px 12px rgba(245, 168, 139, 0.15)',
        'card': '0 4px 20px rgba(245, 168, 139, 0.1)'
      },
      borderRadius: {
        'xl2': '1.25rem'
      }
    },
  },
  plugins: [],
}
