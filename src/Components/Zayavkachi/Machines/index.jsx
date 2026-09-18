import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LuCog, LuSearch, LuChevronLeft, LuChevronRight,
    LuX, LuArrowRight, LuPackage, LuRefreshCw,
} from 'react-icons/lu';
import { useAppTheme } from '../../../theme/tokens';
import { useGetMachinesQuery } from '../../../store/services/machine.api';

const PAGE_SIZE = 12;

export default function ZayavkachiMachines() {
    const { isDark } = useAppTheme();
    const navigate = useNavigate();
    const [page, setPage]     = useState(0);
    const [search, setSearch] = useState('');

    const { data, isFetching, refetch } = useGetMachinesQuery({ name: search || undefined, page, size: PAGE_SIZE });

    const machines   = data?.items      ?? [];
    const pagination = data?.pagination ?? {};

    /* ── theme ─────────────────────────────────────────────────────── */
    const panel  = isDark ? 'border-white/10 bg-[#141C2B]' : 'border-[#e2e8f0] bg-white';
    const muted  = isDark ? 'text-[#94a3b8]' : 'text-[#64748b]';
    const head   = isDark ? 'text-white' : 'text-[#0f172a]';
    const line   = isDark ? 'border-[#334155]/60' : 'border-[#f1f5f9]';
    const inputCx = [
        'w-full rounded-xl border px-4 text-sm outline-none transition-all duration-200 h-12',
        isDark
            ? 'border-[#334155] bg-[#1e293b]/80 text-white placeholder:text-[#64748b] focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20'
            : 'border-[#e2e8f0] bg-white text-[#0f172a] placeholder:text-[#94a3b8] focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20',
    ].join(' ');

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
                            <p className={`text-sm mt-0.5 ${muted}`}>Stanokni tanlab ishlab chiqarish topshirig&apos;ini yuboring</p>
                        </div>
                    </div>
                    <div className="flex w-full items-center gap-2 sm:w-auto">
                    <div className="relative w-full sm:w-72">
                        <LuSearch className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 ${muted}`} />
                        <input type="text" placeholder="Stanok nomini yozing"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                            className={`${inputCx} pl-11 pr-10`} />
                        {search && (
                            <button type="button" onClick={() => { setSearch(''); setPage(0); }}
                                className={`absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg ${muted} hover:text-[#f43f5e]`}>
                                <LuX size={15} />
                            </button>
                        )}
                    </div>
                    <button type="button" onClick={refetch}
                        aria-label="Yangilash" title="Yangilash"
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-colors ${isDark ? 'border-[#334155] text-[#94a3b8] hover:bg-[#1e293b]' : 'border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9]'}`}>
                        <LuRefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
                    </button>
                    </div>
                </div>
            </div>

            {/* ── Ro'yxat ───────────────────────────────────────────────── */}
            {isFetching && machines.length === 0 ? (
                <div className={`flex items-center justify-center gap-2 rounded-2xl border py-16 text-sm shadow-md ${panel} ${muted}`}>
                    <svg className="h-4 w-4 animate-spin text-amber-400" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    Yuklanmoqda...
                </div>
            ) : machines.length === 0 ? (
                <div className={`flex flex-col items-center gap-2 rounded-2xl border py-16 shadow-md ${panel} ${muted}`}>
                    <LuCog size={34} strokeWidth={1.5} />
                    <p className="text-sm font-semibold">Stanoklar topilmadi</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {machines.map((machine) => {
                        const working = Boolean(machine.isWorking && machine.currentRun);
                        return (
                            <button key={machine.id} type="button"
                                onClick={() => navigate(`/zayavkachi/machines/${machine.id}`)}
                                className={`group flex flex-col gap-3 rounded-2xl border p-5 text-left shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${panel}`}>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-400/10 text-amber-500">
                                            <LuCog size={20} />
                                        </span>
                                        <div className="min-w-0">
                                            <p className={`truncate font-bold ${head}`}>{machine.name}</p>
                                            <p className={`truncate text-xs ${muted}`}>{machine.summary || 'Tavsifsiz'}</p>
                                        </div>
                                    </div>
                                    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${
                                        working
                                            ? 'border-[#10b981]/20 bg-[#10b981]/10 text-[#10b981]'
                                            : isDark ? 'border-[#334155] bg-[#1e293b] text-[#94a3b8]' : 'border-[#e2e8f0] bg-[#f1f5f9] text-[#64748b]'
                                    }`}>
                                        <span className={`h-2 w-2 rounded-full ${working ? 'animate-pulse bg-[#10b981]' : 'bg-[#94a3b8]'}`} />
                                        {working ? 'Ishlayapti' : 'Bo‘sh'}
                                    </span>
                                </div>

                                <div className={`flex items-center justify-between gap-3 border-t pt-3 ${line}`}>
                                    <span className={`flex min-w-0 items-center gap-1.5 text-xs ${muted}`}>
                                        <LuPackage size={13} className="shrink-0" />
                                        <span className="truncate">
                                            {working ? machine.currentRun.productName : 'Ishlab chiqarish yo‘q'}
                                        </span>
                                    </span>
                                    <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-amber-500">
                                        Topshiriq <LuArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {pagination.totalPages > 1 && (
                <div className={`flex items-center justify-between gap-3 rounded-2xl border px-5 py-3.5 shadow-md ${panel}`}>
                    <p className={`text-xs ${muted}`}>
                        {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, pagination.totalElements)} / {pagination.totalElements}
                    </p>
                    <div className="flex items-center gap-1.5">
                        <button type="button" disabled={pagination.first} onClick={() => setPage((p) => p - 1)}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors disabled:opacity-40 ${isDark ? 'border-[#334155] hover:bg-[#334155]' : 'border-[#e2e8f0] hover:bg-[#f1f5f9]'}`}>
                            <LuChevronLeft size={14} />
                        </button>
                        <span className={`px-3 text-sm font-semibold ${head}`}>{page + 1} / {pagination.totalPages}</span>
                        <button type="button" disabled={pagination.last} onClick={() => setPage((p) => p + 1)}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors disabled:opacity-40 ${isDark ? 'border-[#334155] hover:bg-[#334155]' : 'border-[#e2e8f0] hover:bg-[#f1f5f9]'}`}>
                            <LuChevronRight size={14} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}