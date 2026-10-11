/* Sana/vaqt formatlash — brauzer tiliga bog‘liq bo‘lmagan yagona format */

const pad = (n) => String(n).padStart(2, '0');

export function toDate(value) {
    if (!value) return null;
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
    const str = String(value);
    const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(str) ? `${str}T00:00:00` : str);
    return Number.isNaN(date.getTime()) ? null : date;
}

/** 28.08.2026 */
export function formatDate(value, fallback = '—') {
    const d = toDate(value);
    return d ? `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}` : fallback;
}

/** 10:15 */
export function formatTime(value, fallback = '') {
    const d = toDate(value);
    return d ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : fallback;
}

/** 28.08.2026, 10:15 */
export function formatDateTime(value, fallback = '—') {
    const d = toDate(value);
    return d ? `${formatDate(d)}, ${formatTime(d)}` : fallback;
}

/** Bugungi sana, yyyy-MM-dd (mahalliy vaqt) */
export function todayIso() {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Hozirgi vaqt, HH:mm */
export function nowTime() {
    const d = new Date();
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
