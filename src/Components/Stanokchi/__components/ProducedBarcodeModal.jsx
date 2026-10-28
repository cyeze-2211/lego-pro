import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { LuPrinter, LuX, LuPackage } from 'react-icons/lu';
import { useAppTheme } from '../../../theme/tokens';
import $api from '../../../store/api';
import Barcode, { encodeEan13 } from '../../ui/Barcode';
import { printHtml } from '../../Staff/__components/orderReceipt';

/*
 * «+1 pachka» qayd etilgandan keyin chiqadigan oyna: mahsulot nomi, katta shtrix-kod va raqami.
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

export default function ProducedBarcodeModal({ open, onClose, productId, productName, brandName, barcode: initialBarcode, quantityLabel = '1 pachka' }) {
    const { isDark } = useAppTheme();
    const [barcode, setBarcode] = useState(initialBarcode || '');
    const [loading, setLoading] = useState(false);

    // Javobda shtrix-kod bo‘lmasa — mahsulotdan olamiz
    useEffect(() => {
        if (!open) return undefined;
        setBarcode(initialBarcode || '');
        if (initialBarcode || !productId) return undefined;
        let cancelled = false;
        setLoading(true);
        $api.get(`/products/${productId}`)
            .then(({ data }) => { if (!cancelled) setBarcode(data?.data?.barcode || ''); })
            .catch(() => {})
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [open, initialBarcode, productId]);

    // Esc bilan yopish
    useEffect(() => {
        if (!open) return undefined;
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    if (!open) return null;
    const panel = isDark ? '#141C2B' : '#ffffff';
    const border = isDark ? '#334155' : '#E2E8F0';
    const text = isDark ? '#F1F5F9' : '#0F172A';
    const muted = isDark ? '#94A3B8' : '#64748B';

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="Shtrix-kod"
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(2,6,23,.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        >
            <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(520px, 100%)', background: panel, border: `1px solid ${border}`, borderRadius: 20, boxShadow: '0 24px 60px rgba(0,0,0,.35)', overflow: 'hidden' }}>
                <div style={{ height: 4, background: 'linear-gradient(90deg,#10B981,#34D399)' }} />
                <div style={{ padding: '18px 20px 8px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <span style={{ display: 'flex', width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', background: isDark ? 'rgba(16,185,129,.15)' : '#ECFDF5', color: '#10B981', flexShrink: 0 }}>
                        <LuPackage size={22} />
                    </span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#10B981' }}>✓ {quantityLabel} qayd etildi</p>
                        <p style={{ margin: '2px 0 0', fontSize: 18, fontWeight: 800, color: text, lineHeight: 1.2 }}>{productName}</p>
                        {brandName && <p style={{ margin: '2px 0 0', fontSize: 13, color: muted }}>Brend: {brandName}</p>}
                    </div>
                    <button type="button" onClick={onClose} aria-label="Yopish" style={{ background: 'transparent', border: 0, color: muted, cursor: 'pointer', padding: 6, borderRadius: 8 }}><LuX size={18} /></button>
                </div>

                {/* Shtrix-kod — oq fonda, skaner o‘qiy olishi uchun */}
                <div style={{ margin: '8px 20px', padding: 16, background: '#fff', borderRadius: 14, border: `1px solid ${border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    {loading ? (
                        <p style={{ margin: 0, color: '#64748B', fontSize: 13 }}>Shtrix-kod yuklanmoqda...</p>
                    ) : barcode ? (
                        <>
                            <Barcode value={barcode} height={80} module={3} />
                            <p style={{ margin: 0, fontFamily: 'monospace', fontSize: 22, fontWeight: 800, letterSpacing: 3, color: '#0F172A' }}>{barcode}</p>
                        </>
                    ) : (
                        <p style={{ margin: 0, color: '#64748B', fontSize: 13 }}>Bu mahsulotga shtrix-kod kiritilmagan</p>
                    )}
                </div>

                <div style={{ padding: '8px 20px 18px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    {barcode && (
                        <button type="button" onClick={() => printHtml(labelHtml({ productName, brandName, barcode }))}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 44, padding: '0 16px', borderRadius: 12, border: `1px solid ${border}`, background: 'transparent', color: text, fontWeight: 700, cursor: 'pointer' }}>
                            <LuPrinter size={16} /> Yorliq chop etish
                        </button>
                    )}
                    <button type="button" onClick={onClose} autoFocus
                        style={{ height: 44, padding: '0 22px', borderRadius: 12, border: 0, background: 'linear-gradient(135deg,rgb(var(--accent-400)),rgb(var(--accent-500)))', color: '#0F172A', fontWeight: 800, cursor: 'pointer' }}>
                        Yopish
                    </button>
                </div>
            </div>
        </div>
    );
}

ProducedBarcodeModal.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    productId: PropTypes.string,
    productName: PropTypes.string,
    brandName: PropTypes.string,
    barcode: PropTypes.string,
    quantityLabel: PropTypes.string,
};
