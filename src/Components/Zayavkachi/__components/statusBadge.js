import { PRODUCT_WAREHOUSE_ROLES } from '../../../app/permissions/roles';
// Zayavka holatlari — butun ERP uchun yagona manba.
// Backend holatlari: CREATED → LOADED → CONFIRMED, CREATED → REJECTED, CONFIRMED → RETURNED.

export const ORDER_STATUSES = ['CREATED', 'LOADED', 'CONFIRMED', 'REJECTED', 'RETURNED'];

export const STATUS_LABEL = {
    CREATED:    'Yangi',
    LOADED:     'Ortildi',
    CONFIRMED:  'Tugallandi',
    REJECTED:   'Bekor qilindi',
    RETURNED:   'Qaytarildi',
};

export const statusLabel = (status) => STATUS_LABEL[String(status || '').toUpperCase()] ?? status ?? '—';

/** Tailwind sinflari (pill/badge uchun) */
export const statusCx = (status) => {
    switch (String(status || '').toUpperCase()) {
        case 'CREATED':
            return 'bg-amber-400/10 text-amber-500 border-amber-400/40';
        case 'LOADED':
            return 'bg-[#8b5cf6]/10 text-[#8b5cf6] border-[#8b5cf6]/40';
        case 'CONFIRMED':
            return 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/40';
        case 'REJECTED':
            return 'bg-[#f43f5e]/10 text-[#f43f5e] border-[#f43f5e]/40';
        case 'RETURNED':
            return 'bg-[#f97316]/10 text-[#f97316] border-[#f97316]/40';
        default:
            return 'bg-[#94a3b8]/10 text-[#94a3b8] border-[#94a3b8]/30';
    }
};

/** Inline uslublar (style={{...}}) uchun ranglar */
export const statusStyle = (status, isDark) => {
    const map = {
        CREATED:   { bg: isDark ? 'rgba(250,204,21,.16)'  : '#FEF3C7', color: isDark ? '#fde68a' : '#92400E', border: isDark ? '#ca8a04' : '#d97706', solid: '#F59E0B' },
        LOADED:    { bg: isDark ? 'rgba(167,139,250,.16)' : '#EDE9FE', color: isDark ? '#c4b5fd' : '#5B21B6', border: isDark ? '#8b5cf6' : '#7c3aed', solid: '#8B5CF6' },
        CONFIRMED: { bg: isDark ? 'rgba(34,197,94,.16)'   : '#DCFCE7', color: isDark ? '#86efac' : '#15803d', border: '#16a34a', solid: '#16A34A' },
        REJECTED:  { bg: isDark ? 'rgba(239,68,68,.16)'   : '#FEE2E2', color: isDark ? '#fca5a5' : '#b91c1c', border: '#dc2626', solid: '#DC2626' },
        RETURNED:  { bg: isDark ? 'rgba(249,115,22,.16)'  : '#FFEDD5', color: isDark ? '#fdba74' : '#c2410c', border: '#ea580c', solid: '#EA580C' },
        DEFAULT:   { bg: isDark ? 'rgba(148,163,184,.16)' : '#E2E8F0', color: isDark ? '#cbd5e1' : '#334155', border: isDark ? '#64748b' : '#94a3b8', solid: '#64748B' },
    };
    return map[String(status || '').toUpperCase()] || map.DEFAULT;
};

// Ruxsat etilgan holat o‘tishlari (state machine)
export const NEXT_STATUS = {
    CREATED:    ['LOADED', 'REJECTED'],
    LOADED:     ['CONFIRMED'],
    CONFIRMED:  ['RETURNED'],
    REJECTED:   [],
    RETURNED:   [],
};

// Yakuniy (o‘zgartirib bo‘lmaydigan) holatlar
export const FINAL_STATUSES = ['CONFIRMED', 'REJECTED', 'RETURNED'];

/** «Ortildi» (LOADED) holatiga faqat mahsulot omborchisi o‘tkaza oladi. */
export const canSetOrderStatus = (role, nextStatus) => {
    if (nextStatus === 'LOADED') return PRODUCT_WAREHOUSE_ROLES.includes(role);
    return true;
};

/** Rol uchun ruxsat etilgan keyingi holatlar */
export const nextStatusesForRole = (status, role) =>
    (NEXT_STATUS[status] ?? []).filter((next) => canSetOrderStatus(role, next));
