import { useState } from 'react';
import PropTypes from 'prop-types';
import { LuX, LuPrinter, LuBuilding2, LuCheck } from 'react-icons/lu';
import { useAppTheme } from '../../../theme/tokens';

// Logo import
import logo1 from '../../../Images/logocopy/Lettered Logo (1).png';
import logo2 from '../../../Images/logocopy/Lettered Logo Outlined.png';
import logo3 from '../../../Images/logocopy/Lettered Logo Outlined (2).png';
import logo4 from '../../../Images/logocopy/Lettered Logo Outlined (3).png';
import logo5 from '../../../Images/logocopy/Letterd Logo Outlined.png';
import logo6 from '../../../Images/logocopy/Unified Logo (background).png';
import logo7 from '../../../Images/logocopy/Ресурс 2300.png';

const LOGOS = [
    { id: 1, src: logo1, name: 'Total Plast',   company: 'Total Plast',   color: '#0D9488', bgColor: '#F0FDFA', textColor: '#134E4A' },
    { id: 2, src: logo2, name: 'Eko Plast',     company: 'Eko Plast',     color: '#DC2626', bgColor: '#FEF2F2', textColor: '#7F1D1D' },
    { id: 3, src: logo3, name: 'Lion Plast',    company: 'Lion Plast',    color: '#CA8A04', bgColor: '#FEFCE8', textColor: '#713F12' },
    { id: 4, src: logo4, name: 'LEGO PRO',      company: 'Lego Pro',      color: '#B91C1C', bgColor: '#FEF2F2', textColor: '#450A0A' },
    { id: 5, src: logo5, name: 'Mega Plast',    company: 'Mega Plast',    color: '#E11D48', bgColor: '#FFF1F2', textColor: '#881337' },
    { id: 6, src: logo6, name: 'Eko Plast Red', company: 'Eko Plast',     color: '#EF4444', bgColor: '#FEF2F2', textColor: '#7F1D1D' },
    { id: 7, src: logo7, name: 'Milliy Plast',  company: 'Milliy Plast',  color: '#1D4ED8', bgColor: '#EFF6FF', textColor: '#1E3A8A' },
];

const STATUS_LABEL_MAP = {
    CREATED:    'Yaratilgan',
    DISPATCHED: "Jo'natilgan",
    LOADED:     'Yuklangan',
    CONFIRMED:  'Tasdiqlangan',
    REJECTED:   'Rad etilgan',
};

export default function OrderPrintModal({ order, onClose }) {
    const { isDark } = useAppTheme();
    const [selectedLogo, setSelectedLogo] = useState(LOGOS[0]);

    const panel = isDark ? 'border-white/10 bg-[#141C2B]' : 'border-[#e2e8f0] bg-white';
    const muted = isDark ? 'text-[#94a3b8]' : 'text-[#64748b]';
    const head  = isDark ? 'text-white' : 'text-[#0f172a]';

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(generatePrintContent());
        printWindow.document.close();
        printWindow.onload = () => {
            printWindow.print();
            printWindow.close();
        };
        onClose();
    };

    const generatePrintContent = () => {
        const logoColor = selectedLogo.color;
        const logoSrc   = selectedLogo.src;

        const fmtNum = (v) => {
            const n = Number(v ?? 0);
            return n.toLocaleString('ru-RU').replace(/\u00A0/g, ' ');
        };
        const fmtDate     = (v) => v ? new Date(v).toLocaleDateString('uz-UZ') : '—';
        const fmtDateTime = (v) => v ? new Date(v).toLocaleString('uz-UZ') : '—';
        const items       = order.items || [];

        const statusColor = order.status === 'CONFIRMED'
            ? '#15803d'
            : order.status === 'REJECTED'
            ? '#b91c1c'
            : '#92400E';

        const emptyRows = Array.from({ length: Math.max(0, 8 - items.length) })
            .map(() => `
                <tr style="border-bottom:1px solid #e2e8f0;background:#fff;">
                    <td style="background:#fff;padding:7px 8px;border-right:1px solid #e2e8f0;">&nbsp;</td>
                    <td style="background:#fff;padding:7px 8px;border-right:1px solid #e2e8f0;">&nbsp;</td>
                    <td style="background:#fff;padding:7px 8px;border-right:1px solid #e2e8f0;">&nbsp;</td>
                    <td style="background:#fff;padding:7px 8px;border-right:1px solid #e2e8f0;">&nbsp;</td>
                    <td style="background:#fff;padding:7px 8px;border-right:1px solid #e2e8f0;">&nbsp;</td>
                    <td style="background:#fff;padding:7px 8px;">&nbsp;</td>
                </tr>
            `).join('');

        const itemRows = items.map((item, idx) => `
            <tr style="border-bottom:1px solid #e2e8f0;background:#fff;">
                <td style="background:#fff;padding:7px 8px;text-align:center;font-size:10px;color:#374151;border-right:1px solid #e2e8f0;">${idx + 1}</td>
                <td style="background:#fff;padding:7px 8px;font-size:10px;border-right:1px solid #e2e8f0;">
                    <div style="font-weight:600;color:#0f172a;">${item.productName || '—'}</div>
                    ${item.productBarcode ? `<div style="font-size:8.5px;color:#94a3b8;font-family:monospace;margin-top:1px;">${item.productBarcode}</div>` : ''}
                </td>
                <td style="background:#fff;padding:7px 8px;text-align:center;font-size:10px;color:#374151;border-right:1px solid #e2e8f0;">${item.quantity}</td>
                <td style="background:#fff;padding:7px 8px;text-align:center;font-size:10px;color:#374151;border-right:1px solid #e2e8f0;">6</td>
                <td style="background:#fff;padding:7px 8px;text-align:right;font-size:10px;color:#374151;border-right:1px solid #e2e8f0;">${fmtNum(item.unitPrice)}</td>
                <td style="background:#fff;padding:7px 8px;text-align:right;font-size:10px;font-weight:700;color:#0f172a;">${fmtNum(item.lineTotal)}</td>
            </tr>
        `).join('');

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
      <img src="${logoSrc}" alt="Logo" style="height:44px;width:auto;object-fit:contain;" />
      <div>
        <div style="font-weight:900;font-size:17px;color:#0f172a;letter-spacing:0.5px;">${selectedLogo.company}</div>
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
              ${STATUS_LABEL_MAP[order.status] ?? order.status}
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
        <td style="padding:0;width:48px;border-right:1px solid #334155;">
          <div style="background:#1e293b;color:#fff;padding:8px 8px;text-align:center;font-size:9.5px;font-weight:700;letter-spacing:0.5px;">DONA</div>
        </td>
        <td style="padding:0;width:92px;border-right:1px solid #334155;">
          <div style="background:#1e293b;color:#fff;padding:8px 10px;text-align:right;font-size:9.5px;font-weight:700;letter-spacing:0.5px;">NARXI</div>
        </td>
        <td style="padding:0;width:108px;">
          <div style="background:#1e293b;color:#fff;padding:8px 10px;text-align:right;font-size:9.5px;font-weight:700;letter-spacing:0.5px;">JAMI</div>
        </td>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
      ${emptyRows}
    </tbody>
  </table>

  <!-- ═══ TO'LOV + JAMI ═══ -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:24px;margin-top:16px;margin-bottom:14px;">
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
  </div>

  <!-- ═══ SHARTLAR + IMZO ═══ -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:24px;margin-bottom:16px;">
    <div style="flex:1;">
      <div style="font-size:10px;font-weight:700;color:#0f172a;margin-bottom:4px;letter-spacing:0.3px;">SHARTLAR VA QOIDALAR:</div>
      <div style="font-size:9px;color:#64748b;line-height:1.6;">
        To'lov shartnomaga muvofiq 5 bank ish kuni ichida amalga oshirilishi lozim.
      </div>
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

    const previewStatus = STATUS_LABEL_MAP[order.status] ?? order.status;

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
                            <p className={`text-xs ${muted}`}>Logotipni tanlang va chop etish</p>
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

                {/* Logo selection */}
                <div className="p-6">
                    <div className="mb-4 flex items-center gap-2">
                        <LuBuilding2 size={16} className={muted} />
                        <h4 className={`text-sm font-bold ${head}`}>Kompaniya / Logotip</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                        {LOGOS.map((logo) => {
                            const selected = selectedLogo.id === logo.id;
                            return (
                                <button
                                    key={logo.id}
                                    onClick={() => setSelectedLogo(logo)}
                                    className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all ${
                                        selected
                                            ? 'border-amber-400 bg-amber-400/10 shadow-lg'
                                            : isDark
                                            ? 'border-[#334155] hover:border-[#475569]'
                                            : 'border-[#e2e8f0] hover:border-[#cbd5e1]'
                                    }`}
                                >
                                    <div className="flex h-10 items-center justify-center">
                                        <img
                                            src={logo.src}
                                            alt={logo.name}
                                            className="h-8 w-20 object-contain"
                                        />
                                    </div>
                                    <span className={`text-xs font-semibold ${selected ? 'text-amber-600' : muted}`}>
                                        {logo.company}
                                    </span>
                                    {selected && (
                                        <div className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[#0F172A]">
                                            <LuCheck size={12} strokeWidth={3} />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Preview */}
                    <div className="mt-6">
                        <h4 className={`mb-3 text-sm font-bold ${head}`}>Dizayn ko&apos;rinishi:</h4>
                        <div
                            className="overflow-hidden rounded-xl shadow-lg"
                            style={{ backgroundColor: '#ffffff', border: `1px solid ${selectedLogo.color}30` }}
                        >
                            {/* Preview header bar */}
                            <div style={{ height: '3px', backgroundColor: selectedLogo.color }} />

                            <div className="p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={selectedLogo.src}
                                            alt="Selected logo"
                                            className="h-10 w-24 flex-shrink-0 object-contain"
                                        />
                                        <div>
                                            <h3
                                                className="text-base font-black tracking-wide"
                                                style={{ color: selectedLogo.color }}
                                            >
                                                {selectedLogo.company}
                                            </h3>
                                            <p className="text-[10px] font-medium tracking-wider text-[#94a3b8]">
                                                INNOVATSION PVX PROFILLARI
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <h3
                                            className="text-2xl font-black tracking-[0.3em]"
                                            style={{ color: selectedLogo.color }}
                                        >
                                            INVOICE
                                        </h3>
                                        <p className="text-[10px] font-semibold tracking-widest text-[#94a3b8]">
                                            HISOB-FAKTURA
                                        </p>
                                    </div>
                                </div>

                                <div className="my-4 h-px" style={{ backgroundColor: selectedLogo.color + '30' }} />

                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-[10px] font-bold tracking-widest" style={{ color: selectedLogo.textColor, opacity: 0.7 }}>
                                            MIJOZ
                                        </p>
                                        <p className="mt-0.5 text-sm font-bold" style={{ color: '#0f172a' }}>
                                            {order.customerName || '—'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold tracking-widest" style={{ color: selectedLogo.textColor, opacity: 0.7 }}>
                                            SUMMA
                                        </p>
                                        <p className="mt-0.5 text-sm font-black" style={{ color: selectedLogo.color }}>
                                            {Number(order.totalAmount || 0).toLocaleString('ru-RU').replace(/\u00A0/g, ' ')} so&apos;m
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center justify-between border-t pt-3" style={{ borderColor: '#e2e8f0' }}>
                                    <p className="text-[10px] text-[#64748b]">
                                        {new Date().toLocaleDateString('uz-UZ')}
                                    </p>
                                    <div
                                        className="rounded-full px-3 py-1 text-[10px] font-bold text-white"
                                        style={{ backgroundColor: selectedLogo.color }}
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
                        className="flex items-center gap-2 rounded-xl bg-[#FACC15] px-6 py-3 text-sm font-bold text-[#0F172A] shadow-lg shadow-[#FACC15]/30 transition-all hover:-translate-y-px hover:bg-[#EAB308] hover:shadow-xl"
                    >
                        <LuPrinter size={16} />
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
};


