import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LuClipboardList, LuSearch, LuChevronLeft, LuChevronRight,
    LuPlus, LuX, LuEye, LuPencil, LuPackage,
} from 'react-icons/lu';
import { useAppTheme } from '../../../theme/tokens';
import { useGetSalesOrdersQuery } from '../../../store/services/salesOrder.api';
import DeleteOrder from '../__components/DeleteOrder';
import { STATUS_LABEL, statusCx } from '../__components/statusBadge';

const PAGE_SIZE = 20;
const STATUSES = ['PENDING', 'APPROVED', 'REJECTED'];

export default function ZayavkachiOrders() {
    const { isDark } = useAppTheme();
    const navigate = useNavigate();
    const [page, setPage]                 = useState(0);
    const [statusFilter, setStatusFilter] = useState('');
    const [dateFrom, setDateFrom]         = useState('');
    const [dateTo, setDateTo]             = useState('');
    const [search, setSearch]             = useState('');

    const { data, isFetching } = useGetSalesOrdersQuery({
        status:   statusFilter || undefined,
        dateFrom: dateFrom     || undefined,
        dateTo:   dateTo       || undefined,
        page,
        size: PAGE_SIZE,
    });

    const orders     = data?.items      ?? [];
    const pagination = data?.pagination ?? {};
    const filtered   = search
        ? orders.filter((o) => o.customerName?.toLowerCase().includes(search.toLowerCase()))
        : orders;

    const hasFilters = statusFilter || dateFrom || dateTo || search;
    const resetFilters = () => { setStatusFilter(''); setDateFrom(''); setDateTo(''); setSearch(''); setPage(0); };

    /* ── theme ─────────────────────────────────────────────────────── */
    const panel   = isDark ? 'border-white/10 bg-[#141C2B]' : 'border-[#e2e8f0] bg-white';
    const muted   = isDark ? 'text-[#94a3b8]' : 'text-[#64748b]';
    const head    = isDark ? 'text-white' : 'text-[#0f172a]';
    const divider = isDark ? 'divide-[#334155]/50' : 'divide-[#f1f5f9]';
    const line    = isDark ? 'border-[#334155]/60' : 'border-[#f1f5f9]';
    const rowHov  = isDark ? 'hover:bg-[#1e293b]/60' : 'hover:bg-amber-50/50';
    const inputCx = [
        'w-full rounded-xl border px-4 text-sm outline-none transition-all duration-200 h-12',
        isDark
            ? 'border-[#334155] bg-[#1e293b]/80 text-white placeholder:text-[#64748b] focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20'
            : 'border-[#e2e8f0] bg-white text-[#0f172a] placeholder:text-[#94a3b8] focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20',
    ].join(' ');
    const iconBtn = isDark
        ? 'flex h-10 w-10 items-center justify-center rounded-lg transition-colors text-[#64748b] hover:bg-[#1e293b] hover:text-amber-400'
        : 'flex h-10 w-10 items-center justify-center rounded-lg transition-colors text-[#94a3b8] hover:bg-amber-50 hover:text-amber-500';

    return (
        <div className="flex w-full flex-col gap-4 py-2">

            {/* ── Header ────────────────────────────────────────────────── */}
            <div className={`relative overflow-hidden rounded-2xl border px-5 py-4 shadow-md ${panel}`}>
                <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-amber-400/6 to-transparent" />
                <div className="relative flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-400/10 text-amber-500">
                            <LuClipboardList size={20} />
                        </span>
                        <div>
                            <h1 className={`text-xl font-bold tracking-tight leading-tight ${head}`}>Buyurtmalar</h1>
                            <p className={`text-sm mt-0.5 ${muted}`}>Mijozlardan kelgan buyurtmalar ro&apos;yxati</p>
                        </div>
                    </div>
                    <button type="button" onClick={() => navigate('/zayavkachi/orders/new')}
                        className="flex h-12 items-center gap-2 rounded-xl bg-[#FACC15] px-6 text-sm font-bold text-[#0F172A] shadow-lg shadow-[#FACC15]/30 transition-all duration-200 hover:-translate-y-px hover:bg-[#EAB308] hover:shadow-xl">
                        <LuPlus size={16} /> Yangi buyurtma
                    </button>
                </div>
            </div>

            {/* ── Ro'yxat ───────────────────────────────────────────────── */}
            <div className={`rounded-2xl border shadow-md ${panel}`}>

                {/* Filtrlar */}
                <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-end">
                    <div className="sm:w-48 shrink-0">
                        <label className={`mb-1.5 block text-xs font-semibold ${muted}`}>Holat</label>
                        <select value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                            className={inputCx}>
                            <option value="">Barchasi</option>
                            {STATUSES.map((s) => (
                                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                            ))}
                        </select>
                    </div>

                    <div className="sm:w-44 shrink-0">
                        <label className={`mb-1.5 block text-xs font-semibold ${muted}`}>Sanadan</label>
                        <input type="date" value={dateFrom}
                            onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
                            className={inputCx} />
                    </div>

                    <div className="sm:w-44 shrink-0">
                        <label className={`mb-1.5 block text-xs font-semibold ${muted}`}>Sanagacha</label>
                        <input type="date" value={dateTo}
                            onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
                            className={inputCx} />
                    </div>

                    <div className="flex-1">
                        <label className={`mb-1.5 block text-xs font-semibold ${muted}`}>Mijoz bo&apos;yicha qidirish</label>
                        <div className="relative">
                            <LuSearch className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 ${muted}`} />
                            <input type="text" placeholder="Mijoz nomini yozing"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className={`${inputCx} pl-11 pr-10`} />
                            {search && (
                                <button type="button" onClick={() => setSearch('')}
                                    className={`absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg ${muted} hover:text-[#f43f5e]`}>
                                    <LuX size={15} />
                                </button>
                            )}
                        </div>
                    </div>

                    {hasFilters && (
                        <button type="button" onClick={resetFilters}
                            className={`flex h-12 shrink-0 items-center rounded-xl border px-4 text-xs font-semibold transition-colors ${isDark ? 'border-[#334155] text-[#94a3b8] hover:bg-[#1e293b]' : 'border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9]'}`}>
                            Tozalash
                        </button>
                    )}
                </div>

                {isFetching ? (
                    <div className={`flex items-center justify-center gap-2 py-14 text-sm ${muted}`}>
                        <svg className="h-4 w-4 animate-spin text-amber-400" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                        </svg>
                        Yuklanmoqda...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className={`flex flex-col items-center gap-2 py-14 ${muted}`}>
                        <LuPackage size={34} strokeWidth={1.5} />
                        <p className="text-sm font-semibold">Buyurtmalar topilmadi</p>
                        <p className="text-xs">Yangi buyurtma qo&apos;shish uchun yuqoridagi tugmani bosing</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className={`text-left text-xs font-semibold uppercase tracking-wide ${muted} ${isDark ? 'bg-[#0f172a]/30' : 'bg-[#f8fafc]/80'}`}>
                                    <th className="px-5 py-3 w-14">№</th>
                                    <th className="px-5 py-3">Mijoz</th>
                                    <th className="px-5 py-3 w-32">Mahsulot</th>
                                    <th className="px-5 py-3 w-44 text-right">Jami summa</th>
                                    <th className="px-5 py-3 w-40">Holat</th>
                                    <th className="px-5 py-3 w-44">Sana</th>
                                    <th className="px-5 py-3 w-40"></th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${divider}`}>
                                {filtered.map((o, idx) => {
                                    const editable = o.status === 'PENDING';
                                    return (
                                        <tr key={o.id} className={`transition-colors ${rowHov}`}>
                                            <td className={`px-5 py-3 text-xs ${muted}`}>{page * PAGE_SIZE + idx + 1}</td>
                                            <td className="px-5 py-3">
                                                <p className={`font-semibold ${head}`}>{o.customerName}</p>
                                                {o.summary && <p className={`truncate max-w-xs text-xs ${muted}`}>{o.summary}</p>}
                                            </td>
                                            <td className={`px-5 py-3 text-xs font-semibold ${muted}`}>{o.items?.length ?? 0} ta</td>
                                            <td className={`px-5 py-3 text-right font-bold ${head}`}>
                                                {(o.totalAmount ?? 0).toLocaleString('uz-UZ')} so&apos;m
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusCx(o.status)}`}>
                                                    {STATUS_LABEL[o.status] ?? o.status}
                                                </span>
                                            </td>
                                            <td className={`px-5 py-3 text-xs ${muted}`}>
                                                {o.createdAt ? new Date(o.createdAt).toLocaleString('uz-UZ') : '—'}
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button type="button" onClick={() => navigate(`/zayavkachi/orders/${o.id}`)}
                                                        aria-label="Ko'rish" title="Ko'rish" className={iconBtn}>
                                                        <LuEye size={16} />
                                                    </button>
                                                    <button type="button" onClick={() => navigate(`/zayavkachi/orders/${o.id}/edit`)}
                                                        disabled={!editable}
                                                        aria-label="Tahrirlash"
                                                        title={editable ? 'Tahrirlash' : 'Faqat “Kutilmoqda” holatidagi buyurtma tahrirlanadi'}
                                                        className={`${iconBtn} disabled:cursor-not-allowed disabled:opacity-30`}>
                                                        <LuPencil size={16} />
                                                    </button>
                                                    <DeleteOrder order={o} disabled={!editable} />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {pagination.totalPages > 1 && (
                    <div className={`flex items-center justify-between gap-3 border-t px-5 py-3.5 ${line}`}>
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
        </div>
    );
}
