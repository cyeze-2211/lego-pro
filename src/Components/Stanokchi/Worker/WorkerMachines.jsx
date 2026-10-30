// Components/Stanokchi/Worker/WorkerMachines.jsx
import { useState, useEffect } from 'react';
import { LuCog, LuChevronLeft, LuChevronRight, LuClock3, LuPackage } from 'react-icons/lu';
import { useGetMachinesQuery } from '../../../store/services/machine.api';
import { useCreateStockTransactionMutation } from '../../../store/services/productStock.api';
import { useAppTheme } from '../../../theme/tokens';
import ProductImage from '../../ui/ProductImage';
import { useMachineWarehouses } from '../productionWarehouse';
import { PRODUCE_WITH_DIALOG, shouldPrintLabel } from '../labelPolicy';
import ProduceDialog from '../ProduceDialog';
import { useAppDispatch } from '../../../store/hooks';
import { labelErrorMessage, printStockLabel } from '../../../services/labelPrinter';
import LabelPrintDialog from '../../ui/LabelPrintDialog';

/* Har «+1 pachka» da chop etiladigan yorliqlar soni — pachkaning ikki tomoniga */
const LABEL_COPIES = 2;

const productImageUrl = (productId) => (productId ? `/api/v1/products/${productId}/image` : null);

const PAGE_SIZE = 8; // bitta ekranga 8 ta stanok (4×2 yoki 2×4)


export default function WorkerMachines() {
    const [page, setPage] = useState(0);
    const { isDark, cardBg, cardBorder, textColor, subtitleColor } = useAppTheme();

    const { data: result, isLoading, error, refetch } = useGetMachinesQuery({ page, size: PAGE_SIZE }, { pollingInterval: 30_000 });
    // Sarflangan vaqt uchun daqiqalik soat
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30_000); return () => clearInterval(t); }, []);
    // Brak (DEFECT) holatidagi stanoklar xodim panelida ko‘rsatilmaydi — ular bilan ishlash muammoli
    const machines   = (result?.items || []).filter((m) => m.status !== 'DEFECT');
    const totalPages = result?.pagination?.totalPages || 0;

    /* ── Qayt etish mutation ── */
    const [createStockTransaction, { isLoading: producing }] = useCreateStockTransactionMutation();
    const [producingId, setProducingId] = useState(null);
    // Ombor har stanok uchun OTK (rahbar rejimi) tomonidan belgilanadi — xodim tanlamaydi
    const machineWarehouses = useMachineWarehouses();
    const dispatch = useAppDispatch();
    const [labelPick, setLabelPick] = useState(null); // printer tanlanmagan bo‘lsa — yorliq oynasi
    const [produceFor, setProduceFor] = useState(null); // VAQTINCHALIK: qayd etish oynasi (nechta pachka / yorliq / printer)

    /* ── Toast ── */
    const [toast, setToast] = useState(null);
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    const handleCardClick = async (machine) => {
        const isWorking = !!machine.currentRun && machine.status !== 'IDLE';
        if (!isWorking || producing) return;
        const warehouseId = machineWarehouses.getWarehouseId(machine.id);
        if (!warehouseId) {
            showToast(`«${machine.name}» uchun kirim ombori belgilanmagan — OTK (rahbar) rejimida belgilang`, 'error');
            return;
        }
        if (PRODUCE_WITH_DIALOG) {
            setProduceFor({ machineId: machine.id, machineName: machine.name, warehouseId, productId: machine.currentRun.productId, productName: machine.currentRun.productName });
            return;
        }

        setProducingId(machine.id);
        try {
            // Stanokdan chiqqan mahsulot: IN + machineId + warehouseId (PRODUCE turi yo‘q)
            const txResult = await createStockTransaction({
                action: 'IN',
                machineId: machine.id,
                warehouseId,
                items: [{ productId: machine.currentRun.productId, quantity: 1, unit: 'PACK' }], // har bosish = 1 pachka
            }).unwrap();
            // Javobdagi harakat yozuvida shtrix-kod bor — oynada katta qilib ko‘rsatamiz
            // Yorliq: backend tayyor TSPL kodini beradi, QZ Tray printerga yuboradi (har pachkaga 2 nusxa).
            // Printer tanlanmagan bo‘lsa — tanlash oynasi; boshqa xato — toast.
            // Yorliq kirim yozuviga bog‘langan: javobdagi data[0].id (brakda massiv bo‘sh — yorliq yo‘q).
            // Faqat tayyor mahsulot (FINISHED) uchun; yarim tayyor — yorliqsiz.
            const entries = Array.isArray(txResult) ? txResult : (txResult?.data ?? []);
            const txId = entries[0]?.id;
            if (txId) {
                shouldPrintLabel(dispatch, machine.currentRun.productId).then((print) => {
                    if (!print) return;
                    printStockLabel(txId, LABEL_COPIES).catch((e) => {
                        if (e?.code === 'NO_PRINTER') setLabelPick({ transactionId: txId, productId: machine.currentRun.productId, productName: machine.currentRun.productName });
                        else showToast(labelErrorMessage(e), 'error');
                    });
                });
            }
            showToast(`✓ 1 pachka qayd etildi — ${machine.currentRun.productName}`);
            refetch();
        } catch (err) {
            showToast(err?.data?.message || 'Qayd etishda xatolik', 'error');
        } finally {
            setProducingId(null);
        }
    };

    return (
        <div className="relative flex h-full min-h-0 flex-col" style={{ color: textColor }}>
            {labelPick && (
                <LabelPrintDialog open onClose={() => setLabelPick(null)} transactionId={labelPick.transactionId} productId={labelPick.productId} productName={labelPick.productName} defaultCopies={LABEL_COPIES} />
            )}
            {produceFor && (
                <ProduceDialog open onClose={() => setProduceFor(null)} {...produceFor} defaultCopies={LABEL_COPIES} onDone={() => refetch()} />
            )}
            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', top: 60, right: 16, zIndex: 9999,
                    padding: '12px 20px', borderRadius: 12, fontWeight: 700, fontSize: 15,
                    background: toast.type === 'error' ? (isDark ? '#7F1D1D' : '#FEE2E2') : (isDark ? '#14532D' : '#DCFCE7'),
                    color: toast.type === 'error' ? (isDark ? '#FCA5A5' : '#991B1B') : (isDark ? '#86EFAC' : '#166534'),
                    boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                }}>
                    {toast.message}
                </div>
            )}

            {/* Xatolik / bo‘sh */}
            {error && !isLoading && (
                <div className="flex flex-1 flex-col items-center justify-center gap-3">
                    <LuCog size={52} style={{ color: subtitleColor, opacity: 0.35 }} />
                    <p className="text-xl font-semibold" style={{ color: subtitleColor }}>Ma&apos;lumotlarni yuklashda xatolik</p>
                </div>
            )}
            {!isLoading && !error && machines.length === 0 && (
                <div className="flex flex-1 flex-col items-center justify-center gap-3">
                    <LuCog size={60} style={{ color: subtitleColor, opacity: 0.3 }} />
                    <p className="text-xl font-semibold" style={{ color: subtitleColor }}>Hozircha stanoklar yo&apos;q</p>
                </div>
            )}

            {/* 8 ta stanok — bitta ekran, skroll yo‘q: landshaftda 4×2, portretda 2×4 */}
            {!error && (isLoading || machines.length > 0) && (
                <div className="grid min-h-0 flex-1 gap-2 sm:gap-3 landscape:grid-cols-4 landscape:grid-rows-2 portrait:grid-cols-2 portrait:grid-rows-4">
                    {isLoading
                        ? Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonCard key={i} isDark={isDark} cardBg={cardBg} cardBorder={cardBorder} />)
                        : machines.map((machine) => (
                            <WorkerMachineCard
                                key={machine.id}
                                machine={machine}
                                now={now}
                                isDark={isDark}
                                cardBg={cardBg}
                                cardBorder={cardBorder}
                                textColor={textColor}
                                subtitleColor={subtitleColor}
                                onClick={() => handleCardClick(machine)}
                                isProducing={producingId === machine.id}
                                warehouseName={machineWarehouses.getWarehouse(machine.id)?.name || ''}
                            />
                        ))}
                </div>
            )}

            {/* Sahifalar (8 tadan ko‘p bo‘lsa) — kichik, pastda */}
            {totalPages > 1 && (
                <div className="mt-2 flex shrink-0 items-center justify-center gap-3">
                    <button type="button" disabled={page === 0} onClick={() => setPage((p) => p - 1)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border transition-all disabled:cursor-not-allowed disabled:opacity-40"
                        style={{ background: cardBg, borderColor: cardBorder, color: textColor }} aria-label="Oldingi">
                        <LuChevronLeft size={18} />
                    </button>
                    <span className="text-sm font-bold" style={{ color: subtitleColor }}>{page + 1} / {totalPages}</span>
                    <button type="button" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border transition-all disabled:cursor-not-allowed disabled:opacity-40"
                        style={{ background: cardBg, borderColor: cardBorder, color: textColor }} aria-label="Keyingi">
                        <LuChevronRight size={18} />
                    </button>
                </div>
            )}
        </div>
    );
}

/* Sarflangan vaqt: «1 s 20 d» */
const elapsedLabel = (startedAt, now) => {
    if (!startedAt) return '';
    const min = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 60000));
    const h = Math.floor(min / 60); const m = min % 60;
    return h > 0 ? `${h} s ${m} d` : `${m} d`;
};

/* ── Karta: katakni to‘liq egallaydi, matnlar ekran kengligiga qarab o‘lchanadi ── */
function WorkerMachineCard({ machine, now, isDark, cardBg, cardBorder, textColor, subtitleColor, onClick, isProducing, warehouseName }) {
    const isWorking = machine.status === 'WORKING';
    const isDefect = machine.status === 'DEFECT';
    const run = machine.currentRun;
    const canClick = (isWorking || isDefect) && Boolean(run);
    const tone = isWorking ? '#22C55E' : isDefect ? '#EF4444' : null;

    const background = isWorking
        ? (isDark ? 'linear-gradient(160deg, rgba(22,163,74,0.18), rgba(34,197,94,0.06))' : 'linear-gradient(160deg, #DCFCE7, #F0FDF4)')
        : isDefect
            ? (isDark ? 'linear-gradient(160deg, rgba(220,38,38,0.18), rgba(239,68,68,0.06))' : 'linear-gradient(160deg, #FEE2E2, #FEF2F2)')
            : cardBg;
    const border = isWorking ? (isDark ? 'rgba(34,197,94,0.55)' : '#86EFAC') : isDefect ? (isDark ? 'rgba(239,68,68,0.55)' : '#FCA5A5') : cardBorder;
    const strong = isWorking ? (isDark ? '#86EFAC' : '#166534') : isDefect ? (isDark ? '#FCA5A5' : '#991B1B') : textColor;

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={isProducing || !canClick}
            className="relative flex min-h-0 w-full flex-col overflow-hidden rounded-2xl border text-left transition-transform duration-150 active:scale-[0.98]"
            style={{
                background, borderColor: border,
                boxShadow: tone ? `0 0 0 2px ${tone}33, 0 10px 28px ${tone}26` : (isDark ? '0 4px 16px rgba(0,0,0,0.3)' : '0 4px 16px rgba(15,23,42,0.08)'),
                cursor: isProducing ? 'wait' : canClick ? 'pointer' : 'default',
                opacity: isProducing ? 0.7 : canClick ? 1 : 0.85,
                padding: 'clamp(8px, 1.1vw, 16px)',
            }}
        >
            {isProducing && (
                <div className="absolute inset-0 z-10 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}>
                    <div className="flex flex-col items-center gap-2">
                        <div style={{ width: 34, height: 34, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#22C55E', animation: 'spin 0.8s linear infinite' }} />
                        <span className="text-sm font-bold text-white">Saqlanmoqda...</span>
                    </div>
                </div>
            )}

            {/* Yuqori qator: stanok nomi + holat */}
            <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1.5">
                    <LuCog size={14} style={{ color: tone || subtitleColor, flexShrink: 0 }} />
                    <span className="truncate font-extrabold" style={{ color: textColor, fontSize: 'clamp(13px, 1.3vw, 19px)' }}>{machine.name}</span>
                </span>
                <span className="shrink-0 rounded-full px-2 py-0.5 font-bold" style={{
                    fontSize: 'clamp(10px, 0.9vw, 13px)',
                    background: isWorking ? (isDark ? 'rgba(34,197,94,0.22)' : '#BBF7D0') : isDefect ? (isDark ? 'rgba(239,68,68,0.22)' : '#FECACA') : (isDark ? 'rgba(148,163,184,0.15)' : '#F1F5F9'),
                    color: strong,
                }}>
                    {isWorking ? '● Ishlayapti' : isDefect ? '● Brak' : '○ Bo‘sh'}
                </span>
            </div>
            {/* OTK belgilagan kirim ombori — xodim o‘zgartira olmaydi */}
            <p className="truncate" style={{ color: warehouseName ? subtitleColor : '#F59E0B', fontSize: 'clamp(10px, 0.85vw, 12px)' }}>
                {warehouseName ? `→ ${warehouseName}` : 'Ombor belgilanmagan'}
            </p>

            {/* O‘rta: yuqorida ikki rasm (brend logotipi + mahsulot fotosi), pastda ma'lumot */}
            {canClick ? (
                <div className="flex min-h-0 flex-1 flex-col gap-1.5 py-1">
                    <div className="grid min-h-0 flex-1 grid-cols-2 gap-2">
                        {/* Brend logotipi */}
                        <div className="relative flex min-h-0 items-center justify-center overflow-hidden rounded-xl border" style={{ borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.12)', background: isDark ? 'rgba(255,255,255,0.06)' : '#fff' }}>
                            <span className="absolute left-1.5 top-1 text-[9px] font-bold uppercase tracking-wide" style={{ color: subtitleColor }}>Brend</span>
                            {run.brand?.logoUrl ? (
                                <ProductImage imageUrl={run.brand.logoUrl} version={run.brand.id} name={run.brand.name} size="100%" radius="none" fit="contain" bg="transparent" borderWidth="0" h="100%" minW="0" p={2} />
                            ) : (
                                <span className="px-2 text-center font-extrabold uppercase" style={{ color: textColor, fontSize: 'clamp(12px, 1.3vw, 20px)' }}>{run.brand?.name || '—'}</span>
                            )}
                        </div>
                        {/* Mahsulot fotosi */}
                        <div className="relative flex min-h-0 items-center justify-center overflow-hidden rounded-xl border" style={{ borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.12)', background: isDark ? 'rgba(255,255,255,0.06)' : '#fff' }}>
                            <span className="absolute left-1.5 top-1 text-[9px] font-bold uppercase tracking-wide" style={{ color: subtitleColor }}>Mahsulot</span>
                            <ProductImage imageUrl={productImageUrl(run.productId)} version={run.productId} name={run.productName} size="100%" radius="none" fit="contain" bg="transparent" borderWidth="0" h="100%" minW="0" p={1} iconSize={28} />
                        </div>
                    </div>
                    <div className="min-w-0 shrink-0">
                        <p className="font-extrabold leading-tight" style={{ color: strong, fontSize: 'clamp(13px, 1.3vw, 19px)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {run.productName}
                        </p>
                        {run.brand?.name && (
                            <p className="truncate font-semibold" style={{ color: subtitleColor, fontSize: 'clamp(11px, 0.95vw, 14px)' }}>{run.brand.name}</p>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-1">
                    <LuCog size={34} style={{ color: subtitleColor, opacity: 0.35 }} />
                    <span className="font-semibold" style={{ color: subtitleColor, fontSize: 'clamp(11px, 1vw, 14px)' }}>Hozir ishlamayapti</span>
                </div>
            )}

            {/* Pastki qator: vaqt + ko‘rsatma */}
            {canClick && (
                <div className="flex items-center justify-between gap-2" style={{ fontSize: 'clamp(10px, 0.95vw, 13px)' }}>
                    <span className="inline-flex items-center gap-1 font-semibold" style={{ color: subtitleColor }}>
                        <LuClock3 size={12} /> {elapsedLabel(run.startedAt, now)}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-extrabold" style={{ background: tone, color: '#fff' }}>
                        <LuPackage size={12} /> +1 pachka
                    </span>
                </div>
            )}
        </button>
    );
}

/* ── Skeleton ── */
function SkeletonCard({ isDark, cardBg, cardBorder }) {
    const sh = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    return (
        <div className="flex min-h-0 flex-col gap-3 rounded-2xl border p-3" style={{ background: cardBg, borderColor: cardBorder }}>
            <div className="flex justify-between"><div style={{ width: '45%', height: 16, borderRadius: 6, background: sh }} /><div style={{ width: 70, height: 18, borderRadius: 999, background: sh }} /></div>
            <div className="flex flex-1 items-center gap-3"><div style={{ width: 64, height: 64, borderRadius: 14, background: sh }} /><div className="flex-1"><div style={{ height: 16, borderRadius: 6, background: sh, width: '90%' }} /><div style={{ height: 12, borderRadius: 6, background: sh, width: '50%', marginTop: 8 }} /></div></div>
            <div style={{ height: 14, borderRadius: 6, background: sh, width: '60%' }} />
        </div>
    );
}

/* ── Spin animation ── */
if (typeof document !== 'undefined' && !document.getElementById('worker-machines-animation')) {
    const style = document.createElement('style');
    style.id = 'worker-machines-animation';
    style.textContent = '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
    document.head.appendChild(style);
}
