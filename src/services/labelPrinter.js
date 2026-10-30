import qz from 'qz-tray';
import $api from '../store/api';

/*
 * Yorliq printeri (GoDEX G-500, EZPL) — QZ Tray orqali.
 *
 * Yorliq PACHKAGA tegishli: undagi barcode — pachkaning o‘z 13 xonali barcode‘i. Backend tayyor printer
 * kodini beradi (`data.tsplBase64` — nom eski TSPL davridan qolgan, ichi EZPL + binar rasm):
 *  - GET /product-stock-transactions/{id}/label?copies=N — kirim yozuvi bilan kirgan va hozir omborda turgan
 *    HAR BIR pachkaga N tadan yorliq (stanokdan kirim: POST javobidagi data[].id yoki machine-outputs.stockTransactionId);
 *  - GET /product-packs/label?ids=a,b&copies=N — tanlangan pachkalar (qayta chop etish, qo‘lda yaratilgan pachkalar);
 *  - GET /product-packs/{id}/label?copies=N — bitta pachka.
 * `copies` — umumiy son emas, har pachkaga nechtadan (1–10; ikki tomoniga yopishtirish uchun 2).
 * Frontend shtrix-kod chizmaydi, window.print() ishlatmaydi. Chop etish faqat QZ Tray o‘rnatilgan kompyuterda.
 */

export const LABEL_PRINTER_KEY = 'label_printer_name';
export const QZ_DOWNLOAD_URL = 'https://qz.io/download';
export const LABEL_MAX_COPIES = 10;      // har pachkaga
export const LABEL_MAX_PACKS = 500;      // bitta chop etishda

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

/** Nomidan yorliq printerini taxmin qilish (GoDEX / Xprinter) */
export const looksLikeLabelPrinter = (name) => /godex|xprinter|g500|g-500/i.test(String(name || ''));

/**
 * Printerni aniqlash: saqlangan → nomida «GoDEX/Xprinter» bo‘lgan → null (tanlash kerak).
 * Saqlangan printer ro‘yxatda bo‘lmasa (o‘chirilgan/qayta nomlangan) — null.
 */
export async function resolvePrinter() {
    const printers = await listPrinters();
    const saved = getSavedPrinter();
    if (saved && printers.includes(saved)) return saved;
    const guess = printers.find(looksLikeLabelPrinter);
    if (guess) { setSavedPrinter(guess); return guess; }
    return null;
}

const clampCopies = (copies) => Math.min(LABEL_MAX_COPIES, Math.max(1, Math.trunc(Number(copies) || 1)));

function toLabelError(error, notFoundText) {
    if (error instanceof LabelPrintError) return error;
    const status = error?.response?.status;
    const message = error?.response?.data?.message;
    if (status === 403) return new LabelPrintError('FORBIDDEN', ERR.FORBIDDEN);
    if (status === 404) return new LabelPrintError('NOT_FOUND', message || notFoundText || 'Topilmadi');
    if (status === 409 || status === 400) return new LabelPrintError('STATE', message || 'Bu yozuvda omborda turgan pachka yo‘q — yorliq chiqmaydi');
    return new LabelPrintError('HTTP', message || 'Yorliqni olishda xatolik');
}

async function fetchTspl(url, params, notFoundText) {
    try {
        const res = await $api.get(url, { params });
        const tspl = res.data?.data?.tsplBase64;
        if (!tspl) throw new LabelPrintError('EMPTY', res.data?.message || 'Yorliq kodi kelmadi');
        return tspl;
    } catch (error) {
        throw toLabelError(error, notFoundText);
    }
}

/** Kirim yozuvi pachkalarining yorliqlari. transactionId — kirim yozuvi id si; copies — har pachkaga (1–10). */
export function fetchLabelCode(transactionId, copies = 1) {
    return fetchTspl(`/product-stock-transactions/${transactionId}/label`, { copies: clampCopies(copies) }, 'Kirim yozuvi topilmadi');
}

/** Tanlangan pachkalar yorliqlari (ko‘pi bilan 500 ta pachka). ids — pachka UUID lari; copies — har pachkaga. */
export function fetchPackLabelCode(ids, copies = 1) {
    const list = (Array.isArray(ids) ? ids : [ids]).filter(Boolean).slice(0, LABEL_MAX_PACKS);
    if (list.length === 0) throw new LabelPrintError('EMPTY', 'Pachka tanlanmagan');
    if (list.length === 1) return fetchTspl(`/product-packs/${list[0]}/label`, { copies: clampCopies(copies) }, 'Pachka topilmadi');
    return fetchTspl('/product-packs/label', { ids: list.join(','), copies: clampCopies(copies) }, 'Pachka topilmadi');
}

/** Tayyor printer kodini QZ Tray orqali yuborish. printerName berilmasa — resolvePrinter(). Printer nomini qaytaradi. */
export async function printRawLabel(tspl, printerName) {
    const printer = printerName || await resolvePrinter();
    if (!printer) throw new LabelPrintError('NO_PRINTER', ERR.NO_PRINTER);
    try {
        await ensureConnected();
        await qz.print(qz.configs.create(printer), [{ type: 'raw', format: 'command', flavor: 'base64', data: tspl }]);
    } catch (error) {
        if (error instanceof LabelPrintError) throw error;
        const text = String(error?.message || error || '');
        if (/printer/i.test(text) && /not found|cannot find|no printer/i.test(text)) throw new LabelPrintError('NO_PRINTER', ERR.NO_PRINTER);
        if (!qz.websocket.isActive()) throw new LabelPrintError('QZ', ERR.QZ);
        throw new LabelPrintError('PRINT', text || 'Chop etishda xatolik');
    }
    return printer;
}

/** Kirim yozuvi (stanokdan kirim) pachkalarining yorliqlarini chop etish — har pachkaga `copies` tadan. */
export async function printStockLabel(transactionId, copies = 1, printerName) {
    const tspl = await fetchLabelCode(transactionId, copies); // avval ruxsat/404 ni tekshiramiz, keyin printerga murojaat
    return printRawLabel(tspl, printerName);
}

/** Tanlangan pachkalar yorliqlarini chop etish — har pachkaga `copies` tadan. */
export async function printPackLabels(packIds, copies = 1, printerName) {
    const tspl = await fetchPackLabelCode(packIds, copies);
    return printRawLabel(tspl, printerName);
}

/**
 * Mahsulot bo‘yicha: omborda turgan (IN_STOCK) pachkalarini topib, hammasiga yorliq chiqaradi.
 * warehouseId berilsa — faqat shu ombordagi pachkalar. Pachkasi yo‘q mahsulotga yorliq yo‘q.
 */
export async function resolveProductPackIds(productId, warehouseId, limit = LABEL_MAX_PACKS) {
    try {
        const res = await $api.get('/product-packs', {
            params: { productId, ...(warehouseId ? { warehouseId } : {}), status: 'IN_STOCK', page: 0, size: Math.min(limit, LABEL_MAX_PACKS), sort: 'createdAt,DESC' },
        });
        const ids = (res.data?.data ?? []).map((p) => p.id).filter(Boolean);
        if (ids.length === 0) throw new LabelPrintError('NOT_FOUND', 'Bu mahsulotning omborda turgan pachkasi yo‘q — avval «Pachka yaratish» qiling');
        return ids;
    } catch (error) {
        throw toLabelError(error, 'Pachka topilmadi');
    }
}

export async function printProductLabel(productId, copies = 1, printerName, warehouseId) {
    const ids = await resolveProductPackIds(productId, warehouseId);
    return printPackLabels(ids, copies, printerName);
}

/** Xatoni matnga: UI da to‘g‘ridan-to‘g‘ri ko‘rsatish uchun */
export const labelErrorMessage = (error) => (error instanceof LabelPrintError
    ? error.message
    : (error?.response?.data?.message || error?.data?.message || error?.message || 'Chop etishda xatolik'));
