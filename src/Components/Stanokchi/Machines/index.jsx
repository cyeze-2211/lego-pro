import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LuCog, LuSearch, LuX, LuChevronLeft, LuChevronRight, LuActivity, LuClock } from 'react-icons/lu';
import { useGetMachinesQuery } from '../../../store/services/machine.api';
import { useAppTheme, BRAND_COLORS } from '../../../theme/tokens';

const PAGE_SIZE = 12;

const formatStartedAt = (iso) => {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('uz-UZ', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export default function StanokchiMachines() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(0);

    const { isDark, pageBg, cardBg, cardBorder, textColor, subtitleColor, accentColor } = useAppTheme();

    const { data: result, isLoading, error } = useGetMachinesQuery({
        name: query || undefined,
        page,
        size: PAGE_SIZE,
    });

    const machines = result?.items || [];
    const pagination = result?.pagination;
    const totalPages = pagination?.totalPages || 0;

    const submitSearch = (e) => {
        e.preventDefault();
        setPage(0);
        setQuery(search.trim());
    };

    const clearSearch = () => {
        setSearch('');
        setPage(0);
        setQuery('');
    };

    return (
        <div style={{ background: pageBg, color: textColor, minHeight: '100%' }}>

            {/* Page title */}
            <div className="mb-6">
                <h1
                    className="text-3xl font-bold mb-1"
                    style={{ color: textColor }}
                >
                    Stanoklar
                </h1>
                <p className="text-sm" style={{ color: subtitleColor }}>
                    Barcha stanoklar va ularning hozirgi holati
                </p>
            </div>

            {/* Search bar */}
            <form
                onSubmit={submitSearch}
                className="flex gap-3 mb-6 p-3 rounded-xl border"
                style={{
                    background: cardBg,
                    borderColor: cardBorder,
                    boxShadow: isDark ? 'none' : '0 4px 12px rgba(15,23,42,0.06)',
                }}
            >
                <div className="relative flex-1">
                    <LuSearch
                        size={17}
                        style={{
                            position: 'absolute',
                            left: 14,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: accentColor,
                            pointerEvents: 'none',
                        }}
                    />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Stanok nomi bo'yicha qidiring..."
                        style={{
                            width: '100%',
                            paddingLeft: 40,
                            paddingRight: search ? 40 : 16,
                            paddingTop: 9,
                            paddingBottom: 9,
                            borderRadius: 10,
                            border: `1px solid ${cardBorder}`,
                            background: isDark ? BRAND_COLORS.darkInputBg : BRAND_COLORS.lightInputBg,
                            color: textColor,
                            fontSize: 14,
                            outline: 'none',
                        }}
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={clearSearch}
                            style={{
                                position: 'absolute',
                                right: 10,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: subtitleColor,
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                            }}
                            aria-label="Tozalash"
                        >
                            <LuX size={16} />
                        </button>
                    )}
                </div>
                <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2 rounded-xl font-semibold text-sm transition-all"
                    style={{
                        background: accentColor,
                        color: '#0F172A',
                        border: 'none',
                        cursor: 'pointer',
                        flexShrink: 0,
                    }}
                >
                    <LuSearch size={16} />
                    Qidirish
                </button>
            </form>

            {/* States */}
            {isLoading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <SkeletonCard key={i} isDark={isDark} cardBg={cardBg} cardBorder={cardBorder} />
                    ))}
                </div>
            )}

            {error && !isLoading && (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <LuCog size={40} style={{ color: subtitleColor }} />
                    <p style={{ color: subtitleColor }}>Ma&apos;lumotlarni yuklashda xatolik</p>
                </div>
            )}

            {!isLoading && !error && machines.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <LuCog size={48} style={{ color: subtitleColor, opacity: 0.4 }} />
                    <p className="font-medium" style={{ color: subtitleColor }}>
                        {query ? "Qidiruv bo'yicha stanok topilmadi" : "Hozircha stanoklar yo'q"}
                    </p>
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
                                style={{
                                    background: cardBg,
                                    borderColor: cardBorder,
                                    color: textColor,
                                    cursor: page === 0 ? 'not-allowed' : 'pointer',
                                }}
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
                                style={{
                                    background: cardBg,
                                    borderColor: cardBorder,
                                    color: textColor,
                                    cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
                                }}
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
                borderColor: isWorking
                    ? (isDark ? 'rgba(34,197,94,0.35)' : '#86EFAC')
                    : cardBorder,
                boxShadow: isDark
                    ? '0 4px 20px rgba(0,0,0,0.25)'
                    : '0 4px 16px rgba(15,23,42,0.07)',
                cursor: 'pointer',
            }}
        >
            {/* Card top accent strip */}
            <div
                style={{
                    height: 4,
                    background: isWorking
                        ? 'linear-gradient(90deg, #22C55E, #16A34A)'
                        : (isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0'),
                }}
            />

            <div className="p-4">
                {/* Icon + status badge */}
                <div className="flex items-start justify-between mb-3">
                    <div
                        className="flex items-center justify-center w-11 h-11 rounded-xl transition-transform duration-200 group-hover:scale-105"
                        style={{
                            background: isDark ? 'rgba(250,204,21,0.12)' : '#FEF3C7',
                        }}
                    >
                        <LuCog size={22} style={{ color: accentColor }} />
                    </div>

                    <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={
                            isWorking
                                ? {
                                      background: isDark ? 'rgba(34,197,94,0.14)' : '#DCFCE7',
                                      color: isDark ? '#86EFAC' : '#166534',
                                  }
                                : {
                                      background: isDark ? 'rgba(148,163,184,0.15)' : '#F1F5F9',
                                      color: subtitleColor,
                                  }
                        }
                    >
                        {isWorking ? 'Ishlayapti' : "Bo'sh"}
                    </span>
                </div>

                {/* Name */}
                <h3
                    className="font-bold text-base mb-1 leading-snug group-hover:underline"
                    style={{ color: textColor }}
                >
                    {machine.name}
                </h3>

                {/* Summary */}
                {machine.summary && (
                    <p
                        className="text-xs mb-3 line-clamp-2 leading-relaxed"
                        style={{ color: subtitleColor }}
                    >
                        {machine.summary}
                    </p>
                )}

                {/* Current run info */}
                {isWorking ? (
                    <div
                        className="mt-3 pt-3 flex flex-col gap-1"
                        style={{ borderTop: `1px solid ${isDark ? 'rgba(34,197,94,0.2)' : '#BBF7D0'}` }}
                    >
                        <div className="flex items-center gap-1.5">
                            <LuActivity size={13} style={{ color: '#22C55E', flexShrink: 0 }} />
                            <span
                                className="text-xs font-medium truncate"
                                style={{ color: isDark ? '#86EFAC' : '#166534' }}
                            >
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
                    <div
                        className="mt-3 pt-3"
                        style={{ borderTop: `1px solid ${cardBorder}` }}
                    >
                        <span className="text-xs" style={{ color: subtitleColor }}>
                            Hozir ishlamayapti
                        </span>
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
        <div
            className="rounded-2xl border overflow-hidden"
            style={{ background: cardBg, borderColor: cardBorder }}
        >
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
