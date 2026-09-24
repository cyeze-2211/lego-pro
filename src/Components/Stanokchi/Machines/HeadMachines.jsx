import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LuCog, LuChevronLeft, LuChevronRight, LuActivity, LuClock } from 'react-icons/lu';
import { useGetMachinesQuery } from '../../../store/services/machine.api';
import { useAppTheme } from '../../../theme/tokens';
import { useHeaderContext } from '../../../context/HeaderContext';

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
    const isWorking = machine.isWorking && machine.currentRun;

    return (
        <button
            onClick={onClick}
            className="text-left w-full rounded-2xl border transition-all duration-200 overflow-hidden group"
            style={{
                background: cardBg,
                borderColor: isWorking ? (isDark ? 'rgba(34,197,94,0.35)' : '#86EFAC') : cardBorder,
                boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.25)' : '0 4px 16px rgba(15,23,42,0.07)',
                cursor: 'pointer',
            }}
        >
            {/* Top accent strip */}
            <div style={{
                height: 4,
                background: isWorking
                    ? 'linear-gradient(90deg, #22C55E, #16A34A)'
                    : (isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0'),
            }} />

            <div className="p-4">
                {/* Icon + status badge */}
                <div className="flex items-start justify-between mb-3">
                    <div
                        className="flex items-center justify-center w-11 h-11 rounded-xl transition-transform duration-200 group-hover:scale-105"
                        style={{ background: isDark ? 'rgba(250,204,21,0.12)' : '#FEF3C7' }}
                    >
                        <LuCog size={22} style={{ color: accentColor }} />
                    </div>

                    <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={isWorking
                            ? { background: isDark ? 'rgba(34,197,94,0.14)' : '#DCFCE7', color: isDark ? '#86EFAC' : '#166534' }
                            : { background: isDark ? 'rgba(148,163,184,0.15)' : '#F1F5F9', color: subtitleColor }}
                    >
                        {isWorking ? 'Ishlayapti' : "Bo'sh"}
                    </span>
                </div>

                {/* Name */}
                <h3 className="font-bold text-base mb-1 leading-snug group-hover:underline" style={{ color: textColor }}>
                    {machine.name}
                </h3>

                {/* Summary */}
                {machine.summary && (
                    <p className="text-xs mb-3 line-clamp-2 leading-relaxed" style={{ color: subtitleColor }}>
                        {machine.summary}
                    </p>
                )}

                {/* Current run info */}
                {isWorking ? (
                    <div className="mt-3 pt-3 flex flex-col gap-1"
                        style={{ borderTop: `1px solid ${isDark ? 'rgba(34,197,94,0.2)' : '#BBF7D0'}` }}>
                        <div className="flex items-center gap-1.5">
                            <LuActivity size={13} style={{ color: '#22C55E', flexShrink: 0 }} />
                            <span className="text-xs font-medium truncate" style={{ color: isDark ? '#86EFAC' : '#166534' }}>
                                {machine.currentRun.productName}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <LuClock size={12} style={{ color: subtitleColor, flexShrink: 0 }} />
                            <span className="text-xs" style={{ color: subtitleColor }}>
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
