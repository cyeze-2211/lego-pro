/*
 * Tahrirlash formalari uchun yordamchilar.
 *
 * Muammo: forma ro‘yxat qatoridan (`list` javobi) to‘ldiriladi, qator esa ba'zan to‘liq bo‘lmaydi
 * (eski kesh, qisqartirilgan javob, obyekt/tekis maydon farqi). Backend PUT da barcha maydonlarni
 * talab qiladi → «to‘ldirilmagan» xatosi. Yechim: oyna ochilganda yozuv `GET /{id}` dan qayta
 * yuklanadi va bo‘sh qolgan maydonlar shu yangi ma'lumot bilan to‘ldiriladi.
 */

const isBlankValue = (value) =>
    value === undefined || value === null || (typeof value === 'string' && value.trim() === '');

/** `current` dagi bo‘sh maydonlarni `fresh` dagi qiymatlar bilan to‘ldiradi (foydalanuvchi yozganini buzmaydi) */
export function fillBlanks(current, fresh) {
    if (!fresh) return current;
    let changed = false;
    const next = { ...current };
    for (const key of Object.keys(fresh)) {
        if (isBlankValue(next[key]) && !isBlankValue(fresh[key])) {
            next[key] = fresh[key];
            changed = true;
        }
    }
    return changed ? next : current;
}

/**
 * Saqlash bloklanganda konsolga to‘liq kontekst yozadi — prodda «nima to‘ldirilmagan» ni
 * DevTools → Console dan bir qarashda ko‘rish uchun.
 */
export function logBlockedSave(formName, message, context = {}) {
    // eslint-disable-next-line no-console
    console.warn(`[${formName}] saqlash bloklandi: ${message}`, context);
}
