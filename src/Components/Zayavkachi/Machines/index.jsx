import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LuCog, LuChevronLeft, LuChevronRight,
    LuActivity, LuClock, LuSearch, LuX,
} from 'react-icons/lu';
import { useGetMachinesQuery } from '../../../store/services/machine.api';
import { useAppTheme } from '../../../theme/tokens';

const PAGE_SIZE = 12;

const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString('uz-UZ', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
};

export default function ZayavkachiMachines() {
    const navigate = useNavigate();
    const { isDark } = useAppTheme();

    const [page, setPage]     = useState(0);
    const [search, setSearch] = useState('');
    const [nameQuery, setNameQuery] = useState('');

    const { data: result, isLoading, isFetching } = useGetMachinesQuery({
        name: nameQuery || undefined,
        page,
        size: PAGE_SIZE,
    });

    const machines   = result?.items      ?? [];
    const pagination = result?.pagination ?? {};
    const totalPages = pagination.totalPages ?? 0;

    /* ── theme ─────────────────────────────────────────────────────────── */
    const panel    = isDark ? 'border-white/10 bg-[#141C2B]' : 'border-[#e2e8f0] bg-white';
    const muted    = isDark ? 'text-[#94a3b8]' : 'text-[#64748b]';
    const head     = isDark ? 'text-white' : 'text-[#0f172a]';
    const inputCx  = [
        'w-full rounded-xl border px-4 text-sm outline-none transition-all duration-200 h-11',
        isDark
            ? 'border-[#334155] bg-[#1e293b]/80 text-white placeholder:text-[#64748b] focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20'
            : 'border-[#e2e8f0] bg-white text-[#0f172a] placeholder:text-[#94a3b8] focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20',
    ].join(' ');

    const handleSearch = (val) => {
        setSearch(val);
        setNameQuery(val.trim());
        setPage(0);
    };

    return (
        <div className="flex w-full flex-col gap-4 py-2">

            {/* ── Header ────────────────────────────────────────────────── */}
            <div className={`relative overflow-hidden rounded-2xl border px-5 py-4 shadow-md ${panel}`}>
                <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-amber-400/6 to-transparent" />
                <div className="relative flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-400/10 text-amber-500">
                            <LuCog size={20} />
                        </span>
                        <div>
                            <h1 className={`text-xl font-bold tracking-tight leading-tight ${head}`}>Stanoklar</h1>
                            <p className={`text-sm mt-0.5 ${muted}`}>Barcha stanoklar va ularning hozirgi holati</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Search ────────────────────────────────────────────────── */}
            <div className={`rounded-2xl border px-5 py-4 shadow-md ${panel}`}>
                <div className="relative max-w-sm">
                    <LuSearch className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 ${muted}`} />
                    <input
                        type="text"
                        placeholder="Stanok nomini qidirish..."
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        className={`${inputCx} pl-11 pr-10`}
                    />
                    {search && (
                        <button type="button" onClick={() => handleSearch('')}
                            className={`absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg ${muted} hover:text-[#f43f5e]`}>
                            <LuX size={15} />
                        </button>
                    )}
                </div>
            </div>

            {/* ── Grid ──────────────────────────────────────────────────── */}
            {isLoading || isFetching ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <SkeletonCard key={i} isDark={isDark} panel={panel} />
                    ))}
                </div>
            ) : machines.length === 0 ? (
                <div className={`flex flex-col items-center justify-center gap-3 rounded-2xl border py-16 ${panel}`}>
                    <LuCog size={40} strokeWidth={1.5} className={muted} />
                    <p className={`text-sm font-semibold ${muted}`}>Stanoklar topilmadi</p>
                    {search && (
                        <button type="button" onClick={() => handleSearch('')}
                            className="text-xs font-semibold text-amber-500 underline">
                            Qidiruvni tozalash
                        </button>
                    )}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {machines.map((machine) => (
                            <MachineCard
                                key={machine.id}
                                machine={machine}
                                isDark={isDark}
                                onClick={() => navigate(`/zayavkachi/machines/${machine.id}`)}
                            />
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-3 mt-2">
                            <button
                                disabled={page === 0}
                                onClick={() => setPage((p) => p - 1)}
                                className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${panel}`}>
                                <LuChevronLeft size={16} className={head} />
                            </button>
                            <span className={`text-sm font-semibold ${muted}`}>
                                {page + 1} / {totalPages}
                            </span>
                            <button
                                disabled={page >= totalPages - 1}
                                onClick={() => setPage((p) => p + 1)}
                                className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${panel}`}>
                                <LuChevronRight size={16} className={head} />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

/* ── MachineCard ──────────────────────────────────────────────────────────── */
function MachineCard({ machine, isDark, onClick }) {
    const isWorking = machine.isWorking && machine.currentRun;

    const cardBg     = isDark ? '#141C2B' : '#ffffff';
    const cardBorder = isWorking
        ? (isDark ? 'rgba(34,197,94,0.35)' : '#86EFAC')
        : (isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0');
    const textColor  = isDark ? '#f8fafc' : '#0f172a';
    const subColor   = isDark ? '#94a3b8' : '#64748b';

    return (
        <button
            onClick={onClick}
            className="text-left w-full rounded-2xl border transition-all duration-200 overflow-hidden group hover:-translate-y-0.5"
            style={{
                background: cardBg,
                borderColor: cardBorder,
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
                {/* Icon + status */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center justify-center w-11 h-11 rounded-xl transition-transform duration-200 group-hover:scale-105"
                        style={{ background: isDark ? 'rgba(250,204,21,0.12)' : '#FEF3C7' }}>
                        <LuCog size={22} className="text-amber-500" />
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={isWorking
                            ? { background: isDark ? 'rgba(34,197,94,0.14)' : '#DCFCE7', color: isDark ? '#86EFAC' : '#166534' }
                            : { background: isDark ? 'rgba(148,163,184,0.15)' : '#F1F5F9', color: subColor }}>
                        {isWorking ? 'Ishlayapti' : "Bo'sh"}
                    </span>
                </div>

                {/* Name */}
                <h3 className="font-bold text-base mb-1 leading-snug group-hover:underline"
                    style={{ color: textColor }}>
                    {machine.name}
                </h3>

                {/* Summary */}
                {machine.summary && (
                    <p className="text-xs mb-3 line-clamp-2 leading-relaxed" style={{ color: subColor }}>
                        {machine.summary}
                    </p>
                )}

                {/* Current run info */}
                {isWorking ? (
                    <div className="mt-3 pt-3 flex flex-col gap-1"
                        style={{ borderTop: `1px solid ${isDark ? 'rgba(34,197,94,0.2)' : '#BBF7D0'}` }}>
                        <div className="flex items-center gap-1.5">
                            <LuActivity size={13} style={{ color: '#22C55E', flexShrink: 0 }} />
                            <span className="text-xs font-medium truncate"
                                style={{ color: isDark ? '#86EFAC' : '#166534' }}>
                                {machine.currentRun.productName}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <LuClock size={12} style={{ color: subColor, flexShrink: 0 }} />
                            <span className="text-xs" style={{ color: subColor }}>
                                {formatDate(machine.currentRun.startedAt)}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}` }}>
                        <span className="text-xs" style={{ color: subColor }}>Hozir ishlamayapti</span>
                    </div>
                )}
            </div>
        </button>
    );
}

/* ── Skeleton Card ─────────────────────────────────────────────────────────── */
function SkeletonCard({ isDark, panel }) {
    const shimmer = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
    return (
        <div className={`rounded-2xl border overflow-hidden ${panel}`}>
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
