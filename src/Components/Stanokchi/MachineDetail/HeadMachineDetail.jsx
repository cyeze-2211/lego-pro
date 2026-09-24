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
    LuSearch,
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
} from '../../../store/services/machine.api';
import { useGetProductsQuery } from '../../../store/services/product.api';
import {
    useCreateStockTransactionMutation,
} from '../../../store/services/productStock.api';
import { useGetMachineOutputsQuery } from '../../../store/services/machineOutput.api';
import {
    useGetProductionTasksQuery,
    useAcceptProductionTaskMutation,
} from '../../../store/services/productionTask.api';
import { useAppTheme, BRAND_COLORS } from '../../../theme/tokens';

const HISTORY_PAGE_SIZE = 10;

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

const calcDuration = (startedAt, endedAt) => {
    if (!startedAt) return null;
    const start = new Date(startedAt);
    const end = endedAt ? new Date(endedAt) : new Date();
    const diffMs = end - start;
    if (diffMs < 0) return null;
    const totalMin = Math.floor(diffMs / 60000);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    if (h > 0) return `${h}s ${m}d`;
    return `${m}d`;
};

/* ═══════════════════════════════════════════════════════════
   ASOSIY KOMPONENT
══════════════════════════════════════════════════════════════ */
export default function StanokchiMachineDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isDark, pageBg, cardBg, cardBorder, textColor, subtitleColor, accentColor } = useAppTheme();

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

    /* ── Mutations ── */
    const [startProduction, { isLoading: starting }] = useStartMachineProductionMutation();
    const [stopProduction, { isLoading: stopping }] = useStopMachineProductionMutation();
    const [createStockTransaction, { isLoading: producing }] = useCreateStockTransactionMutation();

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
    const [startProductSearch, setStartProductSearch] = useState('');
    const [startProductQuery, setStartProductQuery] = useState('');
    const [startSelectedProductId, setStartSelectedProductId] = useState('');
    const [startError, setStartError] = useState('');

    const { data: startProductsResult, isLoading: startProductsLoading } = useGetProductsQuery(
        { name: startProductQuery || undefined, page: 0, size: 30 },
        { skip: !showStartModal }
    );
    const startProducts = startProductsResult?.items || [];

    const openStartModal = () => {
        setShowStartModal(true);
        setStartSelectedProductId('');
        setStartProductSearch('');
        setStartProductQuery('');
        setStartError('');
    };
    const closeStartModal = () => {
        setShowStartModal(false);
        setStartSelectedProductId('');
        setStartProductSearch('');
        setStartProductQuery('');
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
        } catch (err) {
            showToast(err?.data?.message || 'Boshlashda xatolik', 'error');
        }
    };

    /* ════════════════════════════════
       PRODUCE — 1 dona (modal yo'q)
    ════════════════════════════════ */
    const handleProduceOne = async () => {
        if (producing || !machine?.currentRun?.productId) return;
        try {
            await createStockTransaction({
                action: 'PRODUCE',
                machineId: id,
                items: [{ productId: machine.currentRun.productId, quantity: 1 }],
            }).unwrap();
            showToast(`1 dona qayd etildi — ${machine.currentRun.productName}`);
            refetchHistory();
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

    const isWorking = machine?.isWorking && machine?.currentRun;

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
                <div className="lg:col-span-1 rounded-2xl border p-5 flex flex-col gap-4"
                    style={{
                        background: cardBg,
                        borderColor: isWorking ? (isDark ? 'rgba(34,197,94,0.35)' : '#86EFAC') : cardBorder,
                        boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.25)' : '0 4px 16px rgba(15,23,42,0.07)',
                    }}>

                    {/* Holat */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-12 h-12 rounded-xl"
                            style={{ background: isDark ? 'rgba(250,204,21,0.12)' : '#FEF3C7' }}>
                            <LuCog size={24} style={{ color: accentColor }} />
                        </div>
                        <div>
                            <p className="text-xs font-medium mb-0.5" style={{ color: subtitleColor }}>Holati</p>
                            <span className="inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1 rounded-full"
                                style={isWorking
                                    ? { background: isDark ? 'rgba(34,197,94,0.14)' : '#DCFCE7', color: isDark ? '#86EFAC' : '#166534' }
                                    : { background: isDark ? 'rgba(148,163,184,0.15)' : '#F1F5F9', color: subtitleColor }}>
                                {isWorking && (
                                    <span style={{
                                        width: 7, height: 7, borderRadius: '50%', background: '#22C55E',
                                        display: 'inline-block', animation: 'stanokPulse 1.5s infinite',
                                    }} />
                                )}
                                {isWorking ? 'Ishlayapti' : "Bo'sh"}
                            </span>
                        </div>
                    </div>

                    {/* Joriy seans */}
                    {isWorking && (
                        <div className="rounded-xl p-3 flex flex-col gap-2"
                            style={{
                                background: isDark ? 'rgba(34,197,94,0.07)' : '#F0FDF4',
                                border: `1px solid ${isDark ? 'rgba(34,197,94,0.2)' : '#BBF7D0'}`,
                            }}>
                            <div className="flex items-center gap-2">
                                <LuActivity size={14} style={{ color: '#22C55E' }} />
                                <span className="text-xs font-semibold" style={{ color: isDark ? '#86EFAC' : '#166534' }}>
                                    Joriy mahsulot
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
                                <LuClock size={12} style={{ color: '#22C55E' }} />
                                <span className="text-xs font-medium" style={{ color: isDark ? '#86EFAC' : '#166534' }}>
                                    Davomiylik: {calcDuration(machine.currentRun.startedAt, null)}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Knopkalar */}
                    <div className="flex flex-col gap-2 mt-auto">
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
                                Ishlab chiqarishni boshlash
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
                                {stopping ? "To'xtatilmoqda..." : "Ishlab chiqarishni to'xtatish"}
                            </button>
                        )}
                    </div>
                </div>

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
                                    borderColor: isDark ? 'rgba(250,204,21,0.18)' : '#FDE68A',
                                    background: isDark ? 'rgba(250,204,21,0.04)' : '#FFFBEB',
                                }}>
                                {/* Left: icon + info */}
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <div className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0"
                                        style={{ background: isDark ? 'rgba(250,204,21,0.18)' : '#FEF3C7' }}>
                                        <LuClipboardList size={13} style={{ color: accentColor }} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="text-[10px] font-semibold uppercase tracking-wide"
                                                style={{ color: isDark ? '#FACC15' : '#92400E' }}>
                                                Yangi topshiriq
                                            </span>
                                            {pendingTasks.length > 1 && (
                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                                                    style={{
                                                        background: isDark ? 'rgba(250,204,21,0.2)' : '#FDE68A',
                                                        color: isDark ? '#FACC15' : '#92400E',
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
                                    style={{ background: isDark ? 'rgba(250,204,21,0.12)' : '#FEF3C7', color: accentColor }}>
                                    {historyPagination.totalElements} ta
                                </span>
                            )}
                            {isWorking && (
                                <button
                                    onClick={handleProduceOne}
                                    disabled={producing}
                                    className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                                    style={{
                                        background: isDark ? 'rgba(250,204,21,0.18)' : '#FEF9C3',
                                        color: isDark ? '#FACC15' : '#78350F',
                                        border: `1px solid ${isDark ? 'rgba(250,204,21,0.35)' : '#FDE68A'}`,
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
                START MODAL
            ══════════════════════════════════════ */}
            {showStartModal && (
                <Modal
                    onBackdropClick={closeStartModal}
                    isDark={isDark}
                    cardBorder={cardBorder}
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
                                background: isDark ? 'rgba(250,204,21,0.08)' : '#FEF3C7',
                                border: `1px solid ${isDark ? 'rgba(250,204,21,0.2)' : '#FDE68A'}`,
                            }}>
                            <LuCog size={16} style={{ color: accentColor }} />
                            <span className="font-semibold text-sm" style={{ color: textColor }}>{machine.name}</span>
                        </div>
                    </div>

                    <form onSubmit={handleStartSubmit}>
                        <div className="px-5 pb-5 flex flex-col gap-4">
                            <ProductPicker
                                label="Mahsulot tanlang"
                                search={startProductSearch}
                                onSearchChange={(v) => { setStartProductSearch(v); setStartProductQuery(v.trim()); }}
                                onSearchClear={() => { setStartProductSearch(''); setStartProductQuery(''); }}
                                products={startProducts}
                                loading={startProductsLoading}
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
                                loading={starting}
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
function Modal({ children, onBackdropClick, isDark, cardBorder }) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) onBackdropClick(); }}
        >
            <div className="w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden"
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
function ProductPicker({
    label, search, onSearchChange, onSearchClear,
    products, loading, selectedId, onSelect, error,
    isDark, cardBorder, textColor, subtitleColor, accentColor,
}) {
    return (
        <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: subtitleColor }}>
                {label} <span style={{ color: '#EF4444' }}>*</span>
            </label>

            {/* Search input */}
            <div className="relative mb-2">
                <LuSearch size={15} style={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    color: subtitleColor, pointerEvents: 'none',
                }} />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Mahsulot nomini kiriting..."
                    style={{
                        width: '100%',
                        paddingLeft: 36, paddingRight: search ? 36 : 12,
                        paddingTop: 9, paddingBottom: 9,
                        borderRadius: 10,
                        border: `1px solid ${cardBorder}`,
                        background: isDark ? BRAND_COLORS.darkInputBg : BRAND_COLORS.lightInputBg,
                        color: textColor, fontSize: 13, outline: 'none',
                    }}
                />
                {search && (
                    <button type="button" onClick={onSearchClear}
                        style={{
                            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            color: subtitleColor, display: 'flex', alignItems: 'center',
                        }}
                        aria-label="Tozalash">
                        <LuX size={14} />
                    </button>
                )}
            </div>

            {/* List */}
            <div className="overflow-y-auto flex flex-col gap-1"
                style={{
                    maxHeight: 200,
                    border: `1px solid ${cardBorder}`,
                    borderRadius: 12, padding: 6,
                    background: isDark ? 'rgba(255,255,255,0.02)' : '#FAFAFA',
                }}>
                {loading ? (
                    <div className="py-6 text-center text-sm" style={{ color: subtitleColor }}>Yuklanmoqda...</div>
                ) : products.length === 0 ? (
                    <div className="py-6 text-center text-sm" style={{ color: subtitleColor }}>Mahsulot topilmadi</div>
                ) : (
                    products.map((product) => {
                        const selected = selectedId === product.id;
                        return (
                            <button key={product.id} type="button"
                                onClick={() => onSelect(product.id)}
                                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all"
                                style={{
                                    background: selected ? (isDark ? 'rgba(250,204,21,0.15)' : '#FEF3C7') : 'transparent',
                                    border: selected
                                        ? `1px solid ${isDark ? 'rgba(250,204,21,0.4)' : '#FDE68A'}`
                                        : '1px solid transparent',
                                    cursor: 'pointer',
                                }}>
                                <div className="flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0"
                                    style={{ background: selected ? (isDark ? 'rgba(250,204,21,0.2)' : '#FDE68A') : (isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9') }}>
                                    <LuPackage size={13} style={{ color: selected ? accentColor : subtitleColor }} />
                                </div>
                                <span className="text-sm font-medium flex-1 truncate"
                                    style={{ color: selected ? accentColor : textColor }}>
                                    {product.name}
                                </span>
                                {selected && <span className="text-xs font-bold" style={{ color: accentColor }}>✓</span>}
                            </button>
                        );
                    })
                )}
            </div>

            {error && <p className="text-xs mt-1.5" style={{ color: '#EF4444' }}>{error}</p>}
        </div>
    );
}

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
