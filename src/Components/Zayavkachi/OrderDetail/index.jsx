import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
    LuArrowLeft, LuPackage, LuBarcode, LuUser, LuWarehouse,
    LuStickyNote, LuClock3, LuCircleAlert, LuPencil,
    LuChevronDown, LuTriangleAlert, LuCircleCheck, LuCircleX,
    LuBoxes, LuPencilLine, LuPrinter,
    LuHistory, LuSave, LuX,
} from 'react-icons/lu';
import { useAppTheme } from '../../../theme/tokens';
import { useAppSelector } from '../../../store/hooks';
import { BUXGALTER_ROLES, ROLES } from '../../../app/permissions/roles';
import {
    useGetSalesOrderByIdQuery,
    useUpdateSalesOrderStatusMutation,
    useRejectSalesOrderMutation,
    useLoadSalesOrderMutation,
    useUpdateSalesOrderPricesMutation,
    useGetSalesOrdersQuery,
} from '../../../store/services/salesOrder.api';
import { useGetProductStocksQuery } from '../../../store/services/productStock.api';
import { useGetWarehousesQuery } from '../../../store/services/warehouse.api';
import Loading from '../../Other/UI/Loadings/Loading';
import DeleteOrder from '../__components/DeleteOrder';
import {
    STATUS_LABEL,
    statusCx,
    NEXT_STATUS,
    FINAL_STATUSES,
} from '../__components/statusBadge';
import { Alert } from '../../Other/UI/Alert/Alert';
import OrderPrintModal from '../__components/OrderPrintModal';
import logoSvg from '../../../Images/Yellow Unified Lego Outlined.svg';

/* ──────────────────────────────────────────────────────────────── */
/*  Status control (state machine)                                  */
/* ──────────────────────────────────────────────────────────────── */
function OrderStatusControl({ order, isDark }) {
    const [action, setAction] = useState(null);
    const role = useAppSelector((state) => state.auth.role);
    const [updateStatus] = useUpdateSalesOrderStatusMutation();
    const [rejectOrder] = useRejectSalesOrderMutation();
    const [loadOrder] = useLoadSalesOrderMutation();
    const [updatePrices] = useUpdateSalesOrderPricesMutation();

    const statusStyles = {
        CREATED:    { bg: isDark ? 'rgba(148,163,184,.16)' : '#E2E8F0', color: isDark ? '#cbd5e1' : '#334155', border: isDark ? '#64748b' : '#94a3b8' },
        LOADED:     { bg: isDark ? 'rgba(167,139,250,.16)' : '#EDE9FE', color: isDark ? '#c4b5fd' : '#5B21B6', border: isDark ? '#8b5cf6' : '#7c3aed' },
        CONFIRMED:  { bg: isDark ? 'rgba(34,197,94,.16)'   : '#DCFCE7', color: isDark ? '#86efac' : '#15803d', border: '#16a34a' },
        REJECTED:   { bg: isDark ? 'rgba(239,68,68,.16)'   : '#FEE2E2', color: isDark ? '#fca5a5' : '#b91c1c', border: '#dc2626' },
    };
    const style = statusStyles[order.status] || statusStyles.CREATED;

    const isFinal = FINAL_STATUSES.includes(order.status);
    const nextStatuses = NEXT_STATUS[order.status] || [];

    if (role === ROLES.ZAYAVKACHI) {
        return (
            <span className={`rounded-full border px-3 py-1.5 text-xs font-bold ${statusCx(order.status)}`}>
                {STATUS_LABEL[order.status] ?? order.status}
            </span>
        );
    }

    const changeStatus = async (nextStatus) => {
        if (!nextStatus || nextStatus === order.status) return;
        setAction(nextStatus);
        try {
            if (nextStatus === 'CONFIRMED') {
                const priceItems = (order.items ?? []).map((item) => ({
                    itemId: item.id,
                    unitPrice: item.unitPrice,
                }));
                await updatePrices({ id: order.id, data: { items: priceItems } }).unwrap();
            }
            if (nextStatus === 'LOADED') {
                await loadOrder(order.id).unwrap();
            } else if (nextStatus === 'REJECTED') {
                await rejectOrder({ id: order.id }).unwrap();
            } else {
                await updateStatus({ id: order.id, status: nextStatus }).unwrap();
            }
            Alert(
                `Buyurtma holati "${STATUS_LABEL[nextStatus] ?? nextStatus}" ga o'zgartirildi`,
                'success',
            );
            return true;
        } catch (error) {
            Alert(error?.data?.message || "Statusni o'zgartirishda xatolik", 'error');
            return false;
        } finally {
            setAction(null);
        }
    };

    if (isFinal) {
        return (
            <span className={`rounded-full border px-3 py-1.5 text-xs font-bold ${statusCx(order.status)}`}>
                {STATUS_LABEL[order.status] ?? order.status}
            </span>
        );
    }

    return (
        <select
            value={action || order.status}
            onChange={(e) => changeStatus(e.target.value)}
            disabled={Boolean(action)}
            aria-label="Buyurtma holatini o'zgartirish"
            className="rounded-full border px-3 py-1.5 text-xs font-bold outline-none disabled:cursor-wait disabled:opacity-60"
            style={{ backgroundColor: style.bg, color: style.color, borderColor: style.border }}
        >
            <option value={order.status}>{STATUS_LABEL[order.status] ?? order.status}</option>
            {nextStatuses.map((s) => (
                <option key={s} value={s}>→ {STATUS_LABEL[s] ?? s}</option>
            ))}
        </select>
    );
}

OrderStatusControl.propTypes = {
    order: PropTypes.shape({
        id: PropTypes.string.isRequired,
        status: PropTypes.string.isRequired,
        items: PropTypes.arrayOf(PropTypes.shape({
            id: PropTypes.string.isRequired,
            unitPrice: PropTypes.number.isRequired,
        })).isRequired,
    }).isRequired,
    isDark: PropTypes.bool.isRequired,
};

/* ──────────────────────────────────────────────────────────────── */
/*  Группировка одинаковых товаров (PACK + PIECE) в одну строку      */
/* ──────────────────────────────────────────────────────────────── */
function groupOrderItems(items) {
    if (!items?.length) return [];

    const groups = new Map();

    for (const item of items) {
        const key = `${item.productId}|${item.warehouseId || ''}`;

        if (!groups.has(key)) {
            groups.set(key, {
                key,
                productId: item.productId,
                productName: item.productName,
                productBarcode: item.productBarcode,
                productArticle: item.productArticle,
                warehouseId: item.warehouseId,
                warehouseName: item.warehouseName,
                unitPrice: item.unitPrice,
                packs: 0,
                pieces: 0,
                lineTotal: 0,
                orderQuantityTotal: 0,
                hasPackLine: false,
                hasPieceLine: false,
                rawItems: [],
            });
        }

        const g = groups.get(key);
        g.rawItems.push(item);
        g.lineTotal += Number(item.lineTotal) || 0;

        const qty = Number(item.quantity) || 0;
        const entered = Number(item.enteredQuantity);
        const unit = String(item.unit ?? '').toUpperCase();

        g.orderQuantityTotal += qty;

        if (unit === 'PACK' && Number.isFinite(entered) && entered > 0) {
            g.hasPackLine = true;
            g.packs += entered;
        } else {
            g.hasPieceLine = true;
            g.pieces += qty;
        }
    }

    return Array.from(groups.values());
}

/* ──────────────────────────────────────────────────────────────── */
/*  Detail page                                                     */
/* ──────────────────────────────────────────────────────────────── */
export default function ZayavkachiOrderDetail() {
    const { id }       = useParams();
    const navigate     = useNavigate();
    const { pathname } = useLocation();
    const role = useAppSelector((state) => state.auth.role);
    const ordersPath   = pathname.startsWith('/orders')
        ? '/orders'
        : pathname.startsWith('/kassir/orders')
        ? '/kassir/orders'
        : '/zayavkachi/orders';
    const { isDark }   = useAppTheme();

    const { data: order, isLoading, isError } = useGetSalesOrderByIdQuery(id, { skip: !id });
    const { data: warehouses = [] } = useGetWarehousesQuery('PRODUCT');
    const { data: customerOrdersData, isFetching: customerOrdersFetching } = useGetSalesOrdersQuery(
        { customerId: order?.customerId, page: 0, size: 6, sort: ['createdAt,DESC', 'id,DESC'] },
        { skip: !order?.customerId || !BUXGALTER_ROLES.includes(role) },
    );
    const [updatePrices, { isLoading: isSavingPrices }] = useUpdateSalesOrderPricesMutation();
    const [showPriceEditor, setShowPriceEditor] = useState(false);
    const [priceDraft, setPriceDraft] = useState({});

    const orderWarehouseIds = useMemo(() => {
        if (!order?.items) return [];
        return [...new Set(order.items.map((i) => i.warehouseId).filter(Boolean))];
    }, [order]);

    const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
    const activeWarehouseId = useMemo(() => {
        if (orderWarehouseIds.length === 1) return orderWarehouseIds[0];
        return selectedWarehouseId || orderWarehouseIds[0] || '';
    }, [orderWarehouseIds, selectedWarehouseId]);

    const { data: stockData, isFetching: stockFetching } = useGetProductStocksQuery(
        { warehouseId: activeWarehouseId || undefined, page: 0, size: 100 },
        { skip: !activeWarehouseId || !order }
    );
    const stockItems = stockData?.items ?? [];

    /* ── Группируем одинаковые товары ── */
    const groupedItems = useMemo(
        () => groupOrderItems(order?.items ?? []),
        [order]
    );

    /* ── Comparison с piecesPerPack ── */
    const comparison = useMemo(() => {
        if (!groupedItems.length) return [];
        return groupedItems.map((g) => {
            const stock = stockItems.find(
                (s) => s.productId === g.productId && (activeWarehouseId ? s.warehouseId === activeWarehouseId : true)
            );
            const stockQty = stock?.quantity ?? 0;
            const orderQty = g.orderQuantityTotal;
            const enough   = stockQty >= orderQty;
            const diff     = stockQty - orderQty;

            const piecesPerPack =
                Number(stock?.productPiecesPerPack) ||
                Number(g.rawItems?.[0]?.productPiecesPerPack) ||
                Number(g.rawItems?.[0]?.piecesPerPack) ||
                0;

            return { ...g, stockQty, enough, diff, piecesPerPack };
        });
    }, [groupedItems, stockItems, activeWarehouseId]);

    const allEnough = comparison.length > 0 && comparison.every((c) => c.enough);
    const someShort = comparison.some((c) => !c.enough);

    /* ── Итоги для footer'а таблицы сравнения ── */
    const totals = useMemo(() => {
        let stockTotalPieces = 0;
        let orderTotalPieces = 0;
        let stockPacks = 0;
        let stockRemainder = 0;
        let orderPacks = 0;
        let orderRemainder = 0;

        comparison.forEach((row) => {
            const qty = Number(row.stockQty) || 0;
            const ordQty = Number(row.orderQuantityTotal) || 0;
            stockTotalPieces += qty;
            orderTotalPieces += ordQty;

            const pcs = Number(row.piecesPerPack) || 0;
            if (pcs > 1) {
                stockPacks += Math.floor(qty / pcs);
                stockRemainder += qty % pcs;
                orderPacks += Math.floor(ordQty / pcs);
                orderRemainder += ordQty % pcs;
            } else {
                stockRemainder += qty;
                orderRemainder += ordQty;
            }
        });

        return {
            stockTotals: { pieces: stockTotalPieces, packs: stockPacks, remainder: stockRemainder },
            orderTotals: { pieces: orderTotalPieces, packs: orderPacks, remainder: orderRemainder },
            totalDiff:   { diff: stockTotalPieces - orderTotalPieces },
        };
    }, [comparison]);

    const { stockTotals, orderTotals, totalDiff } = totals;

    /* ── theme ── */
    const panel    = isDark ? 'border-white/10 bg-[#141C2B]'        : 'border-[#e2e8f0] bg-white';
    const muted    = isDark ? 'text-[#94a3b8]'                       : 'text-[#64748b]';
    const head     = isDark ? 'text-white'                           : 'text-[#0f172a]';
    const divider  = isDark ? 'divide-[#334155]/50'                  : 'divide-[#f1f5f9]';
    const line     = isDark ? 'border-[#334155]/60'                  : 'border-[#f1f5f9]';
    const rowBg    = isDark ? 'hover:bg-[#1e293b]/60'                : 'hover:bg-amber-50/50';
    const ghostBtn = isDark ? 'border-[#334155] text-[#94a3b8] hover:bg-[#1e293b]' : 'border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9]';
    const inputCx  = ['rounded-xl border px-3 py-2 text-sm outline-none transition-all duration-200', isDark ? 'border-[#334155] bg-[#1e293b]/80 text-white focus:border-amber-400' : 'border-[#e2e8f0] bg-white text-[#0f172a] focus:border-amber-400'].join(' ');
    const selectCx = [inputCx, 'pr-8 appearance-none cursor-pointer'].join(' ');

    const backToList   = () => navigate(ordersPath);
    const [showPrintModal, setShowPrintModal] = useState(false);
    const customerOrders = (customerOrdersData?.items ?? []).filter((item) => item.id !== order?.id);

    const openPriceEditor = () => {
        setPriceDraft(Object.fromEntries(
            (order.items ?? []).map((item) => [item.id, String(item.unitPrice ?? 0)]),
        ));
        setShowPriceEditor(true);
    };

    const savePrices = async () => {
        const items = (order.items ?? []).map((item) => ({
            itemId: item.id,
            unitPrice: Number(priceDraft[item.id]),
        }));
        if (items.some((item) => !Number.isFinite(item.unitPrice) || item.unitPrice < 0)) {
            Alert('Narx 0 dan kichik bo‘lmagan son bo‘lishi kerak', 'error');
            return;
        }
        try {
            await updatePrices({ id: order.id, data: { items } }).unwrap();
            Alert('Buyurtma narxlari saqlandi', 'success');
            setShowPriceEditor(false);
        } catch (error) {
            Alert(error?.data?.message || 'Narxlarni saqlashda xatolik', 'error');
        }
    };

    const printInvoice = () => {
        const invoiceEl = document.querySelector('.invoice-print-root');
        if (!invoiceEl) { window.print(); return; }

        const win = window.open('', '_blank', 'width=900,height=700');
        win.document.write(`<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="UTF-8"/>
  <title>Invoice</title>
  <style>
    @page { size: A4 portrait; margin: 12mm 12mm 14mm 12mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { background: #fff; color: #0f172a; font-family: Arial, Helvetica, sans-serif; font-size: 10.5px; line-height: 1.45; }
    table { border-collapse: collapse; }
    img { max-width: 100%; }
  </style>
</head>
<body>${invoiceEl.innerHTML}</body>
</html>`);
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); win.close(); }, 400);
    };
    void printInvoice;

    if (isLoading) return <div className="flex min-h-[60vh] items-center justify-center"><Loading /></div>;

    if (isError || !order) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-[#f43f5e]">
                <LuCircleAlert size={34} />
                <p className="text-lg">Buyurtmani yuklashda xatolik</p>
                <button type="button" onClick={backToList} className="flex h-12 items-center gap-2 rounded-xl border border-[#f43f5e]/30 px-5 text-sm font-bold">
                    <LuArrowLeft size={16} /> Buyurtmalar ro&apos;yxatiga qaytish
                </button>
            </div>
        );
    }

    const editable = order.status === 'CREATED';
    const showStockComparison = order.status === 'CREATED' || order.status === 'LOADED';

    const fmtDate     = (v) => v ? new Date(v).toLocaleDateString('uz-UZ') : '—';
    const fmtDateTime = (v) => v ? new Date(v).toLocaleString('uz-UZ') : '—';
    const fmtNum      = (v) => { const n = Number(v ?? 0); return n.toLocaleString('ru-RU').replace(/\u00A0/g, ' '); };

    const printStatusColor = order.status === 'CONFIRMED'
        ? '#15803d'
        : order.status === 'REJECTED'
        ? '#b91c1c'
        : '#92400E';

    /* ── Общие итоги ── */
    const totalPacks = groupedItems.reduce((s, g) => s + g.packs, 0);
    const totalPieces = groupedItems.reduce((s, g) => s + g.pieces, 0);

    return (
        <>
            {showPriceEditor && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" role="presentation" onMouseDown={(event) => {
                    if (event.target === event.currentTarget && !isSavingPrices) setShowPriceEditor(false);
                }}>
                    <section role="dialog" aria-modal="true" aria-labelledby="order-price-editor-title" className={`w-full max-w-3xl overflow-hidden rounded-2xl border shadow-2xl ${panel}`}>
                        <div className={`flex items-center justify-between border-b px-5 py-4 ${line}`}>
                            <div>
                                <h2 id="order-price-editor-title" className={`text-base font-bold ${head}`}>Buyurtma narxlarini tahrirlash</h2>
                                <p className={`mt-1 text-xs ${muted}`}>Har bir qator narxini alohida belgilang.</p>
                            </div>
                            <button type="button" onClick={() => setShowPriceEditor(false)} disabled={isSavingPrices} className={`rounded-lg p-2 ${ghostBtn}`} aria-label="Yopish"><LuX size={18} /></button>
                        </div>
                        <div className="max-h-[60vh] overflow-auto px-5">
                            <table className="w-full text-sm">
                                <thead><tr className={`border-b text-left text-xs ${muted}`}>
                                    <th className="py-3 pr-3">Mahsulot / turi</th>
                                    <th className="py-3 px-3 text-right">Miqdor</th>
                                    <th className="py-3 pl-3 text-right">Narx (so‘m)</th>
                                </tr></thead>
                                <tbody className={`divide-y ${divider}`}>
                                    {(order.items ?? []).map((item) => (
                                        <tr key={item.id}>
                                            <td className={`py-3 pr-3 ${head}`}>
                                                <span className="font-semibold">{item.productName}</span>
                                                <span className={`ml-2 text-xs ${muted}`}>{item.unit === 'PACK' ? 'Pachka' : 'Dona'}</span>
                                            </td>
                                            <td className={`px-3 py-3 text-right ${muted}`}>{item.enteredQuantity ?? item.quantity}</td>
                                            <td className="py-3 pl-3">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="any"
                                                    inputMode="decimal"
                                                    value={priceDraft[item.id] ?? ''}
                                                    onChange={(event) => setPriceDraft((current) => ({ ...current, [item.id]: event.target.value }))}
                                                    disabled={isSavingPrices}
                                                    aria-label={`${item.productName} narxi`}
                                                    className={`w-full min-w-32 rounded-lg border px-3 py-2 text-right outline-none focus:border-amber-400 ${inputCx}`}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className={`flex justify-end gap-2 border-t px-5 py-4 ${line}`}>
                            <button type="button" onClick={() => setShowPriceEditor(false)} disabled={isSavingPrices} className={`rounded-xl border px-4 py-2 text-sm font-semibold ${ghostBtn}`}>Bekor qilish</button>
                            <button type="button" onClick={savePrices} disabled={isSavingPrices} className="flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-60">
                                <LuSave size={15} /> {isSavingPrices ? 'Saqlanmoqda…' : 'Saqlash'}
                            </button>
                        </div>
                    </section>
                </div>
            )}
            {showPrintModal && (
                <OrderPrintModal
                    order={order}
                    showPrices
                    onClose={() => setShowPrintModal(false)}
                />
            )}

            <style>{`
                .invoice-print { display: none !important; }
            `}</style>

            {/* ═══════════════ APP UI ═══════════════ */}
            <div className="app-print-hide flex w-full flex-col gap-4 py-2">

                {/* ── Header ── */}
                <div className={`relative overflow-hidden rounded-2xl border px-5 py-4 shadow-md ${panel}`}>
                    <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-amber-400/6 to-transparent" />
                    <div className="relative flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-400/10 text-amber-500">
                                <LuPackage size={20} />
                            </span>
                            <div>
                                <h1 className={`text-xl font-bold leading-tight tracking-tight ${head}`}>{order.customerName}</h1>
                                <p className={`mt-0.5 text-sm ${muted}`}>{fmtDateTime(order.createdAt)}</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <OrderStatusControl order={order} isDark={isDark} />

                            {BUXGALTER_ROLES.includes(role) && order.status === 'LOADED' && (
                                <button type="button" onClick={openPriceEditor} className={`flex h-12 items-center gap-2 rounded-xl border px-5 text-sm font-bold transition-colors hover:border-amber-400/60 hover:text-amber-500 ${ghostBtn}`}>
                                    <LuPencilLine size={16} /> Narxlarni o‘zgartirish
                                </button>
                            )}

                            {BUXGALTER_ROLES.includes(role) && order.status === 'LOADED' && (
                            <button type="button" onClick={() => setShowPrintModal(true)} title="Chop etish"
                                className={`flex h-12 items-center gap-2 rounded-xl border px-5 text-sm font-bold transition-colors hover:border-amber-400/60 hover:text-amber-500 ${ghostBtn}`}>
                                <LuPrinter size={16} /> Chop etish
                            </button>
                            )}

                            <button type="button" onClick={() => navigate(`${ordersPath}/${order.id}/edit`)}
                                disabled={!editable}
                                title={editable ? 'Tahrirlash' : "Faqat \"Yaratilgan\" holatidagi buyurtma tahrirlanadi"}
                                className={`flex h-12 items-center gap-2 rounded-xl border px-5 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${ghostBtn}`}>
                                <LuPencil size={16} /> Tahrirlash
                            </button>
                            <DeleteOrder order={order} disabled={!editable} onDeleted={backToList} />
                            <button type="button" onClick={backToList}
                                className={`flex h-12 items-center gap-2 rounded-xl border px-5 text-sm font-bold transition-colors ${ghostBtn}`}>
                                <LuArrowLeft size={16} /> Buyurtmalar
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Umumiy ma'lumot ── */}
                <div className={`rounded-2xl border shadow-md ${panel}`}>
                    <div className="grid grid-cols-1 gap-4 px-5 py-4 sm:grid-cols-2 xl:grid-cols-4">
                        {[
                            { label: 'Mijoz',             value: order.customerName,   icon: LuUser },
                            { label: 'Jami summa',        value: `${fmtNum(order.totalAmount)} so'm`, icon: LuPackage },
                            { label: "Oxirgi o'zgarish",  value: fmtDateTime(order.lastModifiedAt),   icon: LuClock3 },
                        ].map(({ label, value, icon: Icon }) => (
                            <div key={label}>
                                <p className={`mb-1 flex items-center gap-1.5 text-xs font-semibold ${muted}`}>
                                    <Icon size={12} /> {label}
                                </p>
                                <p className={`text-sm font-bold ${head}`}>{value || '—'}</p>
                            </div>
                        ))}
                    </div>

                    {order.summary && (
                        <div className={`mx-5 mb-4 rounded-xl border px-4 py-3 ${isDark ? 'border-[#334155] bg-[#1e293b]/50' : 'border-[#e2e8f0] bg-[#f8fafc]'}`}>
                            <p className={`mb-1 flex items-center gap-1.5 text-xs font-semibold ${muted}`}><LuStickyNote size={12} /> Izoh</p>
                            <p className={`text-sm ${head}`}>{order.summary}</p>
                        </div>
                    )}

                    {order.status === 'REJECTED' && order.rejectionReason && (
                        <div className="mx-5 mb-4 rounded-xl border border-[#f43f5e]/30 bg-[#f43f5e]/10 px-4 py-3">
                            <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[#f43f5e]"><LuCircleAlert size={12} /> Rad etish sababi</p>
                            <p className="text-sm font-semibold text-[#f43f5e]">{order.rejectionReason}</p>
                        </div>
                    )}

                    <div className={`flex flex-wrap items-center gap-2 border-t px-5 py-3.5 ${line}`}>
                        <h2 className={`text-sm font-bold ${head}`}>Mahsulotlar</h2>
                        <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-xs font-bold text-amber-500">{groupedItems.length}</span>
                        {totalPacks > 0 && (
                            <span className="rounded-full border border-violet-400/30 bg-violet-400/10 px-2 py-0.5 text-xs font-bold text-violet-500">
                                {totalPacks} pachka
                            </span>
                        )}
                        {totalPieces > 0 && (
                            <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${isDark ? 'border-[#334155] bg-white/5 text-slate-300' : 'border-[#e2e8f0] bg-slate-50 text-slate-600'}`}>
                                {totalPieces} dona
                            </span>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-[#1e293b] text-white text-left text-xs font-semibold uppercase tracking-wide">
                                    <th className="px-5 py-3">Mahsulot</th>
                                    <th className="w-44 px-5 py-3">Barcode</th>
                                    <th className="w-48 px-5 py-3">Ombor</th>
                                    <th className="w-32 px-5 py-3 text-right">Narx</th>
                                    <th className="w-40 px-5 py-3 text-right">Pachka</th>
                                    <th className="w-28 px-5 py-3 text-right">Dona</th>
                                    <th className="w-40 px-5 py-3 text-right">Jami</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${divider}`}>
                                {groupedItems.length === 0 ? (
                                    <tr><td colSpan={7} className={`py-10 text-center text-sm ${muted}`}>Mahsulotlar topilmadi</td></tr>
                                ) : groupedItems.map((g, idx) => (
                                    <tr key={g.key} className={`transition-colors ${rowBg}`}>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <span className={`w-4 shrink-0 text-xs font-bold ${muted}`}>{idx + 1}</span>
                                                <span className={`font-semibold ${head}`}>{g.productName}</span>
                                            </div>
                                        </td>
                                        <td className={`px-5 py-3 font-mono text-xs ${muted}`}>
                                            <span className="flex items-center gap-1.5"><LuBarcode size={13} />{g.productBarcode}</span>
                                        </td>
                                        <td className={`px-5 py-3 text-xs ${muted}`}>
                                            <span className="flex items-center gap-1.5"><LuWarehouse size={13} />{g.warehouseName}</span>
                                        </td>
                                        <td className={`px-5 py-3 text-right text-xs font-semibold ${muted}`}>{fmtNum(g.unitPrice)}</td>

                                        {/* ── Pachka ── */}
                                        <td className="px-5 py-3 text-right">
                                            {g.hasPackLine && g.packs > 0 ? (
                                                <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-sm font-bold ${
                                                    isDark
                                                        ? 'border-violet-400/30 bg-violet-500/10 text-violet-300'
                                                        : 'border-violet-300 bg-violet-50 text-violet-700'
                                                }`}>
                                                    <LuBoxes size={12} />
                                                    {g.packs} pachka
                                                </span>
                                            ) : (
                                                <span className={muted}>—</span>
                                            )}
                                        </td>

                                        {/* ── Dona ── */}
                                        <td className={`px-5 py-3 text-right font-bold ${head}`}>
                                            {g.hasPieceLine && g.pieces > 0 ? fmtNum(g.pieces) : <span className={muted}>—</span>}
                                        </td>

                                        <td className={`px-5 py-3 text-right font-bold ${head}`}>{fmtNum(g.lineTotal)} so&apos;m</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className={`flex flex-wrap items-center justify-end gap-3 border-t px-5 py-4 ${line}`}>
                        <span className={`text-sm ${muted}`}>
                            Umumiy summa: <span className={`text-base font-bold ${head}`}>{fmtNum(order.totalAmount)} so&apos;m</span>
                        </span>
                    </div>
                </div>

                {/* ── Ombor qoldiqlari taqqoslov — CREATED / LOADED ── */}
                {showStockComparison && (
                <div className={`rounded-2xl border shadow-md ${panel}`}>
                    <div className={`flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 ${line}`}>
                        <div className="flex items-center gap-2">
                            <LuBoxes size={18} className="text-amber-500" />
                            <h2 className={`text-sm font-bold ${head}`}>Ombor qoldiqlari taqqoslov</h2>
                            {!stockFetching && comparison.length > 0 && (
                                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${
                                    allEnough
                                        ? isDark ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-green-500/30 bg-green-50 text-green-700'
                                        : someShort
                                        ? isDark ? 'border-red-500/30 bg-red-500/10 text-red-400' : 'border-red-500/30 bg-red-50 text-red-600'
                                        : 'border-amber-400/30 bg-amber-400/10 text-amber-500'
                                }`}>
                                    {allEnough ? 'Barchasi yetarli' : `${comparison.filter((c) => !c.enough).length} ta yetishmaydi`}
                                </span>
                            )}
                        </div>
                        {orderWarehouseIds.length > 1 && (
                            <div className="relative flex items-center gap-2">
                                <LuWarehouse size={14} className={muted} />
                                <label className={`shrink-0 text-xs font-semibold ${muted}`}>Ombor:</label>
                                <div className="relative">
                                    <select value={activeWarehouseId} onChange={(e) => setSelectedWarehouseId(e.target.value)} className={selectCx}>
                                        {orderWarehouseIds.map((wid) => {
                                            const wh = warehouses.find((w) => w.id === wid);
                                            return <option key={wid} value={wid}>{wh?.name ?? wid}</option>;
                                        })}
                                    </select>
                                    <LuChevronDown size={13} className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 ${muted}`} />
                                </div>
                            </div>
                        )}
                    </div>

                    {orderWarehouseIds.length === 1 && (
                        <div className="flex items-center gap-2 px-5 pb-0 pt-4">
                            <LuWarehouse size={14} className={muted} />
                            <span className={`text-xs font-semibold ${muted}`}>Ombor:</span>
                            <span className={`text-xs font-bold ${head}`}>{warehouses.find((w) => w.id === activeWarehouseId)?.name ?? activeWarehouseId}</span>
                        </div>
                    )}

                    {stockFetching && (
                        <div className={`flex items-center justify-center gap-2 py-10 text-sm ${muted}`}>
                            <svg className="h-4 w-4 animate-spin text-amber-400" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                            Qoldiqlar yuklanmoqda...
                        </div>
                    )}

                    {!stockFetching && !activeWarehouseId && (
                        <div className={`flex flex-col items-center gap-2 py-10 ${muted}`}>
                            <LuWarehouse size={30} strokeWidth={1.5} />
                            <p className="text-sm">Orderda ombor ma&apos;lumoti yo&apos;q</p>
                        </div>
                    )}

                    {!stockFetching && activeWarehouseId && comparison.length > 0 && (
                        <div className="overflow-x-auto px-0 pb-2">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className={`text-left text-xs font-semibold uppercase tracking-wide ${muted} ${isDark ? 'bg-[#0f172a]/30' : 'bg-[#f8fafc]/80'}`}>
                                        <th className="px-5 py-3">Mahsulot</th>
                                        <th className="w-40 px-5 py-3 text-right">Ombordа qoldiq</th>
                                        <th className="w-40 px-5 py-3 text-right">Buyurtmada</th>
                                        <th className="w-32 px-5 py-3 text-right">Farq</th>
                                        <th className="w-32 px-5 py-3 text-center">Holat</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${divider}`}>
                                    {comparison.map((row) => {
                                        const enough     = row.enough;
                                        const diff       = row.diff;
                                        const pcs        = Number(row.piecesPerPack) || 0;

                                        /* Ombordagi pachka / dona */
                                        const stockPacks = pcs > 1 ? Math.floor(row.stockQty / pcs) : 0;
                                        const stockRem   = pcs > 1 ? row.stockQty % pcs : 0;
                                        /* Buyurtmadagi pachka / dona */
                                        const orderPacks = pcs > 1 ? Math.floor(row.orderQuantityTotal / pcs) : 0;
                                        const orderRem   = pcs > 1 ? row.orderQuantityTotal % pcs : 0;
                                        /* Farq pachka */
                                        const diffPacks  = pcs > 1 ? Math.floor(Math.abs(diff) / pcs) : 0;
                                        const diffRem    = pcs > 1 ? Math.abs(diff) % pcs : 0;

                                        const statusIcon = enough
                                            ? <LuCircleCheck size={15} className={isDark ? 'text-green-400' : 'text-green-600'} />
                                            : <LuCircleX     size={15} className={isDark ? 'text-red-400'   : 'text-red-600'} />;
                                        const statusCls  = enough ? (isDark ? 'text-green-400' : 'text-green-700') : (isDark ? 'text-red-400' : 'text-red-600');
                                        const diffCls    = diff === 0 ? muted : diff > 0 ? (isDark ? 'text-green-400' : 'text-green-700') : (isDark ? 'text-red-400' : 'text-red-600');
                                        const rowAccent  = !enough ? (isDark ? 'bg-red-500/5' : 'bg-red-50/60') : '';
                                        return (
                                            <tr key={row.key} className={`transition-colors ${rowAccent} ${rowBg}`}>
                                                <td className="px-5 py-3">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className={`font-semibold ${head}`}>{row.productName}</span>
                                                        {row.productBarcode && <span className={`font-mono text-xs ${muted}`}>{row.productBarcode}</span>}
                                                    </div>
                                                </td>

                                                {/* Omborda qoldiq — dona + pachka */}
                                                <td className="px-5 py-3 text-right">
                                                    <div className="flex flex-col items-end gap-0.5">
                                                        <span className={`font-bold tabular-nums ${head}`}>
                                                            {fmtNum(row.stockQty)} dona
                                                        </span>
                                                        {pcs > 1 && row.stockQty > 0 && (
                                                            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${
                                                                isDark ? 'text-violet-300' : 'text-violet-600'
                                                            }`}>
                                                                <LuBoxes size={10} />
                                                                {stockPacks} pachka{stockRem > 0 ? ` + ${stockRem} dona` : ''}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Buyurtmada — dona + pachka */}
                                                <td className="px-5 py-3 text-right">
                                                    <div className="flex flex-col items-end gap-0.5">
                                                        <span className={`font-bold tabular-nums ${head}`}>
                                                            {fmtNum(row.orderQuantityTotal)} dona
                                                        </span>
                                                        {pcs > 1 && row.orderQuantityTotal > 0 && (
                                                            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${
                                                                isDark ? 'text-violet-300' : 'text-violet-600'
                                                            }`}>
                                                                <LuBoxes size={10} />   
                                                                {orderPacks} pachka{orderRem > 0 ? ` + ${orderRem} dona` : ''}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Farq — dona + pachka */}
                                                <td className="px-5 py-3 text-right">
                                                    <div className="flex flex-col items-end gap-0.5">
                                                        <span className={`font-bold tabular-nums ${diffCls}`}>
                                                            {diff > 0 ? `+${fmtNum(diff)}` : fmtNum(diff)}
                                                        </span>
                                                        {pcs > 1 && diff !== 0 && (
                                                            <span className={`text-[10px] font-semibold ${diffCls} opacity-80`}>
                                                                ({diffPacks} pachka{diffRem > 0 ? ` + ${diffRem}` : ''})
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="px-5 py-3">
                                                    <div className={`flex items-center justify-center gap-1.5 ${statusCls}`}>
                                                        {statusIcon}
                                                        <span className="text-xs font-bold">{enough ? 'Yetarli' : 'Yetishmaydi'}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>

                                {/* ══ Итоги внизу ══ */}
                                <tfoot>
                                    <tr className={isDark ? 'bg-[#0f172a]/50' : 'bg-[#f8fafc]'}>
                                        <td className={`px-5 py-3 text-xs font-bold uppercase tracking-wide ${muted}`}>
                                            Jami
                                        </td>

                                        {/* Omborda qoldiq jami */}
                                        <td className="px-5 py-3 text-right">
                                            <div className="flex flex-col items-end gap-0.5">
                                                <span className={`font-bold tabular-nums ${head}`}>
                                                    {fmtNum(stockTotals.pieces)} dona
                                                </span>
                                                {stockTotals.packs > 0 && (
                                                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${
                                                        isDark ? 'text-violet-300' : 'text-violet-600'
                                                    }`}>
                                                        <LuBoxes size={10} />
                                                        {stockTotals.packs} pachka{stockTotals.remainder > 0 ? ` + ${stockTotals.remainder} dona` : ''}
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Buyurtmada jami */}
                                        <td className="px-5 py-3 text-right">
                                            <div className="flex flex-col items-end gap-0.5">
                                                <span className={`font-bold tabular-nums ${head}`}>
                                                    {fmtNum(orderTotals.pieces)} dona
                                                </span>
                                                {orderTotals.packs > 0 && (
                                                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${
                                                        isDark ? 'text-violet-300' : 'text-violet-600'
                                                    }`}>
                                                        <LuBoxes size={10} />
                                                        {orderTotals.packs} pachka{orderTotals.remainder > 0 ? ` + ${orderTotals.remainder} dona` : ''}
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Farq jami */}
                                        <td className="px-5 py-3 text-right">
                                            <span className={`font-bold tabular-nums ${
                                                totalDiff.diff === 0
                                                    ? muted
                                                    : totalDiff.diff > 0
                                                    ? (isDark ? 'text-green-400' : 'text-green-700')
                                                    : (isDark ? 'text-red-400' : 'text-red-600')
                                            }`}>
                                                {totalDiff.diff > 0 ? `+${fmtNum(totalDiff.diff)}` : fmtNum(totalDiff.diff)}
                                            </span>
                                        </td>

                                        <td className="px-5 py-3 text-center">
                                            {someShort ? (
                                                <div className="flex items-center justify-center gap-1.5 text-red-500">
                                                    <LuCircleX size={15} />
                                                    <span className="text-xs font-bold">Yetishmaydi</span>
                                                </div>
                                            ) : (
                                                <div className={`flex items-center justify-center gap-1.5 ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                                                    <LuCircleCheck size={15} />
                                                    <span className="text-xs font-bold">Yetarli</span>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}

                    {!stockFetching && someShort && (
                        <div className={`mx-5 mb-4 mt-2 flex items-start gap-3 rounded-xl border px-4 py-3 ${isDark ? 'border-red-500/30 bg-red-500/10 text-red-400' : 'border-red-300 bg-red-50 text-red-700'}`}>
                            <LuTriangleAlert size={16} className="mt-0.5 shrink-0" />
                            <p className="text-xs font-semibold leading-relaxed">
                                Buyurtmani to&apos;liq bajarish uchun{' '}
                                <span className="font-bold">{comparison.filter((c) => !c.enough).map((c) => c.productName).join(', ')}</span>{' '}
                                mahsulot(lar)dan ombordа yetarli qoldiq mavjud emas.
                            </p>
                        </div>
                    )}

                    {!stockFetching && activeWarehouseId && allEnough && comparison.length > 0 && (
                        <div className={`mx-5 mb-4 mt-2 flex items-center gap-3 rounded-xl border px-4 py-3 ${isDark ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-green-300 bg-green-50 text-green-700'}`}>
                            <LuCircleCheck size={16} className="shrink-0" />
                            <p className="text-xs font-semibold">Barcha mahsulotlar uchun ombordа yetarli qoldiq mavjud.</p>
                        </div>
                    )}
                </div>
                )}

                {BUXGALTER_ROLES.includes(role) && (
                    <section className={`rounded-2xl border shadow-md ${panel}`}>
                        <div className={`flex items-center gap-2 border-b px-5 py-4 ${line}`}>
                            <LuHistory size={17} className="text-amber-500" />
                            <h2 className={`text-sm font-bold ${head}`}>Shu mijozning boshqa buyurtmalari</h2>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${muted}`}>{customerOrders.length}</span>
                        </div>
                        {customerOrdersFetching ? (
                            <p className={`px-5 py-6 text-sm ${muted}`}>Buyurtmalar yuklanmoqda…</p>
                        ) : customerOrders.length === 0 ? (
                            <p className={`px-5 py-6 text-sm ${muted}`}>Boshqa buyurtmalar topilmadi.</p>
                        ) : (
                            <div className={`divide-y ${divider}`}>
                                {customerOrders.map((relatedOrder) => (
                                    <button
                                        key={relatedOrder.id}
                                        type="button"
                                        onClick={() => navigate(`${ordersPath}/${relatedOrder.id}`)}
                                        className={`flex w-full flex-wrap items-center justify-between gap-3 px-5 py-3 text-left transition-colors ${rowBg}`}
                                    >
                                        <span>
                                            <span className={`block text-sm font-semibold ${head}`}>#{relatedOrder.id.slice(0, 8).toUpperCase()}</span>
                                            <span className={`text-xs ${muted}`}>{fmtDateTime(relatedOrder.createdAt)} · {relatedOrder.items?.length ?? 0} ta mahsulot</span>
                                        </span>
                                        <span className="flex items-center gap-3">
                                            <span className={`text-xs font-bold ${statusCx(relatedOrder.status)}`}>{STATUS_LABEL[relatedOrder.status] ?? relatedOrder.status}</span>
                                            <span className={`text-sm font-bold ${head}`}>{fmtNum(relatedOrder.totalAmount)} so‘m</span>
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </section>
                )}
            </div>

            {/* ═══════════════ INVOICE — PRINT ONLY ═══════════════ */}
            <div
                className="invoice-print invoice-print-root"
                style={{
                    width: '190mm',
                    margin: '0 auto',
                    background: '#ffffff',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    fontFamily: 'Arial, Helvetica, sans-serif',
                    fontSize: '10.5px',
                    lineHeight: 1.45,
                    colorScheme: 'light',
                    position: 'absolute',
                    left: '-9999px',
                    top: 0,
                    visibility: 'hidden',
                }}
            >
                {/* ══ HEADER ══ */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src={logoSvg} alt="LEGO PRO" style={{ height: '52px', width: 'auto', objectFit: 'contain' }} />
                        <div>
                            <div style={{ fontWeight: 900, fontSize: '16px', color: '#0f172a', letterSpacing: '0.5px' }}>LEGO PRO</div>
                            <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '2px' }}>Innovatsion PVX profillari</div>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '36px', fontWeight: 900, letterSpacing: '5px', color: '#111827', lineHeight: 1 }}>INVOICE</div>
                    </div>
                </div>

                <div className="inv-accent" style={{ height: '2.5px', background: '#f59e0b', margin: '10px 0 14px 0' }} />

                {/* ══ MIJOZ MA'LUMOTI + HUJJAT № ══ */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', gap: '20px' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>Mijoz:</div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>{order.customerName || '—'}</div>
                        {order.summary && (
                            <div style={{ fontSize: '9.5px', color: '#4b5563', marginTop: '3px', lineHeight: 1.5 }}>{order.summary}</div>
                        )}
                        {order.createdBy && (
                            <div style={{ fontSize: '9.5px', color: '#6b7280', marginTop: '2px' }}>Mas&apos;ul: {order.createdBy}</div>
                        )}
                    </div>
                    <div style={{ minWidth: '190px' }}>
                        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                            <tbody>
                                <tr>
                                    <td style={{ fontSize: '10px', fontWeight: 700, color: '#0f172a', paddingBottom: '3px', paddingRight: '12px', whiteSpace: 'nowrap' }}>Hujjat №:</td>
                                    <td style={{ fontSize: '10px', color: '#374151', paddingBottom: '3px', textAlign: 'right' }}>{order.id?.slice(0,8).toUpperCase() || '—'}</td>
                                </tr>
                                <tr>
                                    <td style={{ fontSize: '10px', fontWeight: 700, color: '#0f172a', paddingBottom: '3px', paddingRight: '12px' }}>Sana:</td>
                                    <td style={{ fontSize: '10px', color: '#374151', paddingBottom: '3px', textAlign: 'right' }}>{fmtDate(order.createdAt)}</td>
                                </tr>
                                <tr>
                                    <td style={{ fontSize: '10px', fontWeight: 700, color: '#0f172a', paddingRight: '12px' }}>Holati:</td>
                                    <td style={{ fontSize: '10px', fontWeight: 700, textAlign: 'right', color: printStatusColor }}>
                                        {STATUS_LABEL[order.status] ?? order.status}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ══ MAHSULOTLAR JADVALI ══ */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '0', border: '1px solid #cbd5e1', backgroundColor: '#ffffff' }}>
                    <thead>
                        <tr>
                            <td style={{ padding: 0, width: '28px',  borderRight: '1px solid #334155' }}>
                                <div style={{ background: '#1e293b', color: '#fff', padding: '7px 8px', textAlign: 'center', fontSize: '9.5px', fontWeight: 700 }}>№</div>
                            </td>
                            <td style={{ padding: 0,                 borderRight: '1px solid #334155' }}>
                                <div style={{ background: '#1e293b', color: '#fff', padding: '7px 8px', textAlign: 'left',   fontSize: '9.5px', fontWeight: 700 }}>Mahsulot</div>
                            </td>
                            <td style={{ padding: 0, width: '65px',  borderRight: '1px solid #334155' }}>
                                <div style={{ background: '#1e293b', color: '#fff', padding: '7px 8px', textAlign: 'center', fontSize: '9.5px', fontWeight: 700 }}>Pachka</div>
                            </td>
                            <td style={{ padding: 0, width: '60px',  borderRight: '1px solid #334155' }}>
                                <div style={{ background: '#1e293b', color: '#fff', padding: '7px 8px', textAlign: 'center', fontSize: '9.5px', fontWeight: 700 }}>Dona</div>
                            </td>
                            <td style={{ padding: 0, width: '88px',  borderRight: '1px solid #334155' }}>
                                <div style={{ background: '#1e293b', color: '#fff', padding: '7px 8px', textAlign: 'right',  fontSize: '9.5px', fontWeight: 700 }}>Narxi</div>
                            </td>
                            <td style={{ padding: 0, width: '100px' }}>
                                <div style={{ background: '#1e293b', color: '#fff', padding: '7px 8px', textAlign: 'right',  fontSize: '9.5px', fontWeight: 700 }}>Jami</div>
                            </td>
                        </tr>
                    </thead>
                    <tbody>
                        {groupedItems.map((g, idx) => (
                            <tr key={g.key} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                                <td style={{ backgroundColor: '#ffffff', padding: '6px 8px', textAlign: 'center', fontSize: '10px', color: '#374151', borderRight: '1px solid #e2e8f0' }}>{idx + 1}</td>
                                <td style={{ backgroundColor: '#ffffff', padding: '6px 8px', fontSize: '10px', borderRight: '1px solid #e2e8f0' }}>
                                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{g.productName || '—'}</div>
                                    {g.productBarcode && (
                                        <div style={{ fontSize: '8.5px', color: '#94a3b8', fontFamily: 'monospace', marginTop: '1px' }}>{g.productBarcode}</div>
                                    )}
                                </td>
                                <td style={{ backgroundColor: '#ffffff', padding: '6px 8px', textAlign: 'center', fontSize: '10px', borderRight: '1px solid #e2e8f0' }}>
                                    {g.hasPackLine && g.packs > 0 ? (
                                        <div style={{ fontWeight: 700, color: '#5B21B6' }}>{g.packs}</div>
                                    ) : (
                                        <span style={{ color: '#94a3b8' }}>—</span>
                                    )}
                                </td>
                                <td style={{ backgroundColor: '#ffffff', padding: '6px 8px', textAlign: 'center', fontSize: '10px', fontWeight: 700, color: '#0f172a', borderRight: '1px solid #e2e8f0' }}>
                                    {g.hasPieceLine && g.pieces > 0 ? g.pieces : <span style={{ color: '#94a3b8' }}>—</span>}
                                </td>
                                <td style={{ backgroundColor: '#ffffff', padding: '6px 8px', textAlign: 'right', fontSize: '10px', color: '#374151', borderRight: '1px solid #e2e8f0' }}>
                                    {fmtNum(g.unitPrice)}
                                </td>
                                <td style={{ backgroundColor: '#ffffff', padding: '6px 8px', textAlign: 'right', fontSize: '10px', fontWeight: 700, color: '#0f172a' }}>
                                    {fmtNum(g.lineTotal)}
                                </td>
                            </tr>
                        ))}
                        {Array.from({ length: Math.max(0, 9 - groupedItems.length) }).map((_, i) => (
                            <tr key={`empty-${i}`} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                                <td style={{ backgroundColor: '#ffffff', padding: '6px 8px', borderRight: '1px solid #e2e8f0' }}>&nbsp;</td>
                                <td style={{ backgroundColor: '#ffffff', padding: '6px 8px', borderRight: '1px solid #e2e8f0' }}>&nbsp;</td>
                                <td style={{ backgroundColor: '#ffffff', padding: '6px 8px', borderRight: '1px solid #e2e8f0' }}>&nbsp;</td>
                                <td style={{ backgroundColor: '#ffffff', padding: '6px 8px', borderRight: '1px solid #e2e8f0' }}>&nbsp;</td>
                                <td style={{ backgroundColor: '#ffffff', padding: '6px 8px', borderRight: '1px solid #e2e8f0' }}>&nbsp;</td>
                                <td style={{ backgroundColor: '#ffffff', padding: '6px 8px' }}>&nbsp;</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* ══ JAMI — pachka/dona сводка ══ */}
                {(totalPacks > 0 || totalPieces > 0) && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px', marginTop: '8px', marginBottom: '12px', fontSize: '10px' }}>
                        {totalPacks > 0 && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{
                                    display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%',
                                    background: '#8b5cf6',
                                }} />
                                <span style={{ color: '#4b5563' }}>Jami pachka:</span>
                                <strong style={{ color: '#5B21B6', fontWeight: 800 }}>{totalPacks}</strong>
                            </span>
                        )}
                        {totalPieces > 0 && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{
                                    display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%',
                                    background: '#f59e0b',
                                }} />
                                <span style={{ color: '#4b5563' }}>Jami dona:</span>
                                <strong style={{ color: '#0f172a', fontWeight: 800 }}>{totalPieces}</strong>
                            </span>
                        )}
                    </div>
                )}

                {/* ══ TO'LOV MA'LUMOTLARI + JAMI ══ */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', marginTop: '14px', marginBottom: '12px' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#0f172a', marginBottom: '5px' }}>To&apos;lov ma&apos;lumotlari:</div>
                        <div style={{ fontSize: '9.5px', color: '#374151', lineHeight: 1.7 }}>
                            <div>Mijoz: <strong>{order.customerName || '—'}</strong></div>
                            <div>Mas&apos;ul: <strong>{order.createdBy || '—'}</strong></div>
                            <div>Sana: <strong>{fmtDateTime(order.createdAt)}</strong></div>
                            {order.summary && <div>Izoh: {order.summary}</div>}
                        </div>
                    </div>

                    <div style={{ minWidth: '220px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                            <span style={{ fontSize: '9.5px', color: '#374151' }}>Olingan tovar jami:</span>
                            <span className="inv-yellow" style={{
                                background: '#f59e0b', color: '#fff',
                                padding: '3px 10px', fontSize: '9.5px', fontWeight: 700,
                                minWidth: '90px', textAlign: 'right', whiteSpace: 'nowrap',
                            }}>
                                {fmtNum(order.totalAmount)} so&apos;m
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                            <span style={{ fontSize: '9.5px', color: '#374151' }}>To&apos;langan:</span>
                            <span className="inv-yellow" style={{
                                background: '#f59e0b', color: '#fff',
                                padding: '3px 10px', fontSize: '9.5px', fontWeight: 700,
                                minWidth: '90px', textAlign: 'right', whiteSpace: 'nowrap',
                            }}>
                                {fmtNum(order.paidAmount)} so&apos;m
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#0f172a' }}>QOLGAN QARZ:</span>
                            <span className="inv-yellow" style={{
                                background: '#f59e0b', color: '#fff',
                                padding: '5px 10px', fontSize: '10.5px', fontWeight: 800,
                                minWidth: '90px', textAlign: 'right', whiteSpace: 'nowrap',
                            }}>
                                {fmtNum(order.remainingDebt)} so&apos;m
                            </span>
                        </div>
                    </div>
                </div>

                {/* ══ SHARTLAR ══ */}
                <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>Shartlar va qoidalar (Term &amp; Condition):</div>
                    <div style={{ fontSize: '9.5px', color: '#4b5563', lineHeight: 1.6 }}>
                        To&apos;lov shartnomaga muvofiq 5 bank ish kuni ichida amalga oshirilishi lozim.
                    </div>
                </div>

                {/* ══ TASHAKKUR + IMZO ══ */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '14px' }}>
                    <div style={{ fontSize: '10.5px', fontWeight: 600, color: '#0f172a' }}>Xaridingiz uchun tashakkur!</div>
                    <div style={{ textAlign: 'center', minWidth: '160px' }}>
                        <div style={{ fontSize: '9.5px', color: '#374151', marginBottom: '4px' }}>Imzo / Authorised Sign:</div>
                        <div style={{ borderBottom: '1px solid #374151', width: '140px', marginLeft: 'auto' }} />
                    </div>
                </div>

                {/* ══ FOOTER ══ */}
                <div className="inv-accent" style={{ height: '2.5px', background: '#f59e0b', marginBottom: '8px' }} />
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', fontSize: '9px', color: '#6b7280', flexWrap: 'wrap' }}>
                    <span>📞 +998 71 200 00 00</span>
                    <span style={{ color: '#d1d5db' }}>|</span>
                    <span>📍 Toshkent sh., Yunusobod t.</span>
                    <span style={{ color: '#d1d5db' }}>|</span>
                    <span>✉ info@legopro.uz</span>
                    <span style={{ color: '#d1d5db' }}>|</span>
                    <span>🌐 www.legopro.uz</span>
                </div>
            </div>
        </>
    );
}