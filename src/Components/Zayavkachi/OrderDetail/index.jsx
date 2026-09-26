import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
    LuArrowLeft, LuPackage, LuBarcode, LuUser, LuWarehouse,
    LuStickyNote, LuClock3, LuCircleAlert, LuPencil,
    LuChevronDown, LuTriangleAlert, LuCircleCheck, LuCircleX,
    LuBoxes, LuPencilLine, LuPrinter,
} from 'react-icons/lu';
import { useAppTheme } from '../../../theme/tokens';
import {
    useGetSalesOrderByIdQuery,
    useApproveSalesOrderMutation,
    useRejectSalesOrderMutation,
    useUpdateSalesOrderPricesMutation,
} from '../../../store/services/salesOrder.api';
import { useGetProductStocksQuery } from '../../../store/services/productStock.api';
import { useGetWarehousesQuery } from '../../../store/services/warehouse.api';
import Loading from '../../Other/UI/Loadings/Loading';
import DeleteOrder from '../__components/DeleteOrder';
import { STATUS_LABEL, statusCx } from '../__components/statusBadge';
import { Alert } from '../../Other/UI/Alert/Alert';
import OrderPrintModal from '../__components/OrderPrintModal';
import logoSvg from '../../../Images/Yellow Unified Lego Outlined.svg';

function OrderStatusControl({ order, isDark }) {
    const [action, setAction] = useState(null);
    const [approveOrder] = useApproveSalesOrderMutation();
    const [rejectOrder]  = useRejectSalesOrderMutation();
    const [updatePrices] = useUpdateSalesOrderPricesMutation();

    const statusStyles = {
        PENDING:  { bg: isDark ? 'rgba(250,204,21,.14)' : '#FEF3C7', color: isDark ? '#fde68a' : '#92400E', border: isDark ? '#ca8a04' : '#d97706' },
        APPROVED: { bg: isDark ? 'rgba(34,197,94,.14)'  : '#DCFCE7', color: isDark ? '#86efac' : '#15803d', border: '#16a34a' },
        REJECTED: { bg: isDark ? 'rgba(239,68,68,.14)'  : '#FEE2E2', color: isDark ? '#fca5a5' : '#b91c1c', border: '#dc2626' },
    };
    const style = statusStyles[order.status] || statusStyles.PENDING;

    const changeStatus = async (nextStatus) => {
        if (nextStatus === 'PENDING' || nextStatus === order.status) return;
        setAction(nextStatus);
        try {
            if (nextStatus === 'APPROVED') {
                const priceItems = (order.items ?? []).map((item) => ({
                    itemId: item.id,
                    unitPrice: item.unitPrice,
                }));
                await updatePrices({ id: order.id, data: { items: priceItems } }).unwrap();
                await approveOrder(order.id).unwrap();
                Alert('Buyurtma muvaffaqiyatli tasdiqlandi', 'success');
            } else {
                await rejectOrder({ id: order.id }).unwrap();
                Alert('Buyurtma rad etildi', 'success');
            }
        } catch (error) {
            Alert(error?.data?.message || "Statusni o'zgartirishda xatolik", 'error');
        } finally {
            setAction(null);
        }
    };

    if (order.status !== 'PENDING') {
        return (
            <span className={`rounded-full border px-3 py-1.5 text-xs font-bold ${statusCx(order.status)}`}>
                {STATUS_LABEL[order.status] ?? order.status}
            </span>
        );
    }

    return (
        <select
            value={action || 'PENDING'}
            onChange={(e) => changeStatus(e.target.value)}
            disabled={Boolean(action)}
            aria-label="Buyurtma holatini o'zgartirish"
            className="rounded-full border px-3 py-1.5 text-xs font-bold outline-none disabled:cursor-wait disabled:opacity-60"
            style={{ backgroundColor: style.bg, color: style.color, borderColor: style.border }}
        >
            <option value="PENDING">{STATUS_LABEL.PENDING}</option>
            <option value="APPROVED">Tasdiqlash</option>
            <option value="REJECTED">Rad etish</option>
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

export default function ZayavkachiOrderDetail() {
    const { id }       = useParams();
    const navigate     = useNavigate();
    const { pathname } = useLocation();
    const ordersPath   = pathname.startsWith('/orders')
        ? '/orders'
        : pathname.startsWith('/kassir/orders')
        ? '/kassir/orders'
        : '/zayavkachi/orders';
    const { isDark }   = useAppTheme();

    const { data: order, isLoading, isError } = useGetSalesOrderByIdQuery(id, { skip: !id });
    const { data: warehouses = [] } = useGetWarehousesQuery('PRODUCT');

    const orderWarehouseIds = useMemo(() => {
        if (!order?.items) return [];
        return [...new Set(order.items.map((i) => i.warehouseId).filter(Boolean))];
    }, [order]);

    const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
    const activeWarehouseId = useMemo(() => {
        if (orderWarehouseIds.length === 1) return orderWarehouseIds[0];
        return selectedWarehouseId || orderWarehouseIds[0] || '';
    }, [orderWarehouseIds, selectedWarehouseId]);

    // eslint-disable-next-line no-unused-vars
    const orderProductIds = useMemo(() => {
        if (!order?.items) return [];
        return [...new Set(order.items.map((i) => i.productId).filter(Boolean))];
    }, [order]);

    const { data: stockData, isFetching: stockFetching } = useGetProductStocksQuery(
        { warehouseId: activeWarehouseId || undefined, page: 0, size: 100 },
        { skip: !activeWarehouseId || !order }
    );
    const stockItems = stockData?.items ?? [];

    const comparison = useMemo(() => {
        if (!order?.items) return [];
        return order.items.map((item) => {
            const stock    = stockItems.find((s) => s.productId === item.productId && (activeWarehouseId ? s.warehouseId === activeWarehouseId : true));
            const stockQty = stock?.quantity ?? 0;
            const orderQty = item.quantity;
            const enough   = stockQty >= orderQty;
            const diff     = stockQty - orderQty;
            return { ...item, stockQty, enough, diff };
        });
    }, [order, stockItems, activeWarehouseId]);

    const allEnough = comparison.length > 0 && comparison.every((c) => c.enough);
    const someShort = comparison.some((c) => !c.enough);

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

    // Print: layout yashirish/ko'rsatish

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

    const items    = order.items ?? [];
    const editable = order.status === 'PENDING';

    const fmtDate     = (v) => v ? new Date(v).toLocaleDateString('uz-UZ') : '—';
    const fmtDateTime = (v) => v ? new Date(v).toLocaleString('uz-UZ') : '—';
    const fmtNum      = (v) => { const n = Number(v ?? 0); return n.toLocaleString('ru-RU').replace(/\u00A0/g, ' '); };

    return (
        <>
            {showPrintModal && (
                <OrderPrintModal 
                    order={order} 
                    onClose={() => setShowPrintModal(false)} 
                />
            )}
            
            {/* ── PRINT STYLES — invoice yangi windowda ochiladi, bu faqat hide uchun ── */}
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

                            <button type="button" onClick={() => setShowPrintModal(true)} title="Chop etish"
                                className={`flex h-12 items-center gap-2 rounded-xl border px-5 text-sm font-bold transition-colors hover:border-amber-400/60 hover:text-amber-500 ${ghostBtn}`}>
                                <LuPrinter size={16} /> Chop etish
                            </button>

                            <button type="button" onClick={() => navigate(`${ordersPath}/${order.id}/edit`)}
                                disabled={!editable}
                                title={editable ? 'Tahrirlash' : 'Faqat "Kutilmoqda" holatidagi buyurtma tahrirlanadi'}
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
                            { label: 'Yaratgan',          value: order.createdBy,       icon: LuUser },
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

                    <div className={`flex items-center gap-2 border-t px-5 py-3.5 ${line}`}>
                        <h2 className={`text-sm font-bold ${head}`}>Mahsulotlar</h2>
                        <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-xs font-bold text-amber-500">{items.length}</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-[#1e293b] text-white text-left text-xs font-semibold uppercase tracking-wide">
                                    <th className="px-5 py-3">Mahsulot</th>
                                    <th className="w-44 px-5 py-3">Barcode</th>
                                    <th className="w-48 px-5 py-3">Ombor</th>
                                    <th className="w-32 px-5 py-3 text-right">Narx</th>
                                    <th className="w-28 px-5 py-3 text-right">Miqdor</th>
                                    <th className="w-40 px-5 py-3 text-right">Jami</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${divider}`}>
                                {items.length === 0 ? (
                                    <tr><td colSpan={6} className={`py-10 text-center text-sm ${muted}`}>Mahsulotlar topilmadi</td></tr>
                                ) : items.map((item, idx) => (
                                    <tr key={item.id} className={`transition-colors ${rowBg}`}>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <span className={`w-4 shrink-0 text-xs font-bold ${muted}`}>{idx + 1}</span>
                                                <span className={`font-semibold ${head}`}>{item.productName}</span>
                                            </div>
                                        </td>
                                        <td className={`px-5 py-3 font-mono text-xs ${muted}`}>
                                            <span className="flex items-center gap-1.5"><LuBarcode size={13} />{item.productBarcode}</span>
                                        </td>
                                        <td className={`px-5 py-3 text-xs ${muted}`}>
                                            <span className="flex items-center gap-1.5"><LuWarehouse size={13} />{item.warehouseName}</span>
                                        </td>
                                        <td className={`px-5 py-3 text-right text-xs font-semibold ${muted}`}>{fmtNum(item.unitPrice)}</td>
                                        <td className={`px-5 py-3 text-right font-bold ${head}`}>{item.quantity}</td>
                                        <td className={`px-5 py-3 text-right font-bold ${head}`}>{fmtNum(item.lineTotal)} so&apos;m</td>
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

                {/* ── Ombor qoldiqlari taqqoslov — faqat APPROVED bo'lmasa ── */}
                {order.status !== 'APPROVED' && (
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
                                        <th className="w-36 px-5 py-3 text-right">Ombordа qoldiq</th>
                                        <th className="w-32 px-5 py-3 text-right">Buyurtmada</th>
                                        <th className="w-32 px-5 py-3 text-right">Farq</th>
                                        <th className="w-32 px-5 py-3 text-center">Holat</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${divider}`}>
                                    {comparison.map((row) => {
                                        const enough     = row.enough;
                                        const diff       = row.diff;
                                        const statusIcon = enough
                                            ? <LuCircleCheck size={15} className={isDark ? 'text-green-400' : 'text-green-600'} />
                                            : <LuCircleX     size={15} className={isDark ? 'text-red-400'   : 'text-red-600'} />;
                                        const statusCls  = enough ? (isDark ? 'text-green-400' : 'text-green-700') : (isDark ? 'text-red-400' : 'text-red-600');
                                        const diffCls    = diff === 0 ? muted : diff > 0 ? (isDark ? 'text-green-400' : 'text-green-700') : (isDark ? 'text-red-400' : 'text-red-600');
                                        const rowAccent  = !enough ? (isDark ? 'bg-red-500/5' : 'bg-red-50/60') : '';
                                        return (
                                            <tr key={row.productId} className={`transition-colors ${rowAccent} ${rowBg}`}>
                                                <td className="px-5 py-3">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className={`font-semibold ${head}`}>{row.productName}</span>
                                                        {row.productBarcode && <span className={`font-mono text-xs ${muted}`}>{row.productBarcode}</span>}
                                                    </div>
                                                </td>
                                                <td className={`px-5 py-3 text-right font-bold tabular-nums ${head}`}>{fmtNum(row.stockQty)}</td>
                                                <td className={`px-5 py-3 text-right font-bold tabular-nums ${head}`}>{fmtNum(row.quantity)}</td>
                                                <td className={`px-5 py-3 text-right font-bold tabular-nums ${diffCls}`}>{diff > 0 ? `+${fmtNum(diff)}` : fmtNum(diff)}</td>
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
                    {/* Chap: Logo + kompaniya nomi */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src={logoSvg} alt="LEGO PRO" style={{ height: '52px', width: 'auto', objectFit: 'contain' }} />
                        <div>
                            <div style={{ fontWeight: 900, fontSize: '16px', color: '#0f172a', letterSpacing: '0.5px' }}>LEGO PRO</div>
                            <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '2px' }}>Innovatsion PVX profillari</div>
                        </div>
                    </div>
                    {/* O'ng: INVOICE so'zi */}
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '36px', fontWeight: 900, letterSpacing: '5px', color: '#111827', lineHeight: 1 }}>INVOICE</div>
                    </div>
                </div>

                {/* Accent chiziq */}
                <div className="inv-accent" style={{ height: '2.5px', background: '#f59e0b', margin: '10px 0 14px 0' }} />

                {/* ══ MIJOZ MA'LUMOTI + HUJJAT № ══ */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', gap: '20px' }}>
                    {/* Chap: Mijoz */}
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
                    {/* O'ng: Hujjat № va Sana */}
                    <div style={{ minWidth: '190px' }}>
                        <table  style={{  borderCollapse: 'collapse', width: '100%' }}>
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
                                    <td style={{ fontSize: '10px', fontWeight: 700, textAlign: 'right', color: order.status === 'APPROVED' ? '#15803d' : order.status === 'REJECTED' ? '#b91c1c' : '#92400E' }}>
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
                            <td style={{ padding: 0, width: '48px',  borderRight: '1px solid #334155' }}>
                                <div style={{ background: '#1e293b', color: '#fff', padding: '7px 8px', textAlign: 'center', fontSize: '9.5px', fontWeight: 700 }}>Pachka</div>
                            </td>
                            <td style={{ padding: 0, width: '44px',  borderRight: '1px solid #334155' }}>
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
                        {items.map((item, idx) => (
                            <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                                <td style={{ backgroundColor: '#ffffff', padding: '6px 8px', textAlign: 'center', fontSize: '10px', color: '#374151', borderRight: '1px solid #e2e8f0' }}>{idx + 1}</td>
                                <td style={{ backgroundColor: '#ffffff', padding: '6px 8px', fontSize: '10px', borderRight: '1px solid #e2e8f0' }}>
                                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.productName || '—'}</div>
                                    {item.productBarcode && (
                                        <div style={{ fontSize: '8.5px', color: '#94a3b8', fontFamily: 'monospace', marginTop: '1px' }}>{item.productBarcode}</div>
                                    )}
                                </td>
                                {/* Pachka: quantity / 6 yoki to'g'ridan quantity */}
                                <td style={{ backgroundColor: '#ffffff', padding: '6px 8px', textAlign: 'center', fontSize: '10px', color: '#374151', borderRight: '1px solid #e2e8f0' }}>
                                    {item.quantity}
                                </td>
                                {/* Dona: quantity */}
                                <td style={{ backgroundColor: '#ffffff', padding: '6px 8px', textAlign: 'center', fontSize: '10px', color: '#374151', borderRight: '1px solid #e2e8f0' }}>
                                    {item.quantity}
                                </td>
                                <td style={{ backgroundColor: '#ffffff', padding: '6px 8px', textAlign: 'right', fontSize: '10px', color: '#374151', borderRight: '1px solid #e2e8f0' }}>
                                    {fmtNum(item.unitPrice)}
                                </td>
                                <td style={{ backgroundColor: '#ffffff', padding: '6px 8px', textAlign: 'right', fontSize: '10px', fontWeight: 700, color: '#0f172a' }}>
                                    {fmtNum(item.lineTotal)}
                                </td>
                            </tr>
                        ))}
                        {/* Bo'sh qatorlar */}
                        {Array.from({ length: Math.max(0, 9 - items.length) }).map((_, i) => (
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

                {/* ══ TO'LOV MA'LUMOTLARI + JAMI ══ */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', marginTop: '14px', marginBottom: '12px' }}>
                    {/* Chap: To'lov ma'lumotlari */}
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#0f172a', marginBottom: '5px' }}>To&apos;lov ma&apos;lumotlari:</div>
                        <div style={{ fontSize: '9.5px', color: '#374151', lineHeight: 1.7 }}>
                            <div>Mijoz: <strong>{order.customerName || '—'}</strong></div>
                            <div>Mas&apos;ul: <strong>{order.createdBy || '—'}</strong></div>
                            <div>Sana: <strong>{fmtDateTime(order.createdAt)}</strong></div>
                            {order.summary && <div>Izoh: {order.summary}</div>}
                        </div>
                    </div>

                    {/* O'ng: Olingan tovar / Oldingi qarz / UMUMIY QARZ */}
                    <div style={{ minWidth: '220px' }}>
                        {/* Olingan tovar jami */}
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
                        {/* Oldingi qarzi — paidAmount */}
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
                        {/* UMUMIY QARZ — remainingDebt */}
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
