import $api from '../../../store/api';
import { encodeEan13 } from '../../ui/Barcode';
import { loadAuthImageDataUrl } from '../../ui/auth-image';
import { printHtml } from '../../Staff/__components/orderReceipt';

/*
 * «+1 pachka» qayd etilgach yorliq darhol chop etiladi (modal yo‘q).
 * Yorliq 100×60 mm (chek apparati): brend logotipi, mahsulot fotosi, nomi, rangi (doiracha + nom),
 * o‘lcham/artikul/kategoriya va katta EAN-13 shtrix-kod.
 * Rasmlar token bilan himoyalangan — chop etish oynasi ularni yuklay olmaydi, shuning uchun
 * data-URL ko‘rinishida joylanadi (loadAuthImageDataUrl).
 */
const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const isHex = (v) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(v ?? '').trim());

/** EAN-13 SVG (mm o‘lchamda: eni ~ 70 mm) */
function barcodeSvg(barcode) {
    const bits = encodeEan13(barcode);
    if (!bits) return `<div class="code">${esc(barcode || '—')}</div>`;
    const m = 2; const h = 40; const quiet = 23; // 95*2 + 23*2 = 236 ↔ 62 balandlik → 80×21 mm nisbati
    const guard = new Set([0, 1, 2, 45, 46, 47, 48, 49, 92, 93, 94]);
    const rects = bits.split('').map((b, i) => (b === '1' ? `<rect x="${quiet + i * m}" y="0" width="${m}" height="${guard.has(i) ? h + 7 : h}"/>` : '')).join('');
    const w = 95 * m + quiet * 2;
    return `<svg class="bc" viewBox="0 0 ${w} ${h + 22}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" preserveAspectRatio="xMidYMid meet">
<g fill="#000">${rects}</g>
<g font-family="Arial, sans-serif" font-size="14" font-weight="700" fill="#000">
<text x="${quiet - 4}" y="${h + 17}" text-anchor="end">${barcode[0]}</text>
<text x="${quiet + 24 * m}" y="${h + 17}" text-anchor="middle" letter-spacing="2">${barcode.slice(1, 7)}</text>
<text x="${quiet + 71 * m}" y="${h + 17}" text-anchor="middle" letter-spacing="2">${barcode.slice(7)}</text>
</g></svg>`;
}

/** 100×60 mm yorliq HTML: yuqorida ikki rasm (brend logotipi + mahsulot fotosi), pastda ma'lumot, eng pastda shtrix-kod */
function labelHtml({ productName, brandName, brandLogo, photo, color, size, article, category, barcode }) {
    const colorCode = isHex(color?.code) ? color.code : null;
    const meta = [brandName ? `Brend: <b>${esc(brandName)}</b>` : '', size ? `O‘lcham: <b>${esc(size)}</b>` : '', article ? `Artikul: <b>${esc(article)}</b>` : '', category ? esc(category) : ''].filter(Boolean).join('<span class="dot">·</span>');
    return `<!doctype html><html lang="uz"><head><meta charset="utf-8"><title>${esc(barcode)}</title>
<style>
@page { size: 100mm 60mm; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; width: 100mm; height: 60mm; background: #fff; color: #000; font-family: Arial, Helvetica, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.label { width: 100mm; height: 60mm; padding: 2mm 3.5mm; display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); grid-template-rows: 14mm minmax(0,1fr) 18mm; column-gap: 3mm; row-gap: 1mm; overflow: hidden; }
.label > * { min-height: 0; min-width: 0; }
/* 1-qator: ikki rasm — chapda brend logotipi, o‘ngda mahsulot fotosi */
.pic { display: flex; align-items: center; justify-content: center; border: 0.3mm solid #000; border-radius: 2mm; overflow: hidden; background: #fff; padding: 1mm; position: relative; }
.pic img { max-width: 100%; max-height: 100%; object-fit: contain; }
.pic .cap { position: absolute; left: 1mm; top: 0.6mm; font-size: 6pt; color: #666; text-transform: uppercase; letter-spacing: .3px; }
.pic .txt { font-size: 12pt; font-weight: 800; text-transform: uppercase; text-align: center; }
.pic .ph { font-size: 7pt; color: #666; }
.logo { grid-column: 1; grid-row: 1; }
.photo { grid-column: 2; grid-row: 1; }
/* 2-qator: ma'lumot */
.info { grid-column: 1 / -1; grid-row: 2; display: flex; flex-direction: column; justify-content: center; gap: 0.9mm; overflow: hidden; }
.name { font-size: 10.5pt; font-weight: 800; line-height: 1.1; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.color { display: flex; align-items: center; gap: 2.2mm; }
.sw { width: 6.5mm; height: 6.5mm; border-radius: 50%; border: 0.4mm solid #000; flex-shrink: 0; background: #fff; }
.sw.none { background: repeating-linear-gradient(45deg, #fff 0 1mm, #bbb 1mm 2mm); }
.clabel { font-size: 6.5pt; color: #444; text-transform: uppercase; letter-spacing: .4px; }
.cname { font-size: 11pt; font-weight: 900; text-transform: uppercase; line-height: 1; }
.meta { font-size: 7pt; color: #222; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.meta .dot { margin: 0 1.2mm; color: #888; }
/* 3-qator: shtrix-kod butun enda */
.barcode { grid-column: 1 / -1; grid-row: 3; display: flex; align-items: flex-end; justify-content: center; }
.bc { width: 68mm; height: 18mm; display: block; }
.code { font-family: monospace; font-size: 14pt; font-weight: 700; letter-spacing: 2px; }
</style></head>
<body><div class="label">
  <div class="pic logo"><span class="cap">Brend</span>${brandLogo ? `<img src="${brandLogo}" alt="">` : (brandName ? `<span class="txt">${esc(brandName)}</span>` : `<span class="ph">logotip yo‘q</span>`)}</div>
  <div class="pic photo"><span class="cap">Mahsulot</span>${photo ? `<img src="${photo}" alt="">` : `<span class="ph">foto yo‘q</span>`}</div>
  <div class="info">
    <div class="name">${esc(productName || '—')}</div>
    ${color?.name || colorCode ? `<div class="color"><span class="sw${colorCode ? '' : ' none'}" style="${colorCode ? `background:${colorCode}` : ''}"></span><div><div class="clabel">Rang</div><div class="cname">${esc(color?.name || colorCode)}</div></div></div>` : ''}
    ${meta ? `<div class="meta">${meta}</div>` : ''}
  </div>
  <div class="barcode">${barcodeSvg(barcode)}</div>
</div></body></html>`;
}

const safe = (promise) => promise.then((v) => v).catch(() => null);

/**
 * Yorliqni chop etish. Mahsulot ma'lumotlari (rang, o‘lcham, foto, shtrix-kod) GET /products/{id} dan,
 * rasmlar data-URL ko‘rinishida. Shtrix-kod umuman bo‘lmasa — chop etilmaydi, false qaytaradi.
 */
export async function printProducedLabel({ productId, productName, brandName, barcode }) {
    let product = null;
    if (productId) {
        try { product = (await $api.get(`/products/${productId}`)).data?.data ?? null; } catch { /* quyida mavjud ma'lumot bilan davom etamiz */ }
    }
    const code = String(barcode || product?.barcode || '').trim();
    if (!code) return false;

    const brand = product?.brand ?? null;
    const [photo, brandLogo] = await Promise.all([
        product?.imageUrl ? safe(loadAuthImageDataUrl(product.imageUrl, product.lastModifiedAt)) : Promise.resolve(null),
        brand?.logoUrl ? safe(loadAuthImageDataUrl(brand.logoUrl, brand.id)) : Promise.resolve(null),
    ]);

    printHtml(labelHtml({
        productName: product?.name || productName,
        brandName: brand?.name || brandName || '',
        brandLogo,
        photo,
        color: product?.color ?? null,
        size: product?.size ?? '',
        article: product?.article ?? '',
        category: product?.category?.name ?? '',
        barcode: code,
    }));
    return true;
}

export { labelHtml as buildProducedLabelHtml };
