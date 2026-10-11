export const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

export const isValidHex = (value) => HEX_RE.test(String(value || ''));

export const normalizeHex = (value) => {
    if (!value) return '';
    let v = String(value).trim();
    if (!v.startsWith('#')) v = `#${v}`;
    return HEX_RE.test(v) ? v.toUpperCase() : v;
};

/* Rang ochmi? (oq va och ranglar uchun chegara qalinroq bo‘ladi) */
export function isLightHex(hex) {
    if (!isValidHex(hex)) return false;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.82;
}
