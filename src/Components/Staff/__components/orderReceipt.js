/*
 * Omborchi uchun buyurtma cheki — alohida hujjat sifatida chop etiladi.
 *
 * Nega alohida: sahifa ichida `visibility:hidden` + `position:fixed` bilan chop etish Tailwind/Chakra
 * uslublari bilan to‘qnashib, formatni buzardi (bo‘sh varaqlar, kesilgan jadval). Bu yerda toza HTML
 * yashirin iframe ga yoziladi va faqat u chop etiladi. Hujjat qog‘ozga moslashadi: A4 da to‘liq jadval,
 * tor (80 mm) chek printerida shrift kichrayadi va ikkinchi darajali ustunlar yashiriladi.
 */
import { formatNumber } from '../../ui/number-format';

export const RECEIPT_FORMATS = [
    { key: 'auto', label: 'Avto (printer sozlamasi)' },
    { key: 'a4', label: 'A4' },
    { key: 'thermal', label: '80 mm chek' },
];
export const RECEIPT_FORMAT_KEY = 'staff_receipt_format';

const esc = (value) => String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const fmtDate = (value) => {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const pageRule = (format) => {
    if (format === 'a4') return '@page { size: A4 portrait; margin: 12mm; }';
    if (format === 'thermal') return '@page { size: 80mm auto; margin: 4mm 3mm; }';
    return '@page { size: auto; margin: 10mm; }';
};

/**
 * @param {object} p
 * @param {object} p.order            — zayavka (customerName, createdAt, id, status, summary)
 * @param {string} [p.customerPhone]
 * @param {string} [p.warehouseName]
 * @param {Array}  p.rows             — [{ productName, productBarcode, warehouseName, orderedPacks, orderedPiecesOnly, orderedPieces, piecesPerPack, loadedPacks?, loadedPieces? }]
 * @param {boolean} [p.showLoaded]    — «Yuklangan» ustunini ko‘rsatish
 * @param {string} [p.statusLabel]
 * @param {'auto'|'a4'|'thermal'} [p.format]
 */
export function buildOrderReceiptHtml({ order, customerPhone, warehouseName, rows, showLoaded = false, statusLabel, format = 'auto' }) {
    const totals = rows.reduce((acc, r) => {
        acc.packs += Number(r.orderedPacks) || 0;
        acc.pieces += Number(r.orderedPiecesOnly) || 0;
        acc.total += Number(r.orderedPieces) || 0;
        acc.loadedPacks += Number(r.loadedPacks) || 0;
        acc.loadedPieces += Number(r.loadedPieces) || 0;
        return acc;
    }, { packs: 0, pieces: 0, total: 0, loadedPacks: 0, loadedPieces: 0 });

    const thermal = format === 'thermal';
    const num = (v) => (Number(v) > 0 ? formatNumber(v) : '—');
    const loadedText = (r) => {
        const p = Number(r.loadedPacks) || 0; const d = Number(r.loadedPieces) || 0;
        if (!p && !d) return '—';
        return [p ? `${formatNumber(p)} p.` : null, d ? `${formatNumber(d)} d.` : null].filter(Boolean).join(' + ');
    };

    const body = rows.map((r, i) => `
        <tr>
            <td class="num idx">${i + 1}</td>
            <td class="name">
                <div class="pname">${esc(r.productName || '—')}</div>
                ${r.productBarcode ? `<div class="sub mono">${esc(r.productBarcode)}</div>` : ''}
                ${r.piecesPerPack > 1 ? `<div class="sub">1 pachka = ${formatNumber(r.piecesPerPack)} dona</div>` : ''}
            </td>
            <td class="hide-narrow wh">${esc(r.warehouseName || warehouseName || '—')}</td>
            <td class="num">${num(r.orderedPacks)}</td>
            <td class="num">${num(r.orderedPiecesOnly)}</td>
            <td class="num strong">${formatNumber(r.orderedPieces || 0)}</td>
            ${showLoaded ? `<td class="num loaded">${loadedText(r)}</td>` : ''}
        </tr>`).join('');

    const cols = 6 + (showLoaded ? 1 : 0);

    return `<!doctype html>
<html lang="uz">
<head>
<meta charset="utf-8">
<title>Buyurtma cheki #${esc(String(order?.id ?? '').slice(0, 8).toUpperCase())}</title>
<style>
  ${pageRule(format)}
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; color: #000; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: ${thermal ? '10px' : '12px'}; line-height: 1.35; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .sheet { width: 100%; max-width: ${thermal ? '74mm' : '190mm'}; margin: 0 auto; padding: ${thermal ? '0' : '2mm'}; }
  .brand { text-align: center; border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 8px; }
  .brand h1 { margin: 0; font-size: ${thermal ? '16px' : '22px'}; letter-spacing: .5px; }
  .brand .tag { margin: 2px 0 0; font-size: ${thermal ? '9px' : '11px'}; letter-spacing: 2px; color: #333; }
  h2 { margin: 6px 0 8px; font-size: ${thermal ? '12px' : '15px'}; text-align: center; text-transform: uppercase; }
  .meta { display: grid; grid-template-columns: ${thermal ? '1fr' : '1fr 1fr'}; gap: 2px 14px; margin-bottom: 10px; }
  .meta div { display: flex; gap: 6px; align-items: baseline; }
  .meta b { white-space: nowrap; }
  .meta span { word-break: break-word; }
  .summary { border: 1px dashed #777; padding: 5px 7px; margin-bottom: 10px; }
  table { width: 100%; border-collapse: collapse; table-layout: auto; }
  thead { display: table-header-group; }
  tfoot { display: table-footer-group; }
  tr { page-break-inside: avoid; break-inside: avoid; }
  th, td { padding: ${thermal ? '3px 2px' : '6px 5px'}; vertical-align: top; border-bottom: 1px solid #999; }
  th { border-bottom: 2px solid #000; text-align: left; font-size: ${thermal ? '9px' : '10.5px'}; text-transform: uppercase; letter-spacing: .3px; }
  th.num, td.num { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
  td.idx { color: #555; width: 1%; }
  td.wh { white-space: nowrap; }
  td.name { width: 100%; min-width: 0; word-break: normal; overflow-wrap: anywhere; }
  .pname { font-weight: 700; }
  .sub { font-size: ${thermal ? '8.5px' : '10px'}; color: #555; }
  .mono { font-family: "Courier New", monospace; }
  .strong { font-weight: 700; }
  tfoot th { border-top: 2px solid #000; border-bottom: none; font-size: ${thermal ? '10px' : '12px'}; text-transform: none; }
  .sign { display: grid; grid-template-columns: ${thermal ? '1fr' : '1fr 1fr'}; gap: 10px 24px; margin-top: 18px; }
  .sign div { border-top: 1px solid #000; padding-top: 4px; font-size: ${thermal ? '9px' : '11px'}; color: #333; }
  .foot { margin-top: 10px; font-size: ${thermal ? '8.5px' : '10px'}; color: #555; text-align: center; }
  /* Tor qog‘oz (chek printeri): ikkinchi darajali ustunlar yashiriladi */
  .long { display: inline; } .short { display: none; }
  @media print and (max-width: 100mm) {
    body { font-size: 10px; }
    .hide-narrow, .idx, .long { display: none; }
    .short { display: inline; }
    td.loaded { white-space: normal; }
    .meta, .sign { grid-template-columns: 1fr; }
    .brand h1 { font-size: 16px; }
  }
  ${thermal ? '.hide-narrow, .idx, .long { display: none; } .short { display: inline; } td.loaded { white-space: normal; }' : ''}
</style>
</head>
<body>
<div class="sheet">
  <div class="brand">
    <h1>Zafar Lux</h1>
    <p class="tag">ZAVODI</p>
  </div>
  <h2>Buyurtma cheki</h2>

  <div class="meta">
    <div><b>Mijoz:</b><span>${esc(order?.customerName || '—')}</span></div>
    <div><b>Telefon:</b><span>${esc(customerPhone || '—')}</span></div>
    <div><b>Buyurtma №:</b><span class="mono">#${esc(String(order?.id ?? '').slice(0, 8).toUpperCase())}</span></div>
    <div><b>Sana:</b><span>${fmtDate(order?.createdAt)}</span></div>
    ${statusLabel ? `<div><b>Holat:</b><span>${esc(statusLabel)}</span></div>` : ''}
    ${warehouseName ? `<div><b>Ombor:</b><span>${esc(warehouseName)}</span></div>` : ''}
  </div>
  ${order?.summary ? `<div class="summary"><b>Izoh:</b> ${esc(order.summary)}</div>` : ''}

  <table>
    <thead>
      <tr>
        <th class="num idx">№</th>
        <th>Mahsulot</th>
        <th class="hide-narrow">Ombor</th>
        <th class="num"><span class="long">Pachka</span><span class="short">Pach.</span></th>
        <th class="num">Dona</th>
        <th class="num"><span class="long">Jami dona</span><span class="short">Jami</span></th>
        ${showLoaded ? '<th class="num"><span class="long">Yuklangan</span><span class="short">Yukl.</span></th>' : ''}
      </tr>
    </thead>
    <tbody>${body || `<tr><td colspan="${cols}" style="text-align:center;color:#555;padding:14px">Mahsulotlar yo‘q</td></tr>`}</tbody>
    <tfoot>
      <tr>
        <th class="idx"></th>
        <th>Jami: ${rows.length} ta</th>
        <th class="hide-narrow"></th>
        <th class="num">${formatNumber(totals.packs)}</th>
        <th class="num">${formatNumber(totals.pieces)}</th>
        <th class="num">${formatNumber(totals.total)}</th>
        ${showLoaded ? `<th class="num">${totals.loadedPacks ? `${formatNumber(totals.loadedPacks)} p.` : ''}${totals.loadedPacks && totals.loadedPieces ? ' + ' : ''}${totals.loadedPieces ? `${formatNumber(totals.loadedPieces)} d.` : ''}${!totals.loadedPacks && !totals.loadedPieces ? '—' : ''}</th>` : ''}
      </tr>
    </tfoot>
  </table>

  <div class="sign">
    <div>Omborchi: ______________________</div>
    <div>Qabul qildi: ______________________</div>
  </div>
  <p class="foot">Chop etildi: ${fmtDate(new Date().toISOString())}</p>
</div>
</body>
</html>`;
}

/**
 * HTML ni yashirin iframe orqali chop etadi (pop-up blokerga bog‘liq emas).
 * Muvaffaqiyatsiz bo‘lsa yangi oynaga tushadi.
 */
export function printHtml(html, { onError } = {}) {
    try {
        const iframe = document.createElement('iframe');
        iframe.setAttribute('aria-hidden', 'true');
        iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none;';
        document.body.appendChild(iframe);
        const cleanup = () => { setTimeout(() => iframe.remove(), 1500); };
        iframe.onload = () => {
            try {
                const win = iframe.contentWindow;
                win.focus();
                win.onafterprint = cleanup;
                win.print();
                // Ba'zi brauzerlar onafterprint bermaydi
                setTimeout(cleanup, 60_000);
            } catch {
                iframe.remove();
                fallbackWindow(html, onError);
            }
        };
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        doc.open();
        doc.write(html);
        doc.close();
    } catch {
        fallbackWindow(html, onError);
    }
}

function fallbackWindow(html, onError) {
    const win = window.open('', '_blank');
    if (!win) { onError?.('Chop etish oynasini ochib bo‘lmadi. Brauzerda pop-up oynalarga ruxsat bering'); return; }
    win.document.write(html);
    win.document.close();
    win.onload = () => { win.print(); win.close(); };
}
