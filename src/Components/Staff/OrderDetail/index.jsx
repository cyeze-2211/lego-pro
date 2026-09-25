import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    LuArrowLeft, LuUser, LuStickyNote, LuClock3,
    LuCircleAlert, LuBoxes, LuWarehouse, LuPackage, LuTruck,
} from 'react-icons/lu';
import { useAppTheme } from '../../../theme/tokens';
import { useGetSalesOrderByIdQuery } from '../../../store/services/salesOrder.api';
import { useGetProductStocksQuery } from '../../../store/services/productStock.api';
import { useGetWarehousesQuery } from '../../../store/services/warehouse.api';
import { useCreateStockTransactionMutation } from '../../../store/services/productStock.api';
import Loading from '../../Other/UI/Loadings/Loading';
import { STATUS_LABEL, statusCx } from '../../Zayavkachi/__components/statusBadge';
import { Alert } from '../../Other/UI/Alert/Alert';

export default function StaffOrderDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isDark } = useAppTheme();

    // State declarations BIRINCHI BO'LISHI KERAK
    const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
    const [editableQuantities, setEditableQuantities] = useState({});

    const { data: order, isLoading, isError } = useGetSalesOrderByIdQuery(id, { skip: !id });
    const { data: warehouses = [] } = useGetWarehousesQuery('PRODUCT');

    const orderWarehouseIds = useMemo(() => {
        if (!order?.items) return [];
        return [...new Set(order.items.map((i) => i.warehouseId).filter(Boolean))];
    }, [order]);

    const activeWarehouseId = useMemo(() => {
        if (orderWarehouseIds.length === 1) return orderWarehouseIds[0];
        return selectedWarehouseId || orderWarehouseIds[0] || '';
    }, [orderWarehouseIds, selectedWarehouseId]);

    const { data: stockData, isFetching: stockFetching } = useGetProductStocksQuery(
        { warehouseId: activeWarehouseId || undefined, page: 0, size: 100 },
        { skip: !activeWarehouseId || !order }
    );
    const stockItems = stockData?.items ?? [];

    const comparison = useMemo(() => {
        if (!order?.items) return [];
        return order.items.map((item) => {
            const stock = stockItems.find(
                (s) =>
                    s.productId === item.productId &&
                    (activeWarehouseId ? s.warehouseId === activeWarehouseId : true)
            );
            const stockQty = stock?.quantity ?? 0;
            const orderQty = editableQuantities[item.id] ?? item.quantity;
            const enough = stockQty >= orderQty;
            const diff = stockQty - orderQty;
            return { ...item, stockQty, enough, diff, editableQty: orderQty };
        });
    }, [order, stockItems, activeWarehouseId, editableQuantities]);

    const allEnough = comparison.length > 0 && comparison.every((c) => c.enough);
    const someShort = comparison.some((c) => !c.enough);

    const [createTransaction, { isLoading: isSubmitting }] = useCreateStockTransactionMutation();

    const handleOutcome = async () => {
        if (!allEnough) {
            Alert('Omborga yetarli miqdorda mahsulot yo`q', 'error');
            return;
        }
        if (!activeWarehouseId) {
            Alert('Omborni tanlang', 'error');
            return;
        }

        try {
            const items = comparison.map((item) => ({
                productId: item.productId,
                quantity: item.editableQty,
            }));

            await createTransaction({
                warehouseId: activeWarehouseId,
                orderId: order.id,
                action: 'OUT',
                items,
            }).unwrap();

            Alert('Chiqim muvaffaqiyatli amalga oshirildi', 'success');
            navigate('/staff/orders');
        } catch (error) {
            Alert(error?.data?.message || 'Chiqim qilishda xatolik', 'error');
        }
    };

    const handleSingleOutcome = async (item) => {
        if (!item.enough) {
            Alert(`${item.productName} mahsulotidan yetarli miqdorda yo'q`, 'error');
            return;
        }
        if (!activeWarehouseId) {
            Alert('Omborni tanlang', 'error');
            return;
        }

        try {
            await createTransaction({
                warehouseId: activeWarehouseId,
                orderId: order.id,
                action: 'OUT',
                items: [{
                    productId: item.productId,
                    quantity: item.editableQty,
                }],
            }).unwrap();

            Alert(`${item.productName} chiqim qilindi`, 'success');
            // Refresh order data
            window.location.reload();
        } catch (error) {
            Alert(error?.data?.message || 'Chiqim qilishda xatolik', 'error');
        }
    };

    const handleQuantityChange = (itemId, newValue) => {
        const numValue = typeof newValue === 'number' ? newValue : (parseInt(newValue) || 0);
        if (numValue < 0) return;
        
        // Ombor qoldig'idan oshmasin
        const item = comparison.find(i => i.id === itemId);
        if (item && numValue > item.stockQty) return;
        
        setEditableQuantities(prev => ({
            ...prev,
            [itemId]: numValue
        }));
    };

    /* ── theme ── */
    const panel = isDark ? 'border-white/10 bg-[#141C2B]' : 'border-[#e2e8f0] bg-white';
    const muted = isDark ? 'text-[#94a3b8]' : 'text-[#64748b]';
    const head = isDark ? 'text-white' : 'text-[#0f172a]';
    const divider = isDark ? 'divide-[#334155]/50' : 'divide-[#f1f5f9]';
    const line = isDark ? 'border-[#334155]/60' : 'border-[#f1f5f9]';
    const ghostBtn = isDark
        ? 'border-[#334155] text-[#94a3b8] hover:bg-[#1e293b]'
        : 'border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9]';

    const backToList = () => navigate('/staff/orders');

    if (isLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Loading />
            </div>
        );
    }

    if (isError || !order) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-[#f43f5e]">
                <LuCircleAlert size={34} />
                <p className="text-lg">Buyurtmani yuklashda xatolik</p>
                <button
                    type="button"
                    onClick={backToList}
                    className="flex h-12 items-center gap-2 rounded-xl border border-[#f43f5e]/30 px-5 text-sm font-bold"
                >
                    <LuArrowLeft size={16} /> Buyurtmalar ro&apos;yxatiga qaytish
                </button>
            </div>
        );
    }

    return (
        <div className="flex w-full flex-col gap-4 py-2">
            {/* ── Header ────────────────────────────────────────────────── */}
            <div className={`relative overflow-hidden rounded-2xl border px-5 py-4 shadow-md ${panel}`}>
                <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-amber-400/6 to-transparent" />
                <div className="relative flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-400/10 text-amber-500">
                            <LuUser size={20} />
                        </span>
                        <div>
                            <h1 className={`text-xl font-bold tracking-tight leading-tight ${head}`}>
                                {order.customerName}
                            </h1>
                            <p className={`text-sm mt-0.5 ${muted}`}>Buyurtma #{order.id.slice(0, 8)}</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {order.status === 'APPROVED' && allEnough && (
                            <button
                                type="button"
                                onClick={handleOutcome}
                                disabled={isSubmitting}
                                className="flex h-12 items-center gap-2 rounded-xl bg-[#FACC15] px-6 text-sm font-bold text-[#0F172A] shadow-lg shadow-[#FACC15]/30 transition-all duration-200 hover:-translate-y-px hover:bg-[#EAB308] hover:shadow-xl disabled:opacity-50"
                            >
                                <LuTruck size={16} /> Hammasini chiqim qilish
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={backToList}
                            className={`flex h-12 items-center gap-2 rounded-xl border px-5 text-sm font-bold transition-colors ${ghostBtn}`}
                        >
                            <LuArrowLeft size={16} /> Buyurtmalar
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Ma'lumotlar ───────────────────────────────────────────── */}
            <div className={`rounded-2xl border shadow-md ${panel}`}>
                <div className="grid grid-cols-1 gap-4 px-5 py-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div>
                        <p className={`mb-1 flex items-center gap-1.5 text-xs font-semibold ${muted}`}>
                            <LuUser size={12} /> Mijoz
                        </p>
                        <p className={`text-sm font-bold ${head}`}>{order.customerName}</p>
                    </div>
                    <div>
                        <p className={`mb-1 flex items-center gap-1.5 text-xs font-semibold ${muted}`}>
                            <LuBoxes size={12} /> Holat
                        </p>
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusCx(order.status)}`}>
                            {STATUS_LABEL[order.status] ?? order.status}
                        </span>
                    </div>
                    <div>
                        <p className={`mb-1 flex items-center gap-1.5 text-xs font-semibold ${muted}`}>
                            <LuClock3 size={12} /> Jami summa
                        </p>
                        <p className={`text-sm font-bold ${head}`}>
                            {(order.totalAmount ?? 0).toLocaleString('uz-UZ')} so&apos;m
                        </p>
                    </div>
                    <div>
                        <p className={`mb-1 flex items-center gap-1.5 text-xs font-semibold ${muted}`}>
                            <LuClock3 size={12} /> Yaratilgan
                        </p>
                        <p className={`text-sm font-bold ${head}`}>
                            {order.createdAt ? new Date(order.createdAt).toLocaleString('uz-UZ') : '—'}
                        </p>
                    </div>
                </div>

                {order.summary && (
                    <div
                        className={`mx-5 mb-5 rounded-xl border px-4 py-3 ${
                            isDark ? 'border-[#334155] bg-[#1e293b]/50' : 'border-[#e2e8f0] bg-[#f8fafc]'
                        }`}
                    >
                        <p className={`mb-1 flex items-center gap-1.5 text-xs font-semibold ${muted}`}>
                            <LuStickyNote size={12} /> Izoh
                        </p>
                        <p className={`text-sm ${head}`}>{order.summary}</p>
                    </div>
                )}
            </div>

            {/* ── Mahsulotlar va qoldiq taqqoslash ──────────────────────── */}
            <div className={`rounded-2xl border shadow-md ${panel}`}>
                <div className={`flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3.5 ${line}`}>
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400/10 text-amber-500">
                            <LuPackage size={15} />
                        </span>
                        <div>
                            <p className={`text-sm font-bold ${head}`}>Buyurtma mahsulotlari</p>
                            <p className={`text-xs ${muted}`}>Ombor qoldig'i bilan taqqoslash</p>
                        </div>
                    </div>
                    {orderWarehouseIds.length > 1 && (
                        <select
                            value={activeWarehouseId}
                            onChange={(e) => setSelectedWarehouseId(e.target.value)}
                            className={`rounded-xl border px-3 py-2 text-xs font-semibold outline-none ${
                                isDark
                                    ? 'border-[#334155] bg-[#1e293b]/80 text-white'
                                    : 'border-[#e2e8f0] bg-white text-[#0f172a]'
                            }`}
                        >
                            {warehouses
                                .filter((w) => orderWarehouseIds.includes(w.id))
                                .map((w) => (
                                    <option key={w.id} value={w.id}>
                                        {w.name}
                                    </option>
                                ))}
                        </select>
                    )}
                </div>

                {stockFetching ? (
                    <div className={`flex items-center justify-center gap-2 py-12 text-sm ${muted}`}>
                        <svg className="h-4 w-4 animate-spin text-amber-400" viewBox="0 0 24 24" fill="none">
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Yuklanmoqda...
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr
                                        className={`text-left text-xs font-semibold uppercase tracking-wide ${muted} ${
                                            isDark ? 'bg-[#0f172a]/30' : 'bg-[#f8fafc]/80'
                                        }`}
                                    >
                                        <th className="px-5 py-3 w-14">№</th>
                                        <th className="px-5 py-3">Mahsulot</th>
                                        <th className="px-5 py-3 w-32">Ombor</th>
                                        <th className="px-5 py-3 w-32 text-center">Buyurtma</th>
                                        <th className="px-5 py-3 w-32 text-center">Qoldiq</th>
                                        <th className="px-5 py-3 w-32 text-center">Farq</th>
                                        {order.status === 'APPROVED' && (
                                            <th className="px-5 py-3 w-32 text-center">Amal</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${divider}`}>
                                    {comparison.map((item, idx) => (
                                        <tr key={item.id} className="transition-colors">
                                            <td className={`px-5 py-3 text-xs ${muted}`}>{idx + 1}</td>
                                            <td className="px-5 py-3">
                                                <p className={`font-semibold ${head}`}>{item.productName}</p>
                                                <p className={`text-xs ${muted}`}>{item.productBarcode}</p>
                                            </td>
                                            <td className={`px-5 py-3 text-xs ${muted}`}>
                                                {item.warehouseName}
                                            </td>
                                            <td className="px-5 py-3 text-center">
                                                {order.status === 'APPROVED' ? (
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleQuantityChange(item.id, Math.max(0, item.editableQty - 1))}
                                                            className={`flex h-8 w-8 items-center justify-center rounded-lg border font-bold transition-colors ${
                                                                isDark
                                                                    ? 'border-[#334155] bg-[#1e293b] text-white hover:bg-[#334155]'
                                                                    : 'border-[#e2e8f0] bg-white text-[#0f172a] hover:bg-[#f1f5f9]'
                                                            }`}
                                                        >
                                                            −
                                                        </button>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max={item.stockQty}
                                                            value={item.editableQty}
                                                            onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                                            className={`w-20 rounded-lg border px-2 py-1 text-center text-sm font-bold outline-none ${
                                                                isDark
                                                                    ? 'border-[#334155] bg-[#1e293b]/80 text-white'
                                                                    : 'border-[#e2e8f0] bg-white text-[#0f172a]'
                                                            }`}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => handleQuantityChange(item.id, Math.min(item.stockQty, item.editableQty + 1))}
                                                            className={`flex h-8 w-8 items-center justify-center rounded-lg border font-bold transition-colors ${
                                                                isDark
                                                                    ? 'border-[#334155] bg-[#1e293b] text-white hover:bg-[#334155]'
                                                                    : 'border-[#e2e8f0] bg-white text-[#0f172a] hover:bg-[#f1f5f9]'
                                                            }`}
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className={`font-bold ${head}`}>{item.editableQty}</span>
                                                )}
                                            </td>
                                            <td className={`px-5 py-3 text-center font-bold ${head}`}>
                                                {item.stockQty}
                                            </td>
                                            <td
                                                className={`px-5 py-3 text-center font-bold ${
                                                    item.enough
                                                        ? isDark
                                                            ? 'text-green-400'
                                                            : 'text-green-600'
                                                        : isDark
                                                        ? 'text-red-400'
                                                        : 'text-red-600'
                                                }`}
                                            >
                                                {item.diff >= 0 ? '+' : ''}
                                                {item.diff}
                                            </td>
                                            {order.status === 'APPROVED' && (
                                                <td className="px-5 py-3 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSingleOutcome(item)}
                                                        disabled={!item.enough || isSubmitting}
                                                        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                                                            item.enough
                                                                ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                                                                : 'bg-gray-500/10 text-gray-500 cursor-not-allowed'
                                                        } disabled:opacity-50`}
                                                    >
                                                        Chiqim
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Xabar jadval pastida */}
                        {someShort && (
                            <div className="mx-5 mb-5 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3">
                                <p className="text-sm font-semibold text-red-500">
                                    ⚠️ Ba&apos;zi mahsulotlardan omborga yetarli miqdorda yo&apos;q
                                </p>
                            </div>
                        )}
                        {allEnough && order.status === 'APPROVED' && (
                            <div className="mx-5 mb-5 rounded-xl border border-green-400/30 bg-green-400/10 px-4 py-3">
                                <p className="text-sm font-semibold text-green-500">
                                    ✓ Barcha mahsulotlar omborga mavjud. Chiqim qilishingiz mumkin.
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>

        </div>
    );
}
