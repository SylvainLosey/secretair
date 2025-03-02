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
        gray: {
          100: "#f7f9fc", // Very light background gray
        }
      },
    },
  },
  plugins: [],
} satisfies Config;
