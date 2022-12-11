/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  variants: {
    underline: ["group-hover"],
    "no-underline": ["group-hover"],
    rounded: ["group-hover"],
    shadow: ["group-hover"],
  },
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
      keyframes: {
        wiggle: {
          "0%": { transform: "rotate(0deg)" },
          "33%": { transform: "rotate(7deg)" },
          "67%": { transform: "rotate(-7deg)" },
          "100%": { transform: "rotate(0deg)" },
        },
      },
      animation: {
        wiggle: "wiggle 0.2s ease 2",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
