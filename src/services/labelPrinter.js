import qz from 'qz-tray';
import $api from '../store/api';

/*
 * Yorliq printeri (Xprinter, TSPL) — QZ Tray orqali.
 *
 * Brauzer shu kompyuterdagi QZ Tray (localhost) ga ulanadi; yorliqning tayyor printer kodini
 * backend beradi: GET /product-stock-transactions/{id}/label?copies=N → tsplBase64, bu yerda {id} —
 * KIRIM YOZUVINING id si (mahsulot id si emas). Uni POST /product-stock-transactions javobidagi data[].id,
 * GET /product-stock-transactions dagi id yoki GET /machine-outputs dagi stockTransactionId dan olinadi.
 * Frontend shtrix-kod chizmaydi, window.print() ishlatmaydi. Chop etish faqat QZ Tray va printer
 * o‘rnatilgan kompyuterda ishlaydi.
 */

export const LABEL_PRINTER_KEY = 'label_printer_name';
export const QZ_DOWNLOAD_URL = 'https://qz.io/download';

/* ── Foydalanuvchiga tushunarli xato ── */
export class LabelPrintError extends Error {
    constructor(code, message) { super(message); this.code = code; }
}
const ERR = {
    QZ: 'QZ Tray o‘rnatilmagan yoki ishlamayapti',
    NO_PRINTER: 'Printer topilmadi, sozlamalardan qayta tanlang',
    FORBIDDEN: 'Yorliq chop etishga ruxsatingiz yo‘q',
};

/* ── Security: bir marta sozlanadi ── */
let securityConfigured = false;
function configureSecurity() {
    if (securityConfigured) return;
    securityConfigured = true;
    qz.security.setCertificatePromise((resolve) => {
        $api.get('/qz-tray/certificate')
            .then((res) => resolve(res.data?.data?.certificate))
            .catch(() => resolve()); // 503: sertifikatsiz davom etadi — QZ Tray o‘zi ruxsat so‘raydi
    });
    qz.security.setSignatureAlgorithm('SHA512');
    qz.security.setSignaturePromise((toSign) => (resolve) => {
        $api.post('/qz-tray/sign', { request: toSign })
            .then((res) => resolve(res.data?.data?.signature))
            .catch(() => resolve());
    });
}

/* ── Ulanish: qayta ishlatiladi, har chop etishda yangidan ulanmaydi ── */
let connecting = null;
export async function ensureConnected() {
    configureSecurity();
    if (qz.websocket.isActive()) return;
    if (!connecting) {
        connecting = qz.websocket.connect({ retries: 1, delay: 1 })
            .catch(() => { throw new LabelPrintError('QZ', ERR.QZ); })
            .finally(() => { connecting = null; });
    }
    await connecting;
}

export const isQzConnected = () => qz.websocket.isActive();

/** Kompyuterdagi printerlar nomlari */
export async function listPrinters() {
    await ensureConnected();
    const found = await qz.printers.find();
    return (Array.isArray(found) ? found : [found]).filter(Boolean);
}

/* ── Tanlangan printer — shu brauzerning localStorage'ida ── */
export const getSavedPrinter = () => { try { return localStorage.getItem(LABEL_PRINTER_KEY) || ''; } catch { return ''; } };
export const setSavedPrinter = (name) => {
    try { if (name) localStorage.setItem(LABEL_PRINTER_KEY, name); else localStorage.removeItem(LABEL_PRINTER_KEY); } catch { /* xotira yo‘q */ }
};

/**
 * Printerni aniqlash: saqlangan → nomida «Xprinter» bo‘lgan → null (tanlash kerak).
 * Saqlangan printer ro‘yxatda bo‘lmasa (o‘chirilgan/qayta nomlangan) — null.
 */
export async function resolvePrinter() {
    const printers = await listPrinters();
    const saved = getSavedPrinter();
    if (saved && printers.includes(saved)) return saved;
    const xprinter = printers.find((p) => /xprinter/i.test(p));
    if (xprinter) { setSavedPrinter(xprinter); return xprinter; }
    return null;
}

/** Backenddan tayyor TSPL kodi (base64). transactionId — kirim yozuvi id si. copies 1–1000 — nusxalar soni buyruqning o‘zida. */
export async function fetchLabelCode(transactionId, copies = 1) {
    const n = Math.min(1000, Math.max(1, Math.trunc(Number(copies) || 1)));
    try {
        const res = await $api.get(`/product-stock-transactions/${transactionId}/label`, { params: { copies: n } });
        const tspl = res.data?.data?.tsplBase64;
        if (!tspl) throw new LabelPrintError('EMPTY', res.data?.message || 'Yorliq kodi kelmadi');
        return tspl;
    } catch (error) {
        if (error instanceof LabelPrintError) throw error;
        const status = error?.response?.status;
        const message = error?.response?.data?.message;
        if (status === 403) throw new LabelPrintError('FORBIDDEN', ERR.FORBIDDEN);
        throw new LabelPrintError(status === 404 ? 'NOT_FOUND' : 'HTTP', message || 'Yorliqni olishda xatolik');
    }
}

/**
 * Mahsulot sahifasidan chop etish uchun: mahsulotning eng so‘nggi KIRIM yozuvini topamiz.
 * Yorliq kirim yozuviga bog‘langan — kirimi bo‘lmagan mahsulotga yorliq yo‘q.
 */
export async function resolveLatestIncomeTransactionId(productId) {
    try {
        const res = await $api.get('/product-stock-transactions', {
            params: { productId, action: 'IN', page: 0, size: 1, sort: 'createdAt,DESC' },
        });
        const id = res.data?.data?.[0]?.id;
        if (!id) throw new LabelPrintError('NOT_FOUND', 'Bu mahsulot uchun kirim yozuvi topilmadi — yorliq kirim yozuviga bog‘langan');
        return id;
    } catch (error) {
        if (error instanceof LabelPrintError) throw error;
        const status = error?.response?.status;
        if (status === 403) throw new LabelPrintError('FORBIDDEN', ERR.FORBIDDEN);
        throw new LabelPrintError('HTTP', error?.response?.data?.message || 'Kirim yozuvini olishda xatolik');
    }
}

/**
 * Kirim yozuvi yorlig‘ini chop etish. printerName berilmasa — resolvePrinter().
 * Kod bir marta yuboriladi (nusxalar soni ichida). Muvaffaqiyatda printer nomini qaytaradi.
 */
export async function printStockLabel(transactionId, copies = 1, printerName) {
    const tspl = await fetchLabelCode(transactionId, copies); // avval ruxsat/404 ni tekshiramiz, keyin printerga murojaat
    const printer = printerName || await resolvePrinter();
    if (!printer) throw new LabelPrintError('NO_PRINTER', ERR.NO_PRINTER);
    try {
        await qz.print(qz.configs.create(printer), [{ type: 'raw', format: 'command', flavor: 'base64', data: tspl }]);
    } catch (error) {
        const text = String(error?.message || error || '');
        if (/printer/i.test(text) && /not found|cannot find|no printer/i.test(text)) throw new LabelPrintError('NO_PRINTER', ERR.NO_PRINTER);
        if (!qz.websocket.isActive()) throw new LabelPrintError('QZ', ERR.QZ);
        throw new LabelPrintError('PRINT', text || 'Chop etishda xatolik');
    }
    return printer;
}

/** Mahsulot bo‘yicha chop etish (ro‘yxat/tafsilot sahifalari): so‘nggi kirim yozuvi orqali. */
export async function printProductLabel(productId, copies = 1, printerName) {
    const transactionId = await resolveLatestIncomeTransactionId(productId);
    return printStockLabel(transactionId, copies, printerName);
}

/** Xatoni matnga: UI da to‘g‘ridan-to‘g‘ri ko‘rsatish uchun */
export const labelErrorMessage = (error) => (error instanceof LabelPrintError
    ? error.message
    : (error?.response?.data?.message || error?.data?.message || error?.message || 'Chop etishda xatolik'));
