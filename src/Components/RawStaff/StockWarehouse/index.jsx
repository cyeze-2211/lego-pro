import { useEffect, useMemo, useRef, useState } from 'react';
import {
    LuSearch, LuWarehouse, LuPackage, LuX, LuFlame,
    LuFilter, LuLayers, LuRotateCcw, LuChevronDown, LuChevronUp,
    LuCircleX, LuCircleCheck, LuBoxes,
    LuArrowUp, LuArrowDown, LuArrowUpDown, LuStickyNote,
} from 'react-icons/lu';
import { useAppTheme } from '../../../theme/tokens';
import { useGetRawMaterialStocksQuery } from '../../../store/services/rawMaterialStock.api';
import { useGetWarehousesQuery } from '../../../store/services/warehouse.api';

const PAGE_SIZE = 20;
const UNIT = 'KG';
const MAX_WORDS = 5;

/* ── Truncate text to N words with "..." ── */
function truncateWords(text, maxWords = MAX_WORDS) {
    if (!text) return '';
    const words = String(text).trim().split(/\s+/);
    if (words.length <= maxWords) return text;
    return words.slice(0, maxWords).join(' ') + '...';
}

export default function RawStaffStockWarehouse() {
    const { isDark } = useAppTheme();
    const [page, setPage]                       = useState(0);
    const [allStocks, setAllStocks]             = useState([]);
    const [hasMore, setHasMore]                 = useState(true);
    const [warehouseFilter, setWarehouseFilter] = useState('');
    const [search, setSearch]                   = useState('');
    const [onlyZero, setOnlyZero]               = useState(false);
    const [onlyWithStock, setOnlyWithStock]     = useState(false);
    const [filtersOpen, setFiltersOpen]         = useState(true);
    const [sortKey, setSortKey]                 = useState('rawMaterialName');
    const [sortDir, setSortDir]                 = useState('asc');

    const isFetchingNextRef = useRef(false);
    const loadMoreRef       = useRef(null);
    const isFirstRender     = useRef(true);

    const { data: warehouses = [] } = useGetWarehousesQuery('RAW_MATERIAL');
    const { data, isFetching }      = useGetRawMaterialStocksQuery({
        warehouseId: warehouseFilter || undefined,
        unit: UNIT,
        page,
        size: PAGE_SIZE,
    });

    const pagination = data?.pagination ?? {};

    /* ── Reset accumulated при смене склада ── */
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        setAllStocks([]);
        setPage(0);
        setHasMore(true);
        isFetchingNextRef.current = false;
    }, [warehouseFilter]);

    /* ── Накопление страниц ── */
    useEffect(() => {
        if (!data?.items) return;

        if (page === 0) {
            setAllStocks(data.items);
        } else {
            setAllStocks((prev) => {
                const seen = new Set(prev.map((s) => `${s.rawMaterialId}-${s.warehouseId}`));
                const fresh = data.items.filter((s) => !seen.has(`${s.rawMaterialId}-${s.warehouseId}`));
                return fresh.length ? [...prev, ...fresh] : prev;
            });
        }

        const totalPages = pagination?.totalPages ?? 0;
        if (totalPages > 0) {
            setHasMore(page < totalPages - 1);
        } else {
            setHasMore(data.items.length === PAGE_SIZE);
        }
        isFetchingNextRef.current = false;
    }, [data, page, pagination]);

    /* ── Infinite scroll ── */
    useEffect(() => {
        const node = loadMoreRef.current;
        if (!node) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (
                    entry.isIntersecting &&
                    hasMore &&
                    !isFetching &&
                    !isFetchingNextRef.current
                ) {
                    isFetchingNextRef.current = true;
                    setPage((p) => p + 1);
                }
            },
            { root: null, rootMargin: '400px 0px', threshold: 0 }
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, [hasMore, isFetching, allStocks.length]);

    /* ── Фильтрация ── */
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return allStocks.filter((s) => {
            if (q) {
                const haystack = [s.rawMaterialName, s.rawMaterialSummary]
                    .filter(Boolean)
                    .map((v) => String(v).toLowerCase());
                if (!haystack.some((v) => v.includes(q))) return false;
            }
            const qty = Number(s.quantity) || 0;
            if (onlyZero && qty !== 0) return false;
            if (onlyWithStock && qty <= 0) return false;
            return true;
        });
    }, [allStocks, search, onlyZero, onlyWithStock]);

    /* ── Сортировка ── */
    const sorted = useMemo(() => {
        const arr = [...filtered];
        const dir = sortDir === 'asc' ? 1 : -1;

        const getValue = (item) => {
            switch (sortKey) {
                case 'rawMaterialName':
                    return (item.rawMaterialName || '').toLowerCase();
                case 'rawMaterialSummary':
                    return (item.rawMaterialSummary || '').toLowerCase();
                case 'lastModifiedAt':
                    return item.lastModifiedAt ? new Date(item.lastModifiedAt).getTime() : 0;
                case 'quantity':
                    return Number(item.quantity) || 0;
                default:
                    return '';
            }
        };

        arr.sort((a, b) => {
            const va = getValue(a);
            const vb = getValue(b);
            if (typeof va === 'number' && typeof vb === 'number') {
                return (va - vb) * dir;
            }
            return String(va).localeCompare(String(vb), 'uz') * dir;
        });

        return arr;
    }, [filtered, sortKey, sortDir]);

    /* ── Stats ── */
    const stats = useMemo(() => {
        let zero = 0;
        let withStock = 0;
        allStocks.forEach((s) => {
            const qty = Number(s.quantity) || 0;
            if (qty === 0) zero += 1;
            else withStock += 1;
        });
        return { zero, withStock };
    }, [allStocks]);

    const hasFilter = Boolean(search || onlyZero || onlyWithStock || warehouseFilter);

    const resetFilters = () => {
        setSearch('');
        setOnlyZero(false);
        setOnlyWithStock(false);
        setWarehouseFilter('');
    };

    const activeCount =
        (warehouseFilter ? 1 : 0) +
        (search ? 1 : 0) +
        (onlyZero ? 1 : 0) +
        (onlyWithStock ? 1 : 0);

    /* ── Сортировка click ── */
    const handleSort = (key) => {
        if (sortKey === key) {
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    };

    /* ── tokens ── */
    const panel   = isDark ? 'border-white/10 bg-[#141C2B]' : 'border-[#e2e8f0] bg-white';
    const muted   = isDark ? 'text-[#94a3b8]' : 'text-[#64748b]';
    const head    = isDark ? 'text-white' : 'text-[#0f172a]';
    const divider = isDark ? 'divide-[#334155]/50' : 'divide-[#f1f5f9]';
    const line    = isDark ? 'border-[#334155]/60' : 'border-[#f1f5f9]';
    const rowHov  = isDark ? 'hover:bg-[#1e293b]/60' : 'hover:bg-amber-50/50';
    const cellBorder = `border-r last:border-r-0 ${line}`;

    const inputCx = [
        'w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all duration-200 h-[42px]',
        isDark
            ? 'border-white/10 bg-[#1e293b]/80 text-white placeholder:text-slate-500 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20'
            : 'border-[#e2e8f0] bg-white text-[#0f172a] placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20',
    ].join(' ');
    const toggleCx = (active) =>
        [
            'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all cursor-pointer',
            active
                ? isDark
                    ? 'border-amber-400/40 bg-amber-400/15 text-amber-200'
                    : 'border-amber-400 bg-amber-50 text-amber-700'
                : isDark
                ? 'border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-slate-200'
                : 'border-[#e2e8f0] bg-white text-[#64748b] hover:border-amber-300 hover:text-amber-600',
        ].join(' ');

    /* ── SortableHeader ── */
    const SortableHeader = ({ label, sortField, className = '', align = 'left' }) => {
        const isActive = sortKey === sortField;
        const Icon = isActive
            ? sortDir === 'asc'
                ? LuArrowUp
                : LuArrowDown
            : LuArrowUpDown;

        return (
            <th className={`px-5 py-3 border-b ${className}`}>
                <button
                    type="button"
                    onClick={() => handleSort(sortField)}
                    className={`group inline-flex items-center gap-1.5 font-semibold uppercase tracking-wide text-xs transition-colors ${
                        align === 'right' ? 'justify-end w-full' : align === 'center' ? 'justify-center w-full' : ''
                    } ${
                        isActive
                            ? (isDark ? 'text-amber-300' : 'text-amber-600')
                            : muted
                    } ${
                        isDark ? 'hover:text-amber-300' : 'hover:text-amber-600'
                    }`}
                    aria-label={`Sort by ${label}`}
                >
                    <span>{label}</span>
                    <Icon
                        size={12}
                        className={`transition-transform ${
                            isActive ? '' : 'opacity-40 group-hover:opacity-100'
                        }`}
                    />
                </button>
            </th>
        );
    };

    return (
        <div className="flex w-full flex-col gap-4 py-2">

            {/* ═══ Header ═══ */}
            <div className={`relative overflow-hidden rounded-2xl border px-5 py-4 shadow-md ${panel}`}>
                <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-amber-400/6 to-transparent" />
                <div className="relative flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-400/10 text-amber-500">
                            <LuFlame size={20} />
                        </span>
                        <div>
                            <h1 className={`text-xl font-bold tracking-tight ${head}`}>Xom ashyo qoldiqlari</h1>
                            <p className={`text-xs mt-0.5 ${muted}`}>
                                Omborlardagi xom ashyo qoldiqlarini kuzatish (kg)
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold ${isDark ? 'border-white/10 bg-white/[0.03] text-slate-300' : 'border-[#e2e8f0] bg-white text-[#475569]'}`}>
                            <LuBoxes size={13} />
                            {pagination.totalElements ?? allStocks.length} qator
                        </span>
                        {stats.withStock > 0 && (
                            <span className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold ${isDark ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200' : 'border-emerald-400/50 bg-emerald-50 text-emerald-700'}`}>
                                <LuCircleCheck size={13} />
                                {stats.withStock} mavjud
                            </span>
                        )}
                        {stats.zero > 0 && (
                            <span className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold ${isDark ? 'border-rose-400/30 bg-rose-500/10 text-rose-200' : 'border-rose-400/50 bg-rose-50 text-rose-700'}`}>
                                <LuCircleX size={13} />
                                {stats.zero} tugagan
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* ═══ Accordion Filters ═══ */}
            <div className={`rounded-2xl border shadow-md overflow-hidden ${panel}`}>
                <button
                    type="button"
                    onClick={() => setFiltersOpen((v) => !v)}
                    aria-expanded={filtersOpen}
                    className={`flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors ${
                        filtersOpen ? `border-b ${line}` : ''
                    } ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50/50'}`}
                >
                    <div className="flex items-center gap-2.5">
                        <span className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
                            hasFilter
                                ? 'bg-amber-400/15 text-amber-500'
                                : isDark ? 'bg-white/[0.04] text-slate-400' : 'bg-slate-100 text-slate-500'
                        }`}>
                            <LuFilter size={14} />
                        </span>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className={`text-sm font-bold ${head}`}>Filterlar</span>
                                {activeCount > 0 && (
                                    <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-400 px-1.5 text-[10px] font-bold text-[#0f172a]">
                                        {activeCount}
                                    </span>
                                )}
                            </div>
                            <p className={`text-xs mt-0.5 ${muted}`}>
                                {hasFilter
                                    ? `${activeCount} ta faol filtr qo‘llanmoqda`
                                    : 'Ombor va qidiruv bo‘yicha filtrlang'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {hasFilter && filtersOpen && (
                            <span
                                role="button"
                                tabIndex={0}
                                onClick={(e) => { e.stopPropagation(); resetFilters(); }}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); resetFilters(); } }}
                                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                                    isDark
                                        ? 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-amber-400/30 hover:text-amber-400'
                                        : 'border-[#e2e8f0] bg-white text-[#475569] hover:border-amber-400 hover:text-amber-600'
                                }`}
                            >
                                <LuRotateCcw size={12} />
                                <span>Tozalash</span>
                            </span>
                        )}
                        <span className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
                            isDark ? 'bg-white/[0.04] text-slate-300' : 'bg-slate-100 text-slate-600'
                        }`}>
                            {filtersOpen ? <LuChevronUp size={15} /> : <LuChevronDown size={15} />}
                        </span>
                    </div>
                </button>

                <div className={`grid transition-all duration-300 ease-in-out ${
                    filtersOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}>
                    <div className="overflow-hidden">
                        <div className="p-5">
                            {/* Ombor + Qidiruv — рядом */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[220px_1fr]">
                                <div>
                                    <label className={`mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide ${muted}`}>
                                        <LuWarehouse size={11} /> Ombor
                                    </label>
                                    <select
                                        value={warehouseFilter}
                                        onChange={(e) => setWarehouseFilter(e.target.value)}
                                        className={inputCx}
                                    >
                                        <option value="">Barcha omborlar</option>
                                        {warehouses.map((w) => (
                                            <option key={w.id} value={w.id}>{w.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className={`mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide ${muted}`}>
                                        <LuSearch size={11} /> Qidiruv
                                    </label>
                                    <div className="relative">
                                        <LuSearch className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 ${muted}`} />
                                        <input
                                            type="text"
                                            placeholder="Xom ashyo nomi yoki izohi..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className={`${inputCx} pl-10 pr-10`}
                                        />
                                        {search && (
                                            <button
                                                type="button"
                                                onClick={() => setSearch('')}
                                                className={`absolute right-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
                                                    isDark ? 'text-slate-400 hover:bg-white/[0.06] hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                                                }`}
                                                aria-label="Qidiruvni tozalash"
                                            >
                                                <LuX size={13} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4">
                                <label className={`mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide ${muted}`}>
                                    <LuLayers size={11} /> Qoldiq holati
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    <button type="button" onClick={() => setOnlyWithStock((v) => !v)} className={toggleCx(onlyWithStock)}>
                                        <LuCircleCheck size={13} />
                                        <span>Faqat mavjud</span>
                                    </button>
                                    <button type="button" onClick={() => setOnlyZero((v) => !v)} className={toggleCx(onlyZero)}>
                                        <LuCircleX size={13} />
                                        <span>Faqat tugagan</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setOnlyZero(false); setOnlyWithStock(false); }}
                                        className={toggleCx(!onlyZero && !onlyWithStock)}
                                    >
                                        <LuLayers size={13} />
                                        <span>Barcha holatlar</span>
                                    </button>
                                </div>
                            </div>

                            {hasFilter && (
                                <div className={`mt-4 flex flex-wrap items-center gap-2 border-t pt-3 ${line}`}>
                                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${muted}`}>
                                        Faol:
                                    </span>

                                    {warehouseFilter && (
                                        <FilterChip
                                            label={`Ombor: ${warehouses.find((w) => w.id === warehouseFilter)?.name ?? ''}`}
                                            onRemove={() => setWarehouseFilter('')}
                                            isDark={isDark}
                                        />
                                    )}
                                    {search && (
                                        <FilterChip label={`"${search}"`} onRemove={() => setSearch('')} isDark={isDark} />
                                    )}
                                    {onlyWithStock && (
                                        <FilterChip label="Mavjud" onRemove={() => setOnlyWithStock(false)} isDark={isDark} />
                                    )}
                                    {onlyZero && (
                                        <FilterChip label="Tugagan" onRemove={() => setOnlyZero(false)} isDark={isDark} />
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══ Table ═══ */}
            <div className={`rounded-2xl border shadow-md overflow-hidden ${panel}`}>
                <div className={`flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3.5 ${line}`}>
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400/10 text-amber-500">
                            <LuFlame size={15} />
                        </span>
                        <div>
                            <p className={`text-sm font-bold ${head}`}>Qoldiqlar ro‘yxati</p>
                            <p className={`text-xs ${muted}`}>
                                {sorted.length !== allStocks.length
                                    ? `${sorted.length} / ${allStocks.length} ta (yuklangan)`
                                    : `${allStocks.length} ta ko‘rsatilmoqda`}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`hidden sm:inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold ${
                            isDark
                                ? 'border-amber-400/20 bg-amber-400/5 text-amber-200'
                                : 'border-amber-300 bg-amber-50 text-amber-700'
                        }`}>
                            {sortDir === 'asc' ? <LuArrowUp size={11} /> : <LuArrowDown size={11} />}
                            <span>
                                {{
                                    rawMaterialName:    'Nomi',
                                    rawMaterialSummary: 'Izoh',
                                    lastModifiedAt:     'Sana',
                                    quantity:           'Qoldiq',
                                }[sortKey] ?? ''}
                                {' '}
                                {sortDir === 'asc' ? '↑' : '↓'}
                            </span>
                        </span>
                        {isFetching && allStocks.length > 0 && (
                            <svg className="h-4 w-4 animate-spin text-amber-400" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                            </svg>
                        )}
                    </div>
                </div>

                {isFetching && allStocks.length === 0 ? (
                    <div className={`flex flex-col items-center gap-3 py-20 ${muted}`}>
                        <svg className="h-7 w-7 animate-spin text-amber-400" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                        </svg>
                        <span className="text-sm">Yuklanmoqda...</span>
                    </div>
                ) : sorted.length === 0 ? (
                    <div className={`flex flex-col items-center gap-2.5 py-20 ${muted}`}>
                        <LuPackage size={36} strokeWidth={1.5} />
                        <p className="text-sm font-semibold">Ma&apos;lumot topilmadi</p>
                        {hasFilter && (
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="mt-1 text-xs font-semibold text-amber-500 hover:text-amber-600 underline"
                            >
                                Filterlarni tozalash
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Desktop */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm border-collapse" style={{ minWidth: 1000 }}>
                                <thead>
                                    <tr className={isDark ? 'bg-[#0f172a]/40' : 'bg-[#f8fafc]/90'}>
                                        <th className={`px-5 py-3 w-14 text-center text-xs font-semibold uppercase tracking-wide ${muted} border-b ${cellBorder}`}>#</th>
                                        <SortableHeader label="Xom ashyo" sortField="rawMaterialName"    className={`min-w-[220px] ${cellBorder}`} />
                                        <SortableHeader label="Izoh"      sortField="rawMaterialSummary" className={`min-w-[260px] ${cellBorder}`} />
                                        <SortableHeader label="Oxirgi yangilanish" sortField="lastModifiedAt" className={`w-[190px] ${cellBorder}`} />
                                        <SortableHeader label="Qoldiq (kg)"    sortField="quantity" className="text-right w-[170px]" align="right" />
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${divider}`}>
                                    {sorted.map((s, idx) => {
                                        const qty = Number(s.quantity) || 0;
                                        const isZero = qty === 0;
                                        const rowBg = isZero
                                            ? (isDark ? 'bg-rose-500/[0.04]' : 'bg-rose-50/40')
                                            : '';
                                        const summaryTruncated = truncateWords(s.rawMaterialSummary, MAX_WORDS);
                                        const isTruncated = s.rawMaterialSummary && String(s.rawMaterialSummary).trim().split(/\s+/).length > MAX_WORDS;

                                        return (
                                            <tr
                                                key={`${s.rawMaterialId}-${s.warehouseId}`}
                                                className={`transition-colors ${rowHov} ${rowBg}`}
                                            >
                                                <td className={`px-5 py-3.5 text-xs text-center ${muted} ${cellBorder}`}>
                                                    {idx + 1}
                                                </td>

                                                <td className={`px-5 py-3.5 ${cellBorder}`}>
                                                    <div className="flex items-start gap-3">
                                                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                                                            isZero
                                                                ? 'bg-rose-500/10 text-rose-500'
                                                                : isDark ? 'bg-amber-400/10 text-amber-300' : 'bg-amber-50 text-amber-600'
                                                        }`}>
                                                            <LuFlame size={16} />
                                                        </span>
                                                        <div className="min-w-0">
                                                            <p className={`truncate font-semibold text-sm ${head}`}>
                                                                {s.rawMaterialName}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className={`px-5 py-3.5 text-xs ${muted} ${cellBorder}`}>
                                                    {s.rawMaterialSummary ? (
                                                        <span
                                                            className="inline-flex items-start gap-1.5"
                                                            title={isTruncated ? s.rawMaterialSummary : undefined}
                                                        >
                                                            <LuStickyNote size={12} className="mt-0.5 shrink-0" />
                                                            <span>{summaryTruncated}</span>
                                                        </span>
                                                    ) : (
                                                        <span className="italic">—</span>
                                                    )}
                                                </td>

                                                <td className={`px-5 py-3.5 text-xs whitespace-nowrap ${muted} ${cellBorder}`}>
                                                    {s.lastModifiedAt
                                                        ? new Date(s.lastModifiedAt).toLocaleString('uz-UZ', {
                                                              day: '2-digit',
                                                              month: '2-digit',
                                                              year: 'numeric',
                                                              hour: '2-digit',
                                                              minute: '2-digit',
                                                          })
                                                        : '—'}
                                                </td>

                                                <td className="px-5 py-3.5 text-right">
                                                    <QtyBadge qty={qty} isDark={isDark} />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile */}
                        <div className={`flex flex-col divide-y md:hidden ${divider}`}>
                            <div className="flex items-center gap-2 overflow-x-auto px-4 py-2.5">
                                <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-wider ${muted}`}>
                                    Sort:
                                </span>
                                {[
                                    { key: 'rawMaterialName', label: 'Nomi' },
                                    { key: 'quantity',        label: 'Qoldiq' },
                                ].map(({ key, label }) => {
                                    const isActive = sortKey === key;
                                    const Icon = isActive
                                        ? sortDir === 'asc' ? LuArrowUp : LuArrowDown
                                        : LuArrowUpDown;
                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => handleSort(key)}
                                            className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all ${
                                                isActive
                                                    ? (isDark
                                                        ? 'border-amber-400/40 bg-amber-400/15 text-amber-200'
                                                        : 'border-amber-400 bg-amber-50 text-amber-700')
                                                    : (isDark
                                                        ? 'border-white/10 bg-white/[0.03] text-slate-400'
                                                        : 'border-[#e2e8f0] bg-white text-[#64748b]')
                                            }`}
                                        >
                                            {label}
                                            <Icon size={10} />
                                        </button>
                                    );
                                })}
                            </div>

                            {sorted.map((s) => {
                                const qty = Number(s.quantity) || 0;
                                const isZero = qty === 0;
                                const summaryTruncated = truncateWords(s.rawMaterialSummary, MAX_WORDS);
                                const isTruncated = s.rawMaterialSummary && String(s.rawMaterialSummary).trim().split(/\s+/).length > MAX_WORDS;

                                return (
                                    <div
                                        key={`${s.rawMaterialId}-${s.warehouseId}`}
                                        className={`flex items-start justify-between gap-3 px-4 py-3.5 transition-colors ${rowHov}`}
                                    >
                                        <div className="flex items-start gap-3 min-w-0 flex-1">
                                            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                                                isZero
                                                    ? 'bg-rose-500/10 text-rose-500'
                                                    : isDark ? 'bg-amber-400/10 text-amber-300' : 'bg-amber-50 text-amber-600'
                                            }`}>
                                                <LuFlame size={16} />
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className={`font-semibold text-sm ${head} line-clamp-2`}>{s.rawMaterialName}</p>
                                                {s.rawMaterialSummary && (
                                                    <p
                                                        className={`text-xs mt-0.5 ${muted}`}
                                                        title={isTruncated ? s.rawMaterialSummary : undefined}
                                                    >
                                                        {summaryTruncated}
                                                    </p>
                                                )}
                                                {s.lastModifiedAt && (
                                                    <p className={`text-[10px] mt-1 ${muted}`}>
                                                        {new Date(s.lastModifiedAt).toLocaleString('uz-UZ')}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <QtyBadge qty={qty} isDark={isDark} />
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* ═══ Infinite scroll sentinel ═══ */}
                {hasMore ? (
                    <div
                        ref={loadMoreRef}
                        className={`flex items-center justify-center gap-3 border-t px-5 py-6 ${line} ${isDark ? 'bg-white/[0.01]' : 'bg-[#FCFDFE]'}`}
                        style={{ minHeight: 64 }}
                    >
                        {isFetching ? (
                            <>
                                <svg className="h-4 w-4 animate-spin text-amber-400" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                                </svg>
                                <span className={`text-sm font-medium ${muted}`}>Yuklanmoqda...</span>
                            </>
                        ) : (
                            <span className={`text-xs font-medium ${muted} opacity-70`}>
                                ↓ Yana yuklash uchun pastga suring
                            </span>
                        )}
                    </div>
                ) : (
                    allStocks.length > 0 && (
                        <div className={`flex items-center justify-center gap-2 border-t px-5 py-5 ${line} ${isDark ? 'bg-white/[0.01]' : 'bg-[#FCFDFE]'}`}>
                            <LuCircleCheck size={16} className={isDark ? 'text-emerald-300' : 'text-emerald-600'} />
                            <span className={`text-sm font-medium ${muted}`}>
                                Barcha {allStocks.length} ta qoldiq yuklandi
                            </span>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}

/* ── Filter chip ── */
function FilterChip({ label, onRemove, isDark }) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                isDark
                    ? 'border-amber-400/30 bg-amber-400/10 text-amber-200'
                    : 'border-amber-300 bg-amber-50 text-amber-700'
            }`}
        >
            <span className="max-w-[200px] truncate">{label}</span>
            <button
                type="button"
                onClick={onRemove}
                aria-label="Filterni olib tashlash"
                className={`flex h-4 w-4 items-center justify-center rounded-full transition-colors ${
                    isDark ? 'hover:bg-amber-400/20' : 'hover:bg-amber-200'
                }`}
            >
                <LuX size={10} />
            </button>
        </span>
    );
}

/* ── Qty badge: har doim kg ── */
function QtyBadge({ qty, isDark }) {
    const isZero = qty === 0;

    const cls = isZero
        ? (isDark
            ? 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/40'
            : 'bg-rose-500/10 text-rose-600 ring-1 ring-rose-400/50')
        : (isDark
            ? 'bg-emerald-500/15 text-emerald-300'
            : 'bg-emerald-500/10 text-emerald-600');

    const formatted = typeof qty === 'number'
        ? qty.toLocaleString('uz-UZ', { maximumFractionDigits: 3 })
        : qty;

    return (
        <div className="inline-flex flex-col items-end gap-0.5">
            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold whitespace-nowrap ${cls}`}>
                {isZero && <LuCircleX size={12} />}
                {formatted} <span className="text-xs opacity-80">kg</span>
            </span>
        </div>
    );
}