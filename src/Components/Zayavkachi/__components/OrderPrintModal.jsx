import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { LuX, LuPrinter, LuBuilding2, LuCheck, LuPalette, LuLoader } from 'react-icons/lu';
import { splitOrderItem } from '../../ui/order-items';
import { useAppTheme } from '../../../theme/tokens';
import { Alert } from '../../Other/UI/Alert/Alert';
import { useGetBrandsQuery } from '../../../store/services/brand.api';
import { loadAuthImage, loadAuthImageDataUrl } from '../../ui/auth-image';
import { STATUS_LABEL, statusStyle } from './statusBadge';

/* Hujjat aksent rangi uchun tayyor palitra; oxirgi tanlov brauzerda eslab qolinadi */
const ACCENT_KEY = 'invoice_accent_color';
const PRESET_COLORS = [
    { name: 'Teal', value: '#0D9488' }, { name: 'Ko‘k', value: '#1D4ED8' }, { name: 'Yashil', value: '#15803D' },
    { name: 'Qizil', value: '#DC2626' }, { name: 'To‘q sariq', value: '#EA580C' }, { name: 'Oltin', value: '#CA8A04' },
    { name: 'Binafsha', value: '#7C3AED' }, { name: 'Pushti', value: '#DB2777' }, { name: 'Kulrang', value: '#334155' }, { name: 'Qora', value: '#0F172A' },
];
const loadAccent = () => { try { return localStorage.getItem(ACCENT_KEY) || PRESET_COLORS[0].value; } catch { return PRESET_COLORS[0].value; } };

/* Brend logotipi (token bilan yuklanadi); logo bo‘lmasa — bosh harf */
function BrandThumb({ brand, size = 40 }) {
    const [src, setSrc] = useState(null);
    useEffect(() => {
        let active = true;
        setSrc(null);
        if (!brand?.logoUrl) return undefined;
        loadAuthImage(brand.logoUrl, brand.lastModifiedAt).then((url) => { if (active) setSrc(url); }).catch(() => {});
        return () => { active = false; };
    }, [brand?.logoUrl, brand?.lastModifiedAt]);
    if (src) return <img src={src} alt={brand.name} style={{ height: size, maxWidth: size * 2.4, objectFit: 'contain' }} />;
    return (
        <span className="flex items-center justify-center rounded-lg bg-slate-100 text-sm font-black text-slate-500" style={{ height: size, width: size }}>
            {brand?.name?.charAt(0)?.toUpperCase() || 'B'}
        </span>
    );
}
BrandThumb.propTypes = { brand: PropTypes.object, size: PropTypes.number };

export default function OrderPrintModal({ order, onClose, showPrices = true }) {
    const { isDark } = useAppTheme();

    /* Brendlar — API dan */
    const { data: brandsData, isLoading: brandsLoading } = useGetBrandsQuery({ page: 0, size: 200, sort: ['name,ASC'] });
    const brands = useMemo(() => brandsData?.items ?? [], [brandsData]);
    const [selectedBrandId, setSelectedBrandId] = useState('');
    const selectedBrand = brands.find((b) => b.id === selectedBrandId) ?? brands[0] ?? null;
    const brandName = selectedBrand?.name || 'Kompaniya';

    /* Tanlangan brend logotipi — chop etish uchun data-URL */
    const [logoDataUrl, setLogoDataUrl] = useState(null);
    const [logoLoading, setLogoLoading] = useState(false);
    useEffect(() => {
        let active = true;
        setLogoDataUrl(null);
        if (!selectedBrand?.logoUrl) { setLogoLoading(false); return undefined; }
        setLogoLoading(true);
        loadAuthImageDataUrl(selectedBrand.logoUrl, selectedBrand.lastModifiedAt)
            .then((url) => { if (active) setLogoDataUrl(url); })
            .catch(() => { if (active) setLogoDataUrl(null); })
            .finally(() => { if (active) setLogoLoading(false); });
        return () => { active = false; };
    }, [selectedBrand?.logoUrl, selectedBrand?.lastModifiedAt]);

    /* Aksent rangi */
    const [accent, setAccent] = useState(loadAccent);
    const pickAccent = (value) => {
        setAccent(value);
        try { localStorage.setItem(ACCENT_KEY, value); } catch { /* xotira mavjud emas */ }
    };
    const isPreset = PRESET_COLORS.some((c) => c.value.toLowerCase() === accent.toLowerCase());

    const panel = isDark ? 'border-white/10 bg-[#141C2B]' : 'border-[#e2e8f0] bg-white';
    const muted = isDark ? 'text-[#94a3b8]' : 'text-[#64748b]';
    const head  = isDark ? 'text-white' : 'text-[#0f172a]';

    const handlePrint = () => {
        if (logoLoading) { Alert('Logotip yuklanmoqda, bir oz kuting', 'warning'); return; }
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            Alert('Chop etish oynasini ochib bo‘lmadi. Brauzerda pop-up oynalarga ruxsat bering', 'error');
            return;
        }
        printWindow.document.write(generatePrintContent());
        printWindow.onload = () => {
            printWindow.print();
            printWindow.close();
        };
        printWindow.document.close();
        onClose();
    };

    const generatePrintContent = () => {
        const logoColor = accent;
        const logoSrc   = logoDataUrl;

        const fmtNum = (v) => {
            const n = Number(v ?? 0);
            return n.toLocaleString('ru-RU').replace(/\u00A0/g, ' ');
        };
        const fmtDate     = (v) => v ? new Date(v).toLocaleDateString('uz-UZ') : '—';
        const fmtDateTime = (v) => v ? new Date(v).toLocaleString('uz-UZ') : '—';
        const items       = order.items || [];

        const statusColor = statusStyle(order.status, false).solid;

        const emptyRows = Array.from({ length: Math.max(0, 8 - items.length) })
            .map(() => `
                <tr style="border-bottom:1px solid #e2e8f0;background:#fff;">
                    <td style="padding:7px 8px;border-right:1px solid #e2e8f0;">&nbsp;</td>
                    <td style="padding:7px 8px;border-right:1px solid #e2e8f0;">&nbsp;</td>
                    <td style="padding:7px 8px;border-right:1px solid #e2e8f0;">&nbsp;</td>
                    <td style="padding:7px 8px;${showPrices ? 'border-right:1px solid #e2e8f0;' : ''}">&nbsp;</td>
                    ${showPrices ? '<td style="padding:7px 8px;border-right:1px solid #e2e8f0;">&nbsp;</td><td style="padding:7px 8px;">&nbsp;</td>' : ''}
                </tr>
            `).join('');

        const itemRows = items.map((item, idx) => {
            const split = splitOrderItem(item);
            const packs = split.packs > 0 || split.piecesPerPack > 0 ? split.packs : null;
            return `
            <tr style="border-bottom:1px solid #e2e8f0;background:#fff;">
                <td style="background:#fff;padding:7px 8px;text-align:center;font-size:10px;color:#374151;border-right:1px solid #e2e8f0;">${idx + 1}</td>
                <td style="background:#fff;padding:7px 8px;font-size:10px;border-right:1px solid #e2e8f0;">
                    <div style="font-weight:600;color:#0f172a;">${item.productName || '—'}</div>
                    ${item.productBarcode ? `<div style="font-size:8.5px;color:#94a3b8;font-family:monospace;margin-top:1px;">${item.productBarcode}</div>` : ''}
                </td>
                <td style="background:#fff;padding:7px 8px;text-align:center;font-size:10px;color:#374151;border-right:1px solid #e2e8f0;">${packs === null ? '—' : `${fmtNum(packs)}${split.pieces > 0 ? ` + ${fmtNum(split.pieces)} d.` : ''}`}</td>
                <td style="background:#fff;padding:7px 8px;text-align:center;font-size:10px;color:#374151;${showPrices ? 'border-right:1px solid #e2e8f0;' : ''}">${fmtNum(item.quantity)}</td>
                ${showPrices ? `<td style="background:#fff;padding:7px 8px;text-align:right;font-size:10px;color:#374151;border-right:1px solid #e2e8f0;">${fmtNum(item.unitPrice)}</td>
                <td style="background:#fff;padding:7px 8px;text-align:right;font-size:10px;font-weight:700;color:#0f172a;">${fmtNum(item.lineTotal)}</td>` : ''}
            </tr>
        `;
        }).join('');

        return `<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="UTF-8"/>
  <title>Invoice — ${(order.id || '').slice(0,8).toUpperCase()}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm 12mm 14mm 12mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { background: #fff; color: #0f172a; font-family: Arial, Helvetica, sans-serif; font-size: 10.5px; line-height: 1.45; }
    table { border-collapse: collapse; }
    img { max-width: 100%; }
  </style>
</head>
<body style="padding:0;margin:0;background:#fff;">
<div style="width:190mm;margin:0 auto;background:#fff;color:#0f172a;font-family:Arial,Helvetica,sans-serif;font-size:10.5px;line-height:1.45;">

  <!-- ═══ HEADER ═══ -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;">
    <div style="display:flex;align-items:center;gap:12px;">
      ${logoSrc ? `<img src="${logoSrc}" alt="Logo" style="height:44px;width:auto;max-width:120px;object-fit:contain;" />` : `<div style="height:44px;width:44px;border-radius:10px;background:${logoColor};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:20px;">${brandName.charAt(0).toUpperCase()}</div>`}
      <div>
        <div style="font-weight:900;font-size:17px;color:#0f172a;letter-spacing:0.5px;">${brandName}</div>
        <div style="font-size:9px;color:#94a3b8;margin-top:2px;letter-spacing:0.3px;">INNOVATSION PVX PROFILLARI</div>
      </div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:34px;font-weight:900;letter-spacing:6px;color:${logoColor};line-height:1;">INVOICE</div>
      <div style="font-size:9px;color:#94a3b8;margin-top:4px;letter-spacing:2px;font-weight:600;">HISOB-FAKTURA</div>
    </div>
  </div>

  <!-- ═══ ACCENT LINE ═══ -->
  <div style="height:3px;background:${logoColor};margin:10px 0 16px 0;"></div>

  <!-- ═══ MIJOZ + HUJJAT ═══ -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;gap:24px;">
    <div style="flex:1;">
      <div style="font-size:9px;font-weight:700;color:#94a3b8;letter-spacing:1px;margin-bottom:4px;">MIJOZ </div>
      <div style="font-size:13px;font-weight:800;color:#0f172a;margin-bottom:3px;">${order.customerName || '—'}</div>
      ${order.summary ? `<div style="font-size:9.5px;color:#64748b;margin-top:3px;line-height:1.5;">Izoh: ${order.summary}</div>` : ''}
    </div>
    <div style="min-width:210px;">
      <table style="border-collapse:collapse;width:100%;">
        <tbody>
          <tr>
            <td style="font-size:10px;font-weight:700;color:#94a3b8;padding-bottom:4px;padding-right:12px;white-space:nowrap;letter-spacing:0.5px;">HUJJAT №:</td>
            <td style="font-size:11px;font-weight:800;color:#0f172a;padding-bottom:4px;text-align:right;font-family:monospace;">${(order.id || '').slice(0,8).toUpperCase()}</td>
          </tr>
          <tr>
            <td style="font-size:10px;font-weight:700;color:#94a3b8;padding-bottom:4px;padding-right:12px;letter-spacing:0.5px;">SANA:</td>
            <td style="font-size:10px;color:#374151;padding-bottom:4px;text-align:right;">${fmtDate(order.createdAt)}</td>
          </tr>
          <tr>
            <td style="font-size:10px;font-weight:700;color:#94a3b8;padding-right:12px;letter-spacing:0.5px;">HOLATI:</td>
            <td style="font-size:10px;font-weight:800;text-align:right;color:${statusColor};">
              ${STATUS_LABEL[order.status] ?? order.status}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- ═══ MAHSULOTLAR JADVALI ═══ -->
  <table style="width:100%;border-collapse:collapse;margin-bottom:0;border:1px solid #cbd5e1;background:#fff;">
    <thead>
      <tr>
        <td style="padding:0;width:32px;border-right:1px solid #334155;">
          <div style="background:#1e293b;color:#fff;padding:8px 8px;text-align:center;font-size:9.5px;font-weight:700;letter-spacing:0.5px;">№</div>
        </td>
        <td style="padding:0;border-right:1px solid #334155;">
          <div style="background:#1e293b;color:#fff;padding:8px 10px;text-align:left;font-size:9.5px;font-weight:700;letter-spacing:0.5px;">MAHSULOT NOMI</div>
        </td>
        <td style="padding:0;width:52px;border-right:1px solid #334155;">
          <div style="background:#1e293b;color:#fff;padding:8px 8px;text-align:center;font-size:9.5px;font-weight:700;letter-spacing:0.5px;">PACHKA</div>
        </td>
        <td style="padding:0;width:48px;${showPrices ? 'border-right:1px solid #334155;' : ''}">
          <div style="background:#1e293b;color:#fff;padding:8px 8px;text-align:center;font-size:9.5px;font-weight:700;letter-spacing:0.5px;">DONA</div>
        </td>
        ${showPrices ? `<td style="padding:0;width:92px;border-right:1px solid #334155;">
          <div style="background:#1e293b;color:#fff;padding:8px 10px;text-align:right;font-size:9.5px;font-weight:700;letter-spacing:0.5px;">NARXI</div>
        </td>
        <td style="padding:0;width:108px;">
          <div style="background:#1e293b;color:#fff;padding:8px 10px;text-align:right;font-size:9.5px;font-weight:700;letter-spacing:0.5px;">JAMI</div>
        </td>` : ''}
      </tr>
    </thead>
    <tbody>
      ${itemRows}
      ${emptyRows}
    </tbody>
  </table>

  <!-- ═══ TO'LOV + JAMI ═══ -->
  ${showPrices ? `<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:24px;margin-top:16px;margin-bottom:14px;">
    <div style="flex:1;">
      <div style="font-size:9px;font-weight:700;color:#94a3b8;letter-spacing:1px;margin-bottom:5px;">TO'LOV MA'LUMOTLARI</div>
      <div style="font-size:9.5px;color:#374151;line-height:1.8;">
        <div>Mijoz: <strong>${order.customerName || '—'}</strong></div>
        <div>Sana: <strong>${fmtDateTime(order.createdAt)}</strong></div>
      </div>
    </div>
    <div style="min-width:240px;">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px dashed #cbd5e1;">
        <span style="font-size:10px;color:#64748b;">Olingan tovar jami:</span>
        <span style="font-size:10.5px;font-weight:700;color:#0f172a;">${fmtNum(order.totalAmount)} so'm</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px dashed #cbd5e1;">
        <span style="font-size:10px;color:#64748b;">To'langan:</span>
        <span style="font-size:10.5px;font-weight:700;color:#15803d;">${fmtNum(order.paidAmount)} so'm</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;background:${logoColor};padding:8px 12px;border-radius:6px;">
        <span style="font-size:11px;font-weight:800;color:#fff;letter-spacing:0.5px;">QOLGAN QARZ:</span>
        <span style="font-size:12px;font-weight:900;color:#fff;white-space:nowrap;">${fmtNum(order.remainingDebt)} so'm</span>
      </div>
    </div>
  </div>` : ''}

  <!-- ═══ SHARTLAR + IMZO ═══ -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:24px;margin-bottom:16px;">
    <div style="flex:1;">
      <div style="font-size:10px;font-weight:700;color:#0f172a;margin-bottom:4px;letter-spacing:0.3px;">${showPrices ? 'SHARTLAR VA QOIDALAR:' : 'YUKLASH VA QABUL QILISH:'}</div>
      ${showPrices ? `<div style="font-size:9px;color:#64748b;line-height:1.6;">
        To'lov shartnomaga muvofiq 5 bank ish kuni ichida amalga oshirilishi lozim.
      </div>` : '<div style="font-size:9px;color:#64748b;line-height:1.6;">Mahsulot miqdorini qabul qilish vaqtida tekshiring.</div>'}
    </div>
    <div style="text-align:center;min-width:200px;">
      <div style="font-size:9px;color:#64748b;margin-bottom:22px;letter-spacing:0.3px;">IMZO / AUTHORISED SIGN</div>
      <div style="border-bottom:1px solid #374151;width:170px;margin-left:auto;"></div>
    </div>
  </div>

  <div style="font-size:10px;font-weight:600;color:#0f172a;margin-bottom:18px;font-style:italic;">
    Xaridingiz uchun tashakkur!
  </div>

  <!-- ═══ ACCENT LINE ═══ -->
  <div style="height:2.5px;background:${logoColor};margin-bottom:12px;"></div>

  <!-- ═══ REKVIZITLAR / FOOTER ═══ -->
  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 14px;">
    <div style="font-size:9px;font-weight:800;color:#0f172a;letter-spacing:1.2px;margin-bottom:8px;">KORXONA REKVIZITLARI</div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px 16px;font-size:9px;line-height:1.5;">
      <div>
        <div style="color:#94a3b8;font-weight:700;letter-spacing:0.3px;margin-bottom:2px;">TASHKILOT</div>
        <div style="color:#0f172a;font-weight:600;">"ZAFAR LUX KREDIT" MCHJ</div>
      </div>
      <div>
        <div style="color:#94a3b8;font-weight:700;letter-spacing:0.3px;margin-bottom:2px;">MANZIL</div>
        <div style="color:#374151;">Samarqand shahri</div>
      </div>
      <div>
        <div style="color:#94a3b8;font-weight:700;letter-spacing:0.3px;margin-bottom:2px;">TELEFON</div>
        <div style="color:#374151;font-family:monospace;">+998 97 907 20 22</div>
      </div>
      <div>
        <div style="color:#94a3b8;font-weight:700;letter-spacing:0.3px;margin-bottom:2px;">INN</div>
        <div style="color:#374151;font-family:monospace;">305 406 114</div>
      </div>
      <div>
        <div style="color:#94a3b8;font-weight:700;letter-spacing:0.3px;margin-bottom:2px;">H/R (HISOB RAQAM)</div>
        <div style="color:#374151;font-family:monospace;font-size:8.5px;">2020 8000 2008 5770 2001</div>
      </div>
      <div>
        <div style="color:#94a3b8;font-weight:700;letter-spacing:0.3px;margin-bottom:2px;">MFO</div>
        <div style="color:#374151;font-family:monospace;">01133</div>
      </div>
      <div>
        <div style="color:#94a3b8;font-weight:700;letter-spacing:0.3px;margin-bottom:2px;">OKED</div>
        <div style="color:#374151;font-family:monospace;">47190</div>
      </div>
      <div>
        <div style="color:#94a3b8;font-weight:700;letter-spacing:0.3px;margin-bottom:2px;">BANK</div>
        <div style="color:#374151;">ATB "SQB" Samarqand fil.</div>
      </div>
    </div>
  </div>


</div>
</body>
</html>`;
    };

    const previewStatus = STATUS_LABEL[order.status] ?? order.status;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className={`w-full max-w-4xl rounded-2xl border shadow-2xl ${panel} max-h-[92vh] overflow-y-auto`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`sticky top-0 z-10 flex items-center justify-between border-b px-6 py-4 ${isDark ? 'border-[#334155] bg-[#141C2B]' : 'border-[#e2e8f0] bg-white'}`}>
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 text-amber-500">
                            <LuPrinter size={20} />
                        </span>
                        <div>
                            <h3 className={`text-lg font-bold ${head}`}>Buyurtmani chop etish</h3>
                            <p className={`text-xs ${muted}`}>
                                {showPrices ? 'Brend va rangni tanlab chop eting' : 'Narxlarsiz yuklash hujjati'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Yopish"
                        className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                            isDark ? 'hover:bg-[#1e293b]' : 'hover:bg-[#f1f5f9]'
                        }`}
                    >
                        <LuX size={20} className={muted} />
                    </button>
                </div>

                {/* Brend va rang tanlash */}
                <div className="p-6">
                    <div className="mb-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <LuBuilding2 size={16} className={muted} />
                            <h4 className={`text-sm font-bold ${head}`}>Brend</h4>
                        </div>
                        <span className={`text-xs ${muted}`}>{brandsLoading ? 'Yuklanmoqda...' : `${brands.length} ta brend`}</span>
                    </div>
                    {brandsLoading ? (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                            {Array.from({ length: 4 }).map((_, i) => <div key={i} className={`h-24 animate-pulse rounded-xl ${isDark ? 'bg-white/5' : 'bg-slate-100'}`} />)}
                        </div>
                    ) : brands.length === 0 ? (
                        <div className={`rounded-xl border border-dashed p-4 text-sm ${isDark ? 'border-white/10' : 'border-slate-200'} ${muted}`}>
                            Brendlar topilmadi. «Brendlar» bo‘limida brend qo‘shing — hujjatda uning nomi va logotipi chiqadi.
                        </div>
                    ) : (
                        <div className="grid max-h-56 grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3 md:grid-cols-4">
                            {brands.map((brand) => {
                                const selected = selectedBrand?.id === brand.id;
                                return (
                                    <button
                                        key={brand.id}
                                        type="button"
                                        onClick={() => setSelectedBrandId(brand.id)}
                                        className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all ${
                                            selected
                                                ? 'border-amber-400 bg-amber-400/10 shadow-lg'
                                                : isDark ? 'border-[#334155] hover:border-[#475569]' : 'border-[#e2e8f0] hover:border-[#cbd5e1]'
                                        }`}
                                    >
                                        <div className="flex h-10 items-center justify-center"><BrandThumb brand={brand} size={36} /></div>
                                        <span className={`max-w-full truncate text-xs font-semibold ${selected ? 'text-amber-600' : muted}`}>{brand.name}</span>
                                        {selected && (
                                            <div className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[#0F172A]">
                                                <LuCheck size={12} strokeWidth={3} />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    <div className="mt-5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <LuPalette size={16} className={muted} />
                            <h4 className={`text-sm font-bold ${head}`}>Hujjat rangi</h4>
                        </div>
                        <span className={`font-mono text-xs ${muted}`}>{accent.toUpperCase()}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                        {PRESET_COLORS.map((c) => {
                            const selected = c.value.toLowerCase() === accent.toLowerCase();
                            return (
                                <button
                                    key={c.value}
                                    type="button"
                                    title={c.name}
                                    aria-label={c.name}
                                    onClick={() => pickAccent(c.value)}
                                    className="relative h-9 w-9 rounded-full border-2 transition-transform hover:scale-110"
                                    style={{ background: c.value, borderColor: selected ? '#FACC15' : 'transparent', boxShadow: selected ? '0 0 0 3px rgba(250,204,21,.35)' : 'inset 0 0 0 1px rgba(0,0,0,.08)' }}
                                >
                                    {selected && <LuCheck size={14} strokeWidth={3} className="absolute inset-0 m-auto text-white" />}
                                </button>
                            );
                        })}
                        <label className={`relative flex h-9 cursor-pointer items-center gap-2 rounded-full border-2 px-3 text-xs font-semibold ${!isPreset ? 'border-amber-400' : isDark ? 'border-[#334155]' : 'border-[#e2e8f0]'} ${muted}`} title="O‘z rangingizni tanlang">
                            <span className="h-5 w-5 rounded-full" style={{ background: accent, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.08)' }} />
                            Boshqa rang
                            <input type="color" value={accent} onChange={(e) => pickAccent(e.target.value.toUpperCase())} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" aria-label="Rang tanlash" />
                        </label>
                    </div>

                    {/* Preview */}
                    <div className="mt-6">
                        <h4 className={`mb-3 text-sm font-bold ${head}`}>Dizayn ko&apos;rinishi:</h4>
                        <div
                            className="overflow-hidden rounded-xl shadow-lg"
                            style={{ backgroundColor: '#ffffff', border: `1px solid ${accent}30` }}
                        >
                            {/* Preview header bar */}
                            <div style={{ height: '3px', backgroundColor: accent }} />

                            <div className="p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        {logoLoading
                                            ? <span className="flex h-10 w-24 items-center justify-center"><LuLoader className="animate-spin text-slate-400" size={18} /></span>
                                            : logoDataUrl
                                                ? <img src={logoDataUrl} alt={brandName} className="h-10 w-24 flex-shrink-0 object-contain" />
                                                : <span className="flex h-10 w-10 items-center justify-center rounded-lg text-lg font-black text-white" style={{ background: accent }}>{brandName.charAt(0).toUpperCase()}</span>}
                                        <div>
                                            <h3
                                                className="text-base font-black tracking-wide"
                                                style={{ color: accent }}
                                            >
                                                {brandName}
                                            </h3>
                                            <p className="text-[10px] font-medium tracking-wider text-[#94a3b8]">
                                                INNOVATSION PVX PROFILLARI
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <h3
                                            className="text-2xl font-black tracking-[0.3em]"
                                            style={{ color: accent }}
                                        >
                                            INVOICE
                                        </h3>
                                        <p className="text-[10px] font-semibold tracking-widest text-[#94a3b8]">
                                            {showPrices ? 'HISOB-FAKTURA' : 'YUKLASH HUJJATI'}
                                        </p>
                                    </div>
                                </div>

                                <div className="my-4 h-px" style={{ backgroundColor: accent + '30' }} />

                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-[10px] font-bold tracking-widest" style={{ color: '#0f172a', opacity: 0.6 }}>
                                            MIJOZ
                                        </p>
                                        <p className="mt-0.5 text-sm font-bold" style={{ color: '#0f172a' }}>
                                            {order.customerName || '—'}
                                        </p>
                                    </div>
                                    {showPrices ? <div className="text-right">
                                        <p className="text-[10px] font-bold tracking-widest" style={{ color: '#0f172a', opacity: 0.6 }}>
                                            SUMMA
                                        </p>
                                        <p className="mt-0.5 text-sm font-black" style={{ color: accent }}>
                                            {Number(order.totalAmount || 0).toLocaleString('ru-RU').replace(/\u00A0/g, ' ')} so&apos;m
                                        </p>
                                    </div> : (
                                        <p className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600">
                                            Narxlarsiz nusxa
                                        </p>
                                    )}
                                </div>

                                <div className="mt-4 flex items-center justify-between border-t pt-3" style={{ borderColor: '#e2e8f0' }}>
                                    <p className="text-[10px] text-[#64748b]">
                                        {new Date().toLocaleDateString('uz-UZ')}
                                    </p>
                                    <div
                                        className="rounded-full px-3 py-1 text-[10px] font-bold text-white"
                                        style={{ backgroundColor: accent }}
                                    >
                                        {previewStatus}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className={`sticky bottom-0 flex justify-end gap-3 border-t px-6 py-4 backdrop-blur ${isDark ? 'border-[#334155] bg-[#141C2B]' : 'border-[#e2e8f0] bg-white'}`}>
                    <button
                        onClick={onClose}
                        className={`rounded-xl border px-6 py-3 text-sm font-bold transition-colors ${
                            isDark
                                ? 'border-[#334155] text-[#94a3b8] hover:bg-[#1e293b]'
                                : 'border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9]'
                        }`}
                    >
                        Bekor qilish
                    </button>
                    <button
                        onClick={handlePrint}
                        disabled={logoLoading || brandsLoading}
                        className="flex items-center gap-2 rounded-xl bg-yellow-400 px-6 py-3 text-sm font-bold text-[#0F172A] shadow-lg shadow-yellow-400/30 transition-all hover:-translate-y-px hover:bg-yellow-500 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {logoLoading ? <LuLoader size={16} className="animate-spin" /> : <LuPrinter size={16} />}
                        Chop etish
                    </button>
                </div>
            </div>
        </div>
    );
}

OrderPrintModal.propTypes = {
    order: PropTypes.object.isRequired,
    onClose: PropTypes.func.isRequired,
    showPrices: PropTypes.bool,
};
