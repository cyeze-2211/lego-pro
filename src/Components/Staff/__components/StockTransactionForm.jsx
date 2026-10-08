import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
    LuPlus, LuSearch, LuTrash2, LuPackage, LuSend, LuCheck,
    LuX, LuBarcode, LuCircleAlert, LuCircleCheck, LuWarehouse, LuMinus,
    LuChevronDown, LuSlidersHorizontal, LuRotateCcw, LuBoxes,
    LuArrowDownWideNarrow,
} from 'react-icons/lu';
import { useAppTheme } from '../../../theme/tokens';
import { useGetWarehousesQuery } from '../../../store/services/warehouse.api';
import { useGetProductStocksQuery } from '../../../store/services/productStock.api';
import { useCreateStockTransactionMutation } from '../../../store/services/productStock.api';
import { useGetBrandsQuery } from '../../../store/services/brand.api';
import { formatNumber } from '../../ui/number-format';

const STOCK_PAGE_SIZE = 20;

const SORTS = [
    { key: 'qtyDesc', label: 'Ko\'pdan kamga', sort: ['quantity,DESC', 'id,DESC'] },
    { key: 'qtyAsc',  label: 'Kamdan ko\'pga', sort: ['quantity,ASC', 'id,ASC'] },
];

const EMPTY_FILTERS = {
    name: '',
    productSize: '',
    brandId: '',
    sortKey: 'qtyDesc',
};

function useDebouncedValue(value, delay = 350) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
}

export default function StockTransactionForm({ action }) {
    const { isDark } = useAppTheme();
    const isIn = action === 'IN';

    const [warehouseId, setWarehouseId] = useState('');
    const [open, setOpen]               = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [filters, setFilters]         = useState(EMPTY_FILTERS);
    const [page, setPage]               = useState(0);
    const [allStocks, setAllStocks]     = useState([]);
    const [hasMore, setHasMore]         = useState(true);
    const [items, setItems]             = useState([]);
    const [toast, setToast]             = useState(null);

    const searchRef         = useRef(null);
    const searchInputRef    = useRef(null);
    const loadMoreRef       = useRef(null);
    const isFetchingNextRef = useRef(false);

    const debouncedFilters = useDebouncedValue(filters, 350);

    const { data: warehouses = [] } = useGetWarehousesQuery('PRODUCT');
    const { data: brandsData } = useGetBrandsQuery(
        { page: 0, size: 200 },
        { skip: !open }
    );
    const brands = brandsData?.items ?? [];

    const df = debouncedFilters;
    const term = df.name.trim();
    const isBarcodeTerm = /^\d{8,}$/.test(term);
    const sortParam = SORTS.find((x) => x.key === df.sortKey)?.sort;

    const stockSearchFilters = {
        warehouseId,
        productSize: df.productSize.trim() || undefined,
        brandId: df.brandId || undefined,
        page,
        size: STOCK_PAGE_SIZE,
        sort: sortParam,
    };
    const nameStocksQuery = useGetProductStocksQuery(
        {
            ...stockSearchFilters,
            name: term && !isBarcodeTerm ? term : undefined,
            barcode: isBarcodeTerm ? term : undefined,
        },
        { skip: !warehouseId || !open }
    );
    const articleStocksQuery = useGetProductStocksQuery(
        { ...stockSearchFilters, article: term },
        { skip: !warehouseId || !open || !term || isBarcodeTerm }
    );
    const stocksResp = useMemo(() => {
        const nameResponse = nameStocksQuery.currentData;
        const articleResponse = articleStocksQuery.currentData;
        if (!nameResponse && !articleResponse) return undefined;

        const rows = [
            ...(nameResponse?.items ?? []),
            ...(articleResponse?.items ?? []),
        ];
        const uniqueItems = [...new Map(
            rows.map((stock) => [`${stock.productId}-${stock.warehouseId}`, stock]),
        ).values()];
        const pages = [
            nameResponse?.pagination?.totalPages,
            articleResponse?.pagination?.totalPages,
        ].filter(Number.isFinite);

        return {
            items: uniqueItems,
            pagination: {
                ...(nameResponse?.pagination ?? articleResponse?.pagination ?? {}),
                totalPages: pages.length ? Math.max(...pages) : 0,
            },
        };
    }, [nameStocksQuery.currentData, articleStocksQuery.currentData]);
    const isFetching = nameStocksQuery.isFetching || articleStocksQuery.isFetching;
    const stocksError = nameStocksQuery.isError || articleStocksQuery.isError;
    const stocksErrorData = nameStocksQuery.error ?? articleStocksQuery.error;
    const refetchStocks = () => {
        nameStocksQuery.refetch();
        if (term && !isBarcodeTerm) articleStocksQuery.refetch();
    };

    const [createTx, { isLoading: isSending }] = useCreateStockTransactionMutation();

    const pagination = stocksResp?.pagination ?? null;

    /* ── Reset при смене фильтров/склада ── */
    useEffect(() => {
        setAllStocks([]);
        setPage(0);
        setHasMore(true);
        isFetchingNextRef.current = false;
    }, [
        warehouseId,
        debouncedFilters.name,
        debouncedFilters.productSize,
        debouncedFilters.brandId,
        debouncedFilters.sortKey,
    ]);

    /* ── Накопление страниц ── */
    useEffect(() => {
        if (!stocksResp?.items) return;

        if (page === 0) {
            setAllStocks(stocksResp.items);
        } else {
            setAllStocks((prev) => {
                const seen = new Set(prev.map((s) => `${s.productId}-${s.warehouseId}`));
                const fresh = stocksResp.items.filter(
                    (s) => !seen.has(`${s.productId}-${s.warehouseId}`)
                );
                return fresh.length ? [...prev, ...fresh] : prev;
            });
        }

        const totalPages = pagination?.totalPages ?? 0;
        if (totalPages > 0) {
            setHasMore(page < totalPages - 1);
        } else {
            setHasMore(stocksResp.items.length === STOCK_PAGE_SIZE);
        }
        isFetchingNextRef.current = false;
    }, [stocksResp, page, pagination]);

    /* ── Infinite scroll в dropdown ── */
    useEffect(() => {
        if (!open) return;
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
            { root: null, rootMargin: '150px 0px', threshold: 0 }
        );
        observer.observe(node);
        return () => observer.disconnect();
    }, [open, hasMore, isFetching, allStocks.length]);

    /* ── Focus при открытии ── */
    useEffect(() => {
        if (open && searchInputRef.current) searchInputRef.current.focus();
    }, [open]);

    /* ── Outside click ── */
    useEffect(() => {
        const handler = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    /* ── theme ── */
    const panel   = isDark ? 'border-white/10 bg-[#141C2B]' : 'border-[#e2e8f0] bg-white';
    const muted   = isDark ? 'text-[#94a3b8]' : 'text-[#64748b]';
    const head    = isDark ? 'text-white' : 'text-[#0f172a]';
    const divider = isDark ? 'divide-[#334155]/50' : 'divide-[#f1f5f9]';
    const line    = isDark ? 'border-[#334155]/60' : 'border-[#f1f5f9]';
    const rowBg   = isDark ? 'hover:bg-[#1e293b]/60' : 'hover:bg-amber-50/50';
    const badge   = isIn
        ? 'bg-[#FACC15]/10 text-[#EAB308] border-[#FACC15]/30'
        : 'bg-[#f43f5e]/10 text-[#f43f5e] border-[#f43f5e]/20';
    const submitBtn = isIn
        ? 'bg-[#FACC15] hover:bg-[#EAB308] text-[#0F172A] shadow-[#FACC15]/30'
        : 'bg-[#f43f5e] hover:bg-[#e11d48] text-white shadow-[#f43f5e]/20';
    const fieldCx = isDark
        ? 'border-[#334155] bg-[#1e293b]/80 text-white placeholder:text-[#64748b] focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20'
        : 'border-[#e2e8f0] bg-white text-[#0f172a] placeholder:text-[#94a3b8] focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20';
    const inputCx = ['w-full rounded-xl border px-4 text-sm outline-none transition-all duration-200 h-12', fieldCx].join(' ');
    const stepCx = 'flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-[#0f172a]';

    const stockTone = (qty, isLow) => {
        if (qty <= 0) return isDark ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-red-50 text-red-600 border-red-200';
        if (isLow)   return isDark ? 'bg-amber-400/10 text-amber-400 border-amber-400/30' : 'bg-amber-50 text-amber-700 border-amber-200';
        return isDark ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-green-50 text-green-700 border-green-200';
    };

    /* ── helpers ── */
    const showToast = (type, msg) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3500);
    };

    const addProduct = useCallback((stock) => {
        setItems((prev) => {
            if (prev.find((i) => i.productId === stock.productId)) return prev;
            return [...prev, {
                productId:       stock.productId,
                productName:     stock.productName,
                productBarcode:  stock.productBarcode,
                piecesPerPack:   stock.productPiecesPerPack ?? null,
                quantity:        1,
                unit:            'PACK',
            }];
        });
    }, []);

    const removeItem = (id) => setItems((p) => p.filter((i) => i.productId !== id));

    const updateQty = (id, val) => {
        const qty = parseInt(val, 10);
        if (isNaN(qty) || qty < 1) return;
        setItems((p) => p.map((i) => i.productId === id ? { ...i, quantity: qty } : i));
    };

    const stepQty = (id, delta) => {
        setItems((p) => p.map((i) =>
            i.productId === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i
        ));
    };

    const updateUnit = (id, unit) => {
        setItems((p) => p.map((i) => i.productId === id ? { ...i, unit } : i));
    };

    const handleWarehouseChange = (value) => {
        setWarehouseId(value);
        setFilters(EMPTY_FILTERS);
        setItems([]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!warehouseId || items.length === 0) return;
        try {
            await createTx({
                warehouseId,
                action,
                items: items.map(({ productId, quantity, unit }) => ({
                    productId,
                    quantity: parseInt(quantity, 10),
                    unit,
                })),
            }).unwrap();
            showToast('success', `${isIn ? 'Kirim' : 'Chiqim'} muvaffaqiyatli amalga oshirildi!`);
            setItems([]);
        } catch (err) {
            showToast('error', err?.data?.message || `${isIn ? 'Kirim' : 'Chiqim'} amalga oshmadi.`);
        }
    };

    const totalQty = items.reduce((s, i) => s + i.quantity, 0);
    const formId = `stock-tx-${action}`;
    const hasFilters = Boolean(
        filters.name.trim() || filters.productSize.trim() || filters.brandId ||
        filters.sortKey !== 'qtyDesc'
    );
    const visibleStocks = allStocks;

    const resetFilters = () => setFilters(EMPTY_FILTERS);
    const patchFilters = (patch) => setFilters((current) => ({ ...current, ...patch }));

    const spinner = (
        <svg className="h-4 w-4 animate-spin text-amber-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
    );

    return (
        <div className="flex w-full flex-col gap-4 py-2">

            {/* ── Header ── */}
            <div className={`relative overflow-hidden rounded-2xl border px-5 py-4 shadow-md ${panel}`}>
                <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-amber-400/6 to-transparent" />
                <div className="relative flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${badge}`}>
                            <LuPackage size={20} />
                        </span>
                        <div>
                            <h1 className={`text-xl font-bold tracking-tight leading-tight ${head}`}>
                                {isIn ? 'Mahsulot Kirimi' : 'Mahsulot Chiqimi'}
                            </h1>
                            <p className={`text-sm mt-0.5 ${muted}`}>
                                {isIn ? 'Omborga qabul qilingan mahsulotlarni kiriting' : 'Ombordan chiqarilgan mahsulotlarni kiriting'}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {items.length > 0 && (
                            <span className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-bold ${badge}`}>
                                <LuPackage size={14} /> {items.length} ta · {totalQty} {items.some(i => i.unit === 'PACK') ? 'pachka' : 'dona'}
                            </span>
                        )}
                        <button type="submit" form={formId}
                            disabled={isSending || items.length === 0 || !warehouseId}
                            className={`flex h-12 items-center gap-2 rounded-xl px-7 text-sm font-bold shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl hover:-translate-y-px ${submitBtn}`}>
                            {isSending ? (
                                <>{spinner} Saqlanmoqda...</>
                            ) : (
                                <><LuSend size={15} />{isIn ? 'Kirimni tasdiqlash' : 'Chiqimni tasdiqlash'}</>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <form id={formId} onSubmit={handleSubmit}>
                <div className={`rounded-2xl border shadow-md ${panel}`}>

                    {/* ── Ombor + Mahsulot qo'shish (рядом) ── */}
                    <div className="p-5">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[220px_1fr]">
                            {/* Ombor — компактный */}
                            <div>
                                <label className={`mb-1.5 flex items-center gap-2 text-xs font-semibold ${muted}`}>
                                    <span className={stepCx}>1</span> <LuWarehouse size={12} /> Ombor
                                </label>
                                <select
                                    value={warehouseId}
                                    onChange={(e) => handleWarehouseChange(e.target.value)}
                                    required
                                    className={`${inputCx} px-3`}
                                >
                                    <option value="">Tanlang</option>
                                    {warehouses.map((w) => (
                                        <option key={w.id} value={w.id}>{w.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Mahsulot qo'shish — рядом */}
                            <div className="relative" ref={searchRef}>
                                <label className={`mb-1.5 flex items-center gap-2 text-xs font-semibold ${muted}`}>
                                    <span className={stepCx}>2</span> Mahsulot qo&apos;shish
                                </label>

                                <button
                                    type="button"
                                    disabled={!warehouseId}
                                    onClick={() => setOpen((v) => !v)}
                                    className={`${inputCx} flex items-center gap-3 text-left disabled:opacity-50 disabled:cursor-not-allowed ${
                                        open ? '!border-amber-400 ring-2 ring-amber-400/20' : ''
                                    }`}
                                >
                                    <LuBoxes size={16} className={muted} />
                                    <span className={`flex-1 truncate ${muted}`}>
                                        {warehouseId ? 'Ombordagi mahsulotlardan tanlang' : 'Avval ombor tanlang'}
                                    </span>
                                    {warehouseId && pagination && (
                                        <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${badge}`}>
                                            {filters.name.trim()
                                                ? `${allStocks.length} ta yuklandi`
                                                : `${pagination.totalElements} ta`}
                                        </span>
                                    )}
                                    <LuChevronDown size={16} className={`shrink-0 transition-transform duration-200 ${muted} ${open ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Dropdown */}
                                {open && warehouseId && (
                                    <div className={`absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border shadow-2xl ${
                                        isDark ? 'border-[#334155] bg-[#0f172a]' : 'border-[#e2e8f0] bg-white'
                                    }`}>

                                        {/* Search + compact filters */}
                                        <div className={`border-b p-3 ${line}`}>
                                            <div className="relative">
                                                <LuSearch className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 ${muted}`} />
                                                <input
                                                    ref={searchInputRef}
                                                    type="text"
                                                    placeholder="Nomi, artikul yoki barcode (skaner) bo‘yicha qidiring"
                                                    value={filters.name}
                                                    onChange={(e) => patchFilters({ name: e.target.value })}
                                                    className={`w-full rounded-xl border pl-10 pr-9 h-11 text-sm outline-none transition-all duration-200 ${fieldCx}`}
                                                />
                                                {filters.name && (
                                                    <button type="button" onClick={() => patchFilters({ name: '' })}
                                                        className={`absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md ${muted} hover:text-[#f43f5e]`}>
                                                        <LuX size={15} />
                                                    </button>
                                                )}
                                            </div>

                                            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <button type="button"
                                                        onClick={() => setFiltersOpen((value) => !value)}
                                                        aria-expanded={filtersOpen}
                                                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                                                            filtersOpen || hasFilters
                                                                ? 'border-amber-400 bg-amber-400/10 text-amber-500'
                                                                : isDark
                                                                    ? 'border-[#334155] text-[#94a3b8] hover:bg-[#1e293b]'
                                                                    : 'border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]'
                                                        }`}>
                                                        <LuSlidersHorizontal size={12} /> Kengaytirilgan filtrlar
                                                    </button>
                                                    {hasFilters && (
                                                        <button type="button" onClick={resetFilters}
                                                            className={`flex items-center gap-1 text-xs font-semibold transition-colors ${muted} hover:text-[#f43f5e]`}>
                                                            <LuRotateCcw size={12} /> Tozalash
                                                        </button>
                                                    )}
                                                </div>
                                                <label className={`flex items-center gap-1.5 text-xs font-semibold ${muted}`}>
                                                    <LuArrowDownWideNarrow size={13} />
                                                    <select
                                                        value={filters.sortKey}
                                                        onChange={(e) => patchFilters({ sortKey: e.target.value })}
                                                        className={`h-8 rounded-lg border px-2 text-xs font-semibold outline-none ${fieldCx}`}
                                                    >
                                                        {SORTS.map((sort) => (
                                                            <option key={sort.key} value={sort.key}>{sort.label}</option>
                                                        ))}
                                                    </select>
                                                </label>
                                            </div>
                                            {filtersOpen && (
                                                <div className={`mt-3 grid grid-cols-1 gap-2.5 rounded-xl border p-3 sm:grid-cols-2 lg:grid-cols-4 ${
                                                    isDark ? 'border-[#334155] bg-[#1e293b]/40' : 'border-[#e2e8f0] bg-[#f8fafc]'
                                                }`}>
                                                    <label className="flex flex-col gap-1">
                                                        <span className={`text-[10px] font-bold uppercase tracking-wide ${muted}`}>O‘lcham</span>
                                                        <input
                                                                    type="text"
                                                                    placeholder="1 kg"
                                                                    value={filters.productSize}
                                                                    onChange={(e) => patchFilters({ productSize: e.target.value })}
                                                                    className={`h-9 w-full rounded-lg border px-2.5 text-xs outline-none ${fieldCx}`}
                                                        />
                                                    </label>
                                                    <label className="flex flex-col gap-1">
                                                        <span className={`text-[10px] font-bold uppercase tracking-wide ${muted}`}>Brend</span>
                                                        <select
                                                                    value={filters.brandId}
                                                                    onChange={(e) => patchFilters({ brandId: e.target.value })}
                                                                    className={`h-9 w-full rounded-lg border px-2.5 text-xs outline-none ${fieldCx}`}
                                                        >
                                                                    <option value="">Barcha brendlar</option>
                                                                    {brands.map((brand) => (
                                                                        <option key={brand.id} value={brand.id}>{brand.name}</option>
                                                                    ))}
                                                        </select>
                                                    </label>
                                                </div>
                                            )}
                                        </div>

                                        {/* Products list */}
                                        {stocksError ? (
                                            <div className={`flex flex-col items-center gap-2 py-12 text-center ${muted}`}>
                                                <LuCircleAlert size={26} className="text-red-500" />
                                                <p className="text-sm font-semibold text-red-500">
                                                    {stocksErrorData?.data?.message || 'Qoldiqlarni yuklashda xatolik'}
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={refetchStocks}
                                                    className="text-xs font-bold text-amber-500 hover:underline"
                                                >
                                                    Qayta urinish
                                                </button>
                                            </div>
                                        ) : isFetching && visibleStocks.length === 0 ? (
                                            <div className={`flex items-center justify-center gap-2 py-12 text-sm ${muted}`}>
                                                {spinner} Yuklanmoqda...
                                            </div>
                                        ) : visibleStocks.length === 0 ? (
                                            <div className={`flex flex-col items-center gap-2 py-12 ${muted}`}>
                                                <LuPackage size={28} strokeWidth={1.5} />
                                                <p className="text-sm">
                                                    {hasFilters ? 'Filtr bo\'yicha mahsulot topilmadi' : 'Bu omborda mahsulot yo\'q'}
                                                </p>
                                                {hasFilters && (
                                                    <button type="button" onClick={resetFilters}
                                                        className="text-xs font-bold text-amber-500 hover:underline">
                                                        Filtrlarni tozalash
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <div className={`max-h-[420px] overflow-y-auto divide-y ${divider}`}>
                                                {visibleStocks.map((st) => {
                                                    const added = items.some((i) => i.productId === st.productId);
                                                    const isLow = st.productLowProductAlert === true
                                                        && st.productMinimumLine > 0
                                                        && st.quantity <= st.productMinimumLine;
                                                    const isOut = st.quantity <= 0;

                                                    return (
                                                        <button
                                                            key={`${st.productId}-${st.warehouseId}`}
                                                            type="button"
                                                            onClick={() => !added && addProduct(st)}
                                                            disabled={added}
                                                            className={`group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                                                                added
                                                                    ? 'cursor-not-allowed opacity-50'
                                                                    : isDark ? 'hover:bg-[#1e293b]' : 'hover:bg-amber-50'
                                                            }`}
                                                        >
                                                            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                                                                isOut
                                                                    ? (isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-500')
                                                                    : isLow
                                                                        ? (isDark ? 'bg-amber-400/10 text-amber-400' : 'bg-amber-50 text-amber-500')
                                                                        : (isDark ? 'bg-[#334155] text-slate-300' : 'bg-slate-100 text-slate-500')
                                                            }`}>
                                                                <LuPackage size={18} />
                                                            </span>

                                                            <div className="min-w-0 flex-1">
                                                                <p className={`truncate text-sm font-semibold ${head}`}>
                                                                    {st.productName}
                                                                </p>
                                                                <p className={`mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs ${muted}`}>
                                                                    {st.productArticle && (
                                                                        <span className="font-mono">{st.productArticle}</span>
                                                                    )}
                                                                    {st.productBarcode && (
                                                                        <span className="flex items-center gap-1">
                                                                            <LuBarcode size={11} />
                                                                            {st.productBarcode}
                                                                        </span>
                                                                    )}
                                                                    {st.productSize && (
                                                                        <span>· {st.productSize}</span>
                                                                    )}
                                                                    {st.productPiecesPerPack && (
                                                                        <span className={isDark ? 'text-indigo-300' : 'text-indigo-600'}>
                                                                            · 1 pachka = {st.productPiecesPerPack} dona
                                                                        </span>
                                                                    )}
                                                                </p>
                                                            </div>

                                                            <div className="flex shrink-0 flex-col items-end gap-0.5">
                                                                <span className={`rounded-full border px-2.5 py-1 text-xs font-bold whitespace-nowrap ${stockTone(st.quantity, isLow)}`}>
                                                                    {formatNumber(st.quantity)} dona
                                                                </span>
                                                                {isLow && st.quantity > 0 && (
                                                                    <span className="text-[10px] font-semibold text-amber-500">
                                                                        min {formatNumber(st.productMinimumLine)}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {added ? (
                                                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-400/15 text-amber-500">
                                                                    <LuCheck size={15} />
                                                                </span>
                                                            ) : (
                                                                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all group-hover:scale-110 ${badge}`}>
                                                                    <LuPlus size={15} />
                                                                </span>
                                                            )}
                                                        </button>
                                                    );
                                                })}

                                                {hasMore && (
                                                    <div
                                                        ref={loadMoreRef}
                                                        className={`flex items-center justify-center gap-2 py-4 text-xs ${muted}`}
                                                    >
                                                        {isFetching ? (
                                                            <>
                                                                {spinner}
                                                                <span>Yuklanmoqda...</span>
                                                            </>
                                                        ) : (
                                                            <span className="opacity-60">↓ Yana yuklash uchun pastga suring</span>
                                                        )}
                                                    </div>
                                                )}
                                                {!hasMore && visibleStocks.length > 0 && (
                                                    <div className={`flex items-center justify-center gap-2 py-3 text-xs ${muted}`}>
                                                        <LuCircleCheck size={12} className={isDark ? 'text-green-400' : 'text-green-600'} />
                                                        <span>Barcha {allStocks.length} ta mahsulot yuklandi</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className={`flex items-center justify-between gap-2 border-t px-3 py-2.5 ${line} ${isDark ? 'bg-[#0f172a]/60' : 'bg-[#f8fafc]'}`}>
                                            <span className={`text-xs ${muted}`}>
                                                {pagination
                                                    ? filters.name.trim()
                                                        ? `${allStocks.length} ta yuklandi`
                                                        : `Jami ${pagination.totalElements} ta mahsulot`
                                                    : '—'}
                                            </span>
                                            <button type="button" onClick={() => setOpen(false)}
                                                className="flex h-8 items-center rounded-lg bg-amber-400 px-4 text-xs font-bold text-[#0f172a] transition-colors hover:bg-amber-300">
                                                Yopish
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Tanlangan mahsulotlar ── */}
                    <div className={`flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3.5 ${line}`}>
                        <div className="flex items-center gap-2">
                            <span className={stepCx}>3</span>
                            <h2 className={`text-sm font-bold ${head}`}>Tanlangan mahsulotlar</h2>
                            {items.length > 0 && (
                                <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${badge}`}>{items.length}</span>
                            )}
                        </div>
                        {items.length > 0 && (
                            <button type="button" onClick={() => setItems([])}
                                className={`text-xs font-semibold transition-colors ${muted} hover:text-[#f43f5e]`}>
                                Hammasini tozalash
                            </button>
                        )}
                    </div>

                    {items.length === 0 ? (
                        <div className={`flex flex-col items-center gap-2 py-12 ${muted}`}>
                            <LuPackage size={34} strokeWidth={1.5} />
                            <p className="text-sm font-semibold">Hozircha mahsulot qo&apos;shilmagan</p>
                            <p className="text-xs">Yuqoridagi ro&apos;yxatdan kerakli mahsulotni tanlang</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className={`text-left text-xs font-semibold uppercase tracking-wide ${muted} ${isDark ? 'bg-[#0f172a]/30' : 'bg-[#f8fafc]/80'}`}>
                                        <th className="px-5 py-3">Mahsulot</th>
                                        <th className="px-5 py-3 w-48">Barcode</th>
                                        <th className="px-5 py-3 w-44">Birlik</th>
                                        <th className="px-5 py-3 w-56">Miqdor</th>
                                        <th className="px-5 py-3 w-16"></th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${divider}`}>
                                    {items.map((item, idx) => (
                                        <tr key={item.productId} className={`transition-colors ${rowBg}`}>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-3">
                                                    <span className={`w-4 shrink-0 text-xs font-bold ${muted}`}>{idx + 1}</span>
                                                    <div>
                                                        <span className={`font-semibold ${head}`}>{item.productName}</span>
                                                        {item.piecesPerPack && (
                                                            <p className={`text-xs mt-0.5 ${muted}`}>1 pachka = {item.piecesPerPack} dona</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className={`px-5 py-3 font-mono text-xs ${muted}`}>
                                                <span className="flex items-center gap-1.5"><LuBarcode size={13} />{item.productBarcode}</span>
                                            </td>

                                            {/* Unit toggle — PACHKA | DONA */}
                                            <td className="px-5 py-3">
                                                <div className={`inline-flex rounded-xl border overflow-hidden text-xs font-bold ${isDark ? 'border-[#334155]' : 'border-[#e2e8f0]'}`}>
                                                    <button type="button" onClick={() => updateUnit(item.productId, 'PACK')}
                                                        disabled={!item.piecesPerPack}
                                                        title={!item.piecesPerPack ? 'Bu mahsulotda pachka ma\'lumoti yo\'q' : `1 pachka = ${item.piecesPerPack} dona`}
                                                        className={`px-3 py-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                                                            item.unit === 'PACK'
                                                                ? 'bg-amber-400 text-[#0f172a]'
                                                                : isDark ? 'bg-[#1e293b] text-[#94a3b8] hover:bg-[#334155]' : 'bg-[#f8fafc] text-[#64748b] hover:bg-[#f1f5f9]'
                                                        }`}>
                                                        Pachka
                                                    </button>
                                                    <button type="button" onClick={() => updateUnit(item.productId, 'PIECE')}
                                                        className={`px-3 py-2 transition-colors ${
                                                            item.unit === 'PIECE'
                                                                ? 'bg-amber-400 text-[#0f172a]'
                                                                : isDark ? 'bg-[#1e293b] text-[#94a3b8] hover:bg-[#334155]' : 'bg-[#f8fafc] text-[#64748b] hover:bg-[#f1f5f9]'
                                                        }`}>
                                                        Dona
                                                    </button>
                                                </div>
                                            </td>

                                            {/* Miqdor */}
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className={`inline-flex items-center rounded-xl border overflow-hidden ${isDark ? 'border-[#334155]' : 'border-[#e2e8f0]'}`}>
                                                        <button type="button" onClick={() => stepQty(item.productId, -1)} aria-label="Kamaytirish"
                                                            className={`flex h-11 w-11 items-center justify-center transition-colors ${isDark ? 'bg-[#1e293b] hover:bg-[#334155] text-[#cbd5e1]' : 'bg-[#f8fafc] hover:bg-[#f1f5f9] text-[#475569]'}`}>
                                                            <LuMinus size={15} />
                                                        </button>
                                                        <input type="number" min={1} value={item.quantity}
                                                            onChange={(e) => updateQty(item.productId, e.target.value)}
                                                            className={`h-11 w-20 border-x text-center text-base font-bold outline-none ${isDark ? 'border-[#334155] bg-[#0f172a] text-white' : 'border-[#e2e8f0] bg-white text-[#0f172a]'}`}
                                                        />
                                                        <button type="button" onClick={() => stepQty(item.productId, 1)} aria-label="Ko'paytirish"
                                                            className={`flex h-11 w-11 items-center justify-center transition-colors ${isDark ? 'bg-[#1e293b] hover:bg-[#334155] text-[#cbd5e1]' : 'bg-[#f8fafc] hover:bg-[#f1f5f9] text-[#475569]'}`}>
                                                            <LuPlus size={15} />
                                                        </button>
                                                    </div>
                                                    <span className={`text-xs font-medium ${muted}`}>
                                                        {item.unit === 'PACK' ? 'pachka' : 'dona'}
                                                        {item.unit === 'PACK' && item.piecesPerPack && (
                                                            <span className="ml-1 text-amber-400">= {item.quantity * item.piecesPerPack} dona</span>
                                                        )}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="px-5 py-3 text-right">
                                                <button type="button" onClick={() => removeItem(item.productId)} aria-label="O'chirish"
                                                    className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${isDark ? 'text-[#64748b] hover:bg-[#f43f5e]/10 hover:text-[#fb7185]' : 'text-[#94a3b8] hover:bg-[#fff1f2] hover:text-[#f43f5e]'}`}>
                                                    <LuTrash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </form>

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border px-4 py-3.5 shadow-2xl ${
                    toast.type === 'success'
                        ? (isDark ? 'border-green-500/30 bg-[#052e16] text-green-300' : 'border-green-200 bg-green-50 text-green-800')
                        : (isDark ? 'border-red-500/30 bg-[#1c0505] text-red-300' : 'border-red-200 bg-red-50 text-red-800')
                }`}>
                    {toast.type === 'success'
                        ? <LuCircleCheck size={20} className="shrink-0" />
                        : <LuCircleAlert size={20} className="shrink-0" />
                    }
                    <span className="text-sm font-semibold">{toast.msg}</span>
                </div>
            )}
        </div>
    );
}

StockTransactionForm.propTypes = {
    action: PropTypes.oneOf(['IN', 'OUT']).isRequired,
};