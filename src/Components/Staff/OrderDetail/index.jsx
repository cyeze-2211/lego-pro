import { useState, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    LuArrowLeft, LuUser, LuStickyNote, LuClock3,
    LuCircleAlert, LuBoxes, LuPackage, LuBarcode,
    LuArrowDownToLine, LuPrinter,
} from 'react-icons/lu';
import { useAppTheme } from '../../../theme/tokens';
import { formatNumber } from '../../ui/number-format';
import {
    useGetSalesOrderByIdQuery,
    useLoadSalesOrderMutation,
} from '../../../store/services/salesOrder.api';
import { useGetProductStocksQuery } from '../../../store/services/productStock.api';
import { useGetWarehousesQuery } from '../../../store/services/warehouse.api';
import { useCreateStockTransactionMutation } from '../../../store/services/productStock.api';
import Loading from '../../Other/UI/Loadings/Loading';
import { STATUS_LABEL, statusCx } from '../../Zayavkachi/__components/statusBadge';
import OrderPrintModal from '../../Zayavkachi/__components/OrderPrintModal';
import { Alert } from '../../Other/UI/Alert/Alert';

export default function StaffOrderDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isDark } = useAppTheme();

    // State declarations BIRINCHI BO'LISHI KERAK
    const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
    const [scannedQuantities, setScannedQuantities] = useState({});
    const [isLimitedScanMode, setIsLimitedScanMode] = useState(true);
    const [barcodeInput, setBarcodeInput] = useState('');
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [hasCreatedOutcome, setHasCreatedOutcome] = useState(false);
    const barcodeInputRef = useRef(null);

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
    const activeWarehouseName = warehouses.find((warehouse) => warehouse.id === activeWarehouseId)?.name ?? '—';

    const { data: stockData, isFetching: stockFetching } = useGetProductStocksQuery(
        { warehouseId: activeWarehouseId || undefined, page: 0, size: 100 },
        { skip: !activeWarehouseId || !order }
    );
    const stockItems = useMemo(() => stockData?.items ?? [], [stockData]);

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
            const piecesPerPack = Number(
                item.productPiecesPerPack ?? item.piecesPerPack ?? stock?.productPiecesPerPack
            ) || 1;
            const enough = stockQty >= orderQty;
            const diff = stockQty - orderQty;
            return {
                ...item,
                stockQty,
                enough,
                diff,
                piecesPerPack,
                hasPackInfo: Boolean(
                    Number(item.productPiecesPerPack ?? item.piecesPerPack ?? stock?.productPiecesPerPack)
                ),
                requiredPacks: orderQty / piecesPerPack,
                editableQty: orderQty,
                rowKey: item.id ?? item.productId,
            };
        });
    }, [order, stockItems, activeWarehouseId]);

    const allEnough = comparison.length > 0 && comparison.every((c) => c.enough);
    const someShort = comparison.some((c) => !c.enough);
    const isLoadingOrder = ['CREATED', 'APPROVED'].includes(
        String(order?.status ?? '').toUpperCase(),
    );
    const scannedTotal = comparison.reduce(
        (sum, item) => sum + (scannedQuantities[item.rowKey] ?? 0),
        0,
    );
    const requiredTotal = comparison.reduce((sum, item) => sum + item.requiredPacks, 0);

    const updateScannedQuantity = (item, change) => {
        const currentPacks = scannedQuantities[item.rowKey] ?? 0;
        const nextPacks = Math.max(0, currentPacks + change);

        if (isLimitedScanMode && nextPacks * item.piecesPerPack > item.editableQty) {
            Alert(
                `${item.productName} uchun buyurtmadagi dona miqdoridan ortiq pachka yuklab bo'lmaydi`,
                'error',
            );
            return;
        }

        setScannedQuantities((previous) => ({
            ...previous,
            [item.rowKey]: nextPacks,
        }));
    };

    const setScannedPacks = (item, value) => {
        if (value === '') {
            setScannedQuantities((previous) => ({ ...previous, [item.rowKey]: 0 }));
            return;
        }

        const nextPacks = Number(value);
        if (!Number.isFinite(nextPacks) || nextPacks < 0) return;
        if (isLimitedScanMode && nextPacks * item.piecesPerPack > item.editableQty) {
            Alert(
                `${item.productName} uchun buyurtmadagi dona miqdoridan ortiq pachka yuklab bo'lmaydi`,
                'error',
            );
            return;
        }
        setScannedQuantities((previous) => ({ ...previous, [item.rowKey]: nextPacks }));
    };

    const handleBarcodeSubmit = (event) => {
        event.preventDefault();
        const barcode = barcodeInput.trim();
        if (!barcode) return;

        const item = comparison.find((candidate) => candidate.productBarcode?.trim() === barcode);
        if (!item) {
            Alert('Bu shtrix-kod buyurtmada topilmadi', 'error');
            setBarcodeInput('');
            barcodeInputRef.current?.focus();
            return;
        }

        updateScannedQuantity(item, 1);
        setBarcodeInput('');
        barcodeInputRef.current?.focus();
    };

    const handleScanModeChange = (isLimited) => {
        if (isLimited && comparison.some(
            (item) => (scannedQuantities[item.rowKey] ?? 0) * item.piecesPerPack > item.editableQty
        )) {
            Alert(
                'Yuklangan pachkalar buyurtma miqdoridan ko‘p. Limit rejimini yoqishdan oldin miqdorni kamaytiring',
                'error',
            );
            return;
        }
        setIsLimitedScanMode(isLimited);
    };

    const [createTransaction, { isLoading: isSubmitting }] = useCreateStockTransactionMutation();
    const [loadSalesOrder, { isLoading: isUpdatingStatus }] = useLoadSalesOrderMutation();

    const handleOutcome = async () => {
        if (!hasCreatedOutcome) {
            if (!allEnough) {
                Alert('Omborga yetarli miqdorda mahsulot yo`q', 'error');
                return;
            }
            if (!activeWarehouseId) {
                Alert('Omborni tanlang', 'error');
                return;
            }

            const items = comparison.map((item) => ({
                productId: item.productId,
                quantity: item.editableQty,
                unit: 'PIECE',
            }));

            try {
                await createTransaction({
                    warehouseId: activeWarehouseId,
                    orderId: order.id,
                    action: 'OUT',
                    items,
                }).unwrap();
                setHasCreatedOutcome(true);
            } catch (error) {
                Alert(error?.data?.message || 'Chiqim qilishda xatolik', 'error');
                return;
            }
        }

        try {
            await loadSalesOrder(order.id).unwrap();
            Alert('Chiqim amalga oshirildi, buyurtma holati Ortildi ga o`zgartirildi', 'success');
            navigate('/staff/orders');
        } catch (error) {
            Alert(
                `Chiqim amalga oshdi, ammo holatni Ortildi ga o‘tkazib bo‘lmadi: ${
                    error?.data?.message || 'qayta urinib ko‘ring'
                }`,
                'error',
            );
        }
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
                        {String(order.status ?? '').toUpperCase() === 'LOADED' && (
                            <button
                                type="button"
                                onClick={() => setShowPrintModal(true)}
                                className="flex h-12 items-center gap-2 rounded-xl bg-amber-400 px-5 text-sm font-bold text-[#0f172a] transition-colors hover:bg-amber-500"
                            >
                                <LuPrinter size={17} /> Chop etish
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
                            {formatNumber(order.totalAmount ?? 0)} so&apos;m
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
                            <p className={`text-xs ${muted}`}>Ombor qoldig&apos;i bilan taqqoslash</p>
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

                {isLoadingOrder && (
                    <div className={`mx-5 my-5 overflow-hidden rounded-2xl border shadow-sm ${
                        isDark ? 'border-[#334155] bg-[#1e293b]/50' : 'border-[#e2e8f0] bg-[#f8fafc]'
                    }`}>
                        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                            <div className="flex items-center gap-3">
                                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-500">
                                    <LuBarcode size={24} />
                                </span>
                                <div>
                                    <p className={`text-base font-bold ${head}`}>Yuklash nazorati</p>

                                </div>
                            </div>
                            <div className={`rounded-xl border px-4 py-2.5 text-right ${
                                isDark ? 'border-[#334155] bg-[#0f172a]/70' : 'border-[#e2e8f0] bg-white'
                            }`}>
                                <p className={`text-[11px] font-bold uppercase tracking-wide ${muted}`}>Jami yuklandi</p>
                                <p className={`text-lg font-extrabold tabular-nums ${head}`}>
                                    <span className="text-amber-500">{formatNumber(scannedTotal)}</span>
                                    <span className={`text-sm font-semibold ${muted}`}> / {formatNumber(requiredTotal)} pachka</span>
                                </p>
                            </div>
                        </div>

                        <div className={`grid gap-4 border-t p-5 lg:grid-cols-[minmax(0,1fr)_auto] ${line}`}>
                            <div>
                                <label className={`mb-2 block text-xs font-bold uppercase tracking-wide ${muted}`} htmlFor="order-barcode">
                                    Mahsulot shtrix-kodi
                                </label>
                                <form onSubmit={handleBarcodeSubmit} className="flex items-center gap-3">
                                    <input
                                        id="order-barcode"
                                        ref={barcodeInputRef}
                                        autoFocus
                                        value={barcodeInput}
                                        onChange={(event) => setBarcodeInput(event.target.value)}
                                        placeholder="Skaner bilan kodni o'qing..."
                                        aria-label="Mahsulot shtrix-kodi"
                                        className={`h-14 min-w-0 flex-1 rounded-xl border px-4 text-base outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 ${
                                            isDark
                                                ? 'border-[#334155] bg-[#0f172a] text-white placeholder:text-[#64748b]'
                                                : 'border-[#e2e8f0] bg-white text-[#0f172a] placeholder:text-[#94a3b8]'
                                        }`}
                                    />
                                </form>

                            </div>
                            <div className="lg:min-w-[320px]">
                                <p className={`mb-2 text-xs font-bold uppercase tracking-wide ${muted}`}>Yuklash rejimi</p>
                                <div className={`grid h-14 grid-cols-2 rounded-xl border p-1 ${
                                    isDark ? 'border-[#334155] bg-[#0f172a]' : 'border-[#e2e8f0] bg-white'
                                }`}>
                                    {[
                                        { limited: true, label: 'Limitli', hint: 'Buyurtmagacha' },
                                        { limited: false, label: 'Limitsiz', hint: 'Ortiq yuklash mumkin' },
                                    ].map(({ limited, label, hint }) => (
                                        <button
                                            key={label}
                                            type="button"
                                            onClick={() => handleScanModeChange(limited)}
                                            aria-pressed={isLimitedScanMode === limited}
                                            className={`rounded-lg px-3 text-left transition-colors ${
                                                isLimitedScanMode === limited
                                                    ? 'bg-amber-400 text-[#0f172a]'
                                                    : `${muted} hover:bg-amber-400/10`
                                            }`}
                                        >
                                            <span className="block text-sm font-bold">{label}</span>
                                            <span className="block text-[10px] leading-tight opacity-75">{hint}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

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
                                        <th className="px-5 py-3 w-36 text-center">Buyurtma</th>
                                        {isLoadingOrder && <th className="px-5 py-3 w-64 text-center">Yuklangan pachka</th>}
                                        <th className="px-5 py-3 w-32 text-center">Qoldiq</th>
                                        <th className="px-5 py-3 w-32 text-center">Farq</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${divider}`}>
                                    {comparison.map((item, idx) => (
                                        <tr key={item.rowKey} className="transition-colors">
                                            <td className={`px-5 py-3 text-xs ${muted}`}>{idx + 1}</td>
                                            <td className="px-5 py-3">
                                                <p className={`font-semibold ${head}`}>{item.productName}</p>
                                                <p className={`text-xs ${muted}`}>{item.productBarcode}</p>
                                            </td>
                                            <td className={`px-5 py-3 text-xs ${muted}`}>
                                                {item.warehouseName}
                                            </td>
                                            <td className="px-5 py-3 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className={`inline-flex min-w-16 justify-center rounded-xl border px-4 py-2 text-base font-extrabold tabular-nums ${
                                                        isDark
                                                            ? 'border-[#334155] bg-[#0f172a]/70 text-white'
                                                            : 'border-[#e2e8f0] bg-slate-50 text-[#0f172a]'
                                                    }`}>
                                                        {formatNumber(item.editableQty)} dona
                                                    </span>

                                                </div>
                                            </td>
                                            {isLoadingOrder && (
                                                <td className="px-5 py-3 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => updateScannedQuantity(item, -1)}
                                                            disabled={(scannedQuantities[item.rowKey] ?? 0) === 0}
                                                            aria-label={`${item.productName} pachka sonini kamaytirish`}
                                                            className={`flex h-11 w-11 items-center justify-center rounded-xl border text-xl font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${
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
                                                            step="any"
                                                            value={scannedQuantities[item.rowKey] ?? 0}
                                                            onChange={(event) => setScannedPacks(item, event.target.value)}
                                                            aria-label={`${item.productName} yuklangan pachka soni`}
                                                            className={`h-11 w-24 rounded-xl border text-center text-base font-extrabold tabular-nums outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 ${
                                                                isDark
                                                                    ? 'border-[#334155] bg-[#1e293b] text-white'
                                                                    : 'border-[#e2e8f0] bg-white text-[#0f172a]'
                                                            }`}
                                                        />

                                                        <button
                                                            type="button"
                                                            onClick={() => updateScannedQuantity(item, 1)}
                                                            disabled={isLimitedScanMode && (scannedQuantities[item.rowKey] ?? 0) * item.piecesPerPack >= item.editableQty}
                                                            aria-label={`${item.productName} yuklangan pachkasiga bitta qo‘shish`}
                                                            className={`flex h-11 w-11 items-center justify-center rounded-xl border text-xl font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${
                                                                isDark
                                                                    ? 'border-[#334155] bg-[#1e293b] text-white hover:bg-[#334155]'
                                                                    : 'border-[#e2e8f0] bg-white text-[#0f172a] hover:bg-[#f1f5f9]'
                                                            }`}
                                                        >
                                                            +
                                                        </button>
                                                    </div>

                                                </td>
                                            )}
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
                        {allEnough && isLoadingOrder && (
                            <div className="mx-5 mb-5 rounded-xl border border-green-400/30 bg-green-400/10 px-4 py-3">
                                <p className="text-sm font-semibold text-green-500">
                                    ✓ Barcha mahsulotlar omborga mavjud. Chiqim qilishingiz mumkin.
                                </p>
                            </div>
                        )}
                        {isLoadingOrder && comparison.length > 0 && (
                            <div className={`mx-5 mb-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-4 ${
                                isDark ? 'border-[#334155] bg-[#0f172a]/50' : 'border-[#e2e8f0] bg-slate-50'
                            }`}>
                                <div>
                                    <p className={`text-sm font-bold ${head}`}>Buyurtma bo&apos;yicha umumiy chiqim</p>
                                    <p className={`mt-1 text-xs ${muted}`}>
                                        {activeWarehouseName} · {comparison.length} ta mahsulot · {formatNumber(requiredTotal)} pachka
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleOutcome}
                                    disabled={(!allEnough && !hasCreatedOutcome) || !activeWarehouseId || isSubmitting || isUpdatingStatus}
                                    className="inline-flex h-14 min-w-56 items-center justify-center gap-3 rounded-xl bg-emerald-500 px-7 text-base font-extrabold text-white shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
                                >
                                    {isSubmitting || isUpdatingStatus ? (
                                        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                        </svg>
                                    ) : (
                                        <LuArrowDownToLine size={21} />
                                    )}
                                    {hasCreatedOutcome ? 'Ortildi holatiga o‘tkazish' : 'Chiqim qilish'}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
            {showPrintModal && (
                <OrderPrintModal
                    order={order}
                    showPrices={false}
                    onClose={() => setShowPrintModal(false)}
                />
            )}

        </div>
    );
}
