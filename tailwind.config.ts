import { type Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
  content: ["./src/**/*.tsx"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", ...fontFamily.sans],
      },
      colors: {
        navy: {
          600: "#183b6c", // Lighter navy
          700: "#13305a", // Softer navy for header/footer (less harsh)
          800: "#0e2650", // Original dark navy blue
          900: "#0a1c3d", // Darker navy for hover states
        },
        mint: {
          100: "#d5e8e0", // Light mint color for primary text
          200: "#b8d5c8", // Slightly darker mint for secondary text
        },
        gray: {
          100: "#f7f9fc", // Very light background gray
        }
      },
    },
  },
  plugins: [],
} satisfies Config;
