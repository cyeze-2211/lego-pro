import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    LuArrowLeft,
    LuCalendarClock,
    LuChartNoAxesCombined,
    LuCircleAlert,
    LuClipboardList,
    LuHistory,
    LuLoaderCircle,
    LuPackage,
    LuPhone,
    LuSave,
    LuUserRound,
    LuPencil,
    LuX,
    LuTrendingUp,
    LuTrendingDown,
    LuCircleCheck,
    LuCircleX,
    LuChevronRight,
    LuWallet,
    LuClock,
} from 'react-icons/lu';
import { useAppTheme } from '../../../theme/tokens';
import {
    useGetSalesOrderByIdQuery,
    useGetSalesOrdersQuery,
    useLoadSalesOrderMutation,
    useRejectSalesOrderMutation,
    useUpdateSalesOrderPricesMutation,
    useConfirmSalesOrderMutation,
} from '../../../store/services/salesOrder.api';
import { useGetCustomerByIdQuery } from '../../../store/services/customer.api';
import Loading from '../../Other/UI/Loadings/Loading';
import { Alert } from '../../Other/UI/Alert/Alert';
import { STATUS_LABEL, statusCx } from '../__components/statusBadge';

const ORDER_HISTORY_SIZE = 30;

/* ──────────────────────────────────────────────────────────────── */
/*  Формат числа: 100 000 / 1 234 567.89 / -50 000                  */
/* ──────────────────────────────────────────────────────────────── */
function fmtNumber(value, { decimals = 2 } = {}) {
    const num = Number(value);
    if (!Number.isFinite(num)) return '0';

    const isNegative = num < 0;
    const abs = Math.abs(num);

    const rounded = decimals === 0
        ? Math.round(abs)
        : Math.round(abs * 10 ** decimals) / 10 ** decimals;

    const [intPart, decPart] = rounded.toFixed(decimals).split('.');

    const trimmedDec = decPart ? decPart.replace(/0+$/, '') : '';
    const intWithSpaces = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

    const result = trimmedDec ? `${intWithSpaces}.${trimmedDec}` : intWithSpaces;

    return isNegative ? `-${result}` : result;
}

/* ──────────────────────────────────────────────────────────────── */
/*  Формат ввода цены: "200000" → "200 000", "1234.5" → "1 234.5"   */
/* ──────────────────────────────────────────────────────────────── */
function formatPriceInput(raw) {
    if (raw === '' || raw === null || raw === undefined) return '';

    let cleaned = String(raw)
        .replace(/,/g, '.')
        .replace(/[^\d.]/g, '');

    const parts = cleaned.split('.');
    if (parts.length > 2) {
        cleaned = `${parts[0]}.${parts.slice(1).join('')}`;
    }

    let [intPart, decPart] = cleaned.split('.');
    intPart = (intPart ?? '').replace(/^0+(?=\d)/, '');

    const intWithSpaces = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

    if (decPart === undefined) return intWithSpaces;
    return `${intWithSpaces}.${decPart}`;
}

/* «200 000.5» → 200000.5, «» → NaN */
function parsePriceInput(value) {
    if (value === '' || value === null || value === undefined) return NaN;
    const cleaned = String(value).replace(/\s/g, '');
    if (cleaned === '' || cleaned === '.') return NaN;
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : NaN;
}

const formatDateTime = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('uz-UZ');
};

const getItemUnit = (item) => String(item.unit ?? 'PIECE').toUpperCase();
const getEnteredQuantity = (item) => Number(item.enteredQuantity ?? item.quantity) || 0;

const getDraftPrice = (item, draft) => {
    const value = draft[item.id];
    if (value === undefined) return Number(item.unitPrice) || 0;
    const parsed = parsePriceInput(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const calculateHistoricalPrices = (orders, currentOrder) => {
    const pricesByProductUnit = new Map();
    const pricesByProduct = new Map();

    for (const order of orders) {
        if (order.id === currentOrder.id) continue;
        for (const item of order.items ?? []) {
            const price = Number(item.unitPrice);
            if (!Number.isFinite(price) || price < 0) continue;

            const productPrices = pricesByProduct.get(item.productId) ?? [];
            productPrices.push({ price, createdAt: order.createdAt, unit: getItemUnit(item) });
            pricesByProduct.set(item.productId, productPrices);

            const key = `${item.productId}:${getItemUnit(item)}`;
            const unitPrices = pricesByProductUnit.get(key) ?? [];
            unitPrices.push({ price, createdAt: order.createdAt });
            pricesByProductUnit.set(key, unitPrices);
        }
    }

    return currentOrder.items.map((item) => {
        const unitPrices = pricesByProductUnit.get(`${item.productId}:${getItemUnit(item)}`) ?? [];
        const comparablePrices = unitPrices.length
            ? unitPrices
            : pricesByProduct.get(item.productId) ?? [];
        const latest = [...comparablePrices].sort(
            (a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0),
        )[0];
        const average = comparablePrices.length
            ? comparablePrices.reduce((sum, entry) => sum + entry.price, 0) / comparablePrices.length
            : null;

        return {
            itemId: item.id,
            lastPrice: latest?.price ?? null,
            averagePrice: average,
            historyCount: comparablePrices.length,
        };
    });
};

export default function BuxgalterOrderDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isDark } = useAppTheme();
    const { data: order, isLoading, isError, error } = useGetSalesOrderByIdQuery(id, { skip: !id });
    const {
        data: customer,
        isLoading: isCustomerLoading,
        isError: isCustomerError,
        error: customerError,
    } = useGetCustomerByIdQuery(
        order?.customerId,
        { skip: !order?.customerId },
    );
    const {
        data: customerOrdersData,
        isLoading: isHistoryLoading,
        isError: isHistoryError,
        refetch: refetchHistory,
    } = useGetSalesOrdersQuery(
        { customerId: order?.customerId, page: 0, size: ORDER_HISTORY_SIZE, sort: ['createdAt,DESC', 'id,DESC'] },
        { skip: !order?.customerId },
    );
    const [updatePrices, { isLoading: isSavingPrices }] = useUpdateSalesOrderPricesMutation();
    const [confirmOrder, { isLoading: isConfirmingOrder }] = useConfirmSalesOrderMutation();
    const [loadOrder, { isLoading: isLoadingOrder }] = useLoadSalesOrderMutation();
    const [rejectOrder, { isLoading: isRejectingOrder }] = useRejectSalesOrderMutation();
    const [priceDraft, setPriceDraft] = useState({});
    const [isEditingPrices, setIsEditingPrices] = useState(false);

    /* ── theme ── */
    const panel = isDark ? 'border-white/10 bg-[#141C2B]' : 'border-[#e2e8f0] bg-white';
    const inner = isDark ? 'border-white/5 bg-white/[0.02]' : 'border-[#f1f5f9] bg-[#f8fafc]';
    const head = isDark ? 'text-white' : 'text-[#0f172a]';
    const muted = isDark ? 'text-[#94a3b8]' : 'text-[#64748b]';
    const line = isDark ? 'border-[#334155]/60' : 'border-[#f1f5f9]';
    const field = isDark
        ? 'border-[#334155] bg-[#0f172a] text-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20'
        : 'border-[#e2e8f0] bg-white text-[#0f172a] focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20';
    const ghostBtn = isDark
        ? 'border-[#334155] text-[#94a3b8] hover:bg-[#1e293b] hover:text-white'
        : 'border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]';

    /* ── основная кнопка: главный цвет (amber) + чёрный текст ── */
    const primaryBtn = 'inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-md shadow-amber-400/20 transition hover:-translate-y-0.5 hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0';
    const primaryBtnSm = 'inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-sm font-bold text-slate-950 shadow-md shadow-amber-400/20 transition hover:-translate-y-0.5 hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0';

    const customerOrders = useMemo(
        () => (customerOrdersData?.items ?? []).filter((entry) => entry.id !== order?.id),
        [customerOrdersData, order?.id],
    );
    const priceHistory = useMemo(
        () => order && calculateHistoricalPrices(customerOrdersData?.items ?? [], order),
        [customerOrdersData, order],
    );
    const priceHistoryByItem = useMemo(
        () => new Map((priceHistory ?? []).map((item) => [item.itemId, item])),
        [priceHistory],
    );

    const orderTotal = useMemo(
        () => (order?.items ?? []).reduce(
            (sum, item) => sum + (Number(item.quantity) || 0) * getDraftPrice(item, priceDraft),
            0,
        ),
        [order, priceDraft],
    );

    const changedItems = isEditingPrices
        ? (order?.items ?? []).filter((item) => {
            const parsed = parsePriceInput(priceDraft[item.id]);
            const safe = Number.isFinite(parsed) ? parsed : NaN;
            return safe !== Number(item.unitPrice);
        })
        : [];
    const changedTotal = (order?.items ?? []).reduce(
        (sum, item) => sum + (Number(item.quantity) || 0) * getDraftPrice(item, priceDraft),
        0,
    );
    const originalTotal = Number(order?.totalAmount) || 0;
    const totalDelta = changedTotal - originalTotal;
    const canChangePrices = order?.status === 'LOADED';

    const beginPriceEdit = () => {
        setPriceDraft(Object.fromEntries(
            (order.items ?? []).map((item) => [item.id, fmtNumber(item.unitPrice ?? 0)]),
        ));
        setIsEditingPrices(true);
    };

    const savePrices = async () => {
        const items = (order.items ?? []).map((item) => ({
            itemId: item.id,
            unitPrice: parsePriceInput(priceDraft[item.id]),
        }));

        const hasEmpty = (order.items ?? []).some(
            (item) => !String(priceDraft[item.id] ?? '').trim(),
        );
        const hasInvalid = items.some(
            (item) => !Number.isFinite(item.unitPrice) || item.unitPrice < 0,
        );

        if (hasEmpty || hasInvalid) {
            Alert('Narx 0 dan kichik bo‘lmagan son bo‘lishi kerak', 'error');
            return;
        }

        try {
            await updatePrices({ id: order.id, data: { items } }).unwrap();
            Alert('Narxlar muvaffaqiyatli saqlandi', 'success');
            setIsEditingPrices(false);
            setPriceDraft({});
        } catch (saveError) {
            Alert(saveError?.data?.message || 'Narxlarni saqlashda xatolik', 'error');
        }
    };

    /* ── Yakuniy tasdiqlash: POST /sales-orders/{id}/confirm ── */
    const confirmCurrentOrder = async () => {
        if (changedItems.length) {
            Alert('Avval o‘zgartirilgan narxlarni saqlang', 'error');
            return;
        }
        try {
            await confirmOrder(order.id).unwrap();
            Alert('Buyurtma yakuniy tasdiqlandi', 'success');
        } catch (statusError) {
            Alert(statusError?.data?.message || 'Buyurtmani tasdiqlashda xatolik', 'error');
        }
    };

    const loadCurrentOrder = async () => {
        try {
            await loadOrder(order.id).unwrap();
            Alert('Buyurtma omborga yuklashga o‘tkazildi', 'success');
        } catch (loadError) {
            Alert(loadError?.data?.message || 'Buyurtmani yuklashda xatolik', 'error');
        }
    };

    const rejectCurrentOrder = async () => {
        if (!window.confirm('Ushbu buyurtmani rad etishni tasdiqlaysizmi?')) return;
        try {
            await rejectOrder({ id: order.id }).unwrap();
            Alert('Buyurtma rad etildi', 'success');
        } catch (rejectError) {
            Alert(rejectError?.data?.message || 'Buyurtmani rad etishda xatolik', 'error');
        }
    };

    const fmt = (value) => fmtNumber(value);

    if (isLoading) {
        return <div className="flex min-h-[60vh] items-center justify-center"><Loading /></div>;
    }

    if (isError || !order) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
                <LuCircleAlert size={34} className="text-rose-500" />
                <p className="text-lg text-rose-500">{error?.data?.message || 'Buyurtmani yuklashda xatolik'}</p>
                <button type="button" onClick={() => navigate('/zayavkachi/orders')} className="rounded-xl border px-4 py-2 text-sm font-semibold">
                    Buyurtmalar ro‘yxatiga qaytish
                </button>
            </div>
        );
    }

    return (
        <main className="flex w-full flex-col gap-4 py-2">

            {/* ═══════════════ HEADER ═══════════════ */}
            <header className={`relative overflow-hidden rounded-2xl border px-5 py-5 shadow-md ${panel}`}>
                <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-amber-400/8 to-transparent" />

                <div className="relative flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-400/10 text-amber-500">
                            <LuClipboardList size={22} />
                        </span>
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-widest text-amber-500">
                                Buxgalter · Buyurtma tahlili
                            </p>
                            <h1 className={`mt-1 text-2xl font-bold leading-tight tracking-tight ${head}`}>
                                {order.customerName || 'Buyurtma'}
                            </h1>
                            <div className={`mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs ${muted}`}>
                                <span className="font-mono font-semibold">
                                    #{order.id.slice(0, 8).toUpperCase()}
                                </span>
                                <span>·</span>
                                <span className="flex items-center gap-1">
                                    <LuClock size={11} />
                                    {formatDateTime(order.createdAt)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-3 py-1.5 text-xs font-bold ${statusCx(order.status)}`}>
                            {STATUS_LABEL[order.status] ?? order.status}
                        </span>

                        {order.status === 'LOADED' && (
                            <button
                                type="button"
                                onClick={confirmCurrentOrder}
                                disabled={isConfirmingOrder || changedItems.length > 0}
                                className={primaryBtn}
                            >
                                <LuCircleCheck size={16} />
                                {isConfirmingOrder ? 'Tasdiqlanmoqda…' : 'Tasdiqlash'}
                            </button>
                        )}
                        {order.status === 'CREATED' && (
                            <>
                             
                                <button
                                    type="button"
                                    onClick={rejectCurrentOrder}
                                    disabled={isLoadingOrder || isRejectingOrder}
                                    className="inline-flex items-center gap-2 rounded-xl border border-rose-500/30 px-4 py-2.5 text-sm font-bold text-rose-500 transition hover:bg-rose-500/10 disabled:opacity-50"
                                >
                                    <LuCircleX size={16} />
                                    {isRejectingOrder ? 'Rad etilmoqda…' : 'Rad etish'}
                                </button>
                            </>
                        )}

                        <button
                            type="button"
                            onClick={() => navigate('/zayavkachi/orders')}
                            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${ghostBtn}`}
                        >
                            <LuArrowLeft size={16} /> Orqaga
                        </button>
                    </div>
                </div>

                {/* Stats cards */}
                <div className="relative mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {[
                        {
                            label: 'Buyurtma summasi',
                            value: `${fmt(isEditingPrices ? orderTotal : order.totalAmount)} so‘m`,
                            Icon: LuChartNoAxesCombined,
                            tone: 'amber',
                        },
                        {
                            label: 'To‘langan',
                            value: `${fmt(order.paidAmount)} so‘m`,
                            Icon: LuWallet,
                            tone: 'emerald',
                        },
                        {
                            label: 'Qolgan qarz',
                            value: `${fmt(order.remainingDebt)} so‘m`,
                            Icon: LuCircleAlert,
                            tone: Number(order.remainingDebt) > 0 ? 'rose' : 'slate',
                        },
                        {
                            label: 'To‘lov holati',
                            value: order.paymentStatus === 'PAID' ? 'To‘langan' : order.paymentStatus === 'PARTIAL' ? 'Qismiy' : 'To‘lanmagan',
                            Icon: LuCalendarClock,
                            tone: order.paymentStatus === 'PAID' ? 'emerald' : order.paymentStatus === 'PARTIAL' ? 'amber' : 'rose',
                        },
                    ].map(({ label, value, Icon, tone }) => {
                        const toneMap = {
                            amber: { color: 'text-amber-500', bg: 'bg-amber-400/10' },
                            emerald: { color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                            rose: { color: 'text-rose-500', bg: 'bg-rose-500/10' },
                            slate: { color: muted, bg: isDark ? 'bg-white/5' : 'bg-slate-100' },
                        };
                        const t = toneMap[tone];
                        return (
                            <div key={label} className={`rounded-xl border p-4 ${inner}`}>
                                <div className="flex items-center gap-2">
                                    <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${t.bg} ${t.color}`}>
                                        <Icon size={14} />
                                    </span>
                                    <p className={`text-xs font-medium ${muted}`}>{label}</p>
                                </div>
                                <p className={`mt-2.5 text-base font-bold leading-tight ${head}`}>
                                    {value}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </header>

            {/* ═══════════════ PRODUCTS & PRICES ═══════════════ */}
            <section className={`overflow-hidden rounded-2xl border shadow-md ${panel}`}>
                <div className={`flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 ${line}`}>
                    <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/10 text-amber-500">
                            <LuPackage size={16} />
                        </span>
                        <div>
                            <h2 className={`text-sm font-bold ${head}`}>Mahsulotlar va narxlar</h2>
                            <p className={`mt-0.5 text-xs ${muted}`}>
                                Narxlar shu mijozning oldingi buyurtmalari bilan taqqoslanadi
                            </p>
                        </div>
                    </div>

                    {canChangePrices && !isEditingPrices && (
                        <button
                            type="button"
                            onClick={beginPriceEdit}
                            className={primaryBtnSm}
                        >
                            <LuPencil size={15} /> Narxlarni tahrirlash
                        </button>
                    )}
                    {isEditingPrices && (
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => { setPriceDraft({}); setIsEditingPrices(false); }}
                                disabled={isSavingPrices}
                                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${ghostBtn}`}
                            >
                                <LuX size={15} /> Bekor qilish
                            </button>
                            <button
                                type="button"
                                onClick={savePrices}
                                disabled={isSavingPrices || changedItems.length === 0}
                                className={primaryBtnSm}
                            >
                                {isSavingPrices ? <LuLoaderCircle className="animate-spin" size={15} /> : <LuSave size={15} />}
                                {isSavingPrices ? 'Saqlanmoqda…' : `Saqlash (${changedItems.length})`}
                            </button>
                        </div>
                    )}
                </div>

                {isEditingPrices && (
                    <div className={`flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3 ${line} ${
                        isDark ? 'bg-amber-400/[0.04]' : 'bg-amber-50/60'
                    }`}>
                        <div className="flex items-center gap-2 text-sm">
                            <span className={`${muted}`}>Yangi jami:</span>
                            <span className={`font-bold ${head}`}>{fmt(changedTotal)} so‘m</span>
                        </div>
                        <div className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-bold ${
                            totalDelta > 0
                                ? (isDark ? 'border-rose-500/30 bg-rose-500/10 text-rose-300' : 'border-rose-200 bg-rose-50 text-rose-600')
                                : totalDelta < 0
                                ? (isDark ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-emerald-200 bg-emerald-50 text-emerald-600')
                                : (isDark ? 'border-white/10 bg-white/5 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-500')
                        }`}>
                            {totalDelta > 0 ? <LuTrendingUp size={13} /> : totalDelta < 0 ? <LuTrendingDown size={13} /> : null}
                            O‘zgarish: {totalDelta > 0 ? '+' : ''}{fmt(totalDelta)} so‘m
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1080px] text-sm">
                        <thead className={isDark ? 'bg-[#0f172a]/40' : 'bg-[#f8fafc]'}>
                            <tr className={`text-left text-[11px] font-semibold uppercase tracking-wider ${muted}`}>
                                <th className="px-5 py-3.5">Mahsulot</th>
                                <th className="px-3 py-3.5 text-center w-24">O‘lchov</th>
                                <th className="px-3 py-3.5 text-right w-32">Miqdor</th>
                                <th className="px-3 py-3.5 text-right w-40">Avvalgi narx</th>
                                <th className="px-3 py-3.5 text-right w-40">O‘rtacha narx</th>
                                <th className="px-3 py-3.5 text-right w-44">Joriy narx</th>
                                <th className="px-5 py-3.5 text-right w-44">Qator jami</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${isDark ? 'divide-[#334155]/40' : 'divide-[#f1f5f9]'}`}>
                            {(order.items ?? []).map((item) => {
                                const history = priceHistoryByItem.get(item.id);
                                const currentPrice = Number(item.unitPrice) || 0;
                                const lastPrice = history?.lastPrice;
                                const delta = lastPrice === null || lastPrice === undefined ? null : currentPrice - lastPrice;
                                const parsedDraft = parsePriceInput(priceDraft[item.id]);
                                const isChanged = isEditingPrices
                                    && Number.isFinite(parsedDraft)
                                    && parsedDraft !== currentPrice;
                                const unit = getItemUnit(item);
                                const entered = getEnteredQuantity(item);
                                const isPack = unit === 'PACK';
                                const piecesPerPack = isPack && entered > 0 ? Math.round(Number(item.quantity) / entered) : 0;

                                return (
                                    <tr
                                        key={item.id}
                                        className={`transition-colors ${isChanged ? (isDark ? 'bg-amber-400/[0.04]' : 'bg-amber-50/40') : ''}`}
                                    >
                                        <td className="px-5 py-4">
                                            <div className="flex items-start gap-3">
                                                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                                                    isDark ? 'bg-white/5 text-slate-300' : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                    <LuPackage size={15} />
                                                </span>
                                                <div className="min-w-0">
                                                    <p className={`truncate text-sm font-semibold ${head}`}>
                                                        {item.productName || 'Mahsulot'}
                                                    </p>
                                                    <p className={`mt-0.5 truncate font-mono text-[11px] ${muted}`}>
                                                        {item.productBarcode || item.productId}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-3 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold ${
                                                isPack
                                                    ? (isDark ? 'border-violet-400/30 bg-violet-500/10 text-violet-300' : 'border-violet-200 bg-violet-50 text-violet-700')
                                                    : (isDark ? 'border-amber-400/30 bg-amber-500/10 text-amber-300' : 'border-amber-200 bg-amber-50 text-amber-700')
                                            }`}>
                                                {isPack ? <LuPackage size={10} /> : null}
                                                {isPack ? 'Pachka' : 'Dona'}
                                            </span>
                                        </td>

                                        <td className="px-3 py-4 text-right">
                                            <p className={`text-sm font-bold ${head}`}>
                                                {fmt(entered)}
                                            </p>
                                            {isPack && piecesPerPack > 0 && (
                                                <p className={`mt-0.5 text-[11px] ${muted}`}>
                                                    = {fmt(item.quantity)} dona
                                                </p>
                                            )}
                                        </td>

                                        <td className="px-3 py-4 text-right">
                                            {lastPrice === null || lastPrice === undefined ? (
                                                <span className={muted}>—</span>
                                            ) : (
                                                <>
                                                    <p className={`text-sm font-semibold ${head}`}>
                                                        {fmt(lastPrice)} so‘m
                                                    </p>
                                                    {delta !== null && delta !== 0 && (
                                                        <p className={`mt-0.5 inline-flex items-center gap-0.5 text-[11px] font-bold ${
                                                            delta > 0 ? 'text-rose-500' : 'text-emerald-500'
                                                        }`}>
                                                            {delta > 0 ? <LuTrendingUp size={10} /> : <LuTrendingDown size={10} />}
                                                            {delta > 0 ? '+' : ''}{fmt(delta)}
                                                        </p>
                                                    )}
                                                    {history?.historyCount > 0 && (
                                                        <p className={`mt-0.5 text-[10px] ${muted}`}>
                                                            {history.historyCount} ta tarixiy
                                                        </p>
                                                    )}
                                                </>
                                            )}
                                        </td>

                                        <td className="px-3 py-4 text-right">
                                            {history?.averagePrice === null || history?.averagePrice === undefined ? (
                                                <span className={muted}>—</span>
                                            ) : (
                                                <p className={`text-sm font-semibold ${muted}`}>
                                                    {fmt(history.averagePrice)} so‘m
                                                </p>
                                            )}
                                        </td>

                                        <td className="px-3 py-4 text-right">
                                            {isEditingPrices ? (
                                                <div className="relative">
                                                    <input
                                                        aria-label={`${item.productName} narxi`}
                                                        type="text"
                                                        inputMode="decimal"
                                                        autoComplete="off"
                                                        value={priceDraft[item.id] ?? ''}
                                                        onChange={(event) => setPriceDraft((state) => ({
                                                            ...state,
                                                            [item.id]: formatPriceInput(event.target.value),
                                                        }))}
                                                        disabled={isSavingPrices}
                                                        className={`w-36 rounded-lg border px-3 pr-11 py-2 text-right text-sm font-bold tabular-nums outline-none transition ${field} ${
                                                            isChanged ? 'ring-2 ring-amber-400/40' : ''
                                                        }`}
                                                    />
                                                    <span className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs ${muted}`}>
                                                        so‘m
                                                    </span>
                                                </div>
                                            ) : (
                                                <p className={`text-sm font-bold ${head}`}>
                                                    {fmt(currentPrice)} <span className={`text-xs font-normal ${muted}`}>so‘m</span>
                                                </p>
                                            )}
                                        </td>

                                        <td className="px-5 py-4 text-right">
                                            <p className={`text-sm font-bold ${head}`}>
                                                {fmt((Number(item.quantity) || 0) * getDraftPrice(item, priceDraft))}
                                                <span className={`ml-1 text-xs font-normal ${muted}`}>so‘m</span>
                                            </p>
                                        </td>
                                    </tr>
                                );
                            })}
                            {(order.items ?? []).length === 0 && (
                                <tr>
                                    <td colSpan={7} className={`px-5 py-12 text-center text-sm ${muted}`}>
                                        Buyurtmada mahsulotlar yo‘q
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className={`flex flex-wrap items-center justify-end gap-4 border-t px-5 py-4 ${line} ${
                    isDark ? 'bg-white/[0.02]' : 'bg-[#f8fafc]'
                }`}>
                    <div className="flex items-center gap-2">
                        <span className={`text-sm ${muted}`}>Jami:</span>
                        <span className={`text-xl font-extrabold ${head}`}>
                            {fmt(isEditingPrices ? orderTotal : order.totalAmount)}
                        </span>
                        <span className={`text-sm font-semibold ${muted}`}>so‘m</span>
                    </div>
                </div>
            </section>

            {/* ═══════════════ CUSTOMER & HISTORY ═══════════════ */}
            <section className={`overflow-hidden rounded-2xl border shadow-md ${panel}`}>
                <div className={`flex items-center gap-3 border-b px-5 py-4 ${line}`}>
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/10 text-amber-500">
                        <LuUserRound size={16} />
                    </span>
                    <div>
                        <h2 className={`text-sm font-bold ${head}`}>Mijoz va buyurtma tarixi</h2>
                        <p className={`mt-0.5 text-xs ${muted}`}>Mijoz ma’lumotlari va oldingi buyurtmalar</p>
                    </div>
                </div>

                <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
                    <div className={`rounded-xl border p-4 ${inner}`}>
                        <p className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ${muted}`}>
                            <LuUserRound size={12} /> Mijoz
                        </p>
                        <p className={`mt-2 text-sm font-bold ${head}`}>
                            {customer?.name || order.customerName || (isCustomerLoading ? 'Yuklanmoqda…' : '—')}
                        </p>
                    </div>
                    <div className={`rounded-xl border p-4 ${inner}`}>
                        <p className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ${muted}`}>
                            <LuPhone size={12} /> Telefon
                        </p>
                        <p className={`mt-2 text-sm font-bold ${head}`}>{customer?.phone || '—'}</p>
                    </div>
                    <div className={`rounded-xl border p-4 ${inner}`}>
                        <p className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ${muted}`}>
                            <LuWallet size={12} /> Mijoz balansi
                        </p>
                        <p className={`mt-2 text-sm font-bold ${
                            Number(customer?.balance) < 0
                                ? 'text-rose-500'
                                : Number(customer?.balance) > 0
                                ? 'text-emerald-500'
                                : head
                        }`}>
                            {customer
                                ? `${fmt(Math.abs(customer.balance))} so‘m ${
                                      Number(customer.balance) < 0
                                          ? '(qarzdor)'
                                          : Number(customer.balance) > 0
                                          ? '(kredit)'
                                          : ''
                                  }`
                                : '—'}
                        </p>
                    </div>
                    <div className={`rounded-xl border p-4 ${inner}`}>
                        <p className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ${muted}`}>
                            <LuCalendarClock size={12} /> Buyurtma sanasi
                        </p>
                        <p className={`mt-2 text-sm font-bold ${head}`}>{formatDateTime(order.createdAt)}</p>
                    </div>
                </div>

                {isCustomerError && (
                    <p className="mx-5 mb-4 rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-sm text-rose-500">
                        {customerError?.data?.message || 'Mijoz ma’lumotlarini yuklab bo‘lmadi.'}
                    </p>
                )}

                <div className={`border-t px-5 py-5 ${line}`}>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h3 className={`flex items-center gap-2 text-sm font-bold ${head}`}>
                                <LuHistory size={15} className="text-amber-500" />
                                Oldingi buyurtmalar
                            </h3>
                            <p className={`mt-1 text-xs ${muted}`}>
                                Oxirgi {ORDER_HISTORY_SIZE} ta buyurtma va narxlar tarixi
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => refetchHistory()}
                            disabled={isHistoryLoading}
                            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${ghostBtn}`}
                        >
                            Yangilash
                        </button>
                    </div>

                    {isHistoryLoading ? (
                        <div className={`flex items-center justify-center gap-2 py-8 text-sm ${muted}`}>
                            <LuLoaderCircle size={16} className="animate-spin text-amber-500" />
                            Tarix yuklanmoqda…
                        </div>
                    ) : isHistoryError ? (
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
                            <p className="text-sm text-rose-500">Mijoz buyurtmalari tarixini yuklab bo‘lmadi.</p>
                            <button type="button" onClick={() => refetchHistory()} className="text-sm font-semibold text-rose-500">
                                Qayta urinish
                            </button>
                        </div>
                    ) : customerOrders.length === 0 ? (
                        <div className={`flex flex-col items-center gap-2 py-10 ${muted}`}>
                            <LuHistory size={30} strokeWidth={1.5} />
                            <p className="text-sm">Bu mijozda boshqa buyurtmalar topilmadi</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {customerOrders.map((previousOrder) => (
                                <article key={previousOrder.id} className={`overflow-hidden rounded-xl border transition ${line} ${
                                    isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50/50'
                                }`}>
                                    <div className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 ${
                                        isDark ? 'bg-white/[0.02]' : 'bg-[#f8fafc]'
                                    }`}>
                                        <button
                                            type="button"
                                            onClick={() => navigate(`/zayavkachi/orders/${previousOrder.id}`)}
                                            className="group flex items-center gap-3 text-left"
                                        >
                                            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                                                isDark ? 'bg-white/5 text-slate-300' : 'bg-slate-100 text-slate-500'
                                            }`}>
                                                <LuClipboardList size={14} />
                                            </span>
                                            <div>
                                                <p className={`flex items-center gap-1 text-sm font-bold ${head} group-hover:text-amber-500`}>
                                                    #{previousOrder.id.slice(0, 8).toUpperCase()}
                                                    <LuChevronRight size={12} className="opacity-0 transition group-hover:opacity-100" />
                                                </p>
                                                <p className={`mt-0.5 text-xs ${muted}`}>
                                                    {formatDateTime(previousOrder.createdAt)} · {previousOrder.items?.length ?? 0} qator
                                                </p>
                                            </div>
                                        </button>
                                        <div className="flex items-center gap-3">
                                            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusCx(previousOrder.status)}`}>
                                                {STATUS_LABEL[previousOrder.status] ?? previousOrder.status}
                                            </span>
                                            <span className={`text-sm font-bold ${head}`}>
                                                {fmt(previousOrder.totalAmount)} so‘m
                                            </span>
                                        </div>
                                    </div>
                                    {previousOrder.items?.length > 0 && (
                                        <div className={`divide-y ${isDark ? 'divide-white/5' : 'divide-slate-100'}`}>
                                            {previousOrder.items.map((item) => (
                                                <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                                                    <span className={`text-sm ${head}`}>{item.productName || 'Mahsulot'}</span>
                                                    <span className={`text-xs ${muted}`}>
                                                        {fmt(getEnteredQuantity(item))} {getItemUnit(item) === 'PACK' ? 'pachka' : 'dona'} × {fmt(item.unitPrice)} so‘m
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}