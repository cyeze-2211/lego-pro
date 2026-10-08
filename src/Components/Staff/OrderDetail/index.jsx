import { useState, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    LuArrowLeft, LuUser, LuStickyNote, LuClock3,
    LuCircleAlert, LuBoxes, LuPackage, LuBarcode,
    LuArrowDownToLine, LuPrinter, LuPencil,
} from 'react-icons/lu';
import { useAppTheme } from '../../../theme/tokens';
import { formatNumber } from '../../ui/number-format';
import {
    useGetSalesOrderByIdQuery,
    useLoadSalesOrderMutation,
} from '../../../store/services/salesOrder.api';
import { useGetCustomerByIdQuery } from '../../../store/services/customer.api';
import { useGetProductStocksQuery } from '../../../store/services/productStock.api';
import { useGetWarehousesQuery } from '../../../store/services/warehouse.api';
import { useCreateStockTransactionMutation } from '../../../store/services/productStock.api';
import Loading from '../../Other/UI/Loadings/Loading';
import { STATUS_LABEL, statusCx } from '../../Zayavkachi/__components/statusBadge';
import { Alert } from '../../Other/UI/Alert/Alert';

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
                /* Заказ */
                orderedPacks: 0,       // только из PACK строк
                orderedPiecesOnly: 0,  // только из PIECE строк
                orderedPiecesTotal: 0, // packs × ppp + piecesOnly
                piecesPerPack: 0,
                /* Строки заказа (для лимитов и payload) */
                rawItems: [],
            });
        }

        const g = groups.get(key);
        g.rawItems.push(item);

        const qty = Number(item.quantity) || 0;
        const entered = Number(item.enteredQuantity);
        const unit = String(item.unit ?? '').toUpperCase();
        const ppp = Number(item.productPiecesPerPack ?? item.piecesPerPack) || 0;

        if (unit === 'PACK' && Number.isFinite(entered) && entered > 0) {
            g.orderedPacks += entered;
            if (ppp > 0) g.piecesPerPack = ppp;
        } else {
            g.orderedPiecesOnly += qty;
        }

        g.orderedPiecesTotal += qty;
    }

    /* Если piecesPerPack = 0 и есть пачки — считаем ppp из qty/entered */
    return Array.from(groups.values()).map((g) => {
        let ppp = g.piecesPerPack;
        if (!ppp && g.orderedPacks > 0) {
            const packQty = g.rawItems
                .filter((it) => String(it.unit ?? '').toUpperCase() === 'PACK')
                .reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
            ppp = packQty > 0 && g.orderedPacks > 0 ? packQty / g.orderedPacks : 1;
        }
        return { ...g, piecesPerPack: ppp || 1 };
    });
}

export default function StaffOrderDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isDark } = useAppTheme();

    /* ── State ── */
    const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
    const [scannedPacks, setScannedPacks]     = useState({});
    const [scannedPieces, setScannedPieces]   = useState({});
    const [isLimitedScanMode, setIsLimitedScanMode] = useState(true);
    const [barcodeInput, setBarcodeInput]     = useState('');
    const [hasCreatedOutcome, setHasCreatedOutcome] = useState(false);
    const barcodeInputRef = useRef(null);

    const { data: order, isLoading, isError } = useGetSalesOrderByIdQuery(id, { skip: !id });
    const { data: customer } = useGetCustomerByIdQuery(order?.customerId, {
        skip: !order?.customerId,
    });
    const { data: warehouses = [] } = useGetWarehousesQuery('PRODUCT');

    const orderWarehouseIds = useMemo(() => {
        if (!order?.items) return [];
        return [...new Set(order.items.map((i) => i.warehouseId).filter(Boolean))];
    }, [order]);

    const activeWarehouseId = useMemo(() => {
        if (orderWarehouseIds.length === 1) return orderWarehouseIds[0];
        return selectedWarehouseId || orderWarehouseIds[0] || '';
    }, [orderWarehouseIds, selectedWarehouseId]);

    const activeWarehouseName = warehouses.find((w) => w.id === activeWarehouseId)?.name ?? '—';

    const { data: stockData, isFetching: stockFetching } = useGetProductStocksQuery(
        { warehouseId: activeWarehouseId || undefined, page: 0, size: 100 },
        { skip: !activeWarehouseId || !order }
    );
    const stockItems = useMemo(() => stockData?.items ?? [], [stockData]);

    /* ── Группируем заказ ── */
    const groupedItems = useMemo(
        () => groupOrderItems(order?.items ?? []),
        [order]
    );

    /* ── Comparison с qoldiq ── */
    const comparison = useMemo(() => {
        if (!groupedItems.length) return [];
        return groupedItems.map((g) => {
            const stock = stockItems.find(
                (s) =>
                    s.productId === g.productId &&
                    (activeWarehouseId ? s.warehouseId === activeWarehouseId : true)
            );
            const stockQty = stock?.quantity ?? 0;
            const orderedPieces = g.orderedPiecesTotal;
            const enough = stockQty >= orderedPieces;
            const diff = stockQty - orderedPieces;

            /* Уточняем piecesPerPack из stock если у нас не было */
            const ppp =
                g.piecesPerPack && g.piecesPerPack > 1
                    ? g.piecesPerPack
                    : Number(stock?.productPiecesPerPack) || 1;

            return {
                ...g,
                stockQty,
                enough,
                diff,
                piecesPerPack: ppp,
                orderedPieces: orderedPieces,
            };
        });
    }, [groupedItems, stockItems, activeWarehouseId]);

    const allEnough = comparison.length > 0 && comparison.every((c) => c.enough);
    const someShort = comparison.some((c) => !c.enough);
    const isLoadingOrder = ['CREATED', 'APPROVED'].includes(
        String(order?.status ?? '').toUpperCase()
    );

    /* ── Итоги ── */
    const totals = useMemo(() => {
        let requiredPacks = 0;
        let requiredPiecesOnly = 0;
        let requiredPieces = 0;
        let scannedPacksTotal = 0;
        let scannedPiecesTotal = 0;

        comparison.forEach((item) => {
            requiredPacks += item.orderedPacks;
            requiredPiecesOnly += item.orderedPiecesOnly;
            requiredPieces += item.orderedPiecesTotal;
            scannedPacksTotal += scannedPacks[item.key] ?? 0;
            scannedPiecesTotal += scannedPieces[item.key] ?? 0;
        });

        return {
            requiredPacks,
            requiredPiecesOnly,
            requiredPieces,
            scannedPacksTotal,
            scannedPiecesTotal,
        };
    }, [comparison, scannedPacks, scannedPieces]);

    const receiptTotal = (order?.items ?? []).reduce(
        (sum, item) => sum + Number(item.quantity ?? 0),
        0
    );

    const handlePrint = () => window.print();

    /* ── Обработчики для pachka ── */
    const updateScannedPacks = (item, change) => {
        const current = scannedPacks[item.key] ?? 0;
        const next = Math.max(0, current + change);

        /* Лимит: total pieces (packs*ppp + loadedPieces) не должен превышать orderedPieces */
        if (isLimitedScanMode) {
            const totalLoaded = next * item.piecesPerPack + (scannedPieces[item.key] ?? 0);
            if (totalLoaded > item.orderedPieces) {
                Alert(
                    `${item.productName} uchun buyurtmadagi dona miqdoridan ortiq yuklab bo'lmaydi`,
                    'error'
                );
                return;
            }
        }
        setScannedPacks((prev) => ({ ...prev, [item.key]: next }));
    };

    const setScannedPacksValue = (item, value) => {
        if (value === '') {
            setScannedPacks((prev) => ({ ...prev, [item.key]: 0 }));
            return;
        }
        const next = Number(value);
        if (!Number.isFinite(next) || next < 0) return;
        if (isLimitedScanMode) {
            const totalLoaded = next * item.piecesPerPack + (scannedPieces[item.key] ?? 0);
            if (totalLoaded > item.orderedPieces) {
                Alert(
                    `${item.productName} uchun buyurtmadagi dona miqdoridan ortiq yuklab bo'lmaydi`,
                    'error'
                );
                return;
            }
        }
        setScannedPacks((prev) => ({ ...prev, [item.key]: next }));
    };

    /* ── Обработчики для dona ── */
    const updateScannedPieces = (item, change) => {
        const current = scannedPieces[item.key] ?? 0;
        const next = Math.max(0, current + change);

        if (isLimitedScanMode) {
            const totalLoaded = (scannedPacks[item.key] ?? 0) * item.piecesPerPack + next;
            if (totalLoaded > item.orderedPieces) {
                Alert(
                    `${item.productName} uchun buyurtmadagi dona miqdoridan ortiq yuklab bo'lmaydi`,
                    'error'
                );
                return;
            }
        }
        setScannedPieces((prev) => ({ ...prev, [item.key]: next }));
    };

    const setScannedPiecesValue = (item, value) => {
        if (value === '') {
            setScannedPieces((prev) => ({ ...prev, [item.key]: 0 }));
            return;
        }
        const next = Number(value);
        if (!Number.isFinite(next) || next < 0) return;
        if (isLimitedScanMode) {
            const totalLoaded = (scannedPacks[item.key] ?? 0) * item.piecesPerPack + next;
            if (totalLoaded > item.orderedPieces) {
                Alert(
                    `${item.productName} uchun buyurtmadagi dona miqdoridan ortiq yuklab bo'lmaydi`,
                    'error'
                );
                return;
            }
        }
        setScannedPieces((prev) => ({ ...prev, [item.key]: next }));
    };

    /* ── Сканирование штрих-кода — packs приоритетно, иначе pieces ── */
    const handleBarcodeSubmit = (event) => {
        event.preventDefault();
        const barcode = barcodeInput.trim();
        if (!barcode) return;

        const item = comparison.find((c) => c.productBarcode?.trim() === barcode);
        if (!item) {
            Alert('Bu shtrix-kod buyurtmada topilmadi', 'error');
            setBarcodeInput('');
            barcodeInputRef.current?.focus();
            return;
        }

        if (item.orderedPacks > 0) {
            updateScannedPacks(item, 1);
        } else {
            updateScannedPieces(item, 1);
        }
        setBarcodeInput('');
        barcodeInputRef.current?.focus();
    };

    const handleScanModeChange = (isLimited) => {
        if (isLimited && comparison.some((item) => {
            const packs = scannedPacks[item.key] ?? 0;
            const pieces = scannedPieces[item.key] ?? 0;
            return packs * item.piecesPerPack + pieces > item.orderedPieces;
        })) {
            Alert(
                'Yuklangan miqdor buyurtmadan ko‘p. Limit rejimini yoqishdan oldin kamaytiring',
                'error'
            );
            return;
        }
        setIsLimitedScanMode(isLimited);
    };

    const [createTransaction, { isLoading: isSubmitting }] = useCreateStockTransactionMutation();
    const [loadSalesOrder, { isLoading: isUpdatingStatus }] = useLoadSalesOrderMutation();

    /* ── Chiqim qilish ── */
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

            /* Формируем payload: каждая группа может дать 1-2 строки */
            const items = comparison.flatMap((item) => {
                const lines = [];
                const packs = scannedPacks[item.key] ?? 0;
                const pieces = scannedPieces[item.key] ?? 0;
                if (packs > 0) {
                    lines.push({ productId: item.productId, quantity: packs, unit: 'PACK' });
                }
                if (pieces > 0) {
                    lines.push({ productId: item.productId, quantity: pieces, unit: 'PIECE' });
                }
                return lines;
            });

            if (items.length === 0) {
                Alert('Hech narsa yuklanmagan', 'error');
                return;
            }

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
                'error'
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
            {/* ── Header ── */}
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
                        {String(order.status ?? '').toUpperCase() === 'CREATED' && (
                            <button
                                type="button"
                                onClick={() => navigate(`/staff/orders/${order.id}/edit`)}
                                className={`flex h-12 items-center gap-2 rounded-xl border px-5 text-sm font-bold transition-colors ${ghostBtn}`}
                            >
                                <LuPencil size={17} /> Tahrirlash
                            </button>
                        )}
                        {String(order.status ?? '').toUpperCase() === 'LOADED' && (
                            <button
                                type="button"
                                onClick={handlePrint}
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

            {/* ── Ma'lumotlar ── */}
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

            {/* ── Mahsulotlar va qoldiq taqqoslash ── */}
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
                                    <span className="text-amber-500">{formatNumber(totals.scannedPacksTotal)}</span>
                                    <span className={`text-sm font-semibold ${muted}`}> / {formatNumber(totals.requiredPacks)} pachka</span>
                                </p>
                                <p className={`text-xs font-bold tabular-nums ${head}`}>
                                    <span className="text-amber-500">{formatNumber(totals.scannedPiecesTotal)}</span>
                                    <span className={`text-xs font-semibold ${muted}`}> / {formatNumber(totals.requiredPiecesOnly)} dona</span>
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
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
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
                                        <th className="px-5 py-3 w-40 text-center">Buyurtma</th>
                                        {isLoadingOrder && <th className="px-5 py-3 w-72 text-center">Yuklangan</th>}
                                        <th className="px-5 py-3 w-32 text-center">Qoldiq</th>
                                        <th className="px-5 py-3 w-32 text-center">Farq</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${divider}`}>
                                    {comparison.map((item, idx) => {
                                        const loadedPacks = scannedPacks[item.key] ?? 0;
                                        const loadedPieces = scannedPieces[item.key] ?? 0;
                                        const packsLimitReached = isLimitedScanMode && (loadedPacks * item.piecesPerPack + loadedPieces) >= item.orderedPieces;
                                        const piecesLimitReached = isLimitedScanMode && (loadedPacks * item.piecesPerPack + loadedPieces) >= item.orderedPieces;

                                        return (
                                        <tr key={item.key} className="transition-colors">
                                            <td className={`px-5 py-3 text-xs ${muted}`}>{idx + 1}</td>
                                            <td className="px-5 py-3">
                                                <p className={`font-semibold ${head}`}>{item.productName}</p>
                                                <p className={`text-xs ${muted}`}>{item.productBarcode}</p>
                                            </td>
                                            <td className={`px-5 py-3 text-xs ${muted}`}>
                                                {item.warehouseName}
                                            </td>

                                            {/* Buyurtma: pachka + dona отдельно */}
                                            <td className="px-5 py-3">
                                                <div className="flex flex-col items-center gap-1">
                                                    {item.orderedPacks > 0 && (
                                                        <span className={`inline-flex min-w-16 justify-center rounded-xl border px-3 py-1.5 text-sm font-extrabold tabular-nums ${
                                                            isDark
                                                                ? 'border-violet-400/30 bg-violet-500/10 text-violet-300'
                                                                : 'border-violet-300 bg-violet-50 text-violet-700'
                                                        }`}>
                                                            {formatNumber(item.orderedPacks)} pachka
                                                        </span>
                                                    )}
                                                    {item.orderedPiecesOnly > 0 && (
                                                        <span className={`inline-flex min-w-16 justify-center rounded-xl border px-3 py-1.5 text-sm font-extrabold tabular-nums ${
                                                            isDark
                                                                ? 'border-amber-400/30 bg-amber-500/10 text-amber-200'
                                                                : 'border-amber-300 bg-amber-50 text-amber-700'
                                                        }`}>
                                                            {formatNumber(item.orderedPiecesOnly)} dona
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Yuklangan: 2 input */}
                                            {isLoadingOrder && (
                                                <td className="px-5 py-3">
                                                    <div className="flex flex-col gap-2">

                                                        {/* PACHKA input */}
                                                        {item.orderedPacks > 0 && (
                                                            <div className="flex items-center justify-center gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateScannedPacks(item, -1)}
                                                                    disabled={loadedPacks === 0}
                                                                    aria-label="Pachkani kamaytirish"
                                                                    className={`flex h-9 w-9 items-center justify-center rounded-lg border text-base font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${
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
                                                                    step="1"
                                                                    value={loadedPacks}
                                                                    onChange={(e) => setScannedPacksValue(item, e.target.value)}
                                                                    aria-label={`${item.productName} pachka soni`}
                                                                    className={`h-9 w-16 rounded-lg border text-center text-sm font-extrabold tabular-nums outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 ${
                                                                        isDark
                                                                            ? 'border-[#334155] bg-[#1e293b] text-white'
                                                                            : 'border-[#e2e8f0] bg-white text-[#0f172a]'
                                                                    }`}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateScannedPacks(item, 1)}
                                                                    disabled={packsLimitReached}
                                                                    aria-label="Pachkani ko'paytirish"
                                                                    className={`flex h-9 w-9 items-center justify-center rounded-lg border text-base font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${
                                                                        isDark
                                                                            ? 'border-[#334155] bg-[#1e293b] text-white hover:bg-[#334155]'
                                                                            : 'border-[#e2e8f0] bg-white text-[#0f172a] hover:bg-[#f1f5f9]'
                                                                    }`}
                                                                >
                                                                    +
                                                                </button>
                                                                <span className={`text-[11px] font-bold ${muted}`}>pachka</span>
                                                            </div>
                                                        )}

                                                        {/* DONA input */}
                                                        {item.orderedPiecesOnly > 0 && (
                                                            <div className="flex items-center justify-center gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateScannedPieces(item, -1)}
                                                                    disabled={loadedPieces === 0}
                                                                    aria-label="Donani kamaytirish"
                                                                    className={`flex h-9 w-9 items-center justify-center rounded-lg border text-base font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${
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
                                                                    step="1"
                                                                    value={loadedPieces}
                                                                    onChange={(e) => setScannedPiecesValue(item, e.target.value)}
                                                                    aria-label={`${item.productName} dona soni`}
                                                                    className={`h-9 w-16 rounded-lg border text-center text-sm font-extrabold tabular-nums outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 ${
                                                                        isDark
                                                                            ? 'border-[#334155] bg-[#1e293b] text-white'
                                                                            : 'border-[#e2e8f0] bg-white text-[#0f172a]'
                                                                    }`}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateScannedPieces(item, 1)}
                                                                    disabled={piecesLimitReached}
                                                                    aria-label="Donani ko'paytirish"
                                                                    className={`flex h-9 w-9 items-center justify-center rounded-lg border text-base font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${
                                                                        isDark
                                                                            ? 'border-[#334155] bg-[#1e293b] text-white hover:bg-[#334155]'
                                                                            : 'border-[#e2e8f0] bg-white text-[#0f172a] hover:bg-[#f1f5f9]'
                                                                    }`}
                                                                >
                                                                    +
                                                                </button>
                                                                <span className={`text-[11px] font-bold ${muted}`}>dona</span>
                                                            </div>
                                                        )}

                                                    </div>
                                                </td>
                                            )}

                                            <td className={`px-5 py-3 text-center font-bold ${head}`}>
                                                {item.stockQty}
                                            </td>
                                            <td
                                                className={`px-5 py-3 text-center font-bold ${
                                                    item.enough
                                                        ? isDark ? 'text-green-400' : 'text-green-600'
                                                        : isDark ? 'text-red-400' : 'text-red-600'
                                                }`}
                                            >
                                                {item.diff >= 0 ? '+' : ''}
                                                {item.diff}
                                            </td>
                                        </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

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
                                        {activeWarehouseName} · {comparison.length} ta mahsulot · {formatNumber(totals.requiredPacks)} pachka · {formatNumber(totals.requiredPiecesOnly)} dona
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

            <style>{`
                @media print {
                    @page { margin: 12mm; }
                    body * { visibility: hidden !important; }
                    #staff-order-print-receipt,
                    #staff-order-print-receipt * { visibility: visible !important; }
                    #staff-order-print-receipt {
                        display: block !important;
                        position: fixed;
                        inset: 0 auto auto 0;
                        width: 100%;
                        padding: 0;
                        color: #000 !important;
                        background: #fff !important;
                        font-family: Arial, sans-serif;
                    }
                }
            `}</style>
            <section
                id="staff-order-print-receipt"
                className="hidden"
                aria-label="Buyurtma cheki"
            >
                <h1 style={{ margin: '0 0 4px', fontSize: '22px', textAlign: 'center', fontWeight: 'bold' }}>
                    Zafar Lux
                </h1>
                <p style={{ margin: '0 0 20px', fontSize: '12px', textAlign: 'center', letterSpacing: '2px' }}>
                    ZAVODI
                </p>

                <h2 style={{ margin: '0 0 16px', fontSize: '16px', textAlign: 'center' }}>
                    BUYURTMA CHEKI
                </h2>

                <div style={{ marginBottom: '16px', borderBottom: '1px solid #000', paddingBottom: '12px' }}>
                    <p style={{ margin: '4px 0' }}><strong>Mijoz:</strong> {order.customerName || '—'}</p>
                    <p style={{ margin: '4px 0' }}>
                        <strong>Telefon:</strong>{' '}
                        {order.customerPhone ?? order.customer?.phone ?? customer?.phone ?? '—'}
                    </p>
                    <p style={{ margin: '4px 0' }}>
                        <strong>Sana:</strong>{' '}
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString('uz-UZ') : '—'}
                    </p>
                    {order.id && (
                        <p style={{ margin: '4px 0' }}>
                            <strong>Buyurtma №:</strong>{' '}
                            <span style={{ fontFamily: 'monospace' }}>#{String(order.id).slice(0, 8)}</span>
                        </p>
                    )}
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', color: '#000' }}>
                    <thead>
                        <tr>
                            <th style={{ borderBottom: '1px solid #000', padding: '8px 4px', textAlign: 'left' }}>Mahsulot</th>
                            <th style={{ borderBottom: '1px solid #000', padding: '8px 4px', textAlign: 'right' }}>Pachka</th>
                            <th style={{ borderBottom: '1px solid #000', padding: '8px 4px', textAlign: 'right' }}>Dona</th>
                        </tr>
                    </thead>
                    <tbody>
                        {groupedItems.map((g, index) => (
                            <tr key={g.key ?? index}>
                                <td style={{ borderBottom: '1px solid #aaa', padding: '8px 4px' }}>
                                    {g.productName || '—'}
                                </td>
                                <td style={{ borderBottom: '1px solid #aaa', padding: '8px 4px', textAlign: 'right' }}>
                                    {g.orderedPacks > 0 ? formatNumber(g.orderedPacks) : '—'}
                                </td>
                                <td style={{ borderBottom: '1px solid #aaa', padding: '8px 4px', textAlign: 'right' }}>
                                    {g.orderedPiecesOnly > 0 ? formatNumber(g.orderedPiecesOnly) : '—'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <th style={{ borderTop: '1px solid #000', padding: '10px 4px', textAlign: 'left' }}>
                                Jami
                            </th>
                            <th style={{ borderTop: '1px solid #000', padding: '10px 4px', textAlign: 'right' }}>
                                {formatNumber(totals.requiredPacks)}
                            </th>
                            <th style={{ borderTop: '1px solid #000', padding: '10px 4px', textAlign: 'right' }}>
                                {formatNumber(totals.requiredPiecesOnly)}
                            </th>
                        </tr>
                    </tfoot>
                </table>
            </section>
        </div>
    );
}