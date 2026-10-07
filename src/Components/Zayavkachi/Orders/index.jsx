import { Fragment, useState } from 'react';
import PropTypes from 'prop-types';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    LuClipboardList, LuSearch, LuChevronLeft, LuChevronRight,
    LuPlus, LuX, LuEye, LuPencil, LuPackage,
    LuSlidersHorizontal, LuChevronDown,
    LuCircleX, LuCircleCheckBig, LuBan, LuChevronUp,
    LuInbox, LuCircleDashed, LuPackageCheck,
} from 'react-icons/lu';
import { useAppTheme } from '../../../theme/tokens';
import { formatNumber } from '../../ui/number-format';
import { useAppSelector } from '../../../store/hooks';
import { ROLES } from '../../../app/permissions/roles';
import {
    useGetSalesOrdersQuery,
    useUpdateSalesOrderStatusMutation,
    useRejectSalesOrderMutation,
    useLoadSalesOrderMutation,
} from '../../../store/services/salesOrder.api';
import DeleteOrder from '../__components/DeleteOrder';
import { STATUS_LABEL, statusCx } from '../__components/statusBadge';
import { Alert } from '../../Other/UI/Alert/Alert';

const PAGE_SIZE = 20;

/* ── Status configs ── */
const LOCAL_LABELS = {
    CREATED:    'Yaratilgan',
    LOADED:     'Ortildi',
    CONFIRMED:  'Tugallangan',
    REJECTED:   'Rad etilgan',
};

const NEXT_STATUS = {
    CREATED:    ['LOADED', 'REJECTED'],
    LOADED:     ['CONFIRMED'],
    CONFIRMED:  [],
    REJECTED:   [],
};

const FINAL_STATUSES = ['CONFIRMED', 'REJECTED'];

const STATUS_ICON = {
    CREATED:    LuCircleDashed,
    LOADED:     LuPackageCheck,
    CONFIRMED:  LuCircleCheckBig,
    REJECTED:   LuCircleX,
};

/* ── Tabs ── */
const TABS = [
    {
        key: 'active',
        label: 'Faol buyurtmalar',
        Icon: LuClipboardList,
        statuses: ['CREATED', 'LOADED'],
        hasStatusFilter: true,
        emptyText: "Faol buyurtmalar yo'q",
        emptyHint: "Yangi buyurtma qo'shish uchun yuqoridagi tugmani bosing",
    },
    {
        key: 'completed',
        label: 'Tugallangan',
        Icon: LuCircleCheckBig,
        statuses: ['CONFIRMED'],
        hasStatusFilter: false,
        emptyText: "Hali tugallangan buyurtma yo'q",
        emptyHint: "Tasdiqlangan buyurtmalar shu yerda ko'rinadi",
    },
    {
        key: 'cancelled',
        label: 'Rad etilgan',
        Icon: LuBan,
        statuses: ['REJECTED'],
        hasStatusFilter: false,
        emptyText: "Hali rad etilgan buyurtma yo'q",
        emptyHint: "Rad etilgan buyurtmalar shu yerda ko'rinadi",
    },
];

const ACTIVE_STATUSES = TABS[0].statuses;

const labelOf = (status) => {
    if (!status) return '—';
    return LOCAL_LABELS[status] ?? STATUS_LABEL?.[status] ?? status;
};

const safeStatusCx = (status) => {
    try {
        return typeof statusCx === 'function' ? statusCx(status) ?? '' : '';
    } catch {
        return '';
    }
};

const effectiveNextStatuses = (status) => {
    if (!status) return [];
    const next = NEXT_STATUS?.[status];
    return Array.isArray(next) ? next : [];
};

const isFinalStatus = (status) => {
    if (!status) return false;
    if (status === 'CONFIRMED' || status === 'REJECTED') return true;
    return Array.isArray(FINAL_STATUSES) && FINAL_STATUSES.includes(status);
};

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

/* ──────────────────────────────────────────────────────────────── */
/*  Status control                                                  */
/* ──────────────────────────────────────────────────────────────── */
function OrderListStatusControl({ order, isDark }) {
    const [action, setAction] = useState(null);
    const role = useAppSelector((state) => state.auth.role);
    const [updateStatus] = useUpdateSalesOrderStatusMutation();
    const [rejectOrder] = useRejectSalesOrderMutation();
    const [loadOrder] = useLoadSalesOrderMutation();

    const statusStyles = {
        CREATED:    { bg: isDark ? 'rgba(250,204,21,.16)'  : '#FEF3C7', color: isDark ? '#fde68a' : '#92400E', border: isDark ? '#ca8a04' : '#d97706' },
        LOADED:     { bg: isDark ? 'rgba(167,139,250,.16)' : '#EDE9FE', color: isDark ? '#c4b5fd' : '#5B21B6', border: isDark ? '#8b5cf6' : '#7c3aed' },
        CONFIRMED:  { bg: isDark ? 'rgba(34,197,94,.16)'   : '#DCFCE7', color: isDark ? '#86efac' : '#15803d', border: '#16a34a' },
        REJECTED:   { bg: isDark ? 'rgba(239,68,68,.16)'   : '#FEE2E2', color: isDark ? '#fca5a5' : '#b91c1c', border: '#dc2626' },
    };
    const style = statusStyles[order.status] || statusStyles.CREATED;

    const isFinal = isFinalStatus(order.status);
    const nextStatuses = effectiveNextStatuses(order.status);

    if (role === ROLES.ZAYAVKACHI) {
        const Icon = STATUS_ICON[order.status];
        return (
            <span
                className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold whitespace-nowrap"
                style={{ backgroundColor: style.bg, color: style.color, borderColor: style.border }}
            >
                {Icon && <Icon size={13} />}
                {labelOf(order.status)}
            </span>
        );
    }

    const changeStatus = async (nextStatus) => {
        if (!nextStatus || nextStatus === order.status) return;
        setAction(nextStatus);
        try {
            if (nextStatus === 'LOADED') {
                await loadOrder(order.id).unwrap();
            } else if (nextStatus === 'REJECTED') {
                await rejectOrder({ id: order.id }).unwrap();
            } else {
                await updateStatus({ id: order.id, status: nextStatus }).unwrap();
            }
            Alert(`Buyurtma holati "${labelOf(nextStatus)}" ga o'zgartirildi`, 'success');
        } catch (error) {
            Alert(error?.data?.message || "Statusni o'zgartirishda xatolik", 'error');
        } finally {
            setAction(null);
        }
    };

    if (isFinal) {
        const Icon = STATUS_ICON[order.status];
        return (
            <span
                className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold whitespace-nowrap"
                style={{ backgroundColor: style.bg, color: style.color, borderColor: style.border }}
            >
                {Icon && <Icon size={13} />}
                {labelOf(order.status)}
            </span>
        );
    }

    return (
        <select
            value={action || order.status || ''}
            onChange={(event) => changeStatus(event.target.value)}
            onClick={(event) => event.stopPropagation()}
            disabled={Boolean(action)}
            aria-label="Buyurtma holatini o'zgartirish"
            className="cursor-pointer rounded-full border px-2.5 py-1 text-xs font-bold outline-none transition-transform hover:scale-[1.03] disabled:cursor-wait disabled:opacity-60"
            style={{ backgroundColor: style.bg, color: style.color, borderColor: style.border }}
        >
            <option value={order.status}>{labelOf(order.status)}</option>
            {nextStatuses.map((s) => (
                <option key={s} value={s}>→ {labelOf(s)}</option>
            ))}
        </select>
    );
}

OrderListStatusControl.propTypes = {
    order: PropTypes.shape({
        id: PropTypes.string.isRequired,
        status: PropTypes.string,
    }).isRequired,
    isDark: PropTypes.bool.isRequired,
};

/* ──────────────────────────────────────────────────────────────── */
/*  Tugallangan / Rad etilgan — qator ostidagi panel                */
/* ──────────────────────────────────────────────────────────────── */
function OrderUnderPanel({ order, isDark }) {
    const isCancelled = order?.status === 'REJECTED';

    const head = isDark ? 'text-white' : 'text-[#0f172a]';
    const muted = isDark ? 'text-[#94a3b8]' : 'text-[#64748b]';
    const line = isDark ? 'border-[#334155]/60' : 'border-[#e2e8f0]';
    const base = isDark ? 'bg-[#0f172a]/40' : 'bg-[#f8fafc]';

    const items = Array.isArray(order?.items) ? order.items : [];
    const finishDate = order?.updatedAt || order?.createdAt;

    const accent = isCancelled ? '#ef4444' : '#22c55e';
    const accentBg = isCancelled
        ? (isDark ? 'rgba(239,68,68,.10)' : '#FEE2E2')
        : (isDark ? 'rgba(34,197,94,.10)' : '#DCFCE7');

    return (
        <tr className={`border-t ${line}`}>
            <td colSpan={7} className={`px-5 pb-4 pt-3 ${base}`}>
                <div
                    className="rounded-xl border p-4"
                    style={{ borderColor: accent, backgroundColor: accentBg }}
                >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <span
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                                style={{ backgroundColor: accent, color: '#fff' }}
                            >
                                {isCancelled ? <LuCircleX size={18} /> : <LuCircleCheckBig size={18} />}
                            </span>
                            <div>
                                <p className={`text-sm font-bold leading-tight ${head}`}>
                                    {isCancelled ? 'Rad etilgan' : 'Tugallangan'}
                                </p>
                                <p className={`text-xs ${muted}`}>
                                    {isCancelled
                                        ? `Rad etilgan sana: ${formatDate(finishDate)}`
                                        : `Tugallangan sana: ${formatDate(finishDate)}`}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${line} ${head}`}>
                                {items.length} ta mahsulot
                            </span>
                            <span className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${line} ${head}`}>
                                {formatNumber(order?.totalAmount ?? 0)} so&apos;m
                            </span>
                        </div>
                    </div>

                    {items.length > 0 && (
                        <div className={`mt-3 overflow-hidden rounded-lg border ${line}`}>
                            <table className="w-full text-xs">
                                <thead className={isDark ? 'bg-[#0f172a]/60' : 'bg-white'}>
                                    <tr className={`text-left font-semibold uppercase tracking-wide ${muted}`}>
                                        <th className="px-3 py-2">Mahsulot</th>
                                        <th className="px-3 py-2 w-24 text-right">Narx</th>
                                        <th className="px-3 py-2 w-20 text-right">Soni</th>
                                        <th className="px-3 py-2 w-28 text-right">Jami</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${isDark ? 'divide-[#334155]/60' : 'divide-[#e2e8f0]'}`}>
                                    {items.map((it, i) => {
                                        const price = Number(it?.price ?? it?.amount ?? 0);
                                        const qty = Number(it?.quantity ?? 1);
                                        return (
                                            <tr key={it?.id ?? i}>
                                                <td className={`px-3 py-2 font-semibold ${head}`}>
                                                    {it?.productName || it?.name || '—'}
                                                </td>
                                                <td className={`px-3 py-2 text-right ${muted}`}>
                                                    {formatNumber(price)}
                                                </td>
                                                <td className={`px-3 py-2 text-right ${muted}`}>x {qty}</td>
                                                <td className={`px-3 py-2 text-right font-bold ${head}`}>
                                                    {formatNumber(price * qty)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </td>
        </tr>
    );
}

OrderUnderPanel.propTypes = {
    order: PropTypes.object.isRequired,
    isDark: PropTypes.bool.isRequired,
};

/* ──────────────────────────────────────────────────────────────── */
/*  Main page                                                       */
/* ──────────────────────────────────────────────────────────────── */
export default function ZayavkachiOrders() {
    const { isDark } = useAppTheme();
    const navigate = useNavigate();
    const { pathname } = useLocation();

    const ordersPath = pathname?.startsWith('/orders')
        ? '/orders'
        : pathname?.startsWith('/kassir/orders')
        ? '/kassir/orders'
        : '/zayavkachi/orders';

    const [tab, setTab]                   = useState('active');
    const [page, setPage]                 = useState(0);
    const [statusFilter, setStatusFilter] = useState('');
    const [dateFrom, setDateFrom]         = useState('');
    const [dateTo, setDateTo]             = useState('');
    const [search, setSearch]             = useState('');
    const [filtersOpen, setFiltersOpen]   = useState(false);
    const [expandedId, setExpandedId]     = useState(null);

    const currentTab = TABS.find((t) => t.key === tab) ?? TABS[0];

    const handleTabChange = (newTab) => {
        if (newTab === tab) return;
        setTab(newTab);
        setPage(0);
        setExpandedId(null);
    };

    /* ── API ── */
    const queryArgs = (() => {
        const base = {
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

    const rawList = Array.isArray(data)
        ? data
        : data?.items ?? data?.data ?? [];
    const orders = Array.isArray(rawList) ? rawList : [];
    const pagination = (data && typeof data === 'object' && data.pagination) || {};

    const totalPages = Number.isFinite(pagination?.totalPages) ? pagination.totalPages : 0;
    const totalElements = Number.isFinite(pagination?.totalElements) ? pagination.totalElements : 0;

    const restrictToActive = tab === 'active' && !statusFilter;

    const tabFiltered = restrictToActive
        ? orders.filter((o) => ACTIVE_STATUSES.includes(o?.status))
        : orders;

    const filtered = search
        ? tabFiltered.filter((o) =>
              (o?.customerName ?? '').toLowerCase().includes(search.toLowerCase())
          )
        : tabFiltered;

    /* ── Tab counts ── */
    const tabCounts = {
        active: orders.filter((o) => ACTIVE_STATUSES.includes(o?.status)).length,
        completed: orders.filter((o) => o?.status === 'CONFIRMED').length,
        cancelled: orders.filter((o) => o?.status === 'REJECTED').length,
    };

    const activeFilterCount = tab === 'active'
        ? [statusFilter, dateFrom, dateTo, search].filter(Boolean).length
        : [dateFrom, dateTo, search].filter(Boolean).length;
    const hasFilters = activeFilterCount > 0;

    const resetFilters = () => {
        if (tab === 'active') setStatusFilter('');
        setDateFrom('');
        setDateTo('');
        setSearch('');
        setPage(0);
    };

    const toggleExpand = (id) => {
        setExpandedId((prev) => (prev === id ? null : id));
    };

    const goToOrder = (id) => {
        if (!id) return;
        navigate(`${ordersPath}/${id}`);
    };

    /* ── theme ── */
    const panel   = isDark ? 'border-white/10 bg-[#141C2B]' : 'border-[#e2e8f0] bg-white';
    const muted   = isDark ? 'text-[#94a3b8]' : 'text-[#64748b]';
    const head    = isDark ? 'text-white' : 'text-[#0f172a]';
    const divider = isDark ? 'divide-[#334155]/50' : 'divide-[#f1f5f9]';
    const line    = isDark ? 'border-[#334155]/60' : 'border-[#f1f5f9]';
    const rowHov  = isDark ? 'hover:bg-[#1e293b]/60' : 'hover:bg-amber-50/50';
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
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            Yuklanmoqda...
        </div>
    );

    return (
        <div className="flex w-full flex-col gap-4 py-2">

            {/* ── Header ── */}
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
                    <button type="button" onClick={() => navigate(`${ordersPath}/new`)}
                        className="flex h-12 items-center gap-2 rounded-xl bg-[#FACC15] px-6 text-sm font-bold text-[#0F172A] shadow-lg shadow-[#FACC15]/30 transition-all duration-200 hover:-translate-y-px hover:bg-[#EAB308] hover:shadow-xl">
                        <LuPlus size={16} /> Yangi buyurtma
                    </button>
                </div>
            </div>

            {/* ── Tabs ── */}
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

            {/* ── Ro'yxat ── */}
            <div className={`rounded-2xl border shadow-md ${panel}`}>

                {/* ── Accordion filtrlar ── */}
                <div className={`border-b ${line}`}>
                    <button
                        type="button"
                        onClick={() => setFiltersOpen((v) => !v)}
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
                            {!filtersOpen && tab === 'active' && statusFilter && (
                                <span className={`hidden text-xs sm:inline ${muted}`}>
                                    · Holat: <span className="font-semibold text-amber-500">{labelOf(statusFilter)}</span>
                                </span>
                            )}
                        </div>
                        <LuChevronDown
                            size={18}
                            className={`shrink-0 transition-transform duration-300 ${filtersOpen ? 'rotate-180' : ''} ${muted}`}
                        />
                    </button>

                    <div
                        className={`grid transition-all duration-300 ease-in-out ${
                            filtersOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                        }`}
                    >
                        <div className="overflow-hidden">
                            <div className="flex flex-col gap-3 px-5 pb-5 sm:flex-row sm:items-end">
                                {currentTab.hasStatusFilter && (
                                    <div className="sm:w-48 shrink-0">
                                        <label className={`mb-1.5 block text-xs font-semibold ${muted}`}>Holat</label>
                                        <select value={statusFilter}
                                            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                                            className={inputCx}>
                                            <option value="">Barchasi</option>
                                            {currentTab.statuses.map((s) => (
                                                <option key={s} value={s}>{labelOf(s)}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="sm:w-44 shrink-0">
                                    <label className={`mb-1.5 block text-xs font-semibold ${muted}`}>Yaratilgan sana (dan)</label>
                                    <input type="date" value={dateFrom} max={dateTo || undefined}
                                        onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
                                        className={inputCx} />
                                </div>

                                <div className="sm:w-44 shrink-0">
                                    <label className={`mb-1.5 block text-xs font-semibold ${muted}`}>Yaratilgan sana (gacha)</label>
                                    <input type="date" value={dateTo} min={dateFrom || undefined}
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
                                        className={`flex h-11 shrink-0 items-center rounded-xl border px-4 text-xs font-semibold transition-colors ${isDark ? 'border-[#334155] text-[#94a3b8] hover:bg-[#1e293b]' : 'border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9]'}`}>
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
                        <p className="text-xs">
                            {error?.data?.message || error?.message || 'Server bilan aloqa yo‘q'}
                        </p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className={`flex flex-col items-center gap-2 py-14 ${muted}`}>
                        <LuInbox size={34} strokeWidth={1.5} />
                        <p className="text-sm font-semibold">{currentTab.emptyText}</p>
                        <p className="text-xs">{currentTab.emptyHint}</p>
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
                                    const editable = o?.status === 'CREATED';
                                    const canExpand = o?.status === 'CONFIRMED' || o?.status === 'REJECTED';
                                    const isExpanded = expandedId === o?.id;
                                    return (
                                        <Fragment key={o?.id ?? idx}>
                                            <tr
                                                onClick={() => goToOrder(o?.id)}
                                                title="Batafsil ko'rish uchun bosing"
                                                className={`cursor-pointer transition-colors ${rowHov}`}
                                            >
                                                <td className={`px-5 py-3 text-xs ${muted}`}>{page * PAGE_SIZE + idx + 1}</td>
                                                <td className="px-5 py-3">
                                                    <p className={`font-semibold ${head}`}>{o?.customerName || '—'}</p>
                                                    {o?.summary && <p className={`truncate max-w-xs text-xs ${muted}`}>{o.summary}</p>}
                                                </td>
                                                <td className={`px-5 py-3 text-xs font-semibold ${muted}`}>
                                                    {Array.isArray(o?.items) ? o.items.length : 0} ta
                                                </td>
                                                <td className={`px-5 py-3 text-right font-bold ${head}`}>
                                                    {formatNumber(o?.totalAmount ?? 0)} so&apos;m
                                                </td>
                                                <td className="px-5 py-3">
                                                    <OrderListStatusControl order={o} isDark={isDark} />
                                                </td>
                                                <td className={`px-5 py-3 text-xs ${muted}`}>
                                                    {formatDate(o?.createdAt)}
                                                </td>
                                                <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex items-center justify-end gap-1">
                                                        {canExpand && (
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleExpand(o.id)}
                                                                aria-label={isExpanded ? 'Yopish' : 'Ochish'}
                                                                title={isExpanded ? 'Yopish' : "Batafsil ko'rish"}
                                                                className={iconBtn}
                                                            >
                                                                {isExpanded ? <LuChevronUp size={16} /> : <LuChevronDown size={16} />}
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => goToOrder(o?.id)}
                                                            aria-label="Ko'rish"
                                                            title="Ko'rish"
                                                            className={iconBtn}
                                                        >
                                                            <LuEye size={16} />
                                                        </button>
                                                        <button type="button" onClick={() => navigate(`${ordersPath}/${o.id}/edit`)}
                                                            disabled={!editable}
                                                            aria-label="Tahrirlash"
                                                            title={editable ? 'Tahrirlash' : "Faqat “Yaratilgan” holatidagi buyurtma tahrirlanadi"}
                                                            className={`${iconBtn} disabled:cursor-not-allowed disabled:opacity-30`}>
                                                            <LuPencil size={16} />
                                                        </button>
                                                        <DeleteOrder order={o} disabled={!editable} />
                                                    </div>
                                                </td>
                                            </tr>
                                            {canExpand && isExpanded && (
                                                <OrderUnderPanel order={o} isDark={isDark} />
                                            )}
                                        </Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {totalPages > 1 && (
                    <div className={`flex items-center justify-between gap-3 border-t px-5 py-3.5 ${line}`}>
                        <p className={`text-xs ${muted}`}>
                            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalElements)} / {totalElements}
                        </p>
                        <div className="flex items-center gap-1.5">
                            <button type="button" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}
                                className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors disabled:opacity-40 ${isDark ? 'border-[#334155] hover:bg-[#334155]' : 'border-[#e2e8f0] hover:bg-[#f1f5f9]'}`}>
                                <LuChevronLeft size={14} />
                            </button>
                            <span className={`px-3 text-sm font-semibold ${head}`}>{page + 1} / {totalPages}</span>
                            <button type="button" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}
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