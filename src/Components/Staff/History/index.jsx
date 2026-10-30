import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import {
    LuArrowDownLeft, LuArrowLeftRight, LuArrowUpRight, LuBarcode, LuClipboardList, LuFactory,
    LuHistory, LuSearch, LuWarehouse, LuX,
} from 'react-icons/lu';
import { useAppTheme } from '../../../theme/tokens';
import { useGetStockTransactionsQuery } from '../../../store/services/productStock.api';
import { useGetWarehousesQuery } from '../../../store/services/warehouse.api';
import { useInfiniteList } from '../../ui/useInfiniteList';
import InfiniteSentinel from '../../ui/InfiniteSentinel';
import ProductImage from '../../ui/ProductImage';
import LabelPrintButton from '../../ui/LabelPrintButton';
import { formatNumber } from '../../ui/number-format';
import { formatDate, formatTime, todayIso } from '../../ui/date-format';

const PAGE_SIZE = 20;
const productImageUrl = (productId) => (productId ? `/api/v1/products/${productId}/image` : null);

/* ── Harakat turlari ───────────────────────────────────────────────────── */
const ACTIONS = {
    IN:           { label: 'Kirim',             short: 'Kirim',       sign: '+', Icon: LuArrowDownLeft,  tone: 'emerald' },
    OUT:          { label: 'Chiqim',            short: 'Chiqim',      sign: '−', Icon: LuArrowUpRight,   tone: 'rose' },
    PRODUCE:      { label: 'Ishlab chiqarildi', short: 'Stanok',      sign: '+', Icon: LuFactory,        tone: 'sky' },
    TRANSFER_IN:  { label: 'Ko‘chirish (kirim)',  short: 'Ko‘chirish', sign: '+', Icon: LuArrowLeftRight, tone: 'violet' },
    TRANSFER_OUT: { label: 'Ko‘chirish (chiqim)', short: 'Ko‘chirish', sign: '−', Icon: LuArrowLeftRight, tone: 'amber' },
};
const actionMeta = (a) => ACTIONS[a] || { label: a || '—', short: a || '—', sign: '', Icon: LuHistory, tone: 'slate' };

const TONES = {
    emerald: { chip: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30', dark: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30', text: 'text-emerald-600', textDark: 'text-emerald-300', solid: 'bg-emerald-500' },
    rose:    { chip: 'bg-rose-500/10 text-rose-600 border-rose-500/30',          dark: 'bg-rose-500/15 text-rose-300 border-rose-400/30',          text: 'text-rose-600',    textDark: 'text-rose-300',    solid: 'bg-rose-500' },
    sky:     { chip: 'bg-sky-500/10 text-sky-600 border-sky-500/30',             dark: 'bg-sky-500/15 text-sky-300 border-sky-400/30',             text: 'text-sky-600',     textDark: 'text-sky-300',     solid: 'bg-sky-500' },
    violet:  { chip: 'bg-violet-500/10 text-violet-600 border-violet-500/30',    dark: 'bg-violet-500/15 text-violet-300 border-violet-400/30',    text: 'text-violet-600',  textDark: 'text-violet-300',  solid: 'bg-violet-500' },
    amber:   { chip: 'bg-amber-400/10 text-amber-700 border-amber-400/40',       dark: 'bg-amber-400/15 text-amber-300 border-amber-400/30',       text: 'text-amber-700',   textDark: 'text-amber-300',   solid: 'bg-amber-500' },
    slate:   { chip: 'bg-slate-500/10 text-slate-600 border-slate-500/30',       dark: 'bg-slate-500/15 text-slate-300 border-slate-400/30',       text: 'text-slate-600',   textDark: 'text-slate-300',   solid: 'bg-slate-500' },
};

const ACTION_FILTERS = [
    { value: '', label: 'Barchasi', Icon: LuHistory },
    { value: 'IN', label: 'Kirim', Icon: LuArrowDownLeft },
    { value: 'OUT', label: 'Chiqim', Icon: LuArrowUpRight },
    { value: 'TRANSFER_IN', label: 'Ko‘chirib kelindi', Icon: LuArrowLeftRight },
    { value: 'TRANSFER_OUT', label: 'Ko‘chirib yuborildi', Icon: LuArrowLeftRight },
];

/* ── Kichik bloklar ────────────────────────────────────────────────────── */
function ActionBadge({ action, isDark, size = 'sm' }) {
    const meta = actionMeta(action);
    const tone = TONES[meta.tone];
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border font-bold whitespace-nowrap ${size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'} ${isDark ? tone.dark : tone.chip}`}>
            <meta.Icon size={12} />
            {meta.label}
        </span>
    );
}
ActionBadge.propTypes = { action: PropTypes.string, isDark: PropTypes.bool, size: PropTypes.string };

function Qty({ t, isDark, align = 'right' }) {
    const meta = actionMeta(t.action);
    const tone = TONES[meta.tone];
    const isPack = t.enteredUnit === 'PACK';
    const entered = Number(t.enteredQuantity) || 0;
    const total = Number(t.quantity) || 0;
    return (
        <div className={`flex flex-col ${align === 'right' ? 'items-end' : 'items-start'}`}>
            <span className={`text-base font-extrabold tabular-nums ${isDark ? tone.textDark : tone.text}`}>
                {meta.sign}{formatNumber(isPack ? entered : total)} <span className="text-[11px] font-semibold">{isPack ? 'pachka' : 'dona'}</span>
            </span>
            {isPack && <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>= {formatNumber(total)} dona · 1 pachka = {formatNumber(entered ? Math.round(total / entered) : 0)} dona</span>}
        </div>
    );
}
Qty.propTypes = { t: PropTypes.object.isRequired, isDark: PropTypes.bool, align: PropTypes.string };

function dayLabel(iso) {
    const d = formatDate(iso);
    if (iso === todayIso()) return `Bugun · ${d}`;
    const y = new Date(); y.setDate(y.getDate() - 1);
    const yIso = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
    if (iso === yIso) return `Kecha · ${d}`;
    return d;
}

/* ── Sahifa ────────────────────────────────────────────────────────────── */
export default function StaffHistory() {
    const { isDark } = useAppTheme();
    const [page, setPage]                       = useState(0);
    const [warehouseFilter, setWarehouseFilter] = useState('');
    const [actionFilter, setActionFilter]       = useState('');
    const [search, setSearch]                   = useState('');
    const [productFilter, setProductFilter]     = useState(null); // { id, name }

    const { data: warehouses = [] } = useGetWarehousesQuery('PRODUCT');
    const warehouseName = useMemo(() => Object.fromEntries(warehouses.map((w) => [w.id, w.name])), [warehouses]);

    /* 13 xonali raqam — pachka barcode‘i: backend shu pachkaning butun tarixini qaytaradi (kirim → ko‘chirish → chiqim) */
    const packBarcode = /^\d{13}$/.test(search.trim()) ? search.trim() : '';
    const { data, isLoading, isFetching, isError } = useGetStockTransactionsQuery({
        warehouseId: warehouseFilter || undefined,
        action:      actionFilter     || undefined,
        productId:   productFilter?.id || undefined,
        barcode:     packBarcode || undefined,
        page,
        size: PAGE_SIZE,
    });
    const pagination = data?.pagination ?? {};
    const { items: transactions, hasMore, sentinelRef, loadingMore, loadMore } = useInfiniteList({
        items: data?.data,
        pagination,
        page,
        setPage,
        isFetching,
        resetKey: `${warehouseFilter}|${actionFilter}|${productFilter?.id || ''}|${packBarcode}`,
    });

    const q = packBarcode ? '' : search.trim().toLowerCase();
    const filtered = useMemo(() => (q
        ? transactions.filter((t) => t.productName?.toLowerCase().includes(q) || t.productBarcode?.includes(q))
        : transactions), [transactions, q]);

    /* Kun bo‘yicha guruhlash (ro‘yxat yangidan eskiga keladi) */
    const groups = useMemo(() => {
        const map = new Map();
        for (const t of filtered) {
            const key = String(t.createdAt || '').slice(0, 10);
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(t);
        }
        return [...map.entries()];
    }, [filtered]);

    const totals = useMemo(() => filtered.reduce((acc, t) => {
        const qty = Number(t.quantity) || 0;
        if (t.action === 'IN' || t.action === 'TRANSFER_IN') acc.in += qty;
        else if (t.action === 'OUT' || t.action === 'TRANSFER_OUT') acc.out += qty;
        else if (t.action === 'PRODUCE') acc.produced += qty;
        return acc;
    }, { in: 0, out: 0, produced: 0 }), [filtered]);

    const hasFilters = Boolean(warehouseFilter || actionFilter || search || productFilter);
    const activeCount = [warehouseFilter, actionFilter, search, productFilter].filter(Boolean).length;
    const resetFilters = () => { setWarehouseFilter(''); setActionFilter(''); setSearch(''); setProductFilter(null); };

    /* ── tokens ── */
    const panel   = isDark ? 'border-white/10 bg-[#141C2B]' : 'border-slate-200 bg-white';
    const muted   = isDark ? 'text-slate-400' : 'text-slate-500';
    const head    = isDark ? 'text-white' : 'text-slate-900';
    const line    = isDark ? 'border-white/[0.06]' : 'border-slate-100';
    const rowHov  = isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-amber-50/60';
    const inputCx = `w-full rounded-xl border px-3.5 text-sm outline-none transition-all h-[42px] ${isDark ? 'border-slate-700 bg-slate-800/80 text-white placeholder:text-slate-500 focus:border-amber-400' : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-amber-400'}`;
    const emptyState = (title, hint) => (
        <div className={`flex flex-col items-center gap-2 py-16 ${muted}`}>
            <LuHistory size={36} strokeWidth={1.5} />
            <p className={`text-sm font-semibold ${head}`}>{title}</p>
            {hint && <p className="text-xs">{hint}</p>}
        </div>
    );

    return (
        <div className="flex w-full flex-col gap-4 py-2">
            {/* ── Sarlavha ── */}
            <div className={`relative overflow-hidden rounded-2xl border px-5 py-4 shadow-md ${panel}`}>
                <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-amber-400/6 to-transparent" />
                <div className="relative flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-amber-400/10 text-amber-500 border-amber-400/20"><LuHistory size={20} /></span>
                        <div>
                            <h1 className={`text-xl font-bold tracking-tight ${head}`}>Ombor harakatlari tarixi</h1>
                            <p className={`text-xs mt-0.5 ${muted}`}>Kirim, chiqim, ishlab chiqarish va ko‘chirishlar — yangidan eskiga</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold ${isDark ? 'border-white/10 text-slate-200' : 'border-slate-200 text-slate-700'}`}>{formatNumber(pagination.totalElements ?? 0)} ta yozuv</span>
                        {totals.in > 0 && <span className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold ${isDark ? TONES.emerald.dark : TONES.emerald.chip}`}><LuArrowDownLeft size={12} /> +{formatNumber(totals.in)} dona kirim</span>}
                        {totals.out > 0 && <span className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold ${isDark ? TONES.rose.dark : TONES.rose.chip}`}><LuArrowUpRight size={12} /> −{formatNumber(totals.out)} dona chiqim</span>}
                        {totals.produced > 0 && <span className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold ${isDark ? TONES.sky.dark : TONES.sky.chip}`}><LuFactory size={12} /> {formatNumber(totals.produced)} dona ishlab chiqarildi</span>}
                    </div>
                </div>
            </div>

            {/* ── Filtrlar ── */}
            <div className={`rounded-2xl border shadow-md overflow-hidden ${panel}`}>
                {/* 1-qator: harakat turi (segment) */}
                <div className={`flex items-center gap-2 overflow-x-auto px-3 py-3 border-b ${line}`}>
                    <span className={`shrink-0 pl-1 pr-2 text-[11px] font-bold uppercase tracking-wider ${muted}`}>Tur</span>
                    <div className={`flex gap-1 rounded-xl p-1 ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                        {ACTION_FILTERS.map((f) => {
                            const active = actionFilter === f.value;
                            const tone = f.value ? TONES[actionMeta(f.value).tone] : null;
                            return (
                                <button key={f.value || 'all'} type="button" onClick={() => setActionFilter(f.value)}
                                    className={`flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold whitespace-nowrap transition-all ${
                                        active
                                            ? (tone ? `${tone.solid} text-white shadow-sm` : 'bg-amber-400 text-slate-900 shadow-sm')
                                            : `${muted} ${isDark ? 'hover:bg-white/5 hover:text-white' : 'hover:bg-white hover:text-slate-900'}`
                                    }`}>
                                    <f.Icon size={13} />{f.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 2-qator: ombor + qidiruv */}
                <div className="grid grid-cols-1 gap-3 px-4 py-3 md:grid-cols-[14rem_1fr_auto] md:items-end">
                    <div>
                        <label className={`mb-1.5 flex items-center gap-1.5 text-xs font-semibold ${muted}`}><LuWarehouse size={11} /> Ombor</label>
                        <select value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)} className={inputCx}>
                            <option value="">Barcha omborlar</option>
                            {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                    </div>
                    <div className="min-w-0">
                        <label className={`mb-1.5 flex items-center gap-1.5 text-xs font-semibold ${muted}`}><LuSearch size={11} /> Mahsulot nomi yoki pachka barcode‘i (skaner)</label>
                        <div className="relative">
                            <LuSearch size={15} className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 ${muted}`} />
                            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nomini yozing yoki pachka yorlig‘ini skanerlang — pachka tarixi chiqadi" className={`${inputCx} pl-10 pr-10`} />
                            {search && <button type="button" onClick={() => setSearch('')} className={`absolute right-3 top-1/2 -translate-y-1/2 ${muted} hover:text-amber-500`} aria-label="Tozalash"><LuX size={14} /></button>}
                        </div>
                    </div>
                    <button type="button" onClick={resetFilters} disabled={!hasFilters}
                        className={`flex h-[42px] items-center justify-center gap-1.5 rounded-xl border px-4 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${isDark ? 'border-slate-700 text-slate-200 hover:border-amber-400/50 hover:text-amber-300' : 'border-slate-200 text-slate-700 hover:border-amber-400 hover:text-amber-700'}`}>
                        <LuX size={13} /> Tozalash{activeCount > 0 ? ` (${activeCount})` : ''}
                    </button>
                </div>

                {/* 3-qator: faol filtrlar */}
                {hasFilters && (
                    <div className={`flex flex-wrap items-center gap-2 border-t px-4 py-2.5 text-xs ${line} ${muted}`}>
                        <span>Faol filtrlar:</span>
                        {actionFilter && <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-semibold ${isDark ? TONES[actionMeta(actionFilter).tone].dark : TONES[actionMeta(actionFilter).tone].chip}`}>{actionMeta(actionFilter).label}<button type="button" onClick={() => setActionFilter('')} aria-label="Olib tashlash"><LuX size={11} /></button></span>}
                        {warehouseFilter && <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-semibold ${isDark ? 'border-white/10 text-slate-200' : 'border-slate-200 text-slate-700'}`}><LuWarehouse size={11} />{warehouseName[warehouseFilter] || 'Ombor'}<button type="button" onClick={() => setWarehouseFilter('')} aria-label="Olib tashlash"><LuX size={11} /></button></span>}
                        {productFilter && <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-semibold ${isDark ? 'border-amber-400/30 bg-amber-400/10 text-amber-200' : 'border-amber-300 bg-amber-50 text-amber-800'}`}><LuBarcode size={11} />{productFilter.name}<button type="button" onClick={() => setProductFilter(null)} aria-label="Olib tashlash"><LuX size={11} /></button></span>}
                        {search && <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-semibold ${packBarcode ? (isDark ? 'border-violet-400/30 bg-violet-500/10 text-violet-200' : 'border-violet-300 bg-violet-50 text-violet-800') : (isDark ? 'border-white/10 text-slate-200' : 'border-slate-200 text-slate-700')}`}>{packBarcode ? <LuBarcode size={11} /> : <LuSearch size={11} />}{packBarcode ? `Pachka ${packBarcode} tarixi` : `«${search}»`}<button type="button" onClick={() => setSearch('')} aria-label="Olib tashlash"><LuX size={11} /></button></span>}
                        <span className="ml-auto">{formatNumber(filtered.length)} ta ko‘rsatilmoqda{search ? ' (yuklanganlar ichidan)' : ''}</span>
                    </div>
                )}
            </div>

            {/* ── Ro‘yxat ── */}
            <div className={`rounded-2xl border shadow-md overflow-hidden ${panel}`}>
                {isLoading || (isFetching && transactions.length === 0) ? (
                    <div className="flex flex-col gap-2 p-4">
                        {Array.from({ length: 8 }).map((_, i) => <div key={i} className={`h-14 animate-pulse rounded-xl ${isDark ? 'bg-white/5' : 'bg-slate-100'}`} />)}
                    </div>
                ) : isError ? (
                    emptyState('Tarixni yuklab bo‘lmadi', 'Sahifani yangilab ko‘ring')
                ) : filtered.length === 0 ? (
                    emptyState(hasFilters ? 'Shart bo‘yicha yozuv topilmadi' : 'Hozircha harakatlar yo‘q', hasFilters ? 'Filtrlarni o‘zgartiring yoki tozalang' : undefined)
                ) : (
                    <>
                        {/* Desktop: jadval, kunlar bo‘yicha */}
                        <div className="hidden md:block overflow-x-auto" style={{ opacity: isFetching && !loadingMore ? 0.6 : 1, transition: 'opacity .15s' }}>
                            <table className="w-full min-w-[900px] text-sm">
                                <thead>
                                    <tr className={`text-left text-[11px] font-semibold uppercase tracking-wider ${muted} ${isDark ? 'bg-white/[0.03]' : 'bg-slate-50'}`}>
                                        <th className="px-4 py-3 w-12">№</th>
                                        <th className="px-4 py-3 w-24">Vaqt</th>
                                        <th className="px-4 py-3 w-44">Tur</th>
                                        <th className="px-4 py-3">Mahsulot</th>
                                        <th className="px-4 py-3 w-44">Ombor</th>
                                        <th className="px-4 py-3 text-right w-48">Miqdor</th>
                                        <th className="px-4 py-3 w-36">Manba</th>
                                        <th className="px-4 py-3 w-16 text-center" title="Pachka yorliqlari — kirim yozuvi bilan kirgan va omborda turgan pachkalarga">Yorliq</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {groups.map(([day, rows]) => {
                                        const startIdx = filtered.indexOf(rows[0]);
                                        return [
                                            <tr key={`day-${day}`}>
                                                <td colSpan={8} className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-y ${line} ${isDark ? 'bg-white/[0.02] text-amber-300' : 'bg-amber-50/60 text-amber-700'}`}>
                                                    {dayLabel(day)} <span className={`ml-2 font-semibold normal-case tracking-normal ${muted}`}>· {rows.length} ta harakat</span>
                                                </td>
                                            </tr>,
                                            ...rows.map((t, i) => {
                                                const meta = actionMeta(t.action);
                                                return (
                                                    <tr key={t.id} className={`border-b ${line} transition-colors ${rowHov}`}>
                                                        <td className={`px-4 py-3 text-xs ${muted}`}>{startIdx + i + 1}</td>
                                                        <td className={`px-4 py-3 whitespace-nowrap font-semibold tabular-nums ${head}`}>{formatTime(t.createdAt)}</td>
                                                        <td className="px-4 py-3"><ActionBadge action={t.action} isDark={isDark} /></td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <ProductImage imageUrl={productImageUrl(t.productId)} version={t.productId} name={t.productName} size={40} radius="lg" />
                                                                <div className="min-w-0">
                                                                    <button type="button" onClick={() => setProductFilter({ id: t.productId, name: t.productName })} title="Faqat shu mahsulot tarixini ko‘rsatish"
                                                                        className={`block max-w-full truncate text-left font-semibold hover:text-amber-500 hover:underline ${head}`}>{t.productName}</button>
                                                                    {t.productBarcode && <p className={`inline-flex items-center gap-1 font-mono text-[11px] ${muted}`}><LuBarcode size={11} />{t.productBarcode}</p>}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className={`px-4 py-3 text-sm ${muted}`}>
                                                            {t.action === 'PRODUCE'
                                                                ? <span className="inline-flex items-center gap-1.5"><LuFactory size={13} /> Omborga hali kirmagan</span>
                                                                : <span className="inline-flex items-center gap-1.5"><LuWarehouse size={13} /> {warehouseName[t.warehouseId] || '—'}</span>}
                                                            {t.counterpartWarehouseId && <p className="text-[11px] mt-0.5">{meta.sign === '+' ? 'qayerdan' : 'qayerga'}: {warehouseName[t.counterpartWarehouseId] || '—'}</p>}
                                                        </td>
                                                        <td className="px-4 py-3"><Qty t={t} isDark={isDark} /></td>
                                                        <td className={`px-4 py-3 text-xs ${muted}`}>
                                                            {t.salesOrderId
                                                                ? <Link to={`/staff/orders/${t.salesOrderId}`} className="inline-flex items-center gap-1 font-semibold text-amber-500 hover:underline"><LuClipboardList size={12} /> Buyurtma</Link>
                                                                : t.transferId ? 'Ko‘chirish' : t.action === 'PRODUCE' ? 'Stanok' : 'Qo‘lda'}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            {/* Yorliq — pachka bilan kirgan yozuv uchun (stanokdan kirim, qaytarish). Qo‘lda kirim donaviy — pachkasi yo‘q */}
                                                            {t.action === 'IN' && t.enteredUnit === 'PACK' && <LabelPrintButton transactionId={t.id} productId={t.productId} productName={t.productName} />}
                                                        </td>
                                                    </tr>
                                                );
                                            }),
                                        ];
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobil: kartalar */}
                        <div className={`md:hidden divide-y ${isDark ? 'divide-white/[0.06]' : 'divide-slate-100'}`}>
                            {groups.map(([day, rows]) => (
                                <div key={day}>
                                    <div className={`px-4 py-2 text-xs font-bold uppercase tracking-wider ${isDark ? 'bg-white/[0.02] text-amber-300' : 'bg-amber-50/60 text-amber-700'}`}>{dayLabel(day)}</div>
                                    {rows.map((t) => (
                                        <div key={t.id} className="flex items-start gap-3 px-4 py-3">
                                            <ProductImage imageUrl={productImageUrl(t.productId)} version={t.productId} name={t.productName} size={44} radius="lg" />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <button type="button" onClick={() => setProductFilter({ id: t.productId, name: t.productName })} className={`text-left font-semibold text-sm hover:text-amber-500 ${head}`}>{t.productName}</button>
                                                    <Qty t={t} isDark={isDark} />
                                                </div>
                                                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                                                    <ActionBadge action={t.action} isDark={isDark} />
                                                    <span className={`text-xs ${muted}`}>{formatTime(t.createdAt)}</span>
                                                    <span className={`text-xs ${muted}`}>{t.action === 'PRODUCE' ? 'Omborga kirmagan' : (warehouseName[t.warehouseId] || '—')}</span>
                                                </div>
                                            </div>
                                            {t.action === 'IN' && t.enteredUnit === 'PACK' && <LabelPrintButton transactionId={t.id} productId={t.productId} productName={t.productName} />}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>

                        <div className={`border-t ${line}`}>
                            <InfiniteSentinel sentinelRef={sentinelRef} hasMore={hasMore} loadingMore={loadingMore} loaded={transactions.length} total={pagination.totalElements ?? transactions.length} unit="ta yozuv" onLoadMore={loadMore} />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
