import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
    LuPlus, LuSearch, LuTrash2, LuPackage, LuSend, LuCheck,
    LuX, LuBarcode, LuCircleAlert, LuCircleCheck, LuWarehouse, LuMinus,
    LuChevronDown, LuChevronLeft, LuChevronRight, LuSlidersHorizontal,
    LuRotateCcw, LuArrowDownWideNarrow, LuBoxes, LuTag,
} from 'react-icons/lu';
import { useAppTheme } from '../../../theme/tokens';
import { useGetWarehousesQuery } from '../../../store/services/warehouse.api';
import { useGetProductStocksQuery } from '../../../store/services/productStock.api';
import { useCreateStockTransactionMutation } from '../../../store/services/productStock.api';
import { formatNumber } from '../../ui/number-format';

const STOCK_PAGE_SIZE = 20;

const SORTS = [
    { key: 'recent',  label: 'Oxirgi o\'zgargan', sort: ['lastModifiedAt,DESC', 'id,DESC'] },
    { key: 'qtyDesc', label: 'Ko\'pdan kamga',    sort: ['quantity,DESC', 'id,DESC'] },
    { key: 'qtyAsc',  label: 'Kamdan ko\'pga',    sort: ['quantity,ASC', 'id,ASC'] },
];

const EMPTY_FILTERS = {
    name: '', article: '', productSize: '', brandId: '',
    lowStock: false, priceFrom: '', priceTo: '', sortKey: 'recent',
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
    const [filters, setFilters]         = useState(EMPTY_FILTERS);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [stockPage, setStockPage]     = useState(0);
    const [brandMap, setBrandMap]       = useState({});
    const [items, setItems]             = useState([]);
    const [toast, setToast]             = useState(null);
    const searchRef     = useRef(null);
    const searchInputRef = useRef(null);

    const debouncedFilters = useDebouncedValue(filters, 350);

    const { data: warehouses = [] } = useGetWarehousesQuery('PRODUCT');

    const df = debouncedFilters;
    const term = df.name.trim();
    const isBarcodeTerm = /^\d{8,}$/.test(term);
    const sortParam = SORTS.find((x) => x.key === df.sortKey)?.sort;

    const { data: stocksResp, isFetching } = useGetProductStocksQuery(
        {
            warehouseId,
            name:        isBarcodeTerm ? undefined : (term || undefined),
            barcode:     isBarcodeTerm ? term : undefined,
            article:     df.article.trim()     || undefined,
            productSize: df.productSize.trim() || undefined,
            brandId:     df.brandId            || undefined,
            lowStock:    df.lowStock           || undefined,
            priceFrom:   df.priceFrom !== '' ? Number(df.priceFrom) : undefined,
            priceTo:     df.priceTo   !== '' ? Number(df.priceTo)   : undefined,
            page: stockPage,
            size: STOCK_PAGE_SIZE,
            sort: sortParam,
        },
        { skip: !warehouseId }
    );

    const [createTx, { isLoading: isSending }] = useCreateStockTransactionMutation();

    const stocks          = useMemo(() => stocksResp?.items ?? [], [stocksResp]);
    const stockPagination = stocksResp?.pagination ?? null;

    // Brendlar keshi
    useEffect(() => {
        if (!stocks.length) return;
        setBrandMap((prev) => {
            let changed = false;
            const next = { ...prev };
            for (const st of stocks) {
                if (st.brand?.id && !next[st.brand.id]) { next[st.brand.id] = st.brand; changed = true; }
            }
            return changed ? next : prev;
        });
    }, [stocks]);

    const brandOptions = useMemo(
        () => Object.values(brandMap).sort((a, b) => String(a.name).localeCompare(String(b.name), 'uz')),
        [brandMap]
    );

    const advancedCount =
        (filters.article.trim() ? 1 : 0) + (filters.productSize.trim() ? 1 : 0) +
        (filters.brandId ? 1 : 0) + (filters.lowStock ? 1 : 0) +
        (filters.priceFrom !== '' ? 1 : 0) + (filters.priceTo !== '' ? 1 : 0);
    const hasAnyFilter = advancedCount > 0 || filters.name.trim() !== '' || filters.sortKey !== 'recent';

    const patchFilters = (patch) => { setFilters((p) => ({ ...p, ...patch })); setStockPage(0); };
    const resetFilters = () => { setFilters(EMPTY_FILTERS); setStockPage(0); };

    // Dropdown ochilganda search inputga focus
    useEffect(() => {
        if (open && searchInputRef.current) searchInputRef.current.focus();
    }, [open]);

    // Outside click
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
    const ghostBtn = isDark
        ? 'border-[#334155] text-[#94a3b8] hover:bg-[#1e293b]'
        : 'border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9]';
    const miniCx = `h-9 w-full rounded-lg border px-3 text-xs outline-none transition-all duration-200 ${fieldCx}`;
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
                unit:            'PIECE',
            }];
        });
    }, []);

    const removeItem  = (id) => setItems((p) => p.filter((i) => i.productId !== id));

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
        setStockPage(0);
        setBrandMap({});
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
    const selectedWarehouse = warehouses.find((w) => w.id === warehouseId);
    const formId = `stock-tx-${action}`;

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
                                <LuPackage size={14} /> {items.length} ta · {totalQty} {items.some(i => i.unit === 'PACK') ? 'blok/dona' : 'dona'}
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

                    {/* ── Ombor ── */}
                    <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-end">
                        <div className="sm:w-72 shrink-0">
                            <label className={`mb-1.5 flex items-center gap-2 text-xs font-semibold ${muted}`}>
                                <span className={stepCx}>1</span> <LuWarehouse size={12} /> Ombor
                            </label>
                            <select
                                value={warehouseId}
                                onChange={(e) => handleWarehouseChange(e.target.value)}
                                required
                                className={inputCx}
                            >
                                <option value="">Ombor tanlang</option>
                                {warehouses.map((w) => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* ── Mahsulot qo'shish (dropdown) ── */}
                    <div className="px-5 pb-4">
                        <div className="relative" ref={searchRef}>
                            <label className={`mb-1.5 flex items-center gap-2 text-xs font-semibold ${muted}`}>
                                <span className={stepCx}>2</span> Mahsulot qo&apos;shish
                            </label>

                            {/* Trigger */}
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
                                {warehouseId && stockPagination && (
                                    <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${badge}`}>
                                        {stockPagination.totalElements} ta
                                    </span>
                                )}
                                <LuChevronDown size={16} className={`shrink-0 transition-transform duration-200 ${muted} ${open ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown panel */}
                            {open && warehouseId && (
                                <div className={`absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border shadow-2xl ${isDark ? 'border-[#334155] bg-[#0f172a]' : 'border-[#e2e8f0] bg-white'}`}>

                                    {/* Search + filter toggle */}
                                    <div className={`border-b p-3 ${line}`}>
                                        <div className="flex items-center gap-2">
                                            <div className="relative flex-1">
                                                <LuSearch className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 ${muted}`} />
                                                <input
                                                    ref={searchInputRef}
                                                    type="text"
                                                    placeholder="Nomi yoki barcode (skaner) bo'yicha qidiring"
                                                    value={filters.name}
                                                    onChange={(e) => patchFilters({ name: e.target.value })}
                                                    className={`w-full rounded-xl border pl-10 pr-9 h-10 text-sm outline-none transition-all duration-200 ${fieldCx}`}
                                                />
                                                {filters.name && (
                                                    <button type="button" onClick={() => patchFilters({ name: '' })}
                                                        className={`absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md ${muted} hover:text-[#f43f5e]`}>
                                                        <LuX size={14} />
                                                    </button>
                                                )}
                                            </div>
                                            <button type="button" onClick={() => setFiltersOpen((v) => !v)}
                                                className={`relative flex h-10 shrink-0 items-center gap-2 rounded-xl border px-3.5 text-xs font-bold transition-colors ${
                                                    filtersOpen || advancedCount > 0
                                                        ? 'border-amber-400 bg-amber-400/10 text-amber-500'
                                                        : ghostBtn
                                                }`}>
                                                <LuSlidersHorizontal size={14} /> Filtrlar
                                                {advancedCount > 0 && (
                                                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-[#0f172a]">
                                                        {advancedCount}
                                                    </span>
                                                )}
                                            </button>
                                        </div>

                                        {/* Quick row: low stock + sort + reset */}
                                        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                                            <button type="button"
                                                onClick={() => patchFilters({ lowStock: !filters.lowStock })}
                                                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                                                    filters.lowStock
                                                        ? 'border-amber-400 bg-amber-400 text-[#0f172a]'
                                                        : isDark ? 'border-[#334155] text-[#94a3b8] hover:bg-[#1e293b]' : 'border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]'
                                                }`}>
                                                <LuBoxes size={12} /> Kam qolganlar
                                            </button>

                                            <div className="flex items-center gap-2">
                                                {hasAnyFilter && (
                                                    <button type="button" onClick={resetFilters}
                                                        className={`flex items-center gap-1 text-xs font-semibold transition-colors ${muted} hover:text-[#f43f5e]`}>
                                                        <LuRotateCcw size={12} /> Tozalash
                                                    </button>
                                                )}
                                                <label className={`flex items-center gap-1.5 text-xs font-semibold ${muted}`}>
                                                    <LuArrowDownWideNarrow size={13} />
                                                    <select
                                                        value={filters.sortKey}
                                                        onChange={(e) => patchFilters({ sortKey: e.target.value })}
                                                        className={`h-8 rounded-lg border px-2 text-xs font-semibold outline-none ${fieldCx}`}
                                                    >
                                                        {SORTS.map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}
                                                    </select>
                                                </label>
                                            </div>
                                        </div>

                                        {/* Advanced filters */}
                                        {filtersOpen && (
                                            <div className={`mt-3 grid grid-cols-2 gap-2.5 rounded-xl border p-3 sm:grid-cols-4 ${isDark ? 'border-[#334155] bg-[#1e293b]/40' : 'border-[#e2e8f0] bg-[#f8fafc]'}`}>
                                                <label className="flex flex-col gap-1">
                                                    <span className={`text-[10px] font-bold uppercase tracking-wide ${muted}`}>Artikul</span>
                                                    <input type="text" placeholder="SH-001" value={filters.article}
                                                        onChange={(e) => patchFilters({ article: e.target.value })} className={miniCx} />
                                                </label>
                                                <label className="flex flex-col gap-1">
                                                    <span className={`text-[10px] font-bold uppercase tracking-wide ${muted}`}>O&apos;lcham</span>
                                                    <input type="text" placeholder="1 kg" value={filters.productSize}
                                                        onChange={(e) => patchFilters({ productSize: e.target.value })} className={miniCx} />
                                                </label>
                                                <label className="flex flex-col gap-1 col-span-2">
                                                    <span className={`text-[10px] font-bold uppercase tracking-wide ${muted}`}>Brend</span>
                                                    <select value={filters.brandId}
                                                        onChange={(e) => patchFilters({ brandId: e.target.value })} className={miniCx}>
                                                        <option value="">Barcha brendlar</option>
                                                        {brandOptions.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                                                    </select>
                                                </label>
                                                <label className="flex flex-col gap-1 col-span-2">
                                                    <span className={`text-[10px] font-bold uppercase tracking-wide ${muted}`}>Narx (so&apos;m)</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <input type="text" inputMode="numeric" placeholder="dan" value={filters.priceFrom}
                                                            onChange={(e) => patchFilters({ priceFrom: e.target.value.replace(/[^\d]/g, '') })} className={miniCx} />
                                                        <span className={muted}>–</span>
                                                        <input type="text" inputMode="numeric" placeholder="gacha" value={filters.priceTo}
                                                            onChange={(e) => patchFilters({ priceTo: e.target.value.replace(/[^\d]/g, '') })} className={miniCx} />
                                                    </div>
                                                </label>
                                            </div>
                                        )}
                                    </div>

                                    {/* List */}
                                    {isFetching && stocks.length === 0 ? (
                                        <div className={`flex items-center justify-center gap-2 py-10 text-sm ${muted}`}>
                                            {spinner} Yuklanmoqda...
                                        </div>
                                    ) : stocks.length === 0 ? (
                                        <div className={`flex flex-col items-center gap-2 py-10 ${muted}`}>
                                            <LuPackage size={28} strokeWidth={1.5} />
                                            <p className="text-sm">
                                                {hasAnyFilter ? 'Filtr bo\'yicha mahsulot topilmadi' : 'Bu omborda mahsulot yo\'q'}
                                            </p>
                                            {hasAnyFilter && (
                                                <button type="button" onClick={resetFilters}
                                                    className="text-xs font-bold text-amber-500 hover:underline">
                                                    Filtrlarni tozalash
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className={`relative max-h-80 overflow-y-auto divide-y ${divider} ${isFetching ? 'opacity-60' : ''}`}>
                                            {stocks.map((st) => {
                                                const added = items.some((i) => i.productId === st.productId);
                                                const isLow = st.productMinimumLine > 0 && st.quantity <= st.productMinimumLine;
                                                return (
                                                    <button key={`${st.productId}-${st.warehouseId}`} type="button"
                                                        onClick={() => !added && addProduct(st)}
                                                        disabled={added}
                                                        className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors ${
                                                            added
                                                                ? 'cursor-not-allowed opacity-50'
                                                                : isDark ? 'hover:bg-[#1e293b]' : 'hover:bg-amber-50'
                                                        }`}
                                                    >
                                                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isDark ? 'bg-[#334155]' : 'bg-[#f1f5f9]'}`}>
                                                            <LuPackage size={16} className={muted} />
                                                        </span>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="flex flex-wrap items-center gap-1.5">
                                                                <span className={`truncate font-semibold text-sm ${head}`}>{st.productName}</span>
                                                                {st.productSize && (
                                                                    <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${isDark ? 'bg-white/5 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                                                                        {st.productSize}
                                                                    </span>
                                                                )}
                                                                {st.brand?.name && (
                                                                    <span className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${badge}`}>
                                                                        {st.brand.name}
                                                                    </span>
                                                                )}
                                                            </p>
                                                            <p className={`mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs ${muted}`}>
                                                                {st.productArticle && <span className="font-mono">{st.productArticle}</span>}
                                                                <span className="flex items-center gap-1"><LuBarcode size={11} />{st.productBarcode || '—'}</span>
                                                                {st.productPiecesPerPack && (
                                                                    <span className="flex items-center gap-1">
                                                                        <LuBoxes size={11} />1 blok = {st.productPiecesPerPack} dona
                                                                    </span>
                                                                )}
                                                            </p>
                                                        </div>

                                                        {/* Qoldiq badge */}
                                                        <div className="flex shrink-0 flex-col items-end gap-0.5">
                                                            <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${stockTone(st.quantity, isLow)}`}>
                                                                {formatNumber(st.quantity)} dona
                                                            </span>
                                                            {isLow && st.quantity > 0 && (
                                                                <span className="text-[10px] font-semibold text-amber-500">
                                                                    Kam · min {formatNumber(st.productMinimumLine)}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {added ? (
                                                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-400/10 text-amber-500">
                                                                <LuCheck size={14} />
                                                            </span>
                                                        ) : (
                                                            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${badge}`}>
                                                                <LuPlus size={14} />
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Footer: pagination + close */}
                                    <div className={`flex items-center justify-between gap-2 border-t px-3 py-2.5 ${line} ${isDark ? 'bg-[#0f172a]/60' : 'bg-[#f8fafc]'}`}>
                                        <span className={`flex items-center gap-2 text-xs ${muted}`}>
                                            {isFetching && spinner}
                                            {stockPagination
                                                ? `${stockPagination.page + 1} / ${Math.max(stockPagination.totalPages, 1)} sahifa · jami ${stockPagination.totalElements} ta`
                                                : `${stocks.length} ta mahsulot`}
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            {stockPagination && stockPagination.totalPages > 1 && (
                                                <>
                                                    <button type="button"
                                                        disabled={stockPagination.first}
                                                        onClick={() => setStockPage((p) => Math.max(0, p - 1))}
                                                        className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${ghostBtn}`}>
                                                        <LuChevronLeft size={15} />
                                                    </button>
                                                    <button type="button"
                                                        disabled={stockPagination.last}
                                                        onClick={() => setStockPage((p) => p + 1)}
                                                        className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${ghostBtn}`}>
                                                        <LuChevronRight size={15} />
                                                    </button>
                                                </>
                                            )}
                                            <button type="button" onClick={() => setOpen(false)}
                                                className="flex h-8 items-center rounded-lg bg-amber-400 px-3 text-xs font-bold text-[#0f172a] transition-colors hover:bg-amber-300">
                                                Yopish
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
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
                            <p className="text-xs">Yuqoridagi dropdown dan kerakli mahsulotni tanlang</p>
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
                                                            <p className={`text-xs mt-0.5 ${muted}`}>1 blok = {item.piecesPerPack} dona</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className={`px-5 py-3 font-mono text-xs ${muted}`}>
                                                <span className="flex items-center gap-1.5"><LuBarcode size={13} />{item.productBarcode}</span>
                                            </td>

                                            {/* Unit toggle — PIECE | PACK */}
                                            <td className="px-5 py-3">
                                                <div className={`inline-flex rounded-xl border overflow-hidden text-xs font-bold ${isDark ? 'border-[#334155]' : 'border-[#e2e8f0]'}`}>
                                                    <button type="button" onClick={() => updateUnit(item.productId, 'PIECE')}
                                                        className={`px-3 py-2 transition-colors ${
                                                            item.unit === 'PIECE'
                                                                ? 'bg-amber-400 text-[#0f172a]'
                                                                : isDark ? 'bg-[#1e293b] text-[#94a3b8] hover:bg-[#334155]' : 'bg-[#f8fafc] text-[#64748b] hover:bg-[#f1f5f9]'
                                                        }`}>
                                                        Dona
                                                    </button>
                                                    <button type="button" onClick={() => updateUnit(item.productId, 'PACK')}
                                                        disabled={!item.piecesPerPack}
                                                        title={!item.piecesPerPack ? 'Bu mahsulotda blok ma\'lumoti yo\'q' : `1 blok = ${item.piecesPerPack} dona`}
                                                        className={`px-3 py-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                                                            item.unit === 'PACK'
                                                                ? 'bg-amber-400 text-[#0f172a]'
                                                                : isDark ? 'bg-[#1e293b] text-[#94a3b8] hover:bg-[#334155]' : 'bg-[#f8fafc] text-[#64748b] hover:bg-[#f1f5f9]'
                                                        }`}>
                                                        Blok
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
                                                        {item.unit === 'PACK' ? 'blok' : 'dona'}
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
