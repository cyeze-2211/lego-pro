import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    LuCog,
    LuArrowLeft,
    LuPlay,
    LuSquare,
    LuActivity,
    LuClock,
    LuHistory,
    LuChevronLeft,
    LuChevronRight,
    LuX,
    LuPackage,
    LuCirclePlus,
    LuHash,
    LuClipboardList,
    LuCircleCheck,
    LuRefreshCw,
} from 'react-icons/lu';
import {
    useGetMachineByIdQuery,
    useStartMachineProductionMutation,
    useStopMachineProductionMutation,
    useUpdateMachineStatusMutation,
    useGetMachineOutputsSummaryQuery,
} from '../../../store/services/machine.api';
import StartProductPicker from './StartProductPicker';
import { ProductionWarehousePicker, useProductionWarehouse } from '../productionWarehouse';
import { printProducedLabel } from '../__components/producedLabel';
import {
    useCreateStockTransactionMutation,
} from '../../../store/services/productStock.api';
import { useGetMachineOutputsQuery } from '../../../store/services/machineOutput.api';
import {
    useGetProductionTasksQuery,
    useAcceptProductionTaskMutation,
} from '../../../store/services/productionTask.api';
import { useAppTheme, BRAND_COLORS } from '../../../theme/tokens';
import $api from '../../../store/api';

const HISTORY_PAGE_SIZE = 10;

/* ── BrandLogo komponenti ── */
function BrandLogo({ brand, isDark, accentColor, size = 48, isRectangle = false }) {
    const [imgSrc, setImgSrc] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!brand?.logoUrl) { setImgSrc(null); return; }

        let mounted = true;
        setLoading(true);
        setError(false);

        $api.get(brand.logoUrl.replace('/api/v1', ''), { responseType: 'blob' })
            .then((res) => {
                if (mounted) {
                    setImgSrc(URL.createObjectURL(res.data));
                    setLoading(false);
                }
            })
            .catch(() => {
                if (mounted) { setError(true); setLoading(false); }
            });

        return () => { mounted = false; };
    }, [brand?.logoUrl, brand?.id]);

    const w = isRectangle ? `${size + 32}px` : `${size}px`;
    const h = `${size}px`;

    const base = {
        width: w, height: h, minWidth: w,
        borderRadius: '10px', overflow: 'hidden', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
    };

    if (!brand?.logoUrl || error) {
        return (
            <div style={base}>
                <span style={{ color: accentColor, fontWeight: 700, fontSize: '18px' }}>
                    {brand?.name?.charAt(0) || 'B'}
                </span>
            </div>
        );
    }
    if (loading) {
        return (
            <div style={base}>
                <div style={{ color: accentColor, fontSize: '14px' }}>⏳</div>
            </div>
        );
    }
    return (
        <div style={{ ...base, background: isDark ? 'rgba(255,255,255,0.05)' : '#fff' }}>
            {imgSrc && (
                <img src={imgSrc} alt={brand.name}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px' }} />
            )}
        </div>
    );
}

const formatDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('uz-UZ', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const UZBEKISTAN_TIME_ZONE = 'Asia/Tashkent';

const getUzbekistanTimeParts = (date) => {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: UZBEKISTAN_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(date);

    return Object.fromEntries(parts.map(({ type, value }) => [type, Number(value)]));
};

const formatApiDateTime = (date) => {
    const pad = (value) => String(value).padStart(2, '0');
    return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
};

const getCurrentShift = (now) => {
    const { year, month, day, hour, minute, second } = getUzbekistanTimeParts(now);
    const tashkentWallTime = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    const start = new Date(tashkentWallTime);
    const end = new Date(tashkentWallTime);

    if (hour >= 8 && hour < 20) {
        start.setUTCHours(8, 0, 0, 0);
        end.setUTCHours(20, 0, 0, 0);
        return { name: 'Kunduzgi smena', start, end };
    }

    if (hour >= 20) {
        start.setUTCHours(20, 0, 0, 0);
        end.setUTCDate(end.getUTCDate() + 1);
        end.setUTCHours(8, 0, 0, 0);
    } else {
        start.setUTCDate(start.getUTCDate() - 1);
        start.setUTCHours(20, 0, 0, 0);
        end.setUTCHours(8, 0, 0, 0);
    }

    return { name: 'Kechki smena', start, end };
};

const formatShiftDateTime = (date) => {
    const pad = (value) => String(value).padStart(2, '0');
    return `${pad(date.getUTCDate())}.${pad(date.getUTCMonth() + 1)}.${date.getUTCFullYear()}, ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
};

const formatDurationMinutes = (totalMinutes) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours && minutes) return `${hours} soat ${minutes} daqiqa`;
    if (hours) return `${hours} soat`;
    return `${minutes} daqiqa`;
};

const formatDurationSeconds = (seconds = 0) =>
    formatDurationMinutes(Math.floor((Number(seconds) || 0) / 60));

const calcDuration = (startedAt, endedAt) => {
    if (!startedAt) return null;
    const start = new Date(startedAt);
    const end = endedAt ? new Date(endedAt) : new Date();
    const diffMs = end - start;
    if (diffMs < 0) return null;
    return formatDurationMinutes(Math.floor(diffMs / 60000));
};

/* ═══════════════════════════════════════════════════════════
   ASOSIY KOMPONENT
══════════════════════════════════════════════════════════════ */
export default function StanokchiMachineDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isDark, pageBg, cardBg, cardBorder, textColor, subtitleColor, accentColor } = useAppTheme();
    const [currentTime] = useState(() => new Date());

    const currentShift = getCurrentShift(currentTime);
    // Hisobot butun smena oralig‘i uchun olinadi (boshidan oxirigacha). Oldin oxirgi chegara sahifa
    // ochilgan vaqt edi, shuning uchun keyin «Qo‘shildi» qilingan donalar «Jami»ga kirmay qolardi.
    const shiftFromDateTime = formatApiDateTime(currentShift.start);
    const shiftToDateTime = formatApiDateTime(currentShift.end);

    /* ── Stanok ma'lumotlari ── */
    const { data: machine, isLoading: machineLoading, refetch: refetchMachine } =
        useGetMachineByIdQuery(id, { skip: !id });

    /* ── Machine outputs tarixi (GET /api/v1/machine-outputs?machineId=...) ── */
    const [historyPage, setHistoryPage] = useState(0);
    const { data: historyResult, isLoading: historyLoading, refetch: refetchHistory } =
        useGetMachineOutputsQuery(
            { machineId: id, page: historyPage, size: HISTORY_PAGE_SIZE },
            { skip: !id }
        );
    const historyItems = historyResult?.items ?? [];
    const historyPagination = historyResult?.pagination;
    const historyTotalPages = historyPagination?.totalPages || 0;

    /* ── Joriy smena hisoboti ── */

    const {
        data: summary,
        isLoading: summaryLoading,
        isFetching: summaryFetching,
        isError: summaryError,
        refetch: refetchSummary,
    } = useGetMachineOutputsSummaryQuery(
        {
            machineId: id,
            fromDateTime: shiftFromDateTime,
            toDateTime: shiftToDateTime,
        },
        { skip: !id }
    );

    /* ── Mutations ── */
    const [startProduction, { isLoading: starting }] = useStartMachineProductionMutation();
    const [stopProduction, { isLoading: stopping }] = useStopMachineProductionMutation();
    const [updateMachineStatus, { isLoading: statusUpdating }] = useUpdateMachineStatusMutation();
    const [createStockTransaction, { isLoading: producing }] = useCreateStockTransactionMutation();
    const warehouseState = useProductionWarehouse();

    /* ── Toast ── */
    const [toast, setToast] = useState(null);
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    /* ════════════════════════════════
       START MODAL
    ════════════════════════════════ */
    const [showStartModal, setShowStartModal] = useState(false);
    const [startSelectedProductId, setStartSelectedProductId] = useState('');
    const [startSelectedStatus, setStartSelectedStatus] = useState('WORKING');
    const [startError, setStartError] = useState('');

    /* ════════════════════════════════
       STATUS MODAL (alohida) — olib tashlandi, endi inline toggle button
    ════════════════════════════════ */

    const openStartModal = () => {
        setShowStartModal(true);
        setStartSelectedProductId('');
        setStartError('');
    };
    const closeStartModal = () => {
        setShowStartModal(false);
        setStartSelectedProductId('');
        setStartError('');
    };

    const handleStartSubmit = async (e) => {
        e.preventDefault();
        if (!startSelectedProductId) { setStartError("Mahsulot tanlang"); return; }
        try {
            await startProduction({ id, productId: startSelectedProductId }).unwrap();
            showToast('Ishlab chiqarish boshlandi');
            closeStartModal();
            refetchMachine();
            refetchSummary();
        } catch (err) {
            showToast(err?.data?.message || 'Boshlashda xatolik', 'error');
        }
    };

    /* ════════════════════════════════
       QAYD ETISH — 1 dona (modal yo'q): IN + machineId + warehouseId
    ════════════════════════════════ */
    const handleProduceOne = async () => {
        if (producing || !machine?.currentRun?.productId) return;
        if (!warehouseState.warehouseId) {
            showToast('Avval omborni tanlang — mahsulot qaysi omborga kiradi', 'error');
            return;
        }
        try {
            const res = await createStockTransaction({
                action: 'IN',
                machineId: id,
                warehouseId: warehouseState.warehouseId,
                items: [{ productId: machine.currentRun.productId, quantity: 1, unit: 'PACK' }], // har bosish = 1 pachka
            }).unwrap();
            const tx = Array.isArray(res?.data) ? res.data[0] : null;
            // Yorliq darhol printerga ketadi (modal yo‘q)
            printProducedLabel({
                productId: machine.currentRun.productId,
                productName: machine.currentRun.productName,
                brandName: machine.currentRun.brand?.name || '',
                barcode: tx?.productBarcode || '',
            });
            showToast(`1 pachka qayd etildi — ${machine.currentRun.productName}`);
            refetchMachine();
            refetchHistory();
            refetchSummary();
        } catch (err) {
            showToast(err?.data?.message || 'Qayd etishda xatolik', 'error');
        }
    };

    /* ── Stop ── */
    const handleStop = async () => {
        if (stopping) return;
        try {
            await stopProduction(id).unwrap();
            showToast("Ishlab chiqarish to'xtatildi");
            refetchMachine();
            refetchSummary();
        } catch (err) {
            showToast(err?.data?.message || "To'xtatishda xatolik", 'error');
        }
    };

    /* ── Production tasks (SENT) ── */
    const { data: tasksResult, isFetching: tasksFetching, refetch: refetchTasks } =
        useGetProductionTasksQuery(
            { machineId: id, status: 'SENT', page: 0, size: 20 },
            { skip: !id }
        );
    const pendingTasks = tasksResult?.items ?? [];
    const nextTask = pendingTasks[0] ?? null;

    const [acceptTask, { isLoading: accepting }] = useAcceptProductionTaskMutation();
    const [acceptingId, setAcceptingId] = useState(null);

    const handleAcceptTask = async (task) => {
        if (accepting) return;
        setAcceptingId(task.id);
        try {
            // 1. Joriy ishlab chiqarish bo'lsa — to'xtatamiz
            if (isWorking) {
                await stopProduction(id).unwrap();
            }
            // 2. Topshiriqni qabul qilamiz
            await acceptTask(task.id).unwrap();
            // 3. Yangi mahsulot bilan ishlab chiqarishni boshlaymiz
            await startProduction({ id, productId: task.productId }).unwrap();
            showToast(`${task.productName} ishlab chiqarish boshlandi`);
            refetchMachine();
            refetchTasks();
            refetchSummary();
        } catch (err) {
            showToast(err?.data?.message || 'Xatolik yuz berdi', 'error');
        } finally {
            setAcceptingId(null);
        }
    };

    /* ── ESC bilan modalni yopish ── */
    useEffect(() => {
        const onKey = (e) => {
            if (e.key !== 'Escape') return;
            if (showStartModal) closeStartModal();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [showStartModal]);

    // API javobida `isWorking` field yo'q — status va currentRun orqali aniqlaymiz
    // status: "WORKING" | "DEFECT" => ishlayapti
    // status: "IDLE" yoki currentRun yo'q => to'xtatilgan
    const isWorking = !!machine?.currentRun && machine?.status !== 'IDLE';

    /* ════════════════════════════════
       LOADING / ERROR STATES
    ════════════════════════════════ */
    if (machineLoading) {
        return (
            <div style={{ background: pageBg, minHeight: '100%', color: textColor }}>
                <SkeletonDetail isDark={isDark} cardBg={cardBg} cardBorder={cardBorder} />
            </div>
        );
    }

    if (!machine) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4"
                style={{ color: subtitleColor }}>
                <LuCog size={48} style={{ opacity: 0.3 }} />
                <p>Stanok topilmadi</p>
                <button onClick={() => navigate('/stanokchi')}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                    style={{ background: accentColor, color: '#0F172A', border: 'none', cursor: 'pointer' }}>
                    <LuArrowLeft size={15} /> Orqaga
                </button>
            </div>
        );
    }

    /* ════════════════════════════════
       RENDER
    ════════════════════════════════ */
    return (
        <div style={{ background: pageBg, color: textColor, minHeight: '100%' }}>

            {/* ── Toast ── */}
            {toast && (
                <div style={{
                    position: 'fixed', top: 90, right: 24, zIndex: 9999,
                    padding: '12px 20px', borderRadius: 12, fontWeight: 600, fontSize: 14,
                    background: toast.type === 'error'
                        ? (isDark ? '#7F1D1D' : '#FEE2E2')
                        : (isDark ? '#14532D' : '#DCFCE7'),
                    color: toast.type === 'error'
                        ? (isDark ? '#FCA5A5' : '#991B1B')
                        : (isDark ? '#86EFAC' : '#166534'),
                    boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                }}>
                    {toast.message}
                </div>
            )}

            {/* ── Sarlavha ── */}
            <div className="flex items-center gap-3 mb-6">
                <button onClick={() => navigate('/stanokchi')}
                    className="flex items-center justify-center w-9 h-9 rounded-xl border transition-all hover:scale-105"
                    style={{ background: cardBg, borderColor: cardBorder, color: textColor, cursor: 'pointer' }}
                    aria-label="Orqaga">
                    <LuArrowLeft size={17} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold leading-tight" style={{ color: textColor }}>
                        {machine.name}
                    </h1>
                    {machine.summary && (
                        <p className="text-sm mt-0.5" style={{ color: subtitleColor }}>{machine.summary}</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">

                {/* ══ Stanok holati kartasi ══ */}
                {(() => {
                    const isDefect  = isWorking && machine.status === 'DEFECT';
                    const isNormal  = isWorking && machine.status !== 'DEFECT';
                    const isIdle    = !isWorking;

                    const cardBorderColor = isDefect
                        ? isDark ? 'rgba(239,68,68,0.45)' : '#FCA5A5'
                        : isNormal
                        ? isDark ? 'rgba(34,197,94,0.35)'  : '#86EFAC'
                        : cardBorder;

                    const cardBgGlow = isDefect
                        ? isDark ? 'rgba(239,68,68,0.04)'  : '#FFF5F5'
                        : isNormal
                        ? isDark ? 'rgba(34,197,94,0.04)'  : '#F7FFF9'
                        : cardBg;

                    /* dot pulse rangi */
                    const dotColor  = isDefect ? '#EF4444' : isNormal ? '#22C55E' : '#94a3b8';

                    /* holat badge */
                    const badgeBg   = isDefect
                        ? isDark ? 'rgba(239,68,68,0.18)'  : '#FEE2E2'
                        : isNormal
                        ? isDark ? 'rgba(34,197,94,0.18)'  : '#DCFCE7'
                        : isDark ? 'rgba(148,163,184,0.15)' : '#F1F5F9';
                    const badgeColor = isDefect
                        ? isDark ? '#FCA5A5' : '#991B1B'
                        : isNormal
                        ? isDark ? '#86EFAC' : '#166534'
                        : subtitleColor;
                    const badgeLabel = isDefect ? '⚠ BRAK ishlab chiqarilmoqda'
                        : isNormal ? '● Ishlab chiqarilmoqda'
                        : "○ To'xtatilgan";

                    /* seans bloki rang */
                    const runBg     = isDefect
                        ? isDark ? 'rgba(239,68,68,0.07)'  : '#FEF2F2'
                        : isDark  ? 'rgba(34,197,94,0.07)' : '#F0FDF4';
                    const runBorder = isDefect
                        ? isDark ? 'rgba(239,68,68,0.2)'   : '#FECACA'
                        : isDark  ? 'rgba(34,197,94,0.2)'  : '#BBF7D0';
                    const runIconColor = isDefect ? '#EF4444' : '#22C55E';
                    const runTextColor = isDefect
                        ? isDark ? '#FCA5A5' : '#991B1B'
                        : isDark  ? '#86EFAC' : '#166534';

                    return (
                        <div className="lg:col-span-1 rounded-2xl border p-5 flex flex-col gap-4"
                            style={{
                                background: cardBgGlow,
                                borderColor: cardBorderColor,
                                boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.25)' : '0 4px 16px rgba(15,23,42,0.07)',
                            }}>

                            {/* ── Ikon + holat badge ── */}
                            <div className="flex items-center gap-3">
                                <div className="relative flex items-center justify-center w-12 h-12 rounded-xl"
                                    style={{
                                        background: isDefect
                                            ? isDark ? 'rgba(239,68,68,0.15)' : '#FEE2E2'
                                            : isNormal
                                            ? isDark ? 'rgba(34,197,94,0.15)'  : '#DCFCE7'
                                            : isDark ? 'rgba(148,163,184,0.12)' : '#F1F5F9',
                                    }}>
                                    <LuCog size={24} style={{ color: isDefect ? '#EF4444' : isNormal ? '#22C55E' : subtitleColor }} />
                                    {/* pulse dot */}
                                    {isWorking && (
                                        <span style={{
                                            position: 'absolute', top: 6, right: 6,
                                            width: 8, height: 8, borderRadius: '50%',
                                            background: dotColor,
                                            animation: 'stanokPulse 1.5s infinite',
                                        }} />
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs font-medium mb-1" style={{ color: subtitleColor }}>Holati</p>
                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
                                        style={{ background: badgeBg, color: badgeColor }}>
                                        {badgeLabel}
                                    </span>
                                </div>
                            </div>

                            {/* ── Joriy seans ── */}
                            {isWorking && (
                                <div className="rounded-xl p-3 flex flex-col gap-2.5"
                                    style={{ background: runBg, border: `1px solid ${runBorder}` }}>

                             

                                    <div className="flex items-center gap-2">
                                        <LuActivity size={13} style={{ color: runIconColor }} />
                                        <span className="text-xs font-semibold" style={{ color: runTextColor }}>
                                            {isDefect ? 'Brak mahsulot' : 'Joriy mahsulot'}
                                        </span>
                                    </div>

                                    <p className="font-bold text-sm" style={{ color: textColor }}>
                                        {machine.currentRun.productName}
                                    </p>

                                    <div className="flex items-center gap-1.5">
                                        <LuClock size={12} style={{ color: subtitleColor }} />
                                        <span className="text-xs" style={{ color: subtitleColor }}>
                                            Boshlandi: {formatDate(machine.currentRun.startedAt)}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        <LuClock size={12} style={{ color: runIconColor }} />
                                        <span className="text-xs font-medium" style={{ color: runTextColor }}>
                                            Davomiylik: {calcDuration(machine.currentRun.startedAt, null)}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* ── Bo'sh holat ── */}
                            {isIdle && (
                                <div className="rounded-xl px-4 py-3 flex items-center gap-3"
                                    style={{
                                        background: isDark ? 'rgba(148,163,184,0.06)' : '#F8FAFC',
                                        border: `1px solid ${isDark ? 'rgba(148,163,184,0.15)' : '#E2E8F0'}`,
                                    }}>
                                    <LuCog size={20} style={{ color: subtitleColor, opacity: 0.4 }} />
                                    <div>
                                        <p className="text-xs font-semibold" style={{ color: subtitleColor }}>
                                            Stanok hozir ishlamayapti
                                        </p>
                                        <p className="text-xs mt-0.5" style={{ color: subtitleColor, opacity: 0.7 }}>
                                            Boshlash uchun pastdagi tugmani bosing
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* ── Tugmalar ── */}
                            <div className="flex flex-col gap-2 mt-auto">

                                {/* Status toggle — faqat ishlayotgan bo'lsa */}
                                {isWorking && (
                                    <button
                                        onClick={async () => {
                                            const nextStatus = isDefect ? 'WORKING' : 'DEFECT';
                                            try {
                                                await updateMachineStatus({ id, status: nextStatus }).unwrap();
                                                showToast(
                                                    nextStatus === 'DEFECT'
                                                        ? '⚠ Brak rejimi yoqildi'
                                                        : '✓ Normal ishlab chiqarishga o\'tildi'
                                                );
                                                refetchMachine();
                                                refetchSummary();
                                            } catch (err) {
                                                showToast(err?.data?.message || 'Xatolik yuz berdi', 'error');
                                            }
                                        }}
                                        disabled={statusUpdating}
                                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                                        style={{
                                            background: isDefect
                                                ? isDark ? 'rgba(34,197,94,0.12)' : '#F0FDF4'
                                                : isDark ? 'rgba(239,68,68,0.12)' : '#FEF2F2',
                                            color: isDefect
                                                ? isDark ? '#86EFAC' : '#166534'
                                                : isDark ? '#FCA5A5' : '#991B1B',
                                            border: `1px solid ${isDefect
                                                ? isDark ? 'rgba(34,197,94,0.3)' : '#BBF7D0'
                                                : isDark ? 'rgba(239,68,68,0.3)' : '#FECACA'}`,
                                            cursor: statusUpdating ? 'not-allowed' : 'pointer',
                                        }}
                                    >
                                        {statusUpdating ? (
                                            <>
                                                <span style={{
                                                    width: 12, height: 12, borderRadius: '50%',
                                                    border: '2px solid currentColor',
                                                    borderTopColor: 'transparent',
                                                    display: 'inline-block',
                                                    animation: 'spin 0.8s linear infinite',
                                                }} />
                                                Saqlanmoqda...
                                            </>
                                        ) : isDefect ? (
                                            <>✓ Tuzatildi, normal ishlayapti</>
                                        ) : (
                                            <>⚠ Brak ishlab chiqarilmoqda</>
                                        )}
                                    </button>
                                )}

                                {/* Start / Stop */}
                                {!isWorking ? (
                                    <button onClick={openStartModal} disabled={starting}
                                        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                                        style={{
                                            background: 'linear-gradient(135deg, #22C55E, #16A34A)',
                                            color: '#fff', border: 'none',
                                            cursor: starting ? 'not-allowed' : 'pointer',
                                        }}>
                                        <LuPlay size={16} />
                                        {starting ? 'Boshlanmoqda...' : 'Ishlab chiqarishni boshlash'}
                                    </button>
                                ) : (
                                    <button onClick={handleStop} disabled={stopping}
                                        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                                        style={{
                                            background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                                            color: '#fff', border: 'none',
                                            cursor: stopping ? 'not-allowed' : 'pointer',
                                        }}>
                                        <LuSquare size={16} />
                                        {stopping ? "To'xtatilmoqda..." : "To'xtatish"}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })()}
                {/* ══ PRODUCE tarixi ══ */}
                <div className="lg:col-span-2 rounded-2xl border overflow-hidden"
                    style={{
                        background: cardBg, borderColor: cardBorder,
                        boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.25)' : '0 4px 16px rgba(15,23,42,0.07)',
                    }}>

                    {/* Header */}
                    <div className="flex flex-col border-b" style={{ borderColor: cardBorder }}>

                        {/* ── Kelgan topshiriq (faqat 1 ta, compact) ── */}
                        {(nextTask || tasksFetching) && (
                            <div className="flex items-center gap-3 px-5 py-3 border-b"
                                style={{
                                    borderColor: isDark ? 'rgb(var(--accent-400) / 0.18)' : 'rgb(var(--accent-warm-200))',
                                    background: isDark ? 'rgb(var(--accent-400) / 0.04)' : 'rgb(var(--accent-warm-50))',
                                }}>
                                {/* Left: icon + info */}
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <div className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0"
                                        style={{ background: isDark ? 'rgb(var(--accent-400) / 0.18)' : 'rgb(var(--accent-warm-100))' }}>
                                        <LuClipboardList size={13} style={{ color: accentColor }} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="text-[10px] font-semibold uppercase tracking-wide"
                                                style={{ color: isDark ? 'rgb(var(--accent-400))' : 'rgb(var(--accent-warm-800))' }}>
                                                Yangi topshiriq
                                            </span>
                                            {pendingTasks.length > 1 && (
                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                                                    style={{
                                                        background: isDark ? 'rgb(var(--accent-400) / 0.2)' : 'rgb(var(--accent-warm-200))',
                                                        color: isDark ? 'rgb(var(--accent-400))' : 'rgb(var(--accent-warm-800))',
                                                    }}>
                                                    +{pendingTasks.length - 1} ta kutmoqda
                                                </span>
                                            )}
                                            {tasksFetching && (
                                                <LuRefreshCw size={10} style={{ color: accentColor, animation: 'spin 1s linear infinite', flexShrink: 0 }} />
                                            )}
                                        </div>
                                        {nextTask && (
                                            <p className="text-xs font-bold truncate leading-tight mt-0.5" style={{ color: textColor }}>
                                                <LuPackage size={11} style={{ display: 'inline', marginRight: 4, color: accentColor }} />
                                                {nextTask.productName}
                                                {nextTask.note && (
                                                    <span className="font-normal ml-1.5" style={{ color: subtitleColor }}>
                                                        — {nextTask.note}
                                                    </span>
                                                )}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Right: accept button */}
                                {nextTask && (
                                    <button
                                        onClick={() => handleAcceptTask(nextTask)}
                                        disabled={!!acceptingId}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                                        style={{
                                            background: acceptingId
                                                ? (isDark ? 'rgba(34,197,94,0.15)' : '#DCFCE7')
                                                : 'linear-gradient(135deg, #22C55E, #16A34A)',
                                            color: acceptingId ? (isDark ? '#86EFAC' : '#166534') : '#fff',
                                            border: 'none',
                                            cursor: !!acceptingId ? 'not-allowed' : 'pointer',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {acceptingId ? (
                                            <>
                                                <LuRefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} />
                                                Qabul...
                                            </>
                                        ) : (
                                            <>
                                                <LuCircleCheck size={12} />
                                                Qabul qilish
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* ── Row: tarix title + qayd etish ── */}
                        <div className="flex items-center gap-2 px-5 py-3.5">
                            <LuHistory size={18} style={{ color: accentColor }} />
                            <h2 className="font-bold text-base" style={{ color: textColor }}>
                                Ishlab chiqarish tarixi
                            </h2>
                            {historyPagination && (
                                <span className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                                    style={{ background: isDark ? 'rgb(var(--accent-400) / 0.12)' : 'rgb(var(--accent-warm-100))', color: accentColor }}>
                                    {historyPagination.totalElements} ta
                                </span>
                            )}
                            {isWorking && (
                                <div className="ml-auto" style={{ maxWidth: 240 }}>
                                    <ProductionWarehousePicker state={warehouseState} isDark={isDark} textColor={textColor} subtitleColor={subtitleColor} cardBg={cardBg} cardBorder={cardBorder} compact />
                                </div>
                            )}
                            {isWorking && (
                                <button
                                    onClick={handleProduceOne}
                                    disabled={producing}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                                    style={{
                                        background: isDark ? 'rgb(var(--accent-400) / 0.18)' : 'rgb(var(--accent-100))',
                                        color: isDark ? 'rgb(var(--accent-400))' : 'rgb(var(--accent-warm-900))',
                                        border: `1px solid ${isDark ? 'rgb(var(--accent-400) / 0.35)' : 'rgb(var(--accent-warm-200))'}`,
                                        cursor: producing ? 'not-allowed' : 'pointer',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    <LuCirclePlus size={15} />
                                    {producing ? 'Saqlanmoqda...' : 'Qayd etish'}
                                </button>
                            )}
                        </div>
                    </div>

                    {historyLoading ? (
                        <div className="p-5 flex flex-col gap-2">
                            {Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} isDark={isDark} />)}
                        </div>
                    ) : historyItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-14 gap-2">
                            <LuHistory size={36} style={{ color: subtitleColor, opacity: 0.3 }} />
                            <p className="text-sm" style={{ color: subtitleColor }}>
                                Hali ishlab chiqarish tarixi yo&apos;q
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr style={{
                                            background: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
                                            borderBottom: `1px solid ${cardBorder}`,
                                        }}>
                                            {['№', 'Mahsulot', 'Miqdor (dona)', 'Ishlab chiqarilgan vaqt'].map((h) => (
                                                <th key={h} className="px-4 py-3 text-left font-semibold"
                                                    style={{ color: subtitleColor, whiteSpace: 'nowrap' }}>
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {historyItems.map((item, idx) => (
                                            <tr key={item.id}
                                                style={{ borderBottom: `1px solid ${cardBorder}` }}>
                                                <td className="px-4 py-3" style={{ color: subtitleColor }}>
                                                    {historyPage * HISTORY_PAGE_SIZE + idx + 1}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <LuPackage size={14} style={{ color: accentColor, flexShrink: 0 }} />
                                                        <span className="font-medium" style={{ color: textColor }}>
                                                            {item.productName}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="inline-flex items-center gap-1 font-bold text-sm"
                                                        style={{ color: isDark ? '#86EFAC' : '#166634' }}>
                                                        <LuHash size={13} />
                                                        {item.quantity}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap" style={{ color: subtitleColor }}>
                                                    {formatDate(item.producedAt)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {historyTotalPages > 1 && (
                                <div className="flex items-center justify-center gap-3 py-4 border-t"
                                    style={{ borderColor: cardBorder }}>
                                    <button disabled={historyPage === 0}
                                        onClick={() => setHistoryPage((p) => p - 1)}
                                        className="flex items-center justify-center w-8 h-8 rounded-lg border transition-all disabled:opacity-40"
                                        style={{ background: cardBg, borderColor: cardBorder, color: textColor, cursor: historyPage === 0 ? 'not-allowed' : 'pointer' }}>
                                        <LuChevronLeft size={15} />
                                    </button>
                                    <span className="text-xs" style={{ color: subtitleColor }}>
                                        {historyPage + 1} / {historyTotalPages}
                                    </span>
                                    <button disabled={historyPage >= historyTotalPages - 1}
                                        onClick={() => setHistoryPage((p) => p + 1)}
                                        className="flex items-center justify-center w-8 h-8 rounded-lg border transition-all disabled:opacity-40"
                                        style={{ background: cardBg, borderColor: cardBorder, color: textColor, cursor: historyPage >= historyTotalPages - 1 ? 'not-allowed' : 'pointer' }}>
                                        <LuChevronRight size={15} />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* ══════════════════════════════════════
                SUMMARY TABLE (hisobot)
            ══════════════════════════════════════ */}
            <div className="rounded-2xl border overflow-hidden mt-6"
                style={{
                    background: cardBg, borderColor: cardBorder,
                    boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.25)' : '0 4px 16px rgba(15,23,42,0.07)',
                }}>
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 border-b"
                    style={{ borderColor: cardBorder }}>
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="font-bold text-base" style={{ color: textColor }}>
                                Ishlab chiqarish hisoboti
                            </h2>
                            <span
                                className="rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide"
                                style={{
                                    background: isDark ? 'rgb(var(--accent-400) / 0.16)' : 'rgb(var(--accent-warm-100))',
                                    color: isDark ? 'rgb(var(--accent-400))' : 'rgb(var(--accent-warm-800))',
                                    border: `1px solid ${isDark ? 'rgb(var(--accent-400) / 0.35)' : 'rgb(var(--accent-warm-200))'}`,
                                }}
                            >
                                Hozirgi smena
                            </span>
                        </div>
                        <p className="mt-1 text-sm font-semibold" style={{ color: accentColor }}>
                            {currentShift.name}
                        </p>
                        <p className="mt-1 text-xs" style={{ color: subtitleColor }}>
                            {formatShiftDateTime(currentShift.start)} – {formatShiftDateTime(currentShift.end)}
                            {' · '}O‘zbekiston vaqti (UTC+05:00)
                        </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            type="button"
                            onClick={() => refetchSummary()}
                            disabled={summaryFetching}
                            className="px-3 py-1.5 rounded-lg border text-xs font-semibold disabled:opacity-50"
                            style={{ color: textColor, borderColor: cardBorder }}
                        >
                            {summaryFetching ? 'Yuklanmoqda...' : 'Yangilash'}
                        </button>
                    </div>
                </div>

                {/* Summary content */}
                {summaryLoading ? (
                    <div className="p-5">
                        <div className="py-8 text-center" style={{ color: subtitleColor }}>
                            Yuklanmoqda...
                        </div>
                    </div>
                ) : !summary ? (
                    <div className="p-5">
                        <div className="py-8 text-center" style={{ color: summaryError ? (isDark ? '#FCA5A5' : '#B91C1C') : subtitleColor }}>
                            {summaryError ? 'Smena hisobotini yuklab bo‘lmadi. Qayta urinib ko‘ring.' : 'Bu smenada ma’lumot topilmadi.'}
                        </div>
                    </div>
                ) : (
                    <div className="p-6">
                        {/* Summary cards - Yaxshilangan dizayn */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                            {/* Jami miqdor */}
                            <div 
                                className="rounded-2xl p-5 border-2 transition-all duration-200 hover:scale-105"
                                style={{
                                    background: isDark 
                                        ? 'linear-gradient(135deg, rgba(34,197,94,0.12) 0%, rgba(34,197,94,0.05) 100%)'
                                        : 'linear-gradient(135deg, rgba(240,253,244,1) 0%, rgba(220,252,231,0.8) 100%)',
                                    borderColor: isDark ? 'rgba(34,197,94,0.3)' : '#86EFAC',
                                    boxShadow: isDark 
                                        ? '0 4px 16px rgba(34,197,94,0.1)' 
                                        : '0 4px 16px rgba(34,197,94,0.15)',
                                }}>
                                <div className="flex items-start justify-between mb-3">
                                    <div 
                                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                                        style={{
                                            background: isDark ? 'rgba(34,197,94,0.2)' : 'rgba(34,197,94,0.15)',
                                        }}
                                    >
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isDark ? '#86EFAC' : '#16A34A'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                                            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                                            <line x1="12" y1="22.08" x2="12" y2="12"/>
                                        </svg>
                                    </div>
                                </div>
                                <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: isDark ? '#86EFAC' : '#166534' }}>
                                    Jami ishlab chiqarildi
                                </p>
                                <p className="text-3xl font-extrabold" style={{ color: isDark ? '#86EFAC' : '#166534' }}>
                                    {summary?.totalQuantity || 0}
                                    <span className="text-lg ml-1.5 font-medium opacity-80">dona</span>
                                </p>
                            </div>

                            {/* Ish vaqti */}
                            <div 
                                className="rounded-2xl p-5 border-2 transition-all duration-200 hover:scale-105"
                                style={{
                                    background: isDark 
                                        ? 'linear-gradient(135deg, rgb(var(--accent-400) / 0.12) 0%, rgb(var(--accent-400) / 0.05) 100%)'
                                        : 'linear-gradient(135deg, rgba(255,251,235,1) 0%, rgba(254,243,199,0.8) 100%)',
                                    borderColor: isDark ? 'rgb(var(--accent-400) / 0.3)' : 'rgb(var(--accent-300))',
                                    boxShadow: isDark 
                                        ? '0 4px 16px rgb(var(--accent-400) / 0.1)' 
                                        : '0 4px 16px rgb(var(--accent-400) / 0.15)',
                                }}>
                                <div className="flex items-start justify-between mb-3">
                                    <div 
                                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                                        style={{
                                            background: isDark ? 'rgb(var(--accent-400) / 0.2)' : 'rgb(var(--accent-400) / 0.15)',
                                        }}
                                    >
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ stroke: isDark ? 'rgb(var(--accent-400))' : 'rgb(var(--accent-600))' }} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10"/>
                                            <polyline points="12 6 12 12 16 14"/>
                                        </svg>
                                    </div>
                                </div>
                                <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: isDark ? 'rgb(var(--accent-400))' : 'rgb(var(--accent-warm-900))' }}>
                                    Ish vaqti
                                </p>
                                <p className="text-3xl font-extrabold" style={{ color: isDark ? 'rgb(var(--accent-400))' : 'rgb(var(--accent-warm-900))' }}>
                                    {summary?.workedDurationSeconds
                                        ? formatDurationSeconds(summary.workedDurationSeconds)
                                        : '0 daqiqa'}
                                </p>
                            </div>

                        </div>

                        {/* Mahsulotlar ro'yxati - Yaxshilangan dizayn */}
                        {summary?.products && summary.products.length > 0 && (
                            <div className="mb-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <div 
                                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                                        style={{
                                            background: isDark ? 'rgb(var(--accent-400) / 0.15)' : 'rgb(var(--accent-400) / 0.2)',
                                        }}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="8" y1="6" x2="21" y2="6"/>
                                            <line x1="8" y1="12" x2="21" y2="12"/>
                                            <line x1="8" y1="18" x2="21" y2="18"/>
                                            <line x1="3" y1="6" x2="3.01" y2="6"/>
                                            <line x1="3" y1="12" x2="3.01" y2="12"/>
                                            <line x1="3" y1="18" x2="3.01" y2="18"/>
                                        </svg>
                                    </div>
                                    <h4 className="text-base font-bold" style={{ color: textColor }}>
                                        Mahsulotlar bo'yicha
                                    </h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {summary.products.map((product) => (
                                        <div
                                            key={product.productId}
                                            className="rounded-2xl p-5 border-2 transition-all duration-200 hover:shadow-lg"
                                            style={{
                                                background: isDark 
                                                    ? 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
                                                    : '#FFFFFF',
                                                borderColor: isDark ? 'rgba(255,255,255,0.1)' : cardBorder,
                                            }}
                                        >
                                            {/* Brand logo + mahsulot nomi */}
                                            <div className="flex items-center gap-3 mb-4 pb-3"
                                                style={{
                                                    borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : cardBorder}`
                                                }}
                                            >
                                                {product.brand && (
                                                    <BrandLogo
                                                        brand={product.brand}
                                                        isDark={isDark}
                                                        accentColor={accentColor}
                                                        size={48}
                                                        isRectangle={true}
                                                    />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    {product.brand && (
                                                        <div className="flex items-center gap-1.5 mb-0.5">
                                                            <div
                                                                className="w-1 h-4 rounded-full flex-shrink-0"
                                                                style={{ background: accentColor }}
                                                            />
                                                            <span className="text-xs font-semibold truncate" style={{ color: subtitleColor }}>
                                                                {product.brand.name}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <h5 className="font-bold text-base leading-tight truncate" style={{ color: textColor }}>
                                                        {product.productName}
                                                    </h5>
                                                </div>
                                                <div 
                                                    className="px-3 py-2 rounded-xl flex-shrink-0"
                                                    style={{
                                                        background: isDark ? 'rgb(var(--accent-400) / 0.15)' : 'rgb(var(--accent-400) / 0.2)',
                                                    }}
                                                >
                                                    <p className="text-2xl font-extrabold text-center leading-none" style={{ color: accentColor }}>
                                                        {product.totalQuantity}
                                                    </p>
                                                    <p className="text-[10px] font-semibold uppercase text-center mt-0.5" style={{ color: accentColor, opacity: 0.8 }}>
                                                        dona
                                                    </p>
                                                </div>
                                            </div>

                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Info row */}
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
                            style={{
                                background: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
                                border: `1px solid ${cardBorder}`,
                            }}>
                            <LuCog size={14} style={{ color: accentColor }} />
                            <span className="text-xs font-medium" style={{ color: textColor }}>
                                {machine.name}
                            </span>
                            <span className="text-xs" style={{ color: subtitleColor }}>•</span>
                            <span className="text-xs" style={{ color: subtitleColor }}>
                                {currentShift.name}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* ══════════════════════════════════════
                START MODAL
            ══════════════════════════════════════ */}
            {showStartModal && (
                <Modal
                    onBackdropClick={closeStartModal}
                    isDark={isDark}
                    cardBorder={cardBorder}
                    size="lg"
                >
                    {/* Header */}
                    <ModalHeader
                        icon={<LuPlay size={18} style={{ color: '#22C55E' }} />}
                        title="Ishlab chiqarishni boshlash"
                        onClose={closeStartModal}
                        isDark={isDark}
                        cardBorder={cardBorder}
                        textColor={textColor}
                        subtitleColor={subtitleColor}
                    />

                    {/* Stanok nomi */}
                    <div className="px-5 pt-4">
                        <p className="text-xs font-medium mb-1" style={{ color: subtitleColor }}>Stanok</p>
                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-4"
                            style={{
                                background: isDark ? 'rgb(var(--accent-400) / 0.08)' : 'rgb(var(--accent-warm-100))',
                                border: `1px solid ${isDark ? 'rgb(var(--accent-400) / 0.2)' : 'rgb(var(--accent-warm-200))'}`,
                            }}>
                            <LuCog size={16} style={{ color: accentColor }} />
                            <span className="font-semibold text-sm" style={{ color: textColor }}>{machine.name}</span>
                        </div>
                    </div>

                    <form onSubmit={handleStartSubmit}>
                        <div className="px-5 pb-5 flex flex-col gap-4">
                            <StartProductPicker
                                selectedId={startSelectedProductId}
                                onSelect={(pid) => { setStartSelectedProductId(pid); setStartError(''); }}
                                error={startError}
                                isDark={isDark}
                                cardBorder={cardBorder}
                                textColor={textColor}
                                subtitleColor={subtitleColor}
                                accentColor={accentColor}
                            />

                            <ModalActions
                                onCancel={closeStartModal}
                                submitLabel="Boshlash"
                                submitIcon={<LuPlay size={15} />}
                                submitStyle={{ background: 'linear-gradient(135deg, #22C55E, #16A34A)', color: '#fff' }}
                                loading={starting || statusUpdating}
                                disabled={!startSelectedProductId}
                                cardBorder={cardBorder}
                                textColor={textColor}
                            />
                        </div>
                    </form>
                </Modal>
            )}

            {/* pulse animation */}
            <style>{`
                @keyframes stanokPulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.35; }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════
   KICHIK KOMPONENTLAR
══════════════════════════════════════════════════════════════ */

/** Modal backdrop + container */
function Modal({ children, onBackdropClick, isDark, cardBorder, size = 'md' }) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) onBackdropClick(); }}
        >
            <div className={`w-full ${size === 'lg' ? 'max-w-2xl' : 'max-w-md'} rounded-2xl border shadow-2xl overflow-hidden`}
                style={{
                    background: isDark ? BRAND_COLORS.darkCardBg : '#fff',
                    borderColor: cardBorder,
                    maxHeight: '90vh',
                    overflowY: 'auto',
                }}>
                {children}
            </div>
        </div>
    );
}

/** Modal header row */
function ModalHeader({ icon, title, onClose, isDark, cardBorder, textColor, subtitleColor }) {
    return (
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: cardBorder }}>
            <div className="flex items-center gap-2">
                {icon}
                <h3 className="font-bold text-base" style={{ color: textColor }}>{title}</h3>
            </div>
            <button onClick={onClose}
                className="flex items-center justify-center w-8 h-8 rounded-lg transition-all hover:opacity-70"
                style={{ background: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9', color: subtitleColor, border: 'none', cursor: 'pointer' }}
                aria-label="Yopish">
                <LuX size={16} />
            </button>
        </div>
    );
}

/** Mahsulot qidirish + tanlash ro'yxati */
/** Modal action buttons */
function ModalActions({ onCancel, submitLabel, submitIcon, submitStyle, loading, disabled, cardBorder, textColor }) {
    return (
        <div className="flex gap-2 mt-1">
            <button type="button" onClick={onCancel}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all hover:opacity-80"
                style={{ background: 'transparent', borderColor: cardBorder, color: textColor, cursor: 'pointer' }}>
                Bekor qilish
            </button>
            <button type="submit" disabled={loading || disabled}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                style={{ ...submitStyle, border: 'none', cursor: loading || disabled ? 'not-allowed' : 'pointer' }}>
                {submitIcon}
                {loading ? 'Saqlanmoqda...' : submitLabel}
            </button>
        </div>
    );
}

/* ── Skeleton'lar ── */
function SkeletonDetail({ isDark, cardBg, cardBorder }) {
    const sh = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    return (
        <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3 mb-2">
                <div style={{ width: 36, height: 36, borderRadius: 12, background: sh }} />
                <div style={{ height: 24, width: 200, borderRadius: 8, background: sh }} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="rounded-2xl border p-5" style={{ background: cardBg, borderColor: cardBorder, height: 260 }}>
                    {[80, 120, 40, 40].map((w, i) => (
                        <div key={i} style={{ height: 14, width: `${w}%`, borderRadius: 6, background: sh, marginBottom: 12 }} />
                    ))}
                </div>
                <div className="lg:col-span-2 rounded-2xl border" style={{ background: cardBg, borderColor: cardBorder, height: 260 }} />
            </div>
        </div>
    );
}

function RowSkeleton({ isDark }) {
    const sh = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    return (
        <div className="flex gap-4 py-2">
            {[30, 120, 60, 100].map((w, i) => (
                <div key={i} style={{ height: 12, width: w, borderRadius: 5, background: sh, flexShrink: 0 }} />
            ))}
        </div>
    );
}
