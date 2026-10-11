const withMT = require("@material-tailwind/react/utils/withMT");
const colors = require("tailwindcss/colors");
 
module.exports = withMT({
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "path-to-your-node_modules/@material-tailwind/react/components/**/*.{js,ts,jsx,tsx}",
    "path-to-your-node_modules/@material-tailwind/react/theme/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // withMT Tailwind palitrasini o‘zinikiga almashtiradi (slate, rose, sky, violet, emerald va h.k. yo‘qoladi).
      // Loyiha shu ranglardan keng foydalanadi — standart palitrani qaytaramiz.
      colors: {
        slate: colors.slate,
        zinc: colors.zinc,
        neutral: colors.neutral,
        stone: colors.stone,
        emerald: colors.emerald,
        sky: colors.sky,
        violet: colors.violet,
        fuchsia: colors.fuchsia,
        rose: colors.rose,
      },
    },
  },
  plugins: [],
});