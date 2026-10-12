const withMT = require("@material-tailwind/react/utils/withMT");
const colors = require("tailwindcss/colors");

// Accent rang (sariq yoki foydalanuvchi tanlagani) CSS o‘zgaruvchilardan olinadi — src/theme/accent.js.
// `<alpha-value>` tufayli `bg-amber-400/10` kabi shaffoflik ham ishlaydi.
const ACCENT_SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const accentScale = (prefix) =>
  Object.fromEntries(ACCENT_SHADES.map((shade) => [shade, `rgb(var(--${prefix}-${shade}) / <alpha-value>)`]));
 
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
        // Loyihaning accent oilalari (Sozlamalar → Ko‘rinish)
        yellow: accentScale("accent"),
        amber: accentScale("accent-warm"),
      },
    },
  },
  plugins: [],
});
