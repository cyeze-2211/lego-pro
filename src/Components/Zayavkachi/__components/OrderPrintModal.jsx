import { useState } from 'react';
import PropTypes from 'prop-types';
import { LuX, LuPrinter } from 'react-icons/lu';
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
    { id: 1, src: logo1, name: 'NovyPlast',   color: '#0D9488', bgColor: '#F0FDFA', textColor: '#134E4A' },  // teal
    { id: 2, src: logo2, name: 'Ekoplast',     color: '#DC2626', bgColor: '#FEF2F2', textColor: '#7F1D1D' },  // qizil
    { id: 3, src: logo3, name: 'Lion Plast',   color: '#CA8A04', bgColor: '#FEFCE8', textColor: '#713F12' },  // sariq
    { id: 4, src: logo4, name: 'LEGO PRO',     color: '#B91C1C', bgColor: '#FEF2F2', textColor: '#450A0A' },  // to'q qizil
    { id: 5, src: logo5, name: 'MACplast',     color: '#E11D48', bgColor: '#FFF1F2', textColor: '#881337' },  // pushti-qizil
    { id: 6, src: logo6, name: 'Ekoplast Red', color: '#EF4444', bgColor: '#FEF2F2', textColor: '#7F1D1D' },  // yorqin qizil
    { id: 7, src: logo7, name: 'Milky Plast',  color: '#1D4ED8', bgColor: '#EFF6FF', textColor: '#1E3A8A' },  // ko'k
];

export default function OrderPrintModal({ order, onClose }) {
    const { isDark } = useAppTheme();
    const [selectedLogo, setSelectedLogo] = useState(LOGOS[0]);

    const panel = isDark ? 'border-white/10 bg-[#141C2B]' : 'border-[#e2e8f0] bg-white';
    const muted = isDark ? 'text-[#94a3b8]' : 'text-[#64748b]';
    const head = isDark ? 'text-white' : 'text-[#0f172a]';

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        const printContent = generatePrintContent();
        
        printWindow.document.write(printContent);
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
        const fmtDate = (v) => v ? new Date(v).toLocaleDateString('uz-UZ') : '—';
        const fmtDateTime = (v) => v ? new Date(v).toLocaleString('uz-UZ') : '—';
        const STATUS_LABEL_MAP = { PENDING: 'Kutilmoqda', APPROVED: 'Tasdiqlangan', REJECTED: 'Rad etilgan' };
        const items = order.items || [];

        const emptyRows = Array.from({ length: Math.max(0, 9 - items.length) })
            .map((_, i) => `
                <tr key="empty-${i}" style="border-bottom:1px solid #e2e8f0;background:#fff;">
                    <td style="background:#fff;padding:6px 8px;border-right:1px solid #e2e8f0;">&nbsp;</td>
                    <td style="background:#fff;padding:6px 8px;border-right:1px solid #e2e8f0;">&nbsp;</td>
                    <td style="background:#fff;padding:6px 8px;border-right:1px solid #e2e8f0;">&nbsp;</td>
                    <td style="background:#fff;padding:6px 8px;border-right:1px solid #e2e8f0;">&nbsp;</td>
                    <td style="background:#fff;padding:6px 8px;border-right:1px solid #e2e8f0;">&nbsp;</td>
                    <td style="background:#fff;padding:6px 8px;">&nbsp;</td>
                </tr>
            `).join('');

        const itemRows = items.map((item, idx) => `
            <tr style="border-bottom:1px solid #e2e8f0;background:#fff;">
                <td style="background:#fff;padding:6px 8px;text-align:center;font-size:10px;color:#374151;border-right:1px solid #e2e8f0;">${idx + 1}</td>
                <td style="background:#fff;padding:6px 8px;font-size:10px;border-right:1px solid #e2e8f0;">
                    <div style="font-weight:600;color:#0f172a;">${item.productName || '—'}</div>
                    ${item.productBarcode ? `<div style="font-size:8.5px;color:#94a3b8;font-family:monospace;margin-top:1px;">${item.productBarcode}</div>` : ''}
                </td>
                <td style="background:#fff;padding:6px 8px;text-align:center;font-size:10px;color:#374151;border-right:1px solid #e2e8f0;">${item.quantity}</td>
                <td style="background:#fff;padding:6px 8px;text-align:center;font-size:10px;color:#374151;border-right:1px solid #e2e8f0;">${item.quantity}</td>
                <td style="background:#fff;padding:6px 8px;text-align:right;font-size:10px;color:#374151;border-right:1px solid #e2e8f0;">${fmtNum(item.unitPrice)}</td>
                <td style="background:#fff;padding:6px 8px;text-align:right;font-size:10px;font-weight:700;color:#0f172a;">${fmtNum(item.lineTotal)}</td>
            </tr>
        `).join('');

        const statusColor = order.status === 'APPROVED' ? '#15803d' : order.status === 'REJECTED' ? '#b91c1c' : '#92400E';

        return `<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="UTF-8"/>
  <title>Invoice</title>
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

  <!-- HEADER -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;">
    <div style="display:flex;align-items:center;gap:10px;">
      <img src="${logoSrc}" alt="Logo" style="height:52px;width:auto;object-fit:contain;" />
    </div>
    <div style="text-align:right;">
      <div style="font-size:36px;font-weight:900;letter-spacing:5px;color:#111827;line-height:1;">INVOICE</div>
    </div>
  </div>

  <!-- ACCENT LINE -->
  <div style="height:2.5px;background:${logoColor};margin:10px 0 14px 0;"></div>

  <!-- MIJOZ + HUJJAT -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;gap:20px;">
    <div style="flex:1;">
      <div style="font-size:10px;font-weight:700;color:#0f172a;margin-bottom:4px;">Mijoz:</div>
      <div style="font-size:12px;font-weight:700;color:#0f172a;">${order.customerName || '—'}</div>
      ${order.createdBy ? `<div style="font-size:9.5px;color:#6b7280;margin-top:2px;">Mas'ul: ${order.createdBy}</div>` : ''}
      ${order.summary ? `<div style="font-size:9.5px;color:#4b5563;margin-top:3px;line-height:1.5;">${order.summary}</div>` : ''}
    </div>
    <div style="min-width:190px;">
      <table style="border-collapse:collapse;width:100%;">
        <tbody>
          <tr>
            <td style="font-size:10px;font-weight:700;color:#0f172a;padding-bottom:3px;padding-right:12px;white-space:nowrap;">Hujjat №:</td>
            <td style="font-size:10px;color:#374151;padding-bottom:3px;text-align:right;">${(order.id || '').slice(0,8).toUpperCase()}</td>
          </tr>
          <tr>
            <td style="font-size:10px;font-weight:700;color:#0f172a;padding-bottom:3px;padding-right:12px;">Sana:</td>
            <td style="font-size:10px;color:#374151;padding-bottom:3px;text-align:right;">${fmtDate(order.createdAt)}</td>
          </tr>
          <tr>
            <td style="font-size:10px;font-weight:700;color:#0f172a;padding-right:12px;">Holati:</td>
            <td style="font-size:10px;font-weight:700;text-align:right;color:${statusColor};">${STATUS_LABEL_MAP[order.status] ?? order.status}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- JADVAL -->
  <table style="width:100%;border-collapse:collapse;margin-bottom:0;border:1px solid #cbd5e1;background:#fff;">
    <thead>
      <tr>
        <td style="padding:0;width:28px;border-right:1px solid #334155;">
          <div style="background:#1e293b;color:#fff;padding:7px 8px;text-align:center;font-size:9.5px;font-weight:700;">№</div>
        </td>
        <td style="padding:0;border-right:1px solid #334155;">
          <div style="background:#1e293b;color:#fff;padding:7px 8px;text-align:left;font-size:9.5px;font-weight:700;">Mahsulot</div>
        </td>
        <td style="padding:0;width:48px;border-right:1px solid #334155;">
          <div style="background:#1e293b;color:#fff;padding:7px 8px;text-align:center;font-size:9.5px;font-weight:700;">Pachka</div>
        </td>
        <td style="padding:0;width:44px;border-right:1px solid #334155;">
          <div style="background:#1e293b;color:#fff;padding:7px 8px;text-align:center;font-size:9.5px;font-weight:700;">Dona</div>
        </td>
        <td style="padding:0;width:88px;border-right:1px solid #334155;">
          <div style="background:#1e293b;color:#fff;padding:7px 8px;text-align:right;font-size:9.5px;font-weight:700;">Narxi</div>
        </td>
        <td style="padding:0;width:100px;">
          <div style="background:#1e293b;color:#fff;padding:7px 8px;text-align:right;font-size:9.5px;font-weight:700;">Jami</div>
        </td>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
      ${emptyRows}
    </tbody>
  </table>

  <!-- TO'LOV + JAMI -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:20px;margin-top:14px;margin-bottom:12px;">
    <div style="flex:1;">
      <div style="font-size:10.5px;font-weight:700;color:#0f172a;margin-bottom:5px;">To'lov ma'lumotlari:</div>
      <div style="font-size:9.5px;color:#374151;line-height:1.7;">
        <div>Mijoz: <strong>${order.customerName || '—'}</strong></div>
        <div>Mas'ul: <strong>${order.createdBy || '—'}</strong></div>
        <div>Sana: <strong>${fmtDateTime(order.createdAt)}</strong></div>
        ${order.summary ? `<div>Izoh: ${order.summary}</div>` : ''}
      </div>
    </div>
    <div style="min-width:220px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
        <span style="font-size:9.5px;color:#374151;">Olingan tovar jami:</span>
        <span style="background:${logoColor};color:#fff;padding:3px 10px;font-size:9.5px;font-weight:700;min-width:90px;text-align:right;white-space:nowrap;">
          ${fmtNum(order.totalAmount)} so'm
        </span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
        <span style="font-size:9.5px;color:#374151;">To'langan:</span>
        <span style="background:${logoColor};color:#fff;padding:3px 10px;font-size:9.5px;font-weight:700;min-width:90px;text-align:right;white-space:nowrap;">
          ${fmtNum(order.paidAmount)} so'm
        </span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:10.5px;font-weight:800;color:#0f172a;">QOLGAN QARZ:</span>
        <span style="background:${logoColor};color:#fff;padding:5px 10px;font-size:10.5px;font-weight:800;min-width:90px;text-align:right;white-space:nowrap;">
          ${fmtNum(order.remainingDebt)} so'm
        </span>
      </div>
    </div>
  </div>

  <!-- SHARTLAR -->
  <div style="margin-bottom:16px;">
    <div style="font-size:10.5px;font-weight:700;color:#0f172a;margin-bottom:4px;">Shartlar va qoidalar (Term &amp; Condition):</div>
    <div style="font-size:9.5px;color:#4b5563;line-height:1.6;">
      To'lov shartnomaga muvofiq 5 bank ish kuni ichida amalga oshirilishi lozim.
    </div>
  </div>

  <!-- TASHAKKUR + IMZO -->
  <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:14px;">
    <div style="font-size:10.5px;font-weight:600;color:#0f172a;">Xaridingiz uchun tashakkur!</div>
    <div style="text-align:center;min-width:160px;">
      <div style="font-size:9.5px;color:#374151;margin-bottom:4px;">Imzo / Authorised Sign:</div>
      <div style="border-bottom:1px solid #374151;width:140px;margin-left:auto;"></div>
    </div>
  </div>

  <!-- FOOTER LINE -->
  <div style="height:2.5px;background:${logoColor};margin-bottom:8px;"></div>
  <div style="display:flex;justify-content:center;align-items:center;gap:10px;font-size:9px;color:#6b7280;flex-wrap:wrap;">
    <span>📞 +998 71 200 00 00</span>
    <span style="color:#d1d5db;">|</span>
    <span>📍 Toshkent sh., Yunusobod t.</span>
    <span style="color:#d1d5db;">|</span>
    <span>✉ info@legopro.uz</span>
    <span style="color:#d1d5db;">|</span>
    <span>🌐 www.legopro.uz</span>
  </div>

</div>
</body>
</html>`;
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={onClose}
        >
            <div 
                className={`w-full max-w-4xl rounded-2xl border shadow-2xl ${panel} max-h-[90vh] overflow-y-auto`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`flex items-center justify-between border-b px-6 py-4 ${isDark ? 'border-[#334155]' : 'border-[#e2e8f0]'}`}>
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 text-amber-500">
                            <LuPrinter size={20} />
                        </span>
                        <div>
                            <h3 className={`text-lg font-bold ${head}`}>Buyurtmani chop etish</h3>
                            <p className={`text-sm ${muted}`}>Logo va dizaynni tanlang</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                            isDark ? 'hover:bg-[#1e293b]' : 'hover:bg-[#f1f5f9]'
                        }`}
                    >
                        <LuX size={20} className={muted} />
                    </button>
                </div>

                {/* Logo selection */}
                <div className="p-6">
                    <h4 className={`mb-4 text-sm font-bold ${head}`}>Logo tanlang:</h4>
                    <div className="flex flex-wrap gap-3">
                        {LOGOS.map((logo) => (
                            <button
                                key={logo.id}
                                onClick={() => setSelectedLogo(logo)}
                                className={`relative rounded-xl border-2 p-2 transition-all ${
                                    selectedLogo.id === logo.id
                                        ? 'border-amber-400 bg-amber-400/10 shadow-lg'
                                        : isDark
                                        ? 'border-[#334155] hover:border-[#475569]'
                                        : 'border-[#e2e8f0] hover:border-[#cbd5e1]'
                                }`}
                            >
                                <img
                                    src={logo.src}
                                    alt={logo.name}
                                    className="h-10 w-24 object-contain"
                                />
                                {selectedLogo.id === logo.id && (
                                    <div className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-[#0F172A]">
                                        ✓
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Preview */}
                    <div className="mt-5">
                        <h4 className={`mb-3 text-sm font-bold ${head}`}>Dizayn ko'rinishi:</h4>
                        <div
                            className="rounded-xl p-4"
                            style={{
                                backgroundColor: selectedLogo.bgColor,
                                borderLeft: `4px solid ${selectedLogo.color}`
                            }}
                        >
                            <div className="flex items-center gap-4">
                                <img
                                    src={selectedLogo.src}
                                    alt="Selected logo"
                                    className="h-12 w-32 flex-shrink-0 object-contain"
                                />
                                <div className={`h-10 w-px`} style={{ backgroundColor: selectedLogo.color + '40' }} />
                                <div>
                                    <h3
                                        className="text-xl font-bold tracking-widest"
                                        style={{ color: selectedLogo.color }}
                                    >
                                        INVOICE
                                    </h3>
                                    <p className="text-sm font-semibold" style={{ color: selectedLogo.textColor }}>
                                        {order.customerName}
                                    </p>
                                </div>
                                <div className="ml-auto text-right">
                                    <p className="text-xs" style={{ color: selectedLogo.textColor }}>
                                        {new Date().toLocaleDateString('uz-UZ')}
                                    </p>
                                    <div
                                        className="mt-1 rounded-full px-3 py-1 text-xs font-bold text-white"
                                        style={{ backgroundColor: selectedLogo.color }}
                                    >
                                        {order.status === 'APPROVED' ? 'Tasdiqlangan' : order.status === 'PENDING' ? 'Kutilmoqda' : 'Rad etilgan'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className={`flex justify-end gap-3 border-t px-6 py-4 ${isDark ? 'border-[#334155]' : 'border-[#e2e8f0]'}`}>
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
                        className="flex items-center gap-2 rounded-xl bg-[#FACC15] px-6 py-3 text-sm font-bold text-[#0F172A] transition-all hover:bg-[#EAB308]"
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
