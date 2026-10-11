import { $api } from '../../store/api';

/* Bir xil rasm uchun bitta so‘rov: url+versiya → blob URL (promise) */
const blobCache = new Map();

/* Rasm almashtirilganda majburiy yangilash: url → vaqt belgisi */
const bustMap = new Map();
const listeners = new Set();

export const subscribeImageBust = (listener) => { listeners.add(listener); return () => listeners.delete(listener); };
export const getImageBust = (imageUrl) => (imageUrl ? bustMap.get(imageUrl) || 0 : 0);

/** Yangi rasm yuklangandan keyin chaqiriladi — eski blob va brauzer keshi chetlab o‘tiladi. */
export function bustProductImage(imageUrl) {
    if (!imageUrl) return;
    bustMap.set(imageUrl, Date.now());
    listeners.forEach((listener) => listener());
}

export function loadAuthImage(imageUrl, version) {
    const bust = getImageBust(imageUrl);
    const key = `${imageUrl}|${version || ''}|${bust}`;
    if (!blobCache.has(key)) {
        // Server Cache-Control: max-age=300 qaytaradi; manzil o‘zgarmagani uchun versiyani query bilan beramiz
        const stamp = [version, bust].filter(Boolean).join('-');
        const promise = $api
            .get(imageUrl.replace(/^\/api\/v1/, ''), { responseType: 'blob', params: stamp ? { v: stamp } : undefined })
            .then((response) => URL.createObjectURL(response.data))
            .catch((error) => {
                // Rasm yo‘q (404) yoki xatolik: 60 soniya qayta so‘ramaymiz, keyin yana urinib ko‘riladi
                window.setTimeout(() => { if (blobCache.get(key) === promise) blobCache.delete(key); }, 60_000);
                throw error;
            });
        blobCache.set(key, promise);
    }
    return blobCache.get(key);
}

export const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export function validateImageFile(file) {
    if (!file) return null;
    if (!IMAGE_TYPES.includes(file.type)) return 'Faqat PNG, JPEG yoki WEBP rasm yuklash mumkin';
    if (file.size > IMAGE_MAX_BYTES) return 'Rasm hajmi 5 MB dan oshmasligi kerak';
    return null;
}

const dataUrlCache = new Map();

/** Rasmni base64 data-URL ko‘rinishida qaytaradi (chop etish oynasi uchun — u yerda blob URL ishlamasligi mumkin) */
export function loadAuthImageDataUrl(imageUrl, version) {
    const key = `${imageUrl}|${version || ''}`;
    if (!dataUrlCache.has(key)) {
        const promise = $api
            .get(imageUrl.replace(/^\/api\/v1/, ''), { responseType: 'blob', params: version ? { v: version } : undefined })
            .then((response) => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(response.data);
            }))
            .catch((error) => { dataUrlCache.delete(key); throw error; });
        dataUrlCache.set(key, promise);
    }
    return dataUrlCache.get(key);
}
