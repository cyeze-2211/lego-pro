import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LuCog, LuChevronLeft, LuChevronRight, LuActivity, LuClock } from 'react-icons/lu';
import { useGetMachinesQuery } from '../../../store/services/machine.api';
import { useAppTheme } from '../../../theme/tokens';
import { useHeaderContext } from '../../../context/HeaderContext';
import $api from '../../../store/api';

const PAGE_SIZE = 12;

const formatStartedAt = (iso) => {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('uz-UZ', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
};

/* ── BrandLogo komponenti ── */
function BrandLogo({ brand, isDark, accentColor, size = 24 }) {
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
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        borderRadius: '6px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
        flexShrink: 0,
    };

    if (!brand?.logoUrl || error) {
        return (
            <div style={containerStyle}>
                <span className="text-[10px] font-bold" style={{ color: accentColor }}>
                    {brand?.name?.charAt(0) || 'B'}
                </span>
            </div>
        );
    }

    if (loading) {
        return (
            <div style={containerStyle}>
                <div className="animate-spin text-[10px]" style={{ color: accentColor }}>⏳</div>
            </div>
        );
    }

    return (
        <div style={containerStyle}>
            {imgSrc ? (
                <img 
                    src={imgSrc} 
                    alt={brand.name}
                    className="w-full h-full object-cover"
                />
            ) : (
                <span className="text-[10px] font-bold" style={{ color: accentColor }}>
                    {brand?.name?.charAt(0) || 'B'}
                </span>
            )}
        </div>
    );
}

export default function StanokchiMachines() {
    const navigate = useNavigate();
    const [page, setPage] = useState(0);

    const { isDark, pageBg, cardBg, cardBorder, textColor, subtitleColor, accentColor } = useAppTheme();
    const { setPageHeader } = useHeaderContext();

    const { data: result, isLoading, error } = useGetMachinesQuery({ page, size: PAGE_SIZE });

    const machines = result?.items || [];
    const pagination = result?.pagination;
    const totalPages = pagination?.totalPages || 0;

    useEffect(() => {
        setPageHeader({ title: 'Stanoklar', backTo: '/stanokchi' });
        return () => setPageHeader(null);
    }, [setPageHeader]);

    return (
        <div style={{ background: pageBg, color: textColor, minHeight: '100%' }}>

            {/* Loading skeletons */}
            {isLoading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <SkeletonCard key={i} isDark={isDark} cardBg={cardBg} cardBorder={cardBorder} />
                    ))}
                </div>
            )}

            {/* Error */}
            {error && !isLoading && (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <LuCog size={40} style={{ color: subtitleColor }} />
                    <p style={{ color: subtitleColor }}>Ma&apos;lumotlarni yuklashda xatolik</p>
                </div>
            )}

            {/* Bo'sh */}
            {!isLoading && !error && machines.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <LuCog size={48} style={{ color: subtitleColor, opacity: 0.4 }} />
                    <p className="font-medium" style={{ color: subtitleColor }}>Hozircha stanoklar yo&apos;q</p>
                </div>
            )}

            {/* Cards grid */}
            {!isLoading && !error && machines.length > 0 && (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {machines.map((machine) => (
                            <MachineCard
                                key={machine.id}
                                machine={machine}
                                isDark={isDark}
                                cardBg={cardBg}
                                cardBorder={cardBorder}
                                textColor={textColor}
                                subtitleColor={subtitleColor}
                                accentColor={accentColor}
                                onClick={() => navigate(`/stanokchi/machines/${machine.id}`)}
                            />
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-3 mt-8">
                            <button
                                disabled={page === 0}
                                onClick={() => setPage((p) => p - 1)}
                                className="flex items-center justify-center w-9 h-9 rounded-lg border text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                style={{ background: cardBg, borderColor: cardBorder, color: textColor, cursor: page === 0 ? 'not-allowed' : 'pointer' }}
                            >
                                <LuChevronLeft size={16} />
                            </button>
                            <span className="text-sm" style={{ color: subtitleColor }}>
                                {page + 1} / {totalPages}
                            </span>
                            <button
                                disabled={page >= totalPages - 1}
                                onClick={() => setPage((p) => p + 1)}
                                className="flex items-center justify-center w-9 h-9 rounded-lg border text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                style={{ background: cardBg, borderColor: cardBorder, color: textColor, cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer' }}
                            >
                                <LuChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

/* ── MachineCard ──────────────────────────────────────────── */
function MachineCard({ machine, isDark, cardBg, cardBorder, textColor, subtitleColor, accentColor, onClick }) {
    const isWorking = machine.status === 'WORKING';
    const isDefect = machine.status === 'DEFECT';
    const isIdle = machine.status === 'IDLE';

    // Status bo'yicha kartaning rangi
    const getCardBackground = () => {
        if (isWorking) {
            return isDark 
                ? 'linear-gradient(135deg, rgba(22,163,74,0.12) 0%, rgba(34,197,94,0.06) 100%)'
                : 'linear-gradient(135deg, rgba(220,252,231,0.7) 0%, rgba(187,247,208,0.4) 100%)';
        }
        if (isDefect) {
            return isDark 
                ? 'linear-gradient(135deg, rgba(220,38,38,0.12) 0%, rgba(239,68,68,0.06) 100%)'
                : 'linear-gradient(135deg, rgba(254,226,226,0.7) 0%, rgba(252,165,165,0.4) 100%)';
        }
        return cardBg;
    };

    const getBorderColor = () => {
        if (isWorking) return isDark ? 'rgba(34,197,94,0.4)' : '#86EFAC';
        if (isDefect) return isDark ? 'rgba(239,68,68,0.4)' : '#FCA5A5';
        return cardBorder;
    };

    const getBoxShadow = () => {
        if (isWorking) {
            return isDark 
                ? '0 6px 24px rgba(34,197,94,0.15), 0 0 0 1px rgba(34,197,94,0.08) inset'
                : '0 6px 20px rgba(34,197,94,0.12), 0 0 0 1px rgba(34,197,94,0.08) inset';
        }
        if (isDefect) {
            return isDark 
                ? '0 6px 24px rgba(239,68,68,0.15), 0 0 0 1px rgba(239,68,68,0.08) inset'
                : '0 6px 20px rgba(239,68,68,0.12), 0 0 0 1px rgba(239,68,68,0.08) inset';
        }
        return isDark ? '0 4px 20px rgba(0,0,0,0.25)' : '0 4px 16px rgba(15,23,42,0.07)';
    };

    return (
        <button
            onClick={onClick}
            className="text-left w-full rounded-2xl border transition-all duration-200 overflow-hidden group hover:scale-[1.02] active:scale-[0.98]"
            style={{
                background: getCardBackground(),
                borderColor: getBorderColor(),
                boxShadow: getBoxShadow(),
                cursor: 'pointer',
            }}
        >
            {/* Top accent strip */}
            <div style={{
                height: 5,
                background: isWorking 
                    ? 'linear-gradient(90deg, #22C55E, #16A34A)'
                    : isDefect 
                    ? 'linear-gradient(90deg, #EF4444, #DC2626)'
                    : (isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0'),
            }} />

            <div className="p-4">
                {/* Icon + status badge */}
                <div className="flex items-start justify-between mb-3">
                    <div
                        className="flex items-center justify-center w-12 h-12 rounded-xl transition-transform duration-200 group-hover:scale-110"
                        style={{ 
                            background: isWorking 
                                ? (isDark ? 'rgba(34,197,94,0.18)' : 'rgba(34,197,94,0.12)')
                                : isDefect
                                ? (isDark ? 'rgba(239,68,68,0.18)' : 'rgba(239,68,68,0.12)')
                                : (isDark ? 'rgba(250,204,21,0.12)' : '#FEF3C7')
                        }}
                    >
                        <LuCog 
                            size={24} 
                            style={{ 
                                color: isWorking 
                                    ? '#22C55E'
                                    : isDefect
                                    ? '#EF4444'
                                    : accentColor
                            }} 
                        />
                    </div>

                    <span
                        className="text-xs font-bold px-3 py-1.5 rounded-full"
                        style={
                            isWorking
                                ? { background: isDark ? 'rgba(34,197,94,0.2)' : '#DCFCE7', color: isDark ? '#86EFAC' : '#166534' }
                                : isDefect
                                ? { background: isDark ? 'rgba(239,68,68,0.2)' : '#FEE2E2', color: isDark ? '#FCA5A5' : '#991B1B' }
                                : { background: isDark ? 'rgba(148,163,184,0.15)' : '#F1F5F9', color: subtitleColor }
                        }
                    >
                        {isWorking ? '🟢 Ishlayapti' : isDefect ? '🔴 Brak' : "⚪ Bo'sh"}
                    </span>
                </div>

                {/* Name */}
                <h3 className="font-bold text-base mb-1 leading-snug group-hover:text-opacity-80 transition-opacity" style={{ color: textColor }}>
                    {machine.name}
                </h3>

                {/* Summary */}
                {machine.summary && (
                    <p className="text-xs mb-3 line-clamp-2 leading-relaxed" style={{ color: subtitleColor }}>
                        {machine.summary}
                    </p>
                )}

                {/* Current run info */}
                {(isWorking || isDefect) && machine.currentRun ? (
                    <div 
                        className="mt-3 pt-3 flex flex-col gap-2"
                        style={{ 
                            borderTop: `1px solid ${
                                isWorking 
                                    ? (isDark ? 'rgba(34,197,94,0.25)' : '#BBF7D0')
                                    : (isDark ? 'rgba(239,68,68,0.25)' : '#FECACA')
                            }` 
                        }}
                    >
                        {/* Mahsulot */}
                        <div className="flex items-center gap-1.5">
                            <LuActivity 
                                size={14} 
                                style={{ 
                                    color: isWorking ? '#22C55E' : '#EF4444',
                                    flexShrink: 0 
                                }} 
                            />
                            <span 
                                className="text-xs font-semibold truncate" 
                                style={{ 
                                    color: isWorking 
                                        ? (isDark ? '#86EFAC' : '#166534')
                                        : (isDark ? '#FCA5A5' : '#991B1B')
                                }}
                            >
                                {machine.currentRun.productName}
                            </span>
                        </div>

                        {/* Brand */}
                        {machine.currentRun.brand && (
                            <div className="flex items-center gap-2">
                                <BrandLogo 
                                    brand={machine.currentRun.brand} 
                                    isDark={isDark} 
                                    accentColor={accentColor}
                                    size={24}
                                />
                                <span 
                                    className="text-xs font-medium truncate" 
                                    style={{ color: subtitleColor }}
                                >
                                    {machine.currentRun.brand.name}
                                </span>
                            </div>
                        )}

                        {/* Vaqt */}
                        <div className="flex items-center gap-1.5">
                            <LuClock size={12} style={{ color: subtitleColor, flexShrink: 0 }} />
                            <span className="text-xs truncate" style={{ color: subtitleColor }}>
                                {formatStartedAt(machine.currentRun.startedAt)}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${cardBorder}` }}>
                        <span className="text-xs" style={{ color: subtitleColor }}>Hozir ishlamayapti</span>
                    </div>
                )}
            </div>
        </button>
    );
}

/* ── Skeleton Card ────────────────────────────────────────── */
function SkeletonCard({ isDark, cardBg, cardBorder }) {
    const shimmer = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
    return (
        <div className="rounded-2xl border overflow-hidden" style={{ background: cardBg, borderColor: cardBorder }}>
            <div style={{ height: 4, background: shimmer }} />
            <div className="p-4 flex flex-col gap-3">
                <div className="flex justify-between">
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: shimmer }} />
                    <div style={{ width: 70, height: 26, borderRadius: 999, background: shimmer }} />
                </div>
                <div style={{ height: 16, borderRadius: 6, background: shimmer, width: '70%' }} />
                <div style={{ height: 12, borderRadius: 6, background: shimmer, width: '90%' }} />
                <div style={{ height: 12, borderRadius: 6, background: shimmer, width: '55%' }} />
            </div>
        </div>
    );
}
