import { useEffect, useMemo, useState } from 'react';
import {
    LuChartNoAxesCombined,
    LuClipboardList,
    LuInbox,
    LuLoaderCircle,
    LuPackage,
    LuShoppingCart,
    LuTrendingUp,
    LuTrophy,
    LuCalendarDays,
    LuRefreshCw,
    LuAward,
} from 'react-icons/lu';
import { useAppTheme } from '../../../theme/tokens';
import { useGetTopProductsQuery } from '../../../store/services/salesOrder.api';
import { formatNumber } from '../../ui/number-format';
import { Alert } from '../../Other/UI/Alert/Alert';

/* ──────────────────────────────────────────────────────────────── */
/*  Дата-хелперы                                                    */
/* ──────────────────────────────────────────────────────────────── */
const toISO = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

const todayISO = () => toISO(new Date());

const startOfMonthISO = () => {
    const d = new Date();
    return toISO(new Date(d.getFullYear(), d.getMonth(), 1));
};

const endOfMonthISO = () => {
    const d = new Date();
    return toISO(new Date(d.getFullYear(), d.getMonth() + 1, 0));
};

const startOfPrevMonthISO = () => {
    const d = new Date();
    return toISO(new Date(d.getFullYear(), d.getMonth() - 1, 1));
};

const endOfPrevMonthISO = () => {
    const d = new Date();
    return toISO(new Date(d.getFullYear(), d.getMonth(), 0));
};

const daysAgoISO = (n) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return toISO(d);
};

const PRESETS = [
    { key: 'today', label: 'Bugun',         from: () => todayISO(),             to: () => todayISO() },
    { key: '7d',    label: 'Oxirgi 7 kun',  from: () => daysAgoISO(6),          to: () => todayISO() },
    { key: '30d',   label: 'Oxirgi 30 kun', from: () => daysAgoISO(29),         to: () => todayISO() },
    { key: 'month', label: 'Joriy oy',      from: () => startOfMonthISO(),      to: () => endOfMonthISO() },
    { key: 'prev',  label: "O'tgan oy",     from: () => startOfPrevMonthISO(),  to: () => endOfPrevMonthISO() },
];

const prettyDate = (iso) => {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    return `${d}.${m}.${y}`;
};

/* ──────────────────────────────────────────────────────────────── */
/*  Rank badge                                                      */
/* ──────────────────────────────────────────────────────────────── */
const RANK_STYLES = {
    1: {
        bg: 'linear-gradient(135deg, #FACC15 0%, #EAB308 100%)',
        color: '#422006',
        ring: 'ring-4 ring-amber-400/30',
    },
    2: {
        bg: 'linear-gradient(135deg, #E2E8F0 0%, #94A3B8 100%)',
        color: '#0F172A',
        ring: 'ring-4 ring-slate-400/20',
    },
    3: {
        bg: 'linear-gradient(135deg, #F59E0B 0%, #B45309 100%)',
        color: '#FEF3C7',
        ring: 'ring-4 ring-orange-500/20',
    },
};

function RankBadge({ rank, size = 'md' }) {
    const style = RANK_STYLES[rank];
    const isTop = Boolean(style);

    const dim = size === 'lg' ? 'h-12 w-12 text-lg' : 'h-8 w-8 text-sm';

    if (isTop) {
        return (
            <span
                className={`flex shrink-0 items-center justify-center rounded-full font-extrabold shadow-md ${dim} ${style.ring}`}
                style={{ background: style.bg, color: style.color }}
            >
                {rank}
            </span>
        );
    }
    return (
        <span
            className={`flex shrink-0 items-center justify-center rounded-full border border-[#e2e8f0] bg-[#f8fafc] font-bold text-[#64748b] dark:border-white/10 dark:bg-white/5 dark:text-slate-300 ${dim}`}
        >
            {rank}
        </span>
    );
}

/* ──────────────────────────────────────────────────────────────── */
/*  Подиум — топ-3                                                  */
/* ──────────────────────────────────────────────────────────────── */
function PodiumCard({ product, rank, totalRevenue, isDark }) {
    const head = isDark ? 'text-white' : 'text-[#0f172a]';
    const muted = isDark ? 'text-[#94a3b8]' : 'text-[#64748b]';
    const panel = isDark ? 'border-white/10 bg-[#141C2B]' : 'border-[#e2e8f0] bg-white';
    const innerBg = isDark ? 'bg-white/[0.02]' : 'bg-[#f8fafc]';

    const revenue = Number(product.revenue) || 0;
    const quantity = Number(product.quantity) || 0;
    const orders = Number(product.orderCount) || 0;
    const percent = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;

    const topGradient =
        rank === 1 ? 'from-amber-400/20 via-amber-400/5 to-transparent'
        : rank === 2 ? 'from-slate-400/20 via-slate-400/5 to-transparent'
        : 'from-orange-500/20 via-orange-500/5 to-transparent';

    return (
        <div
            className={`relative overflow-hidden rounded-2xl border p-5 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${panel}`}
        >
            <div className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${topGradient}`} />

            <div className="relative flex items-start justify-between gap-3">
                <RankBadge rank={rank} size="lg" />
            </div>

            <div className="relative mt-4">
                <p className={`line-clamp-2 min-h-[2.5rem] text-base font-bold leading-snug ${head}`}>
                    {product.productName || 'Mahsulot'}
                </p>
            </div>

            <div className="relative mt-4 space-y-3">
                <div className={`rounded-xl border p-3 ${isDark ? 'border-white/5' : 'border-[#f1f5f9]'} ${innerBg}`}>
                    <div className="flex items-center justify-between">
                        <span className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ${muted}`}>
                            <LuTrendingUp size={12} /> Tushum
                        </span>
                        <span className={`text-sm font-extrabold ${head}`}>
                            {formatNumber(revenue)} <span className={`text-[11px] font-normal ${muted}`}>so‘m</span>
                        </span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/60 dark:bg-white/10">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500"
                            style={{ width: `${Math.min(percent, 100)}%` }}
                        />
                    </div>
                    <p className={`mt-1.5 text-right text-[10px] font-semibold ${muted}`}>
                        {percent.toFixed(1)}% ulush
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div className={`rounded-xl border p-3 ${isDark ? 'border-white/5' : 'border-[#f1f5f9]'} ${innerBg}`}>
                        <p className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${muted}`}>
                            <LuPackage size={11} /> Sotildi
                        </p>
                        <p className={`mt-1 text-sm font-extrabold ${head}`}>
                            {formatNumber(quantity)}
                        </p>
                        <p className={`text-[10px] ${muted}`}>dona</p>
                    </div>
                    <div className={`rounded-xl border p-3 ${isDark ? 'border-white/5' : 'border-[#f1f5f9]'} ${innerBg}`}>
                        <p className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${muted}`}>
                            <LuClipboardList size={11} /> Zakaz
                        </p>
                        <p className={`mt-1 text-sm font-extrabold ${head}`}>
                            {formatNumber(orders)}
                        </p>
                        <p className={`text-[10px] ${muted}`}>ta</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ──────────────────────────────────────────────────────────────── */
/*  KPI карточка                                                    */
/* ──────────────────────────────────────────────────────────────── */
function KpiCard({ Icon, label, value, suffix, tone, isDark }) {
    const head = isDark ? 'text-white' : 'text-[#0f172a]';
    const muted = isDark ? 'text-[#94a3b8]' : 'text-[#64748b]';
    const inner = isDark ? 'border-white/5 bg-[#141C2B]' : 'border-[#e2e8f0] bg-white';

    const toneMap = {
        amber:   { color: 'text-amber-500',   bg: 'bg-amber-400/10' },
        emerald: { color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        violet:  { color: 'text-violet-500',  bg: 'bg-violet-500/10' },
        blue:    { color: 'text-blue-500',    bg: 'bg-blue-500/10' },
    };
    const t = toneMap[tone] || toneMap.amber;

    return (
        <div className={`rounded-2xl border p-5 shadow-md ${inner}`}>
            <div className="flex items-center gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${t.bg} ${t.color}`}>
                    <Icon size={18} />
                </span>
                <p className={`text-[11px] font-bold uppercase tracking-wider ${muted}`}>{label}</p>
            </div>
            <p className={`mt-3 text-2xl font-extrabold leading-tight tabular-nums ${head}`}>
                {value}
                {suffix && <span className={`ml-1.5 text-sm font-semibold ${muted}`}>{suffix}</span>}
            </p>
        </div>
    );
}

/* ──────────────────────────────────────────────────────────────── */
/*  Главный компонент                                               */
/* ──────────────────────────────────────────────────────────────── */
export default function ProductChart() {
    const { isDark } = useAppTheme();

    const [dateFrom, setDateFrom] = useState(() => startOfMonthISO());
    const [dateTo, setDateTo] = useState(() => endOfMonthISO());
    const [activePreset, setActivePreset] = useState('month');

    const {
        data: topProducts = [],
        isFetching,
        isError,
        error,
        refetch,
    } = useGetTopProductsQuery(
        { dateFrom, dateTo },
        { skip: !dateFrom || !dateTo },
    );

    useEffect(() => {
        if (isError) {
            Alert(error?.data?.message || 'Hisobotni yuklashda xatolik', 'error');
        }
    }, [isError, error]);

    /* ── totals ── */
    const totals = useMemo(() => topProducts.reduce(
        (acc, p) => {
            acc.orders += Number(p.orderCount) || 0;
            acc.quantity += Number(p.quantity) || 0;
            acc.revenue += Number(p.revenue) || 0;
            return acc;
        },
        { orders: 0, quantity: 0, revenue: 0 },
    ), [topProducts]);

    const avgCheck = totals.orders > 0 ? totals.revenue / totals.orders : 0;
    const top3 = topProducts.slice(0, 3);
    const rest = topProducts.slice(3);

    /* ── presets ── */
    const applyPreset = (preset) => {
        setActivePreset(preset.key);
        setDateFrom(preset.from());
        setDateTo(preset.to());
    };

    const handleDateChange = (which, value) => {
        setActivePreset(null);
        if (which === 'from') setDateFrom(value);
        else setDateTo(value);
    };

    /* ── theme ── */
    const panel = isDark ? 'border-white/10 bg-[#141C2B]' : 'border-[#e2e8f0] bg-white';
    const head = isDark ? 'text-white' : 'text-[#0f172a]';
    const muted = isDark ? 'text-[#94a3b8]' : 'text-[#64748b]';
    const line = isDark ? 'border-[#334155]/60' : 'border-[#f1f5f9]';
    const divider = isDark ? 'divide-[#334155]/50' : 'divide-[#f1f5f9]';
    const inputCx = [
        'h-11 rounded-xl border px-4 text-sm outline-none transition-all duration-200',
        isDark
            ? 'border-[#334155] bg-[#1e293b]/80 text-white placeholder:text-[#64748b] focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20'
            : 'border-[#e2e8f0] bg-white text-[#0f172a] placeholder:text-[#94a3b8] focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20',
    ].join(' ');

    /* ── initial loading ── */
    const isInitialLoading = isFetching && topProducts.length === 0 && !isError;

    return (
        <div className="flex w-full flex-col gap-4 py-2">

            {/* ═══════════════ HEADER ═══════════════ */}
            <div className={`relative overflow-hidden rounded-2xl border px-5 py-5 shadow-md ${panel}`}>
                <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-amber-400/8 to-transparent" />
                <div className="relative flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-400/10 text-amber-500">
                            <LuTrophy size={22} />
                        </span>
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-widest text-amber-500">
                                Analitika · Savdo hisoboti
                            </p>
                            <h1 className={`mt-1 text-2xl font-bold leading-tight tracking-tight ${head}`}>
                                Eng ko‘p sotilgan mahsulotlar
                            </h1>
                            <p className={`mt-1 text-xs ${muted}`}>
                                Faqat <span className="font-semibold text-emerald-500">tasdiqlangan (CONFIRMED)</span> va{' '}
                                <span className="font-semibold text-emerald-500">to‘liq to‘langan (PAID)</span> buyurtmalar asosida
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="inline-flex items-center gap-2 rounded-xl border border-[#e2e8f0] px-4 py-2.5 text-sm font-semibold text-[#64748b] transition hover:bg-[#f1f5f9] disabled:opacity-50 dark:border-[#334155] dark:text-[#94a3b8] dark:hover:bg-[#1e293b]"
                    >
                        <LuRefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />
                        {isFetching ? 'Yuklanmoqda…' : 'Yangilash'}
                    </button>
                </div>
            </div>

            {/* ═══════════════ FILTERS ═══════════════ */}
            <div className={`rounded-2xl border p-5 shadow-md ${panel}`}>
                <div className="flex flex-wrap items-end gap-3">
                    <div className="w-full sm:w-44">
                        <label className={`mb-1.5 flex items-center gap-1.5 text-xs font-semibold ${muted}`}>
                            <LuCalendarDays size={12} /> Boshlanish
                        </label>
                        <input
                            type="date"
                            value={dateFrom}
                            max={dateTo || undefined}
                            onChange={(e) => handleDateChange('from', e.target.value)}
                            className={`${inputCx} w-full`}
                        />
                    </div>
                    <div className="w-full sm:w-44">
                        <label className={`mb-1.5 flex items-center gap-1.5 text-xs font-semibold ${muted}`}>
                            <LuCalendarDays size={12} /> Tugash
                        </label>
                        <input
                            type="date"
                            value={dateTo}
                            min={dateFrom || undefined}
                            onChange={(e) => handleDateChange('to', e.target.value)}
                            className={`${inputCx} w-full`}
                        />
                    </div>

                    <div className="flex flex-1 flex-wrap items-center gap-2">
                        {PRESETS.map((preset) => {
                            const isActive = activePreset === preset.key;
                            return (
                                <button
                                    key={preset.key}
                                    type="button"
                                    onClick={() => applyPreset(preset)}
                                    className={`h-11 rounded-xl px-4 text-sm font-semibold transition ${
                                        isActive
                                            ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20'
                                            : isDark
                                            ? 'border border-[#334155] text-[#94a3b8] hover:bg-[#1e293b] hover:text-white'
                                            : 'border border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]'
                                    }`}
                                >
                                    {preset.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className={`mt-4 flex flex-wrap items-center gap-2 border-t pt-4 ${line}`}>
                    <span className={`text-xs ${muted}`}>
                        Davr: <span className={`font-semibold ${head}`}>{prettyDate(dateFrom)}</span>
                        <span className={`mx-1.5 ${muted}`}>—</span>
                        <span className={`font-semibold ${head}`}>{prettyDate(dateTo)}</span>
                    </span>
                    <span className={`ml-auto text-xs ${muted}`}>
                        Topilgan mahsulotlar: <span className={`font-semibold ${head}`}>{topProducts.length}</span>
                    </span>
                </div>
            </div>

            {/* ═══════════════ CONTENT ═══════════════ */}
            {isInitialLoading ? (
                <div className={`flex items-center justify-center gap-3 rounded-2xl border py-16 text-sm shadow-md ${panel} ${muted}`}>
                    <LuLoaderCircle size={18} className="animate-spin text-amber-500" />
                    Hisobot yuklanmoqda…
                </div>
            ) : isError ? (
                <div className={`flex flex-col items-center gap-3 rounded-2xl border py-16 shadow-md ${panel}`}>
                    <LuInbox size={36} strokeWidth={1.5} className="text-rose-500" />
                    <p className="text-sm font-semibold text-rose-500">
                        {error?.data?.message || 'Hisobotni yuklab bo‘lmadi'}
                    </p>
                    <button
                        type="button"
                        onClick={() => refetch()}
                        className="rounded-xl border border-rose-500/30 px-4 py-2 text-sm font-semibold text-rose-500 transition hover:bg-rose-500/10"
                    >
                        Qayta urinish
                    </button>
                </div>
            ) : topProducts.length === 0 ? (
                <div className={`flex flex-col items-center gap-3 rounded-2xl border py-16 shadow-md ${panel}`}>
                    <LuInbox size={40} strokeWidth={1.5} className={muted} />
                    <div className="text-center">
                        <p className={`text-sm font-semibold ${head}`}>Bu davrda ma’lumot topilmadi</p>
                        <p className={`mt-1 text-xs ${muted}`}>
                            Faqat tasdiqlangan va to‘liq to‘langan buyurtmalar hisobga olinadi
                        </p>
                    </div>
                </div>
            ) : (
                <>
                    {/* ── KPI cards ── */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <KpiCard
                            Icon={LuTrendingUp}
                            label="Jami tushum"
                            value={formatNumber(totals.revenue)}
                            suffix="so‘m"
                            tone="amber"
                            isDark={isDark}
                        />
                        <KpiCard
                            Icon={LuShoppingCart}
                            label="Buyurtmalar"
                            value={formatNumber(totals.orders)}
                            suffix="ta"
                            tone="violet"
                            isDark={isDark}
                        />
                        <KpiCard
                            Icon={LuPackage}
                            label="Sotilgan dona"
                            value={formatNumber(totals.quantity)}
                            suffix="dona"
                            tone="emerald"
                            isDark={isDark}
                        />
                        <KpiCard
                            Icon={LuChartNoAxesCombined}
                            label="O‘rtacha chek"
                            value={formatNumber(avgCheck)}
                            suffix="so‘m"
                            tone="blue"
                            isDark={isDark}
                        />
                    </div>

                    {/* ── Podium (top-3) ── */}
                    {top3.length > 0 && (
                        <div className={`rounded-2xl border p-5 shadow-md ${panel}`}>
                            <div className="mb-4 flex items-center gap-2">
                                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400/10 text-amber-500">
                                    <LuAward size={15} />
                                </span>
                                <h2 className={`text-sm font-bold ${head}`}>TOP 3 yetakchi</h2>
                                <span className={`text-xs ${muted}`}>· eng ko‘p sotilgan mahsulotlar</span>
                            </div>

                            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                {top3.map((product, idx) => (
                                    <PodiumCard
                                        key={product.productId || idx}
                                        product={product}
                                        rank={idx + 1}
                                        totalRevenue={totals.revenue}
                                        isDark={isDark}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Table (rest) ── */}
                    {rest.length > 0 && (
                        <div className={`overflow-hidden rounded-2xl border shadow-md ${panel}`}>
                            <div className={`flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 ${line}`}>
                                <div className="flex items-center gap-2">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400/10 text-amber-500">
                                        <LuClipboardList size={15} />
                                    </span>
                                    <h2 className={`text-sm font-bold ${head}`}>To‘liq ro‘yxat</h2>
                                    <span className={`text-xs ${muted}`}>· TOP {topProducts.length}</span>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[900px] text-sm">
                                    <thead>
                                        <tr className={`text-left text-[11px] font-semibold uppercase tracking-wider ${muted} ${
                                            isDark ? 'bg-[#0f172a]/40' : 'bg-[#f8fafc]'
                                        }`}>
                                            <th className="w-16 px-5 py-3.5 text-center">#</th>
                                            <th className="px-3 py-3.5">Mahsulot</th>
                                            <th className="w-32 px-3 py-3.5 text-right">Zakazlar</th>
                                            <th className="w-32 px-3 py-3.5 text-right">Sotilgan dona</th>
                                            <th className="w-44 px-3 py-3.5 text-right">Tushum</th>
                                            <th className="w-64 px-5 py-3.5">Ulush</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${divider}`}>
                                        {rest.map((product, idx) => {
                                            const rank = idx + 4;
                                            const revenue = Number(product.revenue) || 0;
                                            const quantity = Number(product.quantity) || 0;
                                            const orders = Number(product.orderCount) || 0;
                                            const percent = totals.revenue > 0 ? (revenue / totals.revenue) * 100 : 0;

                                            return (
                                                <tr
                                                    key={product.productId || rank}
                                                    className={`transition-colors ${
                                                        isDark ? 'hover:bg-amber-400/[0.04]' : 'hover:bg-amber-50/40'
                                                    }`}
                                                >
                                                    <td className="px-5 py-4">
                                                        <div className="flex justify-center">
                                                            <RankBadge rank={rank} />
                                                        </div>
                                                    </td>

                                                    <td className="px-3 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                                                                isDark ? 'bg-white/5 text-slate-300' : 'bg-slate-100 text-slate-500'
                                                            }`}>
                                                                <LuPackage size={15} />
                                                            </span>
                                                            <p className={`truncate text-sm font-semibold ${head}`}>
                                                                {product.productName || 'Mahsulot'}
                                                            </p>
                                                        </div>
                                                    </td>

                                                    <td className={`px-3 py-4 text-right text-sm font-semibold tabular-nums ${head}`}>
                                                        {formatNumber(orders)}
                                                        <span className={`ml-1 text-[11px] font-normal ${muted}`}>ta</span>
                                                    </td>

                                                    <td className={`px-3 py-4 text-right text-sm font-bold tabular-nums ${head}`}>
                                                        {formatNumber(quantity)}
                                                        <span className={`ml-1 text-[11px] font-normal ${muted}`}>dona</span>
                                                    </td>

                                                    <td className={`px-3 py-4 text-right text-sm font-bold tabular-nums ${head}`}>
                                                        {formatNumber(revenue)}
                                                        <span className={`ml-1 text-[11px] font-normal ${muted}`}>so‘m</span>
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200/60 dark:bg-white/10">
                                                                <div
                                                                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500"
                                                                    style={{ width: `${Math.min(percent, 100)}%` }}
                                                                />
                                                            </div>
                                                            <span className={`w-12 shrink-0 text-right text-xs font-bold tabular-nums ${head}`}>
                                                                {percent.toFixed(1)}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className={`flex flex-wrap items-center justify-end gap-4 border-t px-5 py-4 ${line} ${
                                isDark ? 'bg-white/[0.02]' : 'bg-[#f8fafc]'
                            }`}>
                                <div className="flex items-center gap-2">
                                    <span className={`text-sm ${muted}`}>Jami tushum:</span>
                                    <span className={`text-xl font-extrabold tabular-nums ${head}`}>
                                        {formatNumber(totals.revenue)}
                                    </span>
                                    <span className={`text-sm font-semibold ${muted}`}>so‘m</span>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}