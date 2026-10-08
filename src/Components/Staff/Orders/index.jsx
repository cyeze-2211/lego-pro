import { Fragment, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LuClipboardList, LuSearch, LuChevronLeft, LuChevronRight,
    LuX, LuEye, LuPackage, LuSlidersHorizontal, LuChevronDown,
    LuInbox, LuCircleCheckBig, LuBan,
} from 'react-icons/lu';
import { useAppTheme } from '../../../theme/tokens';
import { formatNumber } from '../../ui/number-format';
import { useGetSalesOrdersQuery } from '../../../store/services/salesOrder.api';
import { useGetWarehousesQuery } from '../../../store/services/warehouse.api';
import { STATUS_LABEL, statusCx } from '../../Zayavkachi/__components/statusBadge';

const PAGE_SIZE = 20;

/* ── Tabs ── */
const TABS = [
    {
        key: 'active',
        label: 'Faol buyurtmalar',
        Icon: LuClipboardList,
        statuses: ['CREATED', 'LOADED'],
        hasStatusFilter: true,
        emptyText: "Faol buyurtmalar yo'q",
    },
    {
        key: 'completed',
        label: 'Tugallangan',
        Icon: LuCircleCheckBig,
        statuses: ['CONFIRMED'],
        hasStatusFilter: false,
        emptyText: "Hali tugallangan buyurtma yo'q",
    },
    {
        key: 'cancelled',
        label: 'Rad etilgan',
        Icon: LuBan,
        statuses: ['REJECTED'],
        hasStatusFilter: false,
        emptyText: "Hali rad etilgan buyurtma yo'q",
    },
];

const ACTIVE_STATUSES = TABS[0].statuses;

const formatDate = (value) => {
    if (!value) return '—';
    try {
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return '—';
        return d.toLocaleString('uz-UZ', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    } catch {
        return '—';
    }
};

export default function StaffOrders() {
    const { isDark } = useAppTheme();
    const navigate = useNavigate();

    /* ── State ── */
    const [tab, setTab] = useState('active');
    const [page, setPage] = useState(0);
    const [statusFilter, setStatusFilter] = useState('');
    const [warehouseFilter, setWarehouseFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [search, setSearch] = useState('');
    const [filtersOpen, setFiltersOpen] = useState(false);

    const { data: warehousesData } = useGetWarehousesQuery('PRODUCT');
    const warehouses = warehousesData || [];

    const currentTab = TABS.find((t) => t.key === tab) ?? TABS[0];

    /* ── Reset on tab change ── */
    const handleTabChange = (newTab) => {
        if (newTab === tab) return;
        setTab(newTab);
        setPage(0);
        setStatusFilter('');
    };

    /* ── API query ── */
    const queryArgs = (() => {
        const base = {
            warehouseId: warehouseFilter || undefined,
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined,
            page,
            size: PAGE_SIZE,
        };
        if (tab === 'active') {
            return { ...base, status: statusFilter || undefined };
        }
        if (tab === 'completed') return { ...base, status: 'CONFIRMED' };
        if (tab === 'cancelled') return { ...base, status: 'REJECTED' };
        return base;
    })();

    const { data, isFetching, isError, error } = useGetSalesOrdersQuery(queryArgs);

    const orders = data?.items ?? [];
    const pagination = data?.pagination ?? {};

    const totalPages = Number.isFinite(pagination?.totalPages) ? pagination.totalPages : 0;
    const totalElements = Number.isFinite(pagination?.totalElements) ? pagination.totalElements : 0;

    /* ── Client-side filter: active tab → только CREATED/LOADED ── */
    const restrictToActive = tab === 'active' && !statusFilter;
    const tabFiltered = restrictToActive
        ? orders.filter((o) => ACTIVE_STATUSES.includes(o?.status))
        : orders;

    const filtered = search
        ? tabFiltered.filter((o) =>
              (o?.customerName ?? '').toLowerCase().includes(search.toLowerCase())
          )
        : tabFiltered;

    /* ── Tab counts (по загруженным) ── */
    const tabCounts = {
        active: orders.filter((o) => ACTIVE_STATUSES.includes(o?.status)).length,
        completed: orders.filter((o) => o?.status === 'CONFIRMED').length,
        cancelled: orders.filter((o) => o?.status === 'REJECTED').length,
    };

    const activeFilterCount =
        (tab === 'active' && statusFilter ? 1 : 0) +
        (warehouseFilter ? 1 : 0) +
        (dateFrom ? 1 : 0) +
        (dateTo ? 1 : 0) +
        (search ? 1 : 0);
    const hasFilters = activeFilterCount > 0;

    const resetFilters = () => {
        if (tab === 'active') setStatusFilter('');
        setWarehouseFilter('');
        setDateFrom('');
        setDateTo('');
        setSearch('');
        setPage(0);
    };

    const goToOrder = (id) => {
        if (!id) return;
        navigate(`/staff/orders/${id}`);
    };

    /* ── Theme ── */
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
        ? 'flex h-9 w-9 items-center justify-center rounded-lg transition-colors text-[#64748b] hover:bg-[#1e293b] hover:text-amber-400'
        : 'flex h-9 w-9 items-center justify-center rounded-lg transition-colors text-[#94a3b8] hover:bg-amber-50 hover:text-amber-500';

    const renderLoading = () => (
        <div className={`flex items-center justify-center gap-2 py-14 text-sm ${muted}`}>
            <svg className="h-4 w-4 animate-spin text-amber-400" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Yuklanmoqda...
        </div>
    );

    return (
        <div className="flex w-full flex-col gap-4 py-2">

            {/* ═══ Header ═══ */}
            <div className={`relative overflow-hidden rounded-2xl border px-5 py-4 shadow-md ${panel}`}>
                <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-amber-400/6 to-transparent" />
                <div className="relative flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-400/10 text-amber-500">
                            <LuClipboardList size={20} />
                        </span>
                        <div>
                            <h1 className={`text-xl font-bold tracking-tight leading-tight ${head}`}>
                                Buyurtmalar
                            </h1>
                            <p className={`text-sm mt-0.5 ${muted}`}>
                                Barcha xodimlarning buyurtmalar ro&apos;yxati
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══ Tabs ═══ */}
            <div className={`flex items-center gap-1 overflow-x-auto rounded-2xl border p-1.5 ${panel}`}>
                {TABS.map(({ key, label, Icon }) => {
                    const isActive = tab === key;
                    const count = tabCounts[key] || 0;
                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => handleTabChange(key)}
                            className={`flex flex-1 min-w-[160px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200 ${
                                isActive
                                    ? 'bg-[#FACC15] text-[#0F172A] shadow-sm shadow-[#FACC15]/30'
                                    : `${muted} hover:bg-amber-400/10 hover:text-amber-500`
                            }`}
                        >
                            <Icon size={16} />
                            <span className="whitespace-nowrap">{label}</span>
                            {count > 0 && (
                                <span className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                                    isActive
                                        ? 'bg-[#0F172A]/15 text-[#0F172A]'
                                        : isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-600'
                                }`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ═══ Ro'yxat ═══ */}
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
                            {!filtersOpen && statusFilter && tab === 'active' && (
                                <span className={`hidden text-xs sm:inline ${muted}`}>
                                    · Holat:{' '}
                                    <span className="font-semibold text-amber-500">
                                        {STATUS_LABEL[statusFilter]}
                                    </span>
                                </span>
                            )}
                        </div>
                        <LuChevronDown
                            size={18}
                            className={`shrink-0 transition-transform duration-300 ${filtersOpen ? 'rotate-180' : ''} ${muted}`}
                        />
                    </button>

                    <div className={`grid transition-all duration-300 ease-in-out ${filtersOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                        <div className="overflow-hidden">
                            <div className="grid grid-cols-1 gap-3 px-4 pb-4 sm:grid-cols-2 lg:flex lg:flex-row lg:items-end lg:px-5 lg:pb-5">
                                {currentTab.hasStatusFilter && (
                                    <div className="lg:w-48 lg:shrink-0">
                                        <label className={`mb-1.5 block text-xs font-semibold ${muted}`}>Holat</label>
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                                            className={inputCx}
                                        >
                                            <option value="">Barchasi</option>
                                            {currentTab.statuses.map((s) => (
                                                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="lg:w-48 lg:shrink-0">
                                    <label className={`mb-1.5 block text-xs font-semibold ${muted}`}>Ombor</label>
                                    <select
                                        value={warehouseFilter}
                                        onChange={(e) => { setWarehouseFilter(e.target.value); setPage(0); }}
                                        className={inputCx}
                                    >
                                        <option value="">Barcha omborlar</option>
                                        {warehouses.map((warehouse) => (
                                            <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="lg:w-44 lg:shrink-0">
                                    <label className={`mb-1.5 block text-xs font-semibold ${muted}`}>Sanadan</label>
                                    <input
                                        type="date"
                                        value={dateFrom}
                                        max={dateTo || undefined}
                                        onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
                                        className={inputCx}
                                    />
                                </div>

                                <div className="lg:w-44 lg:shrink-0">
                                    <label className={`mb-1.5 block text-xs font-semibold ${muted}`}>Sanagacha</label>
                                    <input
                                        type="date"
                                        value={dateTo}
                                        min={dateFrom || undefined}
                                        onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
                                        className={inputCx}
                                    />
                                </div>

                                <div className="sm:col-span-2 lg:flex-1">
                                    <label className={`mb-1.5 block text-xs font-semibold ${muted}`}>Mijoz bo&apos;yicha qidirish</label>
                                    <div className="relative">
                                        <LuSearch className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 ${muted}`} />
                                        <input
                                            type="text"
                                            placeholder="Mijoz nomini yozing"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className={`${inputCx} pl-11 pr-10`}
                                        />
                                        {search && (
                                            <button
                                                type="button"
                                                onClick={() => setSearch('')}
                                                aria-label="Qidiruvni tozalash"
                                                className={`absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg ${muted} hover:text-[#f43f5e]`}
                                            >
                                                <LuX size={15} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {hasFilters && (
                                    <button
                                        type="button"
                                        onClick={resetFilters}
                                        className={`flex h-11 w-full items-center justify-center rounded-xl border px-4 text-xs font-semibold transition-colors lg:w-auto lg:shrink-0 ${
                                            isDark
                                                ? 'border-[#334155] text-[#94a3b8] hover:bg-[#1e293b]'
                                                : 'border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9]'
                                        }`}
                                    >
                                        Tozalash
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {isFetching ? (
                    renderLoading()
                ) : isError ? (
                    <div className={`flex flex-col items-center gap-2 py-14 ${muted}`}>
                        <LuPackage size={34} strokeWidth={1.5} />
                        <p className="text-sm font-semibold">Ma&apos;lumotlarni yuklashda xatolik</p>
                        <p className="text-xs">{error?.data?.message || error?.message || 'Server bilan aloqa yo‘q'}</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className={`flex flex-col items-center gap-2 py-14 ${muted}`}>
                        <LuInbox size={34} strokeWidth={1.5} />
                        <p className="text-sm font-semibold">{currentTab.emptyText}</p>
                    </div>
                ) : (
                    <>
                        {/* ── Desktop table ── */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full min-w-[900px] text-sm">
                                <thead>
                                    <tr className={`text-left text-xs font-semibold uppercase tracking-wide ${muted} ${isDark ? 'bg-[#0f172a]/30' : 'bg-[#f8fafc]/80'}`}>
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
                                        <tr
                                            key={o.id}
                                            onClick={() => goToOrder(o.id)}
                                            title="Batafsil ko'rish uchun bosing"
                                            className={`cursor-pointer transition-colors ${rowHov}`}
                                        >
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
                                                    className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-bold ${statusCx(o.status)}`}
                                                >
                                                    {STATUS_LABEL[o.status] ?? o.status}
                                                </span>
                                            </td>
                                            <td className={`whitespace-nowrap px-5 py-3 text-xs ${muted}`}>
                                                {formatDate(o.createdAt)}
                                            </td>
                                            <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => goToOrder(o.id)}
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
                                    onClick={() => goToOrder(o.id)}
                                    className={`cursor-pointer px-4 py-3.5 transition-colors ${rowHov}`}
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
                                            className={`shrink-0 inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-bold ${statusCx(o.status)}`}
                                        >
                                            {STATUS_LABEL[o.status] ?? o.status}
                                        </span>
                                    </div>

                                    {/* Middle row: summary */}
                                    {o.summary && (
                                        <p className={`text-xs mb-2 line-clamp-1 ${muted}`}>{o.summary}</p>
                                    )}

                                    {/* Bottom row: items + amount + date + view */}
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
                                                onClick={(e) => { e.stopPropagation(); goToOrder(o.id); }}
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

                {totalPages > 1 && (
                    <div className={`flex items-center justify-between gap-3 border-t px-5 py-3.5 ${line}`}>
                        <p className={`text-xs ${muted}`}>
                            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalElements)} /{' '}
                            {totalElements}
                        </p>
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                disabled={page === 0}
                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                                className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors disabled:opacity-40 ${
                                    isDark
                                        ? 'border-[#334155] hover:bg-[#334155]'
                                        : 'border-[#e2e8f0] hover:bg-[#f1f5f9]'
                                }`}
                            >
                                <LuChevronLeft size={14} />
                            </button>
                            <span className={`px-3 text-sm font-semibold ${head}`}>
                                {page + 1} / {totalPages}
                            </span>
                            <button
                                type="button"
                                disabled={page >= totalPages - 1}
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