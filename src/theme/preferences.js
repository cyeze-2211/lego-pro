// Foydalanuvchi interfeys sozlamalari: rejim (yorug‘/qorong‘i), accent rang va shrift o‘lchami.
//
// Backendda user preferences uchun API yo‘q, shuning uchun sozlamalar brauzerda saqlanadi.
// Har bir foydalanuvchi o‘z kalitiga ega: `ui_preferences:<user_id>` (login sahifasi uchun `ui_preferences:guest`).
// Shu tufayli bir qurilmada bir necha xodim ishlasa ham sozlamalar aralashmaydi.
//
// Sozlamalar React render qilinishidan oldin, modul yuklanganda qo‘llanadi (rang miltillamasligi uchun).

import { useSyncExternalStore } from 'react';
import Cookies from 'js-cookie';
import { ACCENT_PRESETS, accentCssVars, resolveAccent } from './accent';
import { isValidHex, normalizeHex } from '../Components/ui/color-utils';

export const FONT_SIZE = { min: 14, max: 18, step: 1, base: 16 };

const STORAGE_PREFIX = 'ui_preferences:';
const GUEST_KEY = 'guest';
const LEGACY_THEME_KEY = 'theme'; // next-themes oldin rejimni shu kalitda saqlardi

const storageKeyFor = (userId) => `${STORAGE_PREFIX}${userId ? String(userId) : GUEST_KEY}`;

const systemMode = () => {
    try {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
        return 'light';
    }
};

const initialMode = () => {
    try {
        const legacy = localStorage.getItem(LEGACY_THEME_KEY);
        if (legacy === 'light' || legacy === 'dark') return legacy;
    } catch { /* xotira mavjud emas */ }
    return systemMode();
};

export const defaultPreferences = () => ({
    mode: initialMode(),
    accent: 'yellow',
    customColor: null,
    fontSize: FONT_SIZE.base,
});

const clampFontSize = (value) => {
    const n = Math.round(Number(value));
    if (!Number.isFinite(n)) return FONT_SIZE.base;
    return Math.min(FONT_SIZE.max, Math.max(FONT_SIZE.min, n));
};

/** Saqlangan (yoki qo‘lda berilgan) qiymatlarni tekshirib, to‘g‘ri sozlamalar obyektini qaytaradi */
function sanitize(raw) {
    const base = defaultPreferences();
    if (!raw || typeof raw !== 'object') return base;
    const customColor = isValidHex(normalizeHex(raw.customColor)) ? normalizeHex(raw.customColor) : null;
    let accent = raw.accent === 'custom' || ACCENT_PRESETS[raw.accent] ? raw.accent : base.accent;
    if (accent === 'custom' && !customColor) accent = base.accent;
    return {
        mode: raw.mode === 'dark' || raw.mode === 'light' ? raw.mode : base.mode,
        accent,
        customColor,
        fontSize: raw.fontSize == null ? base.fontSize : clampFontSize(raw.fontSize),
    };
}

function read(key) {
    try {
        const raw = localStorage.getItem(key);
        return sanitize(raw ? JSON.parse(raw) : null);
    } catch {
        return sanitize(null);
    }
}

function write(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch { /* xotira to‘lgan yoki bloklangan — sozlama shu sessiya davomida ishlaydi */ }
}

// ── Store ─────────────────────────────────────────────────────────────────

let storageKey = storageKeyFor(Cookies.get('user_id'));
let snapshot = build(read(storageKey));
const listeners = new Set();

function build(preferences) {
    return { preferences, accent: resolveAccent(preferences) };
}

function applyToDocument({ preferences, accent }) {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    Object.entries(accentCssVars(accent)).forEach(([name, value]) => root.style.setProperty(name, value));
    root.style.setProperty('--app-font-scale', String(preferences.fontSize / FONT_SIZE.base));
    // next-themes ham shu sinflarni qo‘yadi; bu yerda oldindan qo‘yamiz — birinchi kadrda to‘g‘ri rang bo‘lsin
    root.classList.toggle('dark', preferences.mode === 'dark');
    root.classList.toggle('light', preferences.mode !== 'dark');
    root.style.colorScheme = preferences.mode;
}

function commit(preferences, { persist = true } = {}) {
    snapshot = build(preferences);
    if (persist) write(storageKey, preferences);
    applyToDocument(snapshot);
    listeners.forEach((listener) => listener());
}

applyToDocument(snapshot);

const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

const getSnapshot = () => snapshot;

export const getPreferences = () => snapshot.preferences;

/** Sozlamalarning bir qismini yangilaydi va darhol qo‘llaydi */
export function updatePreferences(patch) {
    commit(sanitize({ ...snapshot.preferences, ...patch }));
}

/**
 * Rang tanlash paytida (sudrash) faqat CSS o‘zgaruvchilarni yangilaydi — React qayta chizilmaydi va
 * hech narsa saqlanmaydi. Yakuniy qiymat updatePreferences() bilan saqlanadi.
 */
export function previewCustomAccent(hex) {
    if (!isValidHex(normalizeHex(hex))) return;
    const accent = resolveAccent({ accent: 'custom', customColor: normalizeHex(hex) });
    applyToDocument({ preferences: snapshot.preferences, accent });
}

/** Rang va shriftni standart holatga qaytaradi (yorug‘/qorong‘i rejim saqlanib qoladi) */
export function resetPreferences() {
    commit(sanitize({ mode: snapshot.preferences.mode }));
}

/**
 * Joriy foydalanuvchini almashtiradi (login/logout). Shu foydalanuvchining saqlangan
 * sozlamalari yuklanadi; avvalgi foydalanuvchiniki qo‘llanib qolmaydi.
 */
export function setPreferencesUser(userId) {
    const nextKey = storageKeyFor(userId);
    if (nextKey === storageKey) return;
    storageKey = nextKey;
    commit(read(storageKey), { persist: false });
}

/** React uchun: `{ preferences, accent }` — o‘zgarganda komponent qayta chiziladi */
export function usePreferences() {
    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * Logout paytida localStorage ni tozalaydi, lekin foydalanuvchilarning interfeys sozlamalarini qoldiradi
 * (aks holda qayta kirganda sozlamalar yo‘qolardi).
 */
export function clearStorageKeepingPreferences() {
    try {
        const kept = [];
        for (let i = 0; i < localStorage.length; i += 1) {
            const key = localStorage.key(i);
            if (key && key.startsWith(STORAGE_PREFIX)) kept.push([key, localStorage.getItem(key)]);
        }
        localStorage.clear();
        kept.forEach(([key, value]) => localStorage.setItem(key, value));
    } catch { /* xotira mavjud emas */ }
}
