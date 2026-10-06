import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LuClipboardList, LuSearch, LuChevronLeft, LuChevronRight,
    LuX, LuEye, LuPackage, LuSlidersHorizontal, LuChevronDown, LuInbox,
} from 'react-icons/lu';
import { useAppTheme } from '../../../theme/tokens';
import { formatNumber } from '../../ui/number-format';
import { useGetSalesOrdersQuery } from '../../../store/services/salesOrder.api';
import { useGetWarehousesQuery } from '../../../store/services/warehouse.api';

const PAGE_SIZE = 20;
const STATUSES = ['PENDING', 'APPROVED', 'REJECTED'];
const STAFF_STATUS_LABEL = {
    PENDING: 'Kutilmoqda',
    APPROVED: 'Tasdiqlangan',
    REJECTED: 'Rad etilgan',
};
const STAFF_STATUS_CX = {
    PENDING: 'bg-amber-400/10 text-amber-500 border-amber-400/30',
    APPROVED: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
    REJECTED: 'bg-rose-500/10 text-rose-500 border-rose-500/30',
};

export default function StaffOrders() {
    const { isDark } = useAppTheme();
    const navigate = useNavigate();
    const [page, setPage] = useState(0);
    const [statusFilter, setStatusFilter] = useState('');
    const [warehouseFilter, setWarehouseFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [search, setSearch] = useState('');
    const [filtersOpen, setFiltersOpen] = useState(false);

    const { data: warehousesData } = useGetWarehousesQuery('PRODUCT');
    const warehouses = warehousesData || [];

    const { data, isFetching, isError, error } = useGetSalesOrdersQuery({
        status: statusFilter || undefined,
        warehouseId: warehouseFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
        size: PAGE_SIZE,
    });

    const orders = data?.items ?? [];
    const pagination = data?.pagination ?? {};
    const filtered = search
        ? orders.filter((o) => o.customerName?.toLowerCase().includes(search.toLowerCase()))
        : orders;

    const activeFilterCount = [statusFilter, warehouseFilter, dateFrom, dateTo, search].filter(Boolean).length;
    const hasFilters = activeFilterCount > 0;
    const resetFilters = () => {
        setStatusFilter('');
        setWarehouseFilter('');
        setDateFrom('');
        setDateTo('');
        setSearch('');
        setPage(0);
    };

    /* ── theme ─────────────────────────────────────────────────────── */
    const panel = isDark ? 'border-white/10 bg-[#141C2B]' : 'border-[#e2e8f0] bg-white';
    const muted = isDark ? 'text-[#94a3b8]' : 'text-[#64748b]';
    const head = isDark ? 'text-white' : 'text-[#0f172a]';
    const divider = isDark ? 'divide-[#334155]/50' : 'divide-[#f1f5f9]';
    const line = isDark ? 'border-[#334155]/60' : 'border-[#f1f5f9]';
    const rowHov = isDark ? 'hover:bg-[#1e293b]/60' : 'hover:bg-amber-50/50';
    const inputCx = [
        'w-full rounded-xl border px-4 text-sm outline-none transition-all duration-200 h-11',
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
                            <p className={`text-sm mt-0.5 ${muted}`}>Buyurtmalar ro&apos;yxati</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Ro'yxat ───────────────────────────────────────────────── */}
            <div className={`rounded-2xl border shadow-md ${panel}`}>
                {/* Filtrlar */}
                <div className={`border-b ${line}`}>
                    <button
                        type="button"
                        onClick={() => setFiltersOpen((value) => !value)}
                        aria-expanded={filtersOpen}
                        className={`flex w-full items-center justify-between gap-3 px-5 py-4 transition-colors ${isDark ? 'hover:bg-[#1e293b]/40' : 'hover:bg-[#f8fafc]'}`}
                    >
                        <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-400/30 bg-amber-400/10 text-amber-500">
                                <LuSlidersHorizontal size={16} />
                            </span>
                            <div className="flex items-center gap-2">
                                <span className={`text-sm font-bold ${head}`}>Filtrlar</span>
                                {activeFilterCount > 0 && (
                                    <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[11px] font-bold text-amber-500">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </div>
                            {!filtersOpen && statusFilter && (
                                <span className={`hidden text-xs sm:inline ${muted}`}>
                                    · Holat: <span className="font-semibold text-amber-500">{STAFF_STATUS_LABEL[statusFilter]}</span>
                                </span>
                            )}
                        </div>
                        <LuChevronDown size={18} className={`shrink-0 transition-transform duration-300 ${filtersOpen ? 'rotate-180' : ''} ${muted}`} />
                    </button>

                    <div className={`grid transition-all duration-300 ease-in-out ${filtersOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                        <div className="overflow-hidden">
                            <div className="grid grid-cols-1 gap-3 px-4 pb-4 sm:grid-cols-2 lg:flex lg:flex-row lg:items-end lg:px-5 lg:pb-5">
                                <div className="lg:w-48 lg:shrink-0">
                                    <label className={`mb-1.5 block text-xs font-semibold ${muted}`}>Holat</label>
                                    <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }} className={inputCx}>
                                        <option value="">Barchasi</option>
                                        {STATUSES.map((status) => <option key={status} value={status}>{STAFF_STATUS_LABEL[status]}</option>)}
                                    </select>
                                </div>

                                <div className="lg:w-48 lg:shrink-0">
                                    <label className={`mb-1.5 block text-xs font-semibold ${muted}`}>Ombor</label>
                                    <select value={warehouseFilter} onChange={(e) => { setWarehouseFilter(e.target.value); setPage(0); }} className={inputCx}>
                                        <option value="">Barcha omborlar</option>
                                        {warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
                                    </select>
                                </div>

                                <div className="lg:w-44 lg:shrink-0">
                                    <label className={`mb-1.5 block text-xs font-semibold ${muted}`}>Sanadan</label>
                                    <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(0); }} className={inputCx} />
                                </div>

                                <div className="lg:w-44 lg:shrink-0">
                                    <label className={`mb-1.5 block text-xs font-semibold ${muted}`}>Sanagacha</label>
                                    <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(0); }} className={inputCx} />
                                </div>

                                <div className="sm:col-span-2 lg:flex-1">
                                    <label className={`mb-1.5 block text-xs font-semibold ${muted}`}>Mijoz bo&apos;yicha qidirish</label>
                                    <div className="relative">
                                        <LuSearch className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 ${muted}`} />
                                        <input type="text" placeholder="Mijoz nomini yozing" value={search} onChange={(e) => setSearch(e.target.value)} className={`${inputCx} pl-11 pr-10`} />
                                        {search && (
                                            <button type="button" onClick={() => setSearch('')} aria-label="Qidiruvni tozalash" className={`absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg ${muted} hover:text-[#f43f5e]`}>
                                                <LuX size={15} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {hasFilters && (
                                    <button type="button" onClick={resetFilters} className={`flex h-11 w-full items-center justify-center rounded-xl border px-4 text-xs font-semibold transition-colors lg:w-auto lg:shrink-0 ${isDark ? 'border-[#334155] text-[#94a3b8] hover:bg-[#1e293b]' : 'border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9]'}`}>
                                        Tozalash
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {isFetching ? (
                    <div className={`flex items-center justify-center gap-2 py-14 text-sm ${muted}`}>
                        <svg className="h-4 w-4 animate-spin text-amber-400" viewBox="0 0 24 24" fill="none">
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v8H4z"
                            />
                        </svg>
                        Yuklanmoqda...
                    </div>
                ) : isError ? (
                    <div className={`flex flex-col items-center gap-2 py-14 ${muted}`}>
                        <LuPackage size={34} strokeWidth={1.5} />
                        <p className="text-sm font-semibold">Ma&apos;lumotlarni yuklashda xatolik</p>
                        <p className="text-xs">{error?.data?.message || error?.message || 'Server bilan aloqa yo‘q'}</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className={`flex flex-col items-center gap-2 py-14 ${muted}`}>
                        <LuInbox size={34} strokeWidth={1.5} />
                        <p className="text-sm font-semibold">Buyurtmalar topilmadi</p>
                    </div>
                ) : (
                    <>
                        {/* ── Desktop table ── */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full min-w-[900px] text-sm">
                                <thead>
                                    <tr
                                        className={`text-left text-xs font-semibold uppercase tracking-wide ${muted} ${
                                            isDark ? 'bg-[#0f172a]/30' : 'bg-[#f8fafc]/80'
                                        }`}
                                    >
                                        <th className="px-5 py-3 w-14 text-center">№</th>
                                        <th className="px-5 py-3 min-w-[220px]">Mijoz</th>
                                        <th className="px-5 py-3 w-36">Mahsulot</th>
                                        <th className="px-5 py-3 w-44 text-right">Jami summa</th>
                                        <th className="px-5 py-3 w-40">Holat</th>
                                        <th className="px-5 py-3 w-48">Sana</th>
                                        <th className="px-5 py-3 w-20 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${divider}`}>
                                    {filtered.map((o, idx) => (
                                        <tr key={o.id} className={`transition-colors ${rowHov}`}>
                                            <td className={`px-5 py-3 text-center text-xs tabular-nums ${muted}`}>
                                                {page * PAGE_SIZE + idx + 1}
                                            </td>
                                            <td className="px-5 py-3">
                                                <p className={`truncate font-semibold ${head}`}>{o.customerName || '—'}</p>
                                                {o.summary && (
                                                    <p className={`truncate max-w-xs text-xs ${muted}`}>{o.summary}</p>
                                                )}
                                            </td>
                                            <td className={`px-5 py-3 text-xs font-semibold ${muted}`}>
                                                <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                                                    <LuPackage size={13} /> {o.items?.length ?? 0} ta
                                                </span>
                                            </td>
                                            <td className={`px-5 py-3 text-right font-bold tabular-nums ${head}`}>
                                                {formatNumber(o.totalAmount ?? 0)} so&apos;m
                                            </td>
                                            <td className="px-5 py-3">
                                                <span
                                                    className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-bold ${STAFF_STATUS_CX[o.status] ?? 'bg-slate-500/10 text-slate-500 border-slate-500/30'}`}
                                                >
                                                    {STAFF_STATUS_LABEL[o.status] ?? o.status}
                                                </span>
                                            </td>
                                            <td className={`whitespace-nowrap px-5 py-3 text-xs ${muted}`}>
                                                {o.createdAt
                                                    ? new Date(o.createdAt).toLocaleString('uz-UZ')
                                                    : '—'}
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/staff/orders/${o.id}`)}
                                                        aria-label="Ko'rish"
                                                        title="Ko'rish"
                                                        className={iconBtn}
                                                    >
                                                        <LuEye size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* ── Mobile card list ── */}
                        <div className={`flex flex-col divide-y md:hidden ${divider}`}>
                            {filtered.map((o, idx) => (
                                <div
                                    key={o.id}
                                    className={`px-4 py-3.5 transition-colors ${rowHov}`}
                                >
                                    {/* Top row: index + customer + status */}
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className={`text-[11px] tabular-nums shrink-0 ${muted}`}>
                                                #{page * PAGE_SIZE + idx + 1}
                                            </span>
                                            <p className={`font-semibold text-sm truncate ${head}`}>
                                                {o.customerName || '—'}
                                            </p>
                                        </div>
                                        <span
                                            className={`shrink-0 inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-bold ${STAFF_STATUS_CX[o.status] ?? 'bg-slate-500/10 text-slate-500 border-slate-500/30'}`}
                                        >
                                            {STAFF_STATUS_LABEL[o.status] ?? o.status}
                                        </span>
                                    </div>

                                    {/* Middle row: summary */}
                                    {o.summary && (
                                        <p className={`text-xs mb-2 line-clamp-1 ${muted}`}>{o.summary}</p>
                                    )}

                                    {/* Bottom row: items count + amount + date + view */}
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${isDark ? 'bg-white/5 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                                                <LuPackage size={12} /> {o.items?.length ?? 0} ta
                                            </span>
                                            <span className={`font-bold text-sm tabular-nums ${head}`}>
                                                {formatNumber(o.totalAmount ?? 0)} so&apos;m
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[11px] ${muted}`}>
                                                {o.createdAt
                                                    ? new Date(o.createdAt).toLocaleDateString('uz-UZ')
                                                    : '—'}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => navigate(`/staff/orders/${o.id}`)}
                                                aria-label="Ko'rish"
                                                className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                                                    isDark
                                                        ? 'bg-amber-400/10 text-amber-400 hover:bg-amber-400/20'
                                                        : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                                                }`}
                                            >
                                                <LuEye size={15} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {pagination.totalPages > 1 && (
                    <div className={`flex items-center justify-between gap-3 border-t px-5 py-3.5 ${line}`}>
                        <p className={`text-xs ${muted}`}>
                            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, pagination.totalElements)} /{' '}
                            {pagination.totalElements}
                        </p>
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                disabled={pagination.first}
                                onClick={() => setPage((p) => p - 1)}
                                className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors disabled:opacity-40 ${
                                    isDark
                                        ? 'border-[#334155] hover:bg-[#334155]'
                                        : 'border-[#e2e8f0] hover:bg-[#f1f5f9]'
                                }`}
                            >
                                <LuChevronLeft size={14} />
                            </button>
                            <span className={`px-3 text-sm font-semibold ${head}`}>
                                {page + 1} / {pagination.totalPages}
                            </span>
                            <button
                                type="button"
                                disabled={pagination.last}
                                onClick={() => setPage((p) => p + 1)}
                                className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors disabled:opacity-40 ${
                                    isDark
                                        ? 'border-[#334155] hover:bg-[#334155]'
                                        : 'border-[#e2e8f0] hover:bg-[#f1f5f9]'
                                }`}
                            >
                                <LuChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
