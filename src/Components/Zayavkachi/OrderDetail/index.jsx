import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    LuArrowLeft, LuPackage, LuBarcode, LuUser, LuWarehouse,
    LuStickyNote, LuClock3, LuCircleAlert, LuPencil,
    LuChevronDown, LuTriangleAlert, LuCircleCheck, LuCircleX,
    LuBoxes,
} from 'react-icons/lu';
import { useAppTheme } from '../../../theme/tokens';
import { useGetSalesOrderByIdQuery } from '../../../store/services/salesOrder.api';
import { useGetProductStocksQuery } from '../../../store/services/productStock.api';
import { useGetWarehousesQuery } from '../../../store/services/warehouse.api';
import Loading from '../../Other/UI/Loadings/Loading';
import DeleteOrder from '../__components/DeleteOrder';
import { STATUS_LABEL, statusCx } from '../__components/statusBadge';

export default function ZayavkachiOrderDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isDark } = useAppTheme();
    const { data: order, isLoading, isError } = useGetSalesOrderByIdQuery(id, { skip: !id });

    // ── Omborlar ──────────────────────────────────────────────────────────
    const { data: warehouses = [] } = useGetWarehousesQuery('PRODUCT');

    // Orderdan foydalaniladigan omborlar (unique)
    const orderWarehouseIds = useMemo(() => {
        if (!order?.items) return [];
        return [...new Set(order.items.map((i) => i.warehouseId).filter(Boolean))];
    }, [order]);

    // Agar bitta ombor bo'lsa — avtomatik tanlanadi, ko'p bo'lsa — select
    const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
    const activeWarehouseId = useMemo(() => {
        if (orderWarehouseIds.length === 1) return orderWarehouseIds[0];
        return selectedWarehouseId || orderWarehouseIds[0] || '';
    }, [orderWarehouseIds, selectedWarehouseId]);

    // Orderdan unique productIdlar (tanlangan ombor bo'yicha)
    const orderProductIds = useMemo(() => {
        if (!order?.items) return [];
        return [...new Set(order.items.map((i) => i.productId).filter(Boolean))];
    }, [order]);

    // ── Stock ma'lumotlari — har bir mahsulot uchun alohida so'rov ──────
    // API da productId filtri bor, lekin biz hamma mahsulotlar uchun bir so'rovda olamiz
    // warehouseId + page=0, size=50 bilan barcha mahsulot qoldiqlari
    const { data: stockData, isFetching: stockFetching } = useGetProductStocksQuery(
        {
            warehouseId: activeWarehouseId || undefined,
            page: 0,
            size: 100,
        },
        { skip: !activeWarehouseId || !order }
    );
    const stockItems = stockData?.items ?? [];

    // ── Solishtirish: orderItem + stockItem juftlash ─────────────────────
    const comparison = useMemo(() => {
        if (!order?.items) return [];
        return order.items.map((item) => {
            const stock = stockItems.find(
                (s) =>
                    s.productId === item.productId &&
                    (activeWarehouseId ? s.warehouseId === activeWarehouseId : true)
            );
            const stockQty = stock?.quantity ?? 0;
            const orderQty = item.quantity;
            const enough = stockQty >= orderQty;
            const diff = stockQty - orderQty;
            return { ...item, stockQty, enough, diff };
        });
    }, [order, stockItems, activeWarehouseId]);

    const allEnough = comparison.length > 0 && comparison.every((c) => c.enough);
    const someShort = comparison.some((c) => !c.enough);

    /* ── theme ─────────────────────────────────────────────────────────── */
    const panel   = isDark ? 'border-white/10 bg-[#141C2B]' : 'border-[#e2e8f0] bg-white';
    const muted   = isDark ? 'text-[#94a3b8]' : 'text-[#64748b]';
    const head    = isDark ? 'text-white' : 'text-[#0f172a]';
    const divider = isDark ? 'divide-[#334155]/50' : 'divide-[#f1f5f9]';
    const line    = isDark ? 'border-[#334155]/60' : 'border-[#f1f5f9]';
    const rowBg   = isDark ? 'hover:bg-[#1e293b]/60' : 'hover:bg-amber-50/50';
    const ghostBtn = isDark
        ? 'border-[#334155] text-[#94a3b8] hover:bg-[#1e293b]'
        : 'border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9]';
    const inputCx = [
        'rounded-xl border px-3 py-2 text-sm outline-none transition-all duration-200',
        isDark
            ? 'border-[#334155] bg-[#1e293b]/80 text-white focus:border-amber-400'
            : 'border-[#e2e8f0] bg-white text-[#0f172a] focus:border-amber-400',
    ].join(' ');
    const selectCx = [
        inputCx,
        'pr-8 appearance-none cursor-pointer',
    ].join(' ');

    const backToList = () => navigate('/zayavkachi/orders');

    if (isLoading) {
        return <div className="flex min-h-[60vh] items-center justify-center"><Loading /></div>;
    }

    if (isError || !order) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-[#f43f5e]">
                <LuCircleAlert size={34} />
                <p className="text-lg">Buyurtmani yuklashda xatolik</p>
                <button type="button" onClick={backToList}
                    className="flex h-12 items-center gap-2 rounded-xl border border-[#f43f5e]/30 px-5 text-sm font-bold">
                    <LuArrowLeft size={16} /> Buyurtmalar ro&apos;yxatiga qaytish
                </button>
            </div>
        );
    }

    const items    = order.items ?? [];
    const editable = order.status === 'PENDING';

    return (
        <div className="flex w-full flex-col gap-4 py-2">

            {/* ── Header ────────────────────────────────────────────────── */}
            <div className={`relative overflow-hidden rounded-2xl border px-5 py-4 shadow-md ${panel}`}>
                <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-amber-400/6 to-transparent" />
                <div className="relative flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-400/10 text-amber-500">
                            <LuPackage size={20} />
                        </span>
                        <div>
                            <h1 className={`text-xl font-bold tracking-tight leading-tight ${head}`}>{order.customerName}</h1>
                            <p className={`text-sm mt-0.5 ${muted}`}>
                                {order.createdAt ? new Date(order.createdAt).toLocaleString('uz-UZ') : '—'}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-3 py-1.5 text-xs font-bold ${statusCx(order.status)}`}>
                            {STATUS_LABEL[order.status] ?? order.status}
                        </span>
                        <button type="button" onClick={() => navigate(`/zayavkachi/orders/${order.id}/edit`)}
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

            {/* ── Umumiy ma'lumot ───────────────────────────────────────── */}
            <div className={`rounded-2xl border shadow-md ${panel}`}>
                <div className="grid grid-cols-1 gap-4 px-5 py-4 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                        { label: 'Mijoz',      value: order.customerName, icon: LuUser },
                        { label: 'Yaratgan',   value: order.createdBy,    icon: LuUser },
                        { label: 'Jami summa', value: `${(order.totalAmount ?? 0).toLocaleString('uz-UZ')} so'm`, icon: LuPackage },
                        { label: "Oxirgi o'zgarish", value: order.lastModifiedAt ? new Date(order.lastModifiedAt).toLocaleString('uz-UZ') : '—', icon: LuClock3 },
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
                        <p className={`mb-1 flex items-center gap-1.5 text-xs font-semibold ${muted}`}>
                            <LuStickyNote size={12} /> Izoh
                        </p>
                        <p className={`text-sm ${head}`}>{order.summary}</p>
                    </div>
                )}

                {order.status === 'REJECTED' && order.rejectionReason && (
                    <div className="mx-5 mb-4 rounded-xl border border-[#f43f5e]/30 bg-[#f43f5e]/10 px-4 py-3">
                        <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[#f43f5e]">
                            <LuCircleAlert size={12} /> Rad etish sababi
                        </p>
                        <p className="text-sm font-semibold text-[#f43f5e]">{order.rejectionReason}</p>
                    </div>
                )}

                {/* ── Mahsulotlar ───────────────────────────────────────── */}
                <div className={`flex items-center gap-2 border-t px-5 py-3.5 ${line}`}>
                    <h2 className={`text-sm font-bold ${head}`}>Mahsulotlar</h2>
                    <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-xs font-bold text-amber-500">
                        {items.length}
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className={`text-left text-xs font-semibold uppercase tracking-wide ${muted} ${isDark ? 'bg-[#0f172a]/30' : 'bg-[#f8fafc]/80'}`}>
                                <th className="px-5 py-3">Mahsulot</th>
                                <th className="px-5 py-3 w-44">Barcode</th>
                                <th className="px-5 py-3 w-48">Ombor</th>
                                <th className="px-5 py-3 w-32 text-right">Narx</th>
                                <th className="px-5 py-3 w-28 text-right">Miqdor</th>
                                <th className="px-5 py-3 w-40 text-right">Jami</th>
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
                                    <td className={`px-5 py-3 text-right text-xs font-semibold ${muted}`}>
                                        {(item.unitPrice ?? 0).toLocaleString('uz-UZ')}
                                    </td>
                                    <td className={`px-5 py-3 text-right font-bold ${head}`}>{item.quantity}</td>
                                    <td className={`px-5 py-3 text-right font-bold ${head}`}>
                                        {(item.lineTotal ?? 0).toLocaleString('uz-UZ')} so&apos;m
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className={`flex flex-wrap items-center justify-end gap-3 border-t px-5 py-4 ${line}`}>
                    <span className={`text-sm ${muted}`}>
                        Umumiy summa: <span className={`text-base font-bold ${head}`}>{(order.totalAmount ?? 0).toLocaleString('uz-UZ')} so&apos;m</span>
                    </span>
                </div>
            </div>

            {/* ── Ombor qoldiqlari taqqoslov ───────────────────────────── */}
            <div className={`rounded-2xl border shadow-md ${panel}`}>

                {/* Section header */}
                <div className={`flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 ${line}`}>
                    <div className="flex items-center gap-2">
                        <LuBoxes size={18} className="text-amber-500" />
                        <h2 className={`text-sm font-bold ${head}`}>Ombor qoldiqlari taqqoslov</h2>
                        {/* Summary badge */}
                        {!stockFetching && comparison.length > 0 && (
                            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${
                                allEnough
                                    ? isDark ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-green-500/30 bg-green-50 text-green-700'
                                    : someShort
                                    ? isDark ? 'border-red-500/30 bg-red-500/10 text-red-400' : 'border-red-500/30 bg-red-50 text-red-600'
                                    : 'border-amber-400/30 bg-amber-400/10 text-amber-500'
                            }`}>
                                {allEnough
                                    ? 'Barchasi yetarli'
                                    : `${comparison.filter((c) => !c.enough).length} ta yetishmaydi`}
                            </span>
                        )}
                    </div>

                    {/* Warehouse selector — ko'p ombor bo'lsa chiqadi */}
                    {orderWarehouseIds.length > 1 && (
                        <div className="relative flex items-center gap-2">
                            <LuWarehouse size={14} className={muted} />
                            <label className={`text-xs font-semibold shrink-0 ${muted}`}>Ombor:</label>
                            <div className="relative">
                                <select
                                    value={activeWarehouseId}
                                    onChange={(e) => setSelectedWarehouseId(e.target.value)}
                                    className={selectCx}
                                >
                                    {orderWarehouseIds.map((wid) => {
                                        const wh = warehouses.find((w) => w.id === wid);
                                        return (
                                            <option key={wid} value={wid}>
                                                {wh?.name ?? wid}
                                            </option>
                                        );
                                    })}
                                </select>
                                <LuChevronDown size={13} className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 ${muted}`} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Bitta ombor — label sifatida ko'rsat */}
                {orderWarehouseIds.length === 1 && (
                    <div className={`flex items-center gap-2 px-5 pt-4 pb-0`}>
                        <LuWarehouse size={14} className={muted} />
                        <span className={`text-xs font-semibold ${muted}`}>Ombor:</span>
                        <span className={`text-xs font-bold ${head}`}>
                            {warehouses.find((w) => w.id === activeWarehouseId)?.name ?? activeWarehouseId}
                        </span>
                    </div>
                )}

                {/* Loading */}
                {stockFetching && (
                    <div className={`flex items-center justify-center gap-2 py-10 text-sm ${muted}`}>
                        <svg className="h-4 w-4 animate-spin text-amber-400" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Qoldiqlar yuklanmoqda...
                    </div>
                )}

                {/* No warehouse selected */}
                {!stockFetching && !activeWarehouseId && (
                    <div className={`flex flex-col items-center gap-2 py-10 ${muted}`}>
                        <LuWarehouse size={30} strokeWidth={1.5} />
                        <p className="text-sm">Orderda ombor ma&apos;lumoti yo&apos;q</p>
                    </div>
                )}

                {/* Table */}
                {!stockFetching && activeWarehouseId && comparison.length > 0 && (
                    <div className="overflow-x-auto px-0 pb-2">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className={`text-left text-xs font-semibold uppercase tracking-wide ${muted} ${isDark ? 'bg-[#0f172a]/30' : 'bg-[#f8fafc]/80'}`}>
                                    <th className="px-5 py-3">Mahsulot</th>
                                    <th className="px-5 py-3 w-36 text-right">Ombordа qoldiq</th>
                                    <th className="px-5 py-3 w-32 text-right">Buyurtmada</th>
                                    <th className="px-5 py-3 w-32 text-right">Farq</th>
                                    <th className="px-5 py-3 w-32 text-center">Holat</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${divider}`}>
                                {comparison.map((row) => {
                                    const enough = row.enough;
                                    const diff   = row.diff;

                                    const statusIcon = enough
                                        ? <LuCircleCheck size={15} className={isDark ? 'text-green-400' : 'text-green-600'} />
                                        : <LuCircleX     size={15} className={isDark ? 'text-red-400'   : 'text-red-600'} />;

                                    const statusLabel = enough ? 'Yetarli' : 'Yetishmaydi';

                                    const statusCls = enough
                                        ? isDark ? 'text-green-400' : 'text-green-700'
                                        : isDark ? 'text-red-400'   : 'text-red-600';

                                    const diffCls = diff === 0
                                        ? muted
                                        : diff > 0
                                        ? isDark ? 'text-green-400' : 'text-green-700'
                                        : isDark ? 'text-red-400'   : 'text-red-600';

                                    const rowAccent = !enough
                                        ? isDark ? 'bg-red-500/5' : 'bg-red-50/60'
                                        : '';

                                    return (
                                        <tr key={row.productId} className={`transition-colors ${rowAccent} ${rowBg}`}>
                                            <td className="px-5 py-3">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className={`font-semibold ${head}`}>{row.productName}</span>
                                                    {row.productBarcode && (
                                                        <span className={`font-mono text-xs ${muted}`}>{row.productBarcode}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className={`px-5 py-3 text-right font-bold tabular-nums ${head}`}>
                                                {row.stockQty.toLocaleString('uz-UZ')}
                                            </td>
                                            <td className={`px-5 py-3 text-right font-bold tabular-nums ${head}`}>
                                                {row.quantity.toLocaleString('uz-UZ')}
                                            </td>
                                            <td className={`px-5 py-3 text-right font-bold tabular-nums ${diffCls}`}>
                                                {diff > 0 ? `+${diff.toLocaleString('uz-UZ')}` : diff.toLocaleString('uz-UZ')}
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className={`flex items-center justify-center gap-1.5 ${statusCls}`}>
                                                    {statusIcon}
                                                    <span className="text-xs font-bold">{statusLabel}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Overall warning banner */}
                {!stockFetching && someShort && (
                    <div className={`mx-5 mb-4 mt-2 flex items-start gap-3 rounded-xl border px-4 py-3 ${
                        isDark
                            ? 'border-red-500/30 bg-red-500/10 text-red-400'
                            : 'border-red-300 bg-red-50 text-red-700'
                    }`}>
                        <LuTriangleAlert size={16} className="mt-0.5 shrink-0" />
                        <p className="text-xs font-semibold leading-relaxed">
                            Buyurtmani to&apos;liq bajarish uchun{' '}
                            <span className="font-bold">
                                {comparison.filter((c) => !c.enough).map((c) => c.productName).join(', ')}
                            </span>{' '}
                            mahsulot(lar)dan ombordа yetarli qoldiq mavjud emas.
                        </p>
                    </div>
                )}

                {!stockFetching && activeWarehouseId && allEnough && comparison.length > 0 && (
                    <div className={`mx-5 mb-4 mt-2 flex items-center gap-3 rounded-xl border px-4 py-3 ${
                        isDark
                            ? 'border-green-500/30 bg-green-500/10 text-green-400'
                            : 'border-green-300 bg-green-50 text-green-700'
                    }`}>
                        <LuCircleCheck size={16} className="shrink-0" />
                        <p className="text-xs font-semibold">
                            Barcha mahsulotlar uchun ombordа yetarli qoldiq mavjud.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
