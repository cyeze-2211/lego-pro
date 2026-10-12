// Accent (asosiy) rang palitralari.
// Ilovada sariq rang ikki oiladan keladi: Tailwind/Chakra `yellow` (#FACC15 = yellow.400) va
// Tailwind `amber` (bg-amber-400 va h.k.). Ikkalasi ham CSS o‘zgaruvchilarga bog‘langan:
//   --accent-<shade>       → yellow oilasi
//   --accent-warm-<shade>  → amber oilasi
// Qiymatlar "R G B" ko‘rinishida saqlanadi, shunda Tailwind `bg-amber-400/10` kabi shaffoflikni qo‘llay oladi.

import { isValidHex, normalizeHex } from '../Components/ui/color-utils';

export const ACCENT_SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

const YELLOW = ['#FEFCE8', '#FEF9C3', '#FEF08A', '#FDE047', '#FACC15', '#EAB308', '#CA8A04', '#A16207', '#854D0E', '#713F12', '#422006'];
const AMBER = ['#FFFBEB', '#FEF3C7', '#FDE68A', '#FCD34D', '#FBBF24', '#F59E0B', '#D97706', '#B45309', '#92400E', '#78350F', '#451A03'];
const BLUE = ['#EFF6FF', '#DBEAFE', '#BFDBFE', '#93C5FD', '#60A5FA', '#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF', '#1E3A8A', '#172554'];

const toPalette = (list) => Object.fromEntries(ACCENT_SHADES.map((shade, i) => [shade, list[i]]));

/** Tayyor accent variantlari. `main` — yellow oilasi, `warm` — amber oilasi. */
export const ACCENT_PRESETS = {
    yellow: { label: 'Sariq', main: toPalette(YELLOW), warm: toPalette(AMBER) },
    blue: { label: 'Ko‘k', main: toPalette(BLUE), warm: toPalette(BLUE) },
};

// Accent fonidagi matn: loyiha bo‘ylab tugmalarda to‘q matn ishlatiladi (BRAND_COLORS.yellowDarkText)
const DARK_TEXT = '#0F172A';
const LIGHT_TEXT = '#FFFFFF';

// ── Rang hisob-kitoblari ──────────────────────────────────────────────────

const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

const rgbToHex = (rgb) => `#${rgb.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('')}`.toUpperCase();

const channel = (v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

/** WCAG nisbiy yorqinlik (0…1) */
export const luminance = (hex) => {
    const [r, g, b] = hexToRgb(hex);
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

/** WCAG kontrast nisbati (1…21) */
export const contrastRatio = (a, b) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
};

const rgbToHsl = ([r, g, b]) => {
    const [rn, gn, bn] = [r / 255, g / 255, b / 255];
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const l = (max + min) / 2;
    if (max === min) return [0, 0, l];
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h;
    if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    return [h * 60, s, l];
};

const hslToRgb = ([h, s, l]) => {
    const k = (n) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [f(0) * 255, f(8) * 255, f(4) * 255];
};

/** Rang tusi va to‘yinganligini saqlab, kerakli yorqinlikka ega rangni topadi */
const withLuminance = (hue, sat, target) => {
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 24; i += 1) {
        const mid = (lo + hi) / 2;
        if (luminance(rgbToHex(hslToRgb([hue, sat, mid]))) < target) lo = mid;
        else hi = mid;
    }
    return rgbToHex(hslToRgb([hue, sat, (lo + hi) / 2]));
};

// Har bir pog‘ona uchun mo‘ljallangan yorqinlik (Tailwind palitralariga yaqin)
const TARGET_LUMINANCE = { 50: 0.94, 100: 0.87, 200: 0.75, 300: 0.6, 400: 0.45, 500: 0.3, 600: 0.19, 700: 0.12, 800: 0.075, 900: 0.05, 950: 0.025 };

// Asosiy (400) rang chegaralari: to‘q matn bilan kamida 4.5:1 kontrast va oq fonda ko‘rinadigan bo‘lishi uchun
const MIN_SOLID_LUMINANCE = 0.22;
const MAX_SOLID_LUMINANCE = 0.72;

/**
 * Foydalanuvchi tanlagan rangdan to‘liq palitra (50…950) yasaydi.
 * Tanlangan rang 400-pog‘onaga (tugma, faol menyu) qo‘yiladi. Agar u matn o‘qilishi uchun
 * juda to‘q yoki juda och bo‘lsa, shu tusdagi eng yaqin mos rang olinadi va `adjusted: true` qaytadi.
 */
export function buildCustomPalette(hex) {
    const base = normalizeHex(hex);
    const [hue, sat] = rgbToHsl(hexToRgb(base));
    const baseLum = luminance(base);
    const solidLum = Math.min(MAX_SOLID_LUMINANCE, Math.max(MIN_SOLID_LUMINANCE, baseLum));
    const adjusted = solidLum !== baseLum;
    const solid = adjusted ? withLuminance(hue, sat, solidLum) : base;

    const anchor = TARGET_LUMINANCE[400];
    const palette = {};
    ACCENT_SHADES.forEach((shade) => {
        if (shade === 400) {
            palette[shade] = solid;
            return;
        }
        const t = TARGET_LUMINANCE[shade];
        // Pog‘onalar tanlangan rang atrofida tekis taqsimlanadi (och → to‘q tartibi buzilmaydi)
        const target = shade < 400
            ? 1 - (1 - solidLum) * ((1 - t) / (1 - anchor))
            : solidLum * (t / anchor);
        palette[shade] = withLuminance(hue, sat, target);
    });

    return { palette, adjusted, solid };
}

/** Accent fonidagi matn uchun eng kontrastli rang */
export const contrastTextFor = (hex) => (contrastRatio(hex, DARK_TEXT) >= contrastRatio(hex, LIGHT_TEXT) ? DARK_TEXT : LIGHT_TEXT);

/**
 * Sozlamalardan amaldagi accent ma’lumotini hisoblaydi.
 * @returns {{ main: Record<number,string>, warm: Record<number,string>, solid: string, hover: string, active: string, contrast: string, adjusted: boolean }}
 */
export function resolveAccent({ accent, customColor }) {
    let main;
    let warm;
    let adjusted = false;

    if (accent === 'custom' && isValidHex(customColor)) {
        const custom = buildCustomPalette(customColor);
        main = custom.palette;
        warm = custom.palette;
        adjusted = custom.adjusted;
    } else {
        const preset = ACCENT_PRESETS[accent] || ACCENT_PRESETS.yellow;
        main = preset.main;
        warm = preset.warm;
    }

    return {
        main,
        warm,
        solid: main[400],
        hover: main[500],
        active: main[600],
        contrast: contrastTextFor(main[400]),
        adjusted,
    };
}

const toChannels = (hex) => hexToRgb(hex).join(' ');

/** CSS o‘zgaruvchilari ro‘yxati (documentElement ga yoziladi) */
export function accentCssVars(resolved) {
    const vars = {};
    ACCENT_SHADES.forEach((shade) => {
        vars[`--accent-${shade}`] = toChannels(resolved.main[shade]);
        vars[`--accent-warm-${shade}`] = toChannels(resolved.warm[shade]);
    });
    vars['--accent-contrast'] = resolved.contrast;
    return vars;
}
