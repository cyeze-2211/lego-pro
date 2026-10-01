// Components/Stanokchi/Worker/WorkerMachines.jsx
import { useState, useEffect } from 'react';
import { LuCog, LuActivity, LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import { useGetMachinesQuery } from '../../../store/services/machine.api';
import { useCreateStockTransactionMutation } from '../../../store/services/productStock.api';
import { useAppTheme } from '../../../theme/tokens';
import $api from '../../../store/api';

const PAGE_SIZE = 8;

const formatStartedAt = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString('uz-UZ', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
};

/* ── BrandLogo komponenti ── */
function BrandLogo({ brand, isDark, accentColor, size = 32, isRectangle = false }) {
    const [imgSrc, setImgSrc] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!brand?.logoUrl) {
            setImgSrc(null);
            return;
        }

        let mounted = true;
        setLoading(true);
        setError(false);

        // Axios bilan blob yuklab olish (token bilan)
        $api.get(brand.logoUrl.replace('/api/v1', ''), { responseType: 'blob' })
            .then((response) => {
                if (mounted) {
                    const url = URL.createObjectURL(response.data);
                    setImgSrc(url);
                    setLoading(false);
                }
            })
            .catch((err) => {
                if (mounted) {
                    console.error('Logo load error:', err);
                    setError(true);
                    setLoading(false);
                }
            });

        return () => {
            mounted = false;
            if (imgSrc) URL.revokeObjectURL(imgSrc);
        };
    }, [brand?.logoUrl, brand?.id]);

    const containerStyle = {
        width: isRectangle ? `${size + 32}px` : `${size}px`,
        height: `${size}px`,
        minWidth: isRectangle ? `${size + 32}px` : `${size}px`,
        borderRadius: '8px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
        flexShrink: 0,
    };

    if (!brand?.logoUrl || error) {
        return (
            <div style={containerStyle}>
                <span className="text-xs font-bold" style={{ color: accentColor }}>
                    {brand?.name?.charAt(0) || 'B'}
                </span>
            </div>
        );
    }

    if (loading) {
        return (
            <div style={containerStyle}>
                <div className="animate-spin text-xs" style={{ color: accentColor }}>⏳</div>
            </div>
        );
    }

    return (
        <div style={containerStyle}>
            {imgSrc ? (
                <img 
                    src={imgSrc} 
                    alt={brand.name}
                    className="w-full h-full object-contain"
                    style={{ padding: '4px' }}
                />
            ) : (
                <span className="text-xs font-bold" style={{ color: accentColor }}>
                    {brand?.name?.charAt(0) || 'B'}
                </span>
            )}
        </div>
    );
}

export default function WorkerMachines() {
    const [page, setPage] = useState(0);
    const { isDark, pageBg, cardBg, cardBorder, textColor, subtitleColor, accentColor } = useAppTheme();

    const { data: result, isLoading, error, refetch } = useGetMachinesQuery({ page, size: PAGE_SIZE });
    const machines   = result?.items || [];
    const totalPages = result?.pagination?.totalPages || 0;

    /* ── Qayt etish mutation ── */
    const [createStockTransaction, { isLoading: producing }] = useCreateStockTransactionMutation();
    const [producingId, setProducingId] = useState(null);

    /* ── Toast ── */
    const [toast, setToast] = useState(null);
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    const handleCardClick = async (machine) => {
        const isWorking = !!machine.currentRun && machine.status !== 'IDLE';
        if (!isWorking || producing) return;

        setProducingId(machine.id);
        try {
            await createStockTransaction({
                action: 'PRODUCE',
                machineId: machine.id,
                items: [{ productId: machine.currentRun.productId, quantity: 1 }],
            }).unwrap();
            showToast(`✓ 1 dona qayd etildi — ${machine.currentRun.productName}`);
            refetch();
        } catch (err) {
            showToast(err?.data?.message || 'Qayd etishda xatolik', 'error');
        } finally {
            setProducingId(null);
        }
    };

    return (
        <div style={{ background: pageBg, color: textColor, minHeight: '100%' }}>

            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', top: 90, right: 24, zIndex: 9999,
                    padding: '12px 20px', borderRadius: 12, fontWeight: 600, fontSize: 14,
                    background: toast.type === 'error'
                        ? (isDark ? '#7F1D1D' : '#FEE2E2')
                        : (isDark ? '#14532D' : '#DCFCE7'),
                    color: toast.type === 'error'
                        ? (isDark ? '#FCA5A5' : '#991B1B')
                        : (isDark ? '#86EFAC' : '#166534'),
                    boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                }}>
                    {toast.message}
                </div>
            )}

            {/* Sarlavha */}
            <div className="mb-8">
                <h1 className="text-4xl font-extrabold mb-2 leading-tight" style={{ color: textColor }}>
                    Stanoklar
                </h1>
                <p className="text-lg" style={{ color: subtitleColor }}>
                    Qayd etish uchun ishlayotgan stanokning ustiga bosing
                </p>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <SkeletonCard key={i} isDark={isDark} cardBg={cardBg} cardBorder={cardBorder} />
                    ))}
                </div>
            )}

            {/* Error */}
            {error && !isLoading && (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <LuCog size={52} style={{ color: subtitleColor, opacity: 0.35 }} />
                    <p className="text-xl font-semibold" style={{ color: subtitleColor }}>
                        Ma&apos;lumotlarni yuklashda xatolik
                    </p>
                </div>
            )}

            {/* Bo'sh */}
            {!isLoading && !error && machines.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <LuCog size={60} style={{ color: subtitleColor, opacity: 0.3 }} />
                    <p className="text-xl font-semibold" style={{ color: subtitleColor }}>
                        Hozircha stanoklar yo&apos;q
                    </p>
                </div>
            )}

            {/* Cards */}
            {!isLoading && !error && machines.length > 0 && (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {machines.map((machine) => (
                            <WorkerMachineCard
                                key={machine.id}
                                machine={machine}
                                isDark={isDark}
                                cardBg={cardBg}
                                cardBorder={cardBorder}
                                textColor={textColor}
                                subtitleColor={subtitleColor}
                                accentColor={accentColor}
                                onClick={() => handleCardClick(machine)}
                                isProducing={producingId === machine.id}
                            />
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-4 mt-10">
                            <button
                                disabled={page === 0}
                                onClick={() => setPage((p) => p - 1)}
                                className="flex items-center justify-center w-12 h-12 rounded-xl border text-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                style={{ background: cardBg, borderColor: cardBorder, color: textColor }}
                            >
                                <LuChevronLeft size={22} />
                            </button>
                            <span className="text-lg font-bold" style={{ color: subtitleColor }}>
                                {page + 1} / {totalPages}
                            </span>
                            <button
                                disabled={page >= totalPages - 1}
                                onClick={() => setPage((p) => p + 1)}
                                className="flex items-center justify-center w-12 h-12 rounded-xl border text-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                style={{ background: cardBg, borderColor: cardBorder, color: textColor }}
                            >
                                <LuChevronRight size={22} />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

/* ── WorkerMachineCard — katta, oddiy ── */
function WorkerMachineCard({ machine, isDark, cardBg, cardBorder, textColor, subtitleColor, accentColor, onClick, isProducing }) {
    const isWorking = machine.status === 'WORKING';
    const isDefect = machine.status === 'DEFECT';
    const isIdle = machine.status === 'IDLE';

    // Status bo'yicha kartaning rangi
    const getCardBackground = () => {
        if (isWorking) {
            return isDark 
                ? 'linear-gradient(135deg, rgba(22,163,74,0.15) 0%, rgba(34,197,94,0.08) 100%)'
                : 'linear-gradient(135deg, rgba(220,252,231,0.8) 0%, rgba(187,247,208,0.5) 100%)';
        }
        if (isDefect) {
            return isDark 
                ? 'linear-gradient(135deg, rgba(220,38,38,0.15) 0%, rgba(239,68,68,0.08) 100%)'
                : 'linear-gradient(135deg, rgba(254,226,226,0.8) 0%, rgba(252,165,165,0.5) 100%)';
        }
        return cardBg;
    };

    const getBorderColor = () => {
        if (isWorking) return isDark ? 'rgba(34,197,94,0.5)' : '#86EFAC';
        if (isDefect) return isDark ? 'rgba(239,68,68,0.5)' : '#FCA5A5';
        return cardBorder;
    };

    const getBoxShadow = () => {
        if (isWorking) {
            return isDark 
                ? '0 8px 32px rgba(34,197,94,0.2), 0 0 0 1px rgba(34,197,94,0.1) inset'
                : '0 8px 28px rgba(34,197,94,0.15), 0 0 0 1px rgba(34,197,94,0.1) inset';
        }
        if (isDefect) {
            return isDark 
                ? '0 8px 32px rgba(239,68,68,0.2), 0 0 0 1px rgba(239,68,68,0.1) inset'
                : '0 8px 28px rgba(239,68,68,0.15), 0 0 0 1px rgba(239,68,68,0.1) inset';
        }
        return isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 18px rgba(15,23,42,0.08)';
    };

    const canClick = (isWorking || isDefect) && machine.currentRun;

    return (
        <button
            onClick={onClick}
            disabled={isProducing || !canClick}
            className="relative text-left w-full rounded-3xl border transition-all duration-200 overflow-hidden active:scale-[0.98]"
            style={{
                background: getCardBackground(),
                borderColor: getBorderColor(),
                boxShadow: getBoxShadow(),
                cursor: isProducing ? 'wait' : canClick ? 'pointer' : 'default',
                opacity: isProducing ? 0.6 : 1,
            }}
        >
            {/* Top accent strip */}
            <div style={{
                height: 6,
                background: isWorking 
                    ? 'linear-gradient(90deg,#22C55E,#16A34A)'
                    : isDefect 
                    ? 'linear-gradient(90deg,#EF4444,#DC2626)'
                    : (isDark ? 'rgba(255,255,255,0.05)' : '#E2E8F0'),
            }} />

            <div className="p-6">
                {/* Loading indicator (card ustida) */}
                {isProducing && (
                    <div className="absolute inset-0 flex items-center justify-center z-10"
                        style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}>
                        <div className="flex flex-col items-center gap-2">
                            <div style={{
                                width: 32, height: 32, borderRadius: '50%',
                                border: '3px solid rgba(255,255,255,0.3)',
                                borderTopColor: '#22C55E',
                                animation: 'spin 0.8s linear infinite',
                            }} />
                            <span className="text-xs font-semibold" style={{ color: '#fff' }}>
                                Saqlanmoqda...
                            </span>
                        </div>
                    </div>
                )}

                {/* Logo + badge row */}
                <div className="flex items-start justify-between mb-4">
                    {/* Brand logo (katta, to'rtburchak) yoki default icon */}
                    {(isWorking || isDefect) && machine.currentRun?.brand ? (
                        <BrandLogo 
                            brand={machine.currentRun.brand} 
                            isDark={isDark} 
                            accentColor={accentColor}
                            size={64}
                            isRectangle={true}
                        />
                    ) : (
                        <div
                            className="flex items-center justify-center rounded-2xl"
                            style={{ 
                                width: '96px',
                                height: '64px',
                                background: isWorking 
                                    ? (isDark ? 'rgba(34,197,94,0.2)' : 'rgba(34,197,94,0.15)')
                                    : isDefect
                                    ? (isDark ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.15)')
                                    : (isDark ? 'rgba(250,204,21,0.14)' : '#FEF3C7')
                            }}
                        >
                            <LuCog 
                                size={32} 
                                style={{ 
                                    color: isWorking 
                                        ? '#22C55E'
                                        : isDefect
                                        ? '#EF4444'
                                        : accentColor
                                }} 
                            />
                        </div>
                    )}

                    <span
                        className="text-sm font-bold px-3 py-1.5 rounded-full"
                        style={
                            isWorking
                                ? { background: isDark ? 'rgba(34,197,94,0.2)' : '#DCFCE7', color: isDark ? '#86EFAC' : '#166534' }
                                : isDefect
                                ? { background: isDark ? 'rgba(239,68,68,0.2)' : '#FEE2E2', color: isDark ? '#FCA5A5' : '#991B1B' }
                                : { background: isDark ? 'rgba(148,163,184,0.15)' : '#F1F5F9', color: subtitleColor }
                        }
                    >
                        {isWorking ? '🟢 Ishlayapti' : isDefect ? '🔴 Brak' : '⚪ Bo\'sh'}
                    </span>
                </div>

                {/* Brand nomi - zamonaviy dizayn */}
                {(isWorking || isDefect) && machine.currentRun?.brand && (
                    <div 
                        className="mb-3 pb-3"
                        style={{
                            borderBottom: `2px solid ${
                                isWorking 
                                    ? (isDark ? 'rgba(34,197,94,0.2)' : '#BBF7D0')
                                    : (isDark ? 'rgba(239,68,68,0.2)' : '#FECACA')
                            }`
                        }}
                    >
                        <div className="flex items-center gap-2">
                            <div 
                                className="w-1.5 h-6 rounded-full flex-shrink-0"
                                style={{
                                    background: isWorking 
                                        ? (isDark ? '#86EFAC' : '#16A34A')
                                        : (isDark ? '#FCA5A5' : '#DC2626')
                                }}
                            />
                            <span 
                                className="text-xl font-extrabold tracking-tight" 
                                style={{ color: textColor }}
                            >
                                {machine.currentRun.brand.name}
                            </span>
                        </div>
                    </div>
                )}

                {/* Stanok nomi - kichikroq, subtitle rangida */}
                <div className="flex items-center gap-2 mb-2">
                    <LuCog size={14} style={{ color: subtitleColor, flexShrink: 0 }} />
                    <h3 className="font-semibold text-sm" style={{ color: subtitleColor }}>
                        {machine.name}
                    </h3>
                </div>

                {/* Current run info */}
                {(isWorking || isDefect) && machine.currentRun ? (
                    <div
                        className="mt-3 pt-3 flex flex-col gap-2"
                        style={{ 
                            borderTop: `1px solid ${
                                isWorking 
                                    ? (isDark ? 'rgba(34,197,94,0.3)' : '#BBF7D0')
                                    : (isDark ? 'rgba(239,68,68,0.3)' : '#FECACA')
                            }` 
                        }}
                    >
                        {/* Mahsulot nomi */}
                        <div className="flex items-center gap-2">
                            <LuActivity 
                                size={16} 
                                style={{ 
                                    color: isWorking ? '#22C55E' : '#EF4444',
                                    flexShrink: 0 
                                }} 
                            />
                            <span 
                                className="text-base font-semibold" 
                                style={{ 
                                    color: isWorking 
                                        ? (isDark ? '#86EFAC' : '#166534')
                                        : (isDark ? '#FCA5A5' : '#991B1B')
                                }}
                            >
                                {machine.currentRun.productName}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div
                        className="mt-4 pt-4"
                        style={{ borderTop: `1px solid ${cardBorder}` }}
                    >
                        <span className="text-base" style={{ color: subtitleColor }}>Hozir ishlamayapti</span>
                    </div>
                )}
            </div>
        </button>
    );
}

/* ── Skeleton ── */
function SkeletonCard({ isDark, cardBg, cardBorder }) {
    const sh = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
    return (
        <div className="rounded-3xl border overflow-hidden" style={{ background: cardBg, borderColor: cardBorder }}>
            <div style={{ height: 6, background: sh }} />
            <div className="p-6 flex flex-col gap-4">
                <div className="flex justify-between">
                    <div style={{ width: 56, height: 56, borderRadius: 16, background: sh }} />
                    <div style={{ width: 100, height: 32, borderRadius: 999, background: sh }} />
                </div>
                <div style={{ height: 22, borderRadius: 8, background: sh, width: '60%' }} />
                <div style={{ height: 16, borderRadius: 6, background: sh, width: '85%' }} />
                <div style={{ height: 16, borderRadius: 6, background: sh, width: '50%' }} />
            </div>
        </div>
    );
}

/* ── Spin animation ── */
const spinStyle = `
@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
`;

// Inject style
if (typeof document !== 'undefined') {
    const styleId = 'worker-machines-animation';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = spinStyle;
        document.head.appendChild(style);
    }
}
