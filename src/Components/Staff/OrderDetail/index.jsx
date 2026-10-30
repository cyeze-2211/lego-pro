import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    LuArrowLeft, LuUser, LuStickyNote, LuClock3,
    LuCircleAlert, LuBoxes, LuPackage, LuBarcode, LuScanLine,
    LuArrowDownToLine, LuPrinter, LuPencil, LuPhone, LuMapPin, LuUserCheck,
    LuCircleCheck, LuPackageOpen, LuX, LuFactory, LuRefreshCw,
} from 'react-icons/lu';
import { useAppTheme } from '../../../theme/tokens';
import { formatNumber } from '../../ui/number-format';
import { formatDateTime } from '../../ui/date-format';
import {
    useGetSalesOrderByIdQuery,
    useLoadSalesOrderMutation,
} from '../../../store/services/salesOrder.api';
import { useGetCustomerByIdQuery } from '../../../store/services/customer.api';
import { useGetWarehousesQuery } from '../../../store/services/warehouse.api';
import { PACK_STATUS_LABEL } from '../../../store/services/productPack.api';
import Loading from '../../Other/UI/Loadings/Loading';
import { STATUS_LABEL, statusCx } from '../../Zayavkachi/__components/statusBadge';
import { Alert } from '../../Other/UI/Alert/Alert';
import { splitOrderItem } from '../../ui/order-items';
import usePackScanner, { beep } from '../../ui/usePackScanner';
import { RECEIPT_FORMATS, RECEIPT_FORMAT_KEY, buildOrderReceiptHtml, printHtml } from '../__components/orderReceipt';
import $api from '../../../store/api';

/*
 * Zayavkani yuklash (Ortildi) — pachka barcode‘lari bilan.
 * Backend: POST /sales-orders/{id}/load { items: [{ itemId, packBarcodes, openPackBarcodes? }] } bitta tranzaksiyada
 * har qatorni o‘z omboridan chiqaradi (OUT yozuvlari + qoldiq) va zayavkani LOADED qiladi — frontend alohida OUT yubormaydi.
 *  - packBarcodes — mijozga butunligicha ketadigan pachkalar; soni qatordagi packQuantity ga teng bo‘lishi SHART;
 *  - qatorning donalari (pieceQuantity) omborning donaviy qoldig‘idan olinadi; yetmasa omborchi yana pachka skanerlaydi —
 *    u openPackBarcodes ga tushadi: pachka ochiladi, donalari donaviy qoldiqqa o‘tadi, ortgani omborda qoladi.
 * Skanerlangan kod GET /product-packs/by-barcode/{barcode} bilan tekshiriladi: mahsulot, ombor, holat (IN_STOCK).
 */

/* Har (mahsulot, ombor) juftligi uchun joriy qoldiq: pachkalar soni va donaviy qoldiq */
function useItemStocks(rows) {
    const [stocks, setStocks] = useState({});
    const [loading, setLoading] = useState(false);
    const keys = useMemo(() => [...new Set(rows.map((r) => `${r.productId}|${r.warehouseId}`))], [rows]);
    const keyStr = keys.join(',');

    const refresh = useCallback(async () => {
        if (!keys.length) return;
        setLoading(true);
        const next = {};
        await Promise.all(keys.map(async (key) => {
            const [productId, warehouseId] = key.split('|');
            try {
                const { data } = await $api.get('/product-stocks', { params: { productId, warehouseId, page: 0, size: 1 } });
                const s = data?.data?.[0];
                next[key] = s
                    ? { quantity: Number(s.quantity) || 0, packQuantity: Number(s.packQuantity) || 0, pieceQuantity: Number(s.pieceQuantity) || 0, piecesPerPack: Number(s.productPiecesPerPack) || 0 }
                    : { quantity: 0, packQuantity: 0, pieceQuantity: 0, piecesPerPack: 0 };
            } catch {
                next[key] = null; // olinmadi
            }
        }));
        setStocks(next);
        setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [keyStr]);

    useEffect(() => { refresh(); }, [refresh]);
    return { stocks, loading, refresh };
}

const EMPTY_SCAN = { packs: [], open: [] };

export default function StaffOrderDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isDark } = useAppTheme();

    const { data: order, isLoading, isError } = useGetSalesOrderByIdQuery(id, { skip: !id });
    const { data: customer } = useGetCustomerByIdQuery(order?.customerId, { skip: !order?.customerId });
    const { data: warehouses = [] } = useGetWarehousesQuery('PRODUCT');
    const warehouseName = (wid) => warehouses.find((w) => w.id === wid)?.name ?? '—';

    const orderStatus = String(order?.status ?? '').toUpperCase();
    const isLoadingOrder = orderStatus === 'CREATED';

    /* ── Qatorlar: har zayavka qatori — pachka + dona ── */
    const rows = useMemo(() => (order?.items ?? []).map((item) => {
        const split = splitOrderItem(item);
        return {
            id: item.id,
            productId: item.productId,
            productName: item.productName,
            productBarcode: item.productBarcode,
            warehouseId: item.warehouseId,
            warehouseName: item.warehouseName,
            unitPrice: item.unitPrice,
            packQuantity: split.packs,
            pieceQuantity: split.pieces,
            total: split.total,
            piecesPerPack: split.piecesPerPack,
        };
    }), [order]);

    const { stocks, loading: stockLoading, refresh: refreshStocks } = useItemStocks(rows);

    /* ── Skanerlangan pachkalar: { [itemId]: { packs: [pack], open: [pack] } } ── */
    const [scans, setScans] = useState({});
    const [lastScan, setLastScan] = useState(null); // { ok, text }
    const [flashId, setFlashId] = useState(null);

    /* ── Har qator holati ── */
    const lines = useMemo(() => rows.map((r) => {
        const stock = stocks[`${r.productId}|${r.warehouseId}`];
        const sc = scans[r.id] ?? EMPTY_SCAN;
        const ppp = r.piecesPerPack || stock?.piecesPerPack || 0;
        const openPieces = sc.open.reduce((s, p) => s + (Number(p.pieces) || 0), 0);
        const stockPieces = stock?.pieceQuantity ?? 0;
        const piecesAvail = stockPieces + openPieces;
        const packsOk = sc.packs.length === r.packQuantity;
        const piecesOk = r.pieceQuantity === 0 || piecesAvail >= r.pieceQuantity;
        const piecesShort = Math.max(0, r.pieceQuantity - piecesAvail);
        const packsToOpen = piecesShort > 0 && ppp > 0 ? Math.ceil(piecesShort / ppp) : 0;
        const stockPacksEnough = stock ? stock.packQuantity >= r.packQuantity : true;
        return {
            ...r, stock, scan: sc, ppp, openPieces, stockPieces, piecesAvail,
            packsOk, piecesOk, ok: packsOk && piecesOk, piecesShort, packsToOpen, stockPacksEnough,
            needsScan: r.packQuantity > 0 || !piecesOk,
        };
    }), [rows, stocks, scans]);

    const allOk = lines.length > 0 && lines.every((l) => l.ok);
    const pendingLines = lines.filter((l) => !l.ok);
    const totals = useMemo(() => lines.reduce((acc, l) => {
        acc.packs += l.packQuantity; acc.pieces += l.pieceQuantity;
        acc.scanned += l.scan.packs.length; acc.opened += l.scan.open.length;
        return acc;
    }, { packs: 0, pieces: 0, scanned: 0, opened: 0 }), [lines]);

    const flash = (itemId) => { setFlashId(itemId); setTimeout(() => setFlashId((cur) => (cur === itemId ? null : cur)), 1200); };
    const allScanned = () => Object.values(scans).flatMap((s) => [...s.packs, ...s.open]);

    /* ── Skanerlangan pachkani qatorga biriktirish ── */
    const handlePack = useCallback((pack) => {
        if (pack.status !== 'IN_STOCK') {
            setLastScan({ ok: false, text: `Pachka ${pack.barcode} omborda emas — ${PACK_STATUS_LABEL[pack.status] || pack.status}` });
            return;
        }
        if (allScanned().some((p) => p.barcode === pack.barcode)) {
            setLastScan({ ok: false, text: `Pachka ${pack.barcode} allaqachon skanerlangan` });
            return;
        }
        const sameProduct = lines.filter((l) => l.productId === pack.productId);
        if (!sameProduct.length) {
            setLastScan({ ok: false, text: `«${pack.productName}» bu zayavkada yo‘q` });
            return;
        }
        const sameWh = sameProduct.filter((l) => l.warehouseId === pack.warehouseId);
        if (!sameWh.length) {
            setLastScan({ ok: false, text: `Pachka boshqa omborda turibdi (${warehouseName(pack.warehouseId)}), zayavka qatori: ${sameProduct.map((l) => l.warehouseName).join(', ')}` });
            return;
        }
        // 1) butun pachka kerak bo‘lgan qator
        let line = sameWh.find((l) => l.scan.packs.length < l.packQuantity);
        if (line) {
            setScans((prev) => ({ ...prev, [line.id]: { packs: [...(prev[line.id]?.packs ?? []), pack], open: prev[line.id]?.open ?? [] } }));
            beep(true); flash(line.id);
            setLastScan({ ok: true, text: `${pack.productName} — pachka ${line.scan.packs.length + 1} / ${line.packQuantity}` });
            return;
        }
        // 2) donaviy qoldiq yetmagan qator — pachka ochiladi
        line = sameWh.find((l) => l.pieceQuantity > 0 && l.piecesShort > 0);
        if (line) {
            setScans((prev) => ({ ...prev, [line.id]: { packs: prev[line.id]?.packs ?? [], open: [...(prev[line.id]?.open ?? []), pack] } }));
            beep(true); flash(line.id);
            const left = Math.max(0, line.piecesShort - (Number(pack.pieces) || 0));
            setLastScan({ ok: true, text: `${pack.productName} — pachka ochiladi (${pack.pieces} dona)${left > 0 ? `, yana ${left} dona kerak` : ', dona yetarli'}` });
            return;
        }
        setLastScan({ ok: false, text: `«${pack.productName}» uchun hamma pachka skanerlangan${sameWh.some((l) => l.pieceQuantity > 0) ? ' va dona yetarli' : ''}` });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lines, scans, warehouses]);

    const scanner = usePackScanner({
        enabled: isLoadingOrder,
        onPack: handlePack,
        onError: (text) => setLastScan({ ok: false, text }),
    });

    const removeScan = (itemId, kind, barcode) => {
        setScans((prev) => ({ ...prev, [itemId]: { ...(prev[itemId] ?? EMPTY_SCAN), [kind]: (prev[itemId]?.[kind] ?? []).filter((p) => p.barcode !== barcode) } }));
    };
    const clearScans = () => { setScans({}); setLastScan(null); };

    useEffect(() => {
        if (isLoadingOrder && scanner.inputRef.current) scanner.inputRef.current.focus();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoadingOrder]);

    /* ── Chek: alohida hujjat, qog‘ozga moslashadi (A4 / 80 mm / avto) ── */
    const [receiptFormat, setReceiptFormat] = useState(() => {
        try { const v = localStorage.getItem(RECEIPT_FORMAT_KEY); return RECEIPT_FORMATS.some((f) => f.key === v) ? v : 'auto'; } catch { return 'auto'; }
    });
    const changeReceiptFormat = (value) => {
        setReceiptFormat(value);
        try { localStorage.setItem(RECEIPT_FORMAT_KEY, value); } catch { /* xotira yo‘q */ }
    };
    /* Zayavka qatorida kategoriya yo‘q — chop etishdan oldin GET /products/{id} dan olamiz (bir marta, keshlanadi) */
    const categoryCacheRef = useRef({});
    const [isPreparingPrint, setIsPreparingPrint] = useState(false);
    const loadCategories = async (productIds) => {
        const cache = categoryCacheRef.current;
        const missing = productIds.filter((pid) => pid && !(pid in cache));
        await Promise.all(missing.map(async (pid) => {
            try {
                const { data } = await $api.get(`/products/${pid}`);
                cache[pid] = data?.data?.category?.name || '';
            } catch {
                cache[pid] = ''; // kategoriya olinmasa ham chek chiqaveradi
            }
        }));
        return cache;
    };

    const handlePrint = async () => {
        if (!order || isPreparingPrint) return;
        setIsPreparingPrint(true);
        let categories = {};
        try {
            categories = await loadCategories([...new Set(lines.map((l) => l.productId))]);
        } finally {
            setIsPreparingPrint(false);
        }
        const loaded = orderStatus !== 'CREATED';
        const html = buildOrderReceiptHtml({
            order,
            customerPhone: order.customerPhone ?? order.customer?.phone ?? customer?.phone,
            warehouseName: [...new Set(lines.map((l) => l.warehouseName).filter(Boolean))].join(', ') || '—',
            statusLabel: STATUS_LABEL[order.status] ?? order.status,
            format: receiptFormat,
            showLoaded: loaded,
            rows: lines.map((l) => ({
                productName: l.productName,
                productBarcode: l.productBarcode,
                categoryName: categories[l.productId] || '',
                warehouseName: l.warehouseName,
                orderedPacks: l.packQuantity,
                orderedPiecesOnly: l.pieceQuantity,
                orderedPieces: l.total,
                piecesPerPack: l.ppp,
                loadedPacks: loaded ? l.packQuantity : l.scan.packs.length,
                loadedPieces: loaded ? l.pieceQuantity : (l.piecesOk ? l.pieceQuantity : 0),
            })),
        });
        printHtml(html, { onError: (message) => Alert(message, 'error') });
    };

    /* ── Ortildi: backend qoldiqni chiqaradi va holatni LOADED qiladi (bitta so‘rov) ── */
    const [loadSalesOrder, { isLoading: isUpdatingStatus }] = useLoadSalesOrderMutation();
    const loadBusyRef = useRef(false);
    const handleLoad = async () => {
        if (loadBusyRef.current) return;
        if (!allOk) {
            const l = pendingLines[0];
            Alert(l && !l.packsOk
                ? `«${l.productName}»: ${l.scan.packs.length} / ${l.packQuantity} pachka skanerlandi`
                : `«${l?.productName}»: donaviy qoldiq yetmaydi — yana ${l?.packsToOpen || 1} pachka skanerlang (ochiladi)`, 'error');
            return;
        }
        loadBusyRef.current = true;
        try {
            const items = lines
                .filter((l) => l.scan.packs.length > 0 || l.scan.open.length > 0)
                .map((l) => ({
                    itemId: l.id,
                    packBarcodes: l.scan.packs.map((p) => p.barcode),
                    ...(l.scan.open.length ? { openPackBarcodes: l.scan.open.map((p) => p.barcode) } : {}),
                }));
            await loadSalesOrder(items.length ? { id: order.id, data: { items } } : order.id).unwrap();
            Alert('Buyurtma Ortildi holatiga o‘tkazildi, mahsulotlar ombordan chiqarildi', 'success');
            navigate('/staff/orders');
        } catch (error) {
            console.error('[Omborchi] Ortildi xatosi', error);
            Alert(`Ortildi ga o‘tkazib bo‘lmadi${error?.data?.message ? `: ${error.data.message}` : ''}`, 'error');
            refreshStocks();
        } finally {
            loadBusyRef.current = false;
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
    const chipPack = isDark ? 'border-violet-400/30 bg-violet-500/10 text-violet-200' : 'border-violet-300 bg-violet-50 text-violet-800';
    const chipOpen = isDark ? 'border-orange-400/30 bg-orange-500/10 text-orange-200' : 'border-orange-300 bg-orange-50 text-orange-800';
    const okText = isDark ? 'text-emerald-400' : 'text-emerald-600';
    const badText = isDark ? 'text-red-400' : 'text-red-600';
    const warnText = isDark ? 'text-amber-400' : 'text-amber-600';

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

    const renderChip = (pack, tone, onRemove, opened = false) => (
        <span key={pack.barcode} className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 font-mono text-[11px] font-bold ${tone}`} title={`${pack.pieces} dona${pack.machineName ? ` · ${pack.machineName}` : ''}${pack.producedAt ? ` · ${formatDateTime(pack.producedAt)}` : ''}`}>
            {opened ? <LuPackageOpen size={11} /> : <LuPackage size={11} />}
            {pack.barcode}
            <button type="button" onClick={onRemove} aria-label="Olib tashlash" className="ml-0.5 rounded hover:text-[#f43f5e]"><LuX size={11} /></button>
        </span>
    );

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
                            {(order.customerPhone || order.customerRegion || order.customerAddress || order.customerAgent?.name) && (
                                <p className={`mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs ${muted}`}>
                                    {order.customerPhone && <span className="inline-flex items-center gap-1"><LuPhone size={11} />{order.customerPhone}</span>}
                                    {(order.customerRegion || order.customerAddress) && (
                                        <span className="inline-flex items-center gap-1"><LuMapPin size={11} className="shrink-0" />{[order.customerRegion, order.customerAddress].filter(Boolean).join(', ')}</span>
                                    )}
                                    {order.customerAgent?.name && <span className="inline-flex items-center gap-1"><LuUserCheck size={11} />Agent: {order.customerAgent.name}</span>}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {orderStatus === 'CREATED' && (
                            <button
                                type="button"
                                onClick={() => navigate(`/staff/orders/${order.id}/edit`)}
                                className={`flex h-12 items-center gap-2 rounded-xl border px-5 text-sm font-bold transition-colors ${ghostBtn}`}
                            >
                                <LuPencil size={17} /> Tahrirlash
                            </button>
                        )}
                        {orderStatus === 'LOADED' && (
                            <div className="flex h-12 items-stretch overflow-hidden rounded-xl bg-amber-400 text-[#0f172a]">
                                <button
                                    type="button"
                                    onClick={handlePrint}
                                    disabled={isPreparingPrint}
                                    className="flex items-center gap-2 px-5 text-sm font-bold transition-colors hover:bg-amber-500 disabled:cursor-wait disabled:opacity-70"
                                >
                                    <LuPrinter size={17} /> {isPreparingPrint ? 'Tayyorlanmoqda…' : 'Chop etish'}
                                </button>
                                <select
                                    value={receiptFormat}
                                    onChange={(e) => changeReceiptFormat(e.target.value)}
                                    aria-label="Chek formati"
                                    title="Chek formati: qog‘ozga qarab tanlang"
                                    className="h-full cursor-pointer border-l border-black/15 bg-amber-300 px-2 text-xs font-bold outline-none hover:bg-amber-500"
                                >
                                    {RECEIPT_FORMATS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
                                </select>
                            </div>
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

            {/* ── Mahsulotlar: skaner va qoldiq ── */}
            <div className={`rounded-2xl border shadow-md ${panel}`}>
                <div className={`flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3.5 ${line}`}>
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400/10 text-amber-500">
                            <LuPackage size={15} />
                        </span>
                        <div>
                            <p className={`text-sm font-bold ${head}`}>Buyurtma mahsulotlari</p>
                            <p className={`text-xs ${muted}`}>{isLoadingOrder ? 'Har qatorning pachkalarini skanerlang — ombor qoldig‘i bilan taqqoslanadi' : 'Ombor qoldig‘i bilan taqqoslash'}</p>
                        </div>
                    </div>
                    <button type="button" onClick={refreshStocks} disabled={stockLoading} className={`flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition-colors ${ghostBtn} disabled:opacity-50`} title="Qoldiqni qayta yuklash">
                        <LuRefreshCw size={13} className={stockLoading ? 'animate-spin' : ''} /> Qoldiq
                    </button>
                </div>

                {isLoadingOrder && (
                    <div className={`mx-5 my-5 overflow-hidden rounded-2xl border shadow-sm ${
                        isDark ? 'border-[#334155] bg-[#1e293b]/50' : 'border-[#e2e8f0] bg-[#f8fafc]'
                    }`}>
                        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                            <div className="flex items-center gap-3">
                                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-500">
                                    <LuScanLine size={24} />
                                </span>
                                <div>
                                    <p className={`text-base font-bold ${head}`}>Pachkalarni skanerlash</p>
                                    <p className={`text-xs ${muted}`}>Pachka yorlig‘idagi barcode — har pachka bir marta. Dona yetmasa yana pachka skanerlang: u ochiladi.</p>
                                </div>
                            </div>
                            <div className={`rounded-xl border px-4 py-2.5 text-right ${
                                isDark ? 'border-[#334155] bg-[#0f172a]/70' : 'border-[#e2e8f0] bg-white'
                            }`}>
                                <p className={`text-[11px] font-bold uppercase tracking-wide ${muted}`}>Skanerlandi</p>
                                <p className={`text-lg font-extrabold tabular-nums ${head}`}>
                                    <span className="text-amber-500">{formatNumber(totals.scanned)}</span>
                                    <span className={`text-sm font-semibold ${muted}`}> / {formatNumber(totals.packs)} pachka</span>
                                </p>
                                {totals.opened > 0 && (
                                    <p className={`text-xs font-bold tabular-nums ${warnText}`}>
                                        <LuPackageOpen size={11} className="inline -mt-0.5" /> {totals.opened} pachka ochiladi (dona uchun)
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className={`border-t p-5 ${line}`}>
                            <label className={`mb-2 block text-xs font-bold uppercase tracking-wide ${muted}`} htmlFor="order-pack-barcode">
                                Pachka barcode‘i (skaner)
                            </label>
                            <div className="flex items-center gap-3">
                                <div className="relative min-w-0 flex-1">
                                    <LuBarcode className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-amber-400" />
                                    <input
                                        id="order-pack-barcode"
                                        {...scanner.inputProps}
                                        autoFocus
                                        placeholder="Pistolet bilan o‘qing yoki barcode‘ni terib Enter bosing"
                                        aria-label="Pachka barcode‘i"
                                        className={`h-14 w-full rounded-xl border pl-12 pr-4 font-mono text-lg tracking-wider outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 ${
                                            isDark
                                                ? 'border-[#334155] bg-[#0f172a] text-white placeholder:text-[#64748b]'
                                                : 'border-[#e2e8f0] bg-white text-[#0f172a] placeholder:text-[#94a3b8]'
                                        }`}
                                    />
                                </div>
                                {(totals.scanned > 0 || totals.opened > 0) && (
                                    <button type="button" onClick={clearScans} className={`h-14 rounded-xl border px-4 text-xs font-bold ${ghostBtn}`}>Tozalash</button>
                                )}
                            </div>
                            {lastScan ? (
                                <p className={`mt-2 flex items-center gap-1.5 text-sm font-semibold ${lastScan.ok ? okText : badText}`}>
                                    {lastScan.ok ? <LuCircleCheck size={15} /> : <LuCircleAlert size={15} />}
                                    {lastScan.text}
                                </p>
                            ) : (
                                <p className={`mt-2 text-xs ${muted}`}>{scanner.busy ? 'Tekshirilmoqda...' : 'Pistolet fokus boshqa joyda bo‘lganda ham ishlaydi.'}</p>
                            )}
                        </div>
                    </div>
                )}

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
                                {isLoadingOrder && <th className="px-5 py-3 min-w-[260px]">Skanerlangan pachkalar</th>}
                                <th className="px-5 py-3 w-44 text-center">Qoldiq</th>
                                {isLoadingOrder && <th className="px-5 py-3 w-56">Holat</th>}
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${divider}`}>
                            {lines.map((l, idx) => (
                                <tr key={l.id} className={`transition-colors ${flashId === l.id ? (isDark ? 'bg-amber-400/15' : 'bg-amber-100') : ''}`}>
                                    <td className={`px-5 py-3 text-xs ${muted}`}>{idx + 1}</td>
                                    <td className="px-5 py-3">
                                        <p className={`font-semibold ${head}`}>{l.productName}</p>
                                        <p className={`text-xs ${muted}`}>{l.productBarcode}{l.ppp > 0 ? ` · 1 pachka = ${l.ppp} dona` : ''}</p>
                                    </td>
                                    <td className={`px-5 py-3 text-xs ${muted}`}>{l.warehouseName}</td>

                                    {/* Buyurtma: pachka + dona */}
                                    <td className="px-5 py-3">
                                        <div className="flex flex-col items-center gap-1">
                                            {l.packQuantity > 0 && (
                                                <span className={`inline-flex min-w-16 justify-center rounded-xl border px-3 py-1.5 text-sm font-extrabold tabular-nums ${chipPack}`}>
                                                    {formatNumber(l.packQuantity)} pachka
                                                </span>
                                            )}
                                            {l.pieceQuantity > 0 && (
                                                <span className={`inline-flex min-w-16 justify-center rounded-xl border px-3 py-1.5 text-sm font-extrabold tabular-nums ${
                                                    isDark ? 'border-amber-400/30 bg-amber-500/10 text-amber-200' : 'border-amber-300 bg-amber-50 text-amber-700'
                                                }`}>
                                                    {formatNumber(l.pieceQuantity)} dona
                                                </span>
                                            )}
                                            <span className={`text-[11px] ${muted}`}>= {formatNumber(l.total)} dona</span>
                                        </div>
                                    </td>

                                    {/* Skanerlangan pachkalar */}
                                    {isLoadingOrder && (
                                        <td className="px-5 py-3">
                                            {l.scan.packs.length === 0 && l.scan.open.length === 0 ? (
                                                <span className={`text-xs ${l.packQuantity > 0 ? warnText : muted}`}>
                                                    {l.packQuantity > 0 ? `${l.packQuantity} ta pachka skanerlang` : l.piecesOk ? 'Faqat dona — skaner shart emas' : 'Dona yetmaydi — pachka skanerlang'}
                                                </span>
                                            ) : (
                                                <div className="flex flex-col gap-1.5">
                                                    {l.scan.packs.length > 0 && (
                                                        <div className="flex flex-wrap items-center gap-1">
                                                            <span className={`text-[10px] font-bold uppercase ${muted}`}>Butun:</span>
                                                            {l.scan.packs.map((p) => renderChip(p, chipPack, () => removeScan(l.id, 'packs', p.barcode)))}
                                                        </div>
                                                    )}
                                                    {l.scan.open.length > 0 && (
                                                        <div className="flex flex-wrap items-center gap-1">
                                                            <span className={`text-[10px] font-bold uppercase ${muted}`}>Ochiladi:</span>
                                                            {l.scan.open.map((p) => renderChip(p, chipOpen, () => removeScan(l.id, 'open', p.barcode), true))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    )}

                                    {/* Qoldiq: pachka + donaviy */}
                                    <td className="px-5 py-3 text-center">
                                        {l.stock === undefined && stockLoading ? (
                                            <span className={`text-xs ${muted}`}>…</span>
                                        ) : l.stock === null ? (
                                            <span className={`text-xs ${badText}`}>olinmadi</span>
                                        ) : (
                                            <div className="flex flex-col items-center">
                                                <span className={`font-bold tabular-nums ${l.stockPacksEnough ? head : badText}`}>{formatNumber(l.stock?.packQuantity ?? 0)} pachka</span>
                                                <span className={`text-xs tabular-nums ${l.stock?.pieceQuantity >= l.pieceQuantity ? muted : warnText}`}>{formatNumber(l.stock?.pieceQuantity ?? 0)} dona</span>
                                                <span className={`text-[10px] ${muted}`}>jami {formatNumber(l.stock?.quantity ?? 0)}</span>
                                            </div>
                                        )}
                                    </td>

                                    {/* Holat */}
                                    {isLoadingOrder && (
                                        <td className="px-5 py-3">
                                            <div className="flex flex-col gap-0.5 text-xs font-semibold">
                                                {l.packQuantity > 0 && (
                                                    <span className={`inline-flex items-center gap-1 ${l.packsOk ? okText : warnText}`}>
                                                        {l.packsOk ? <LuCircleCheck size={13} /> : <LuPackage size={13} />} Pachka {l.scan.packs.length} / {l.packQuantity}
                                                    </span>
                                                )}
                                                {l.pieceQuantity > 0 && (
                                                    <span className={`inline-flex items-center gap-1 ${l.piecesOk ? okText : badText}`}>
                                                        {l.piecesOk ? <LuCircleCheck size={13} /> : <LuCircleAlert size={13} />}
                                                        {l.piecesOk
                                                            ? `Dona yetarli (${formatNumber(l.piecesAvail)})`
                                                            : `Dona yetmaydi: ${formatNumber(l.piecesShort)} — ${l.packsToOpen || 1} pachka skanerlang`}
                                                    </span>
                                                )}
                                                {!l.stockPacksEnough && (
                                                    <span className={`inline-flex items-center gap-1 ${badText}`}><LuCircleAlert size={13} /> Omborda pachka kam</span>
                                                )}
                                                {l.ok && <span className={`inline-flex items-center gap-1 ${okText}`}><LuCircleCheck size={13} /> Tayyor</span>}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {isLoadingOrder && lines.some((l) => !l.stockPacksEnough || (l.pieceQuantity > 0 && !l.piecesOk && l.stock && l.stock.packQuantity - l.packQuantity < l.packsToOpen)) && (
                    <div className="mx-5 mb-5 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3">
                        <p className="text-sm font-semibold text-red-500">
                            ⚠️ Ba&apos;zi mahsulotlardan omborda yetarli pachka yo&apos;q — avval kirim yoki ko&apos;chirish qiling
                        </p>
                    </div>
                )}
                {isLoadingOrder && lines.length > 0 && (
                    <div className={`mx-5 mb-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-4 ${
                        isDark ? 'border-[#334155] bg-[#0f172a]/50' : 'border-[#e2e8f0] bg-slate-50'
                    }`}>
                        <div>
                            <p className={`text-sm font-bold ${head}`}>Buyurtma bo&apos;yicha umumiy chiqim</p>
                            <p className={`mt-1 text-xs ${muted}`}>
                                {lines.length} ta qator · {formatNumber(totals.packs)} pachka · {formatNumber(totals.pieces)} dona
                            </p>
                            <p className={`mt-1 text-xs font-semibold ${allOk ? okText : warnText}`}>
                                {allOk
                                    ? 'Barcha pachkalar skanerlandi — Ortildi ga o‘tkazish mumkin'
                                    : `${pendingLines.length} ta qator hali tayyor emas`}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleLoad}
                            disabled={!allOk || isUpdatingStatus}
                            title={!allOk ? 'Avval barcha pachkalarni skanerlang' : 'Ombordan chiqarib, holatni Ortildi qiladi'}
                            className="inline-flex h-14 min-w-56 items-center justify-center gap-3 rounded-xl bg-emerald-500 px-7 text-base font-extrabold text-white shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
                        >
                            {isUpdatingStatus ? (
                                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                </svg>
                            ) : (
                                <LuArrowDownToLine size={21} />
                            )}
                            {isUpdatingStatus ? 'Ortilmoqda…' : 'Ortildi — ombordan chiqarish'}
                        </button>
                    </div>
                )}
                {!isLoadingOrder && lines.length > 0 && (
                    <p className={`px-5 pb-4 text-xs ${muted}`}>
                        <LuFactory size={11} className="inline -mt-0.5" /> Chiqib ketgan pachkalar tarixi: «Tarix» sahifasida pachka barcode‘ini skanerlang.
                    </p>
                )}
            </div>
        </div>
    );
}
