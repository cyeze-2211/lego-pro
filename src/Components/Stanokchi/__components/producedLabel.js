import $api from '../../../store/api';
import { encodeEan13 } from '../../ui/Barcode';
import { printHtml } from '../../Staff/__components/orderReceipt';

/*
 * «+1 pachka» qayd etilgach yorliq darhol chop etiladi (modal yo‘q): mahsulot nomi, brend, EAN-13 shtrix-kod.
 * Shtrix-kod kirim javobidan (productBarcode) olinadi; javobda bo‘lmasa (brak) — GET /products/{id} dan.
 */
const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Yorliq (58×40 mm) uchun toza HTML — shtrix-kod SVG qo‘lda chiziladi */
function labelHtml({ productName, brandName, barcode }) {
    const bits = encodeEan13(barcode);
    const m = 2; const h = 60; const quiet = 9 * m;
    const guard = new Set([0, 1, 2, 45, 46, 47, 48, 49, 92, 93, 94]);
    const rects = bits ? bits.split('').map((b, i) => (b === '1' ? `<rect x="${quiet + i * m}" y="0" width="${m}" height="${guard.has(i) ? h + 6 : h}"/>` : '')).join('') : '';
    const w = 95 * m + quiet * 2;
    const svg = bits ? `<svg viewBox="0 0 ${w} ${h + 22}" width="${w}" height="${h + 22}" xmlns="http://www.w3.org/2000/svg"><g fill="#000">${rects}</g>
        <g font-family="monospace" font-size="12"><text x="${quiet - 4}" y="${h + 16}" text-anchor="end">${barcode[0]}</text><text x="${quiet + 24 * m}" y="${h + 16}" text-anchor="middle">${barcode.slice(1, 7)}</text><text x="${quiet + 71 * m}" y="${h + 16}" text-anchor="middle">${barcode.slice(7)}</text></g></svg>` : `<div style="font-family:monospace;font-size:16px">${esc(barcode || '—')}</div>`;
    return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(barcode)}</title>
<style>@page{size:58mm 40mm;margin:2mm}html,body{margin:0;padding:0;background:#fff;color:#000;font-family:Arial,sans-serif}
.l{width:54mm;height:36mm;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2mm;text-align:center}
.n{font-size:11px;font-weight:700;line-height:1.15;max-height:26px;overflow:hidden}.b{font-size:9px;color:#333}svg{max-width:52mm;height:auto}</style></head>
<body><div class="l"><div class="n">${esc(productName)}</div>${brandName ? `<div class="b">${esc(brandName)}</div>` : ''}${svg}</div></body></html>`;
}

/** Yorliqni chop etish. Shtrix-kod bo‘lmasa mahsulotdan oladi; umuman bo‘lmasa — hech narsa chop etmaydi, false qaytaradi. */
export async function printProducedLabel({ productId, productName, brandName, barcode }) {
    let code = String(barcode ?? '').trim();
    if (!code && productId) {
        try {
            const { data } = await $api.get(`/products/${productId}`);
            code = String(data?.data?.barcode ?? '').trim();
        } catch { /* mahsulot olinmadi — pastda false */ }
    }
    if (!code) return false;
    printHtml(labelHtml({ productName, brandName, barcode: code }));
    return true;
}
