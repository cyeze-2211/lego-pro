// Components/Stanokchi/Worker/WorkerMachines.jsx
import { useState } from 'react';
import { LuCog, LuActivity, LuClock, LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import { useGetMachinesQuery } from '../../../store/services/machine.api';
import { useCreateStockTransactionMutation } from '../../../store/services/productStock.api';
import { useAppTheme } from '../../../theme/tokens';

const PAGE_SIZE = 8;

const formatStartedAt = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString('uz-UZ', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
};

export default function WorkerMachines() {
    const [page, setPage] = useState(0);
    const { isDark, pageBg, cardBg, cardBorder, textColor, subtitleColor, accentColor } = useAppTheme();

    const { data: result, isLoading, error, refetch } = useGetMachinesQuery({ page, size: PAGE_SIZE });
    const machines   = result?.items || [];
    const totalPages = result?.pagination?.totalPages || 0;

    /* ── Qayt etish mutation ── */
    const [createStockTransaction, { isLoading: producing }] = useCreateStockTransactionMutation();
    const [producingId, setProducingId] = useState(null);

    /* ── Toast ── */
    const [toast, setToast] = useState(null);
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    const handleCardClick = async (machine) => {
        const isWorking = !!machine.currentRun && machine.status !== 'IDLE';
        if (!isWorking || producing) return;

        setProducingId(machine.id);
        try {
            await createStockTransaction({
                action: 'PRODUCE',
                machineId: machine.id,
                items: [{ productId: machine.currentRun.productId, quantity: 1 }],
            }).unwrap();
            showToast(`✓ 1 dona qayd etildi — ${machine.currentRun.productName}`);
            refetch();
        } catch (err) {
            showToast(err?.data?.message || 'Qayd etishda xatolik', 'error');
        } finally {
            setProducingId(null);
        }
    };

    return (
        <div style={{ background: pageBg, color: textColor, minHeight: '100%' }}>

            {/* Toast */}
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

            {/* Sarlavha */}
            <div className="mb-8">
                <h1 className="text-4xl font-extrabold mb-2 leading-tight" style={{ color: textColor }}>
                    Stanoklar
                </h1>
                <p className="text-lg" style={{ color: subtitleColor }}>
                    Qayd etish uchun ishlayotgan stanokning ustiga bosing
                </p>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <SkeletonCard key={i} isDark={isDark} cardBg={cardBg} cardBorder={cardBorder} />
                    ))}
                </div>
            )}

            {/* Error */}
            {error && !isLoading && (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <LuCog size={52} style={{ color: subtitleColor, opacity: 0.35 }} />
                    <p className="text-xl font-semibold" style={{ color: subtitleColor }}>
                        Ma&apos;lumotlarni yuklashda xatolik
                    </p>
                </div>
            )}

            {/* Bo'sh */}
            {!isLoading && !error && machines.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <LuCog size={60} style={{ color: subtitleColor, opacity: 0.3 }} />
                    <p className="text-xl font-semibold" style={{ color: subtitleColor }}>
                        Hozircha stanoklar yo&apos;q
                    </p>
                </div>
            )}

            {/* Cards */}
            {!isLoading && !error && machines.length > 0 && (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {machines.map((machine) => (
                            <WorkerMachineCard
                                key={machine.id}
                                machine={machine}
                                isDark={isDark}
                                cardBg={cardBg}
                                cardBorder={cardBorder}
                                textColor={textColor}
                                subtitleColor={subtitleColor}
                                accentColor={accentColor}
                                onClick={() => handleCardClick(machine)}
                                isProducing={producingId === machine.id}
                            />
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-4 mt-10">
                            <button
                                disabled={page === 0}
                                onClick={() => setPage((p) => p - 1)}
                                className="flex items-center justify-center w-12 h-12 rounded-xl border text-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                style={{ background: cardBg, borderColor: cardBorder, color: textColor }}
                            >
                                <LuChevronLeft size={22} />
                            </button>
                            <span className="text-lg font-bold" style={{ color: subtitleColor }}>
                                {page + 1} / {totalPages}
                            </span>
                            <button
                                disabled={page >= totalPages - 1}
                                onClick={() => setPage((p) => p + 1)}
                                className="flex items-center justify-center w-12 h-12 rounded-xl border text-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                style={{ background: cardBg, borderColor: cardBorder, color: textColor }}
                            >
                                <LuChevronRight size={22} />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

/* ── WorkerMachineCard — katta, oddiy ── */
function WorkerMachineCard({ machine, isDark, cardBg, cardBorder, textColor, subtitleColor, accentColor, onClick, isProducing }) {
    const isWorking = !!machine.currentRun && machine.status !== 'IDLE';

    return (
        <button
            onClick={onClick}
            disabled={isProducing}
            className="relative text-left w-full rounded-3xl border transition-all duration-200 overflow-hidden active:scale-[0.98]"
            style={{
                background: cardBg,
                borderColor: isWorking
                    ? (isDark ? 'rgba(34,197,94,0.45)' : '#86EFAC')
                    : cardBorder,
                boxShadow: isWorking
                    ? (isDark ? '0 6px 28px rgba(34,197,94,0.12)' : '0 6px 24px rgba(34,197,94,0.1)')
                    : (isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 18px rgba(15,23,42,0.08)'),
                cursor: isProducing ? 'wait' : isWorking ? 'pointer' : 'default',
                opacity: isProducing ? 0.6 : 1,
            }}
        >
            {/* Top accent strip */}
            <div style={{
                height: 6,
                background: isWorking
                    ? 'linear-gradient(90deg,#22C55E,#16A34A)'
                    : (isDark ? 'rgba(255,255,255,0.05)' : '#E2E8F0'),
            }} />

            <div className="p-6">
                {/* Loading indicator (card ustida) */}
                {isProducing && (
                    <div className="absolute inset-0 flex items-center justify-center z-10"
                        style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}>
                        <div className="flex flex-col items-center gap-2">
                            <div style={{
                                width: 32, height: 32, borderRadius: '50%',
                                border: '3px solid rgba(255,255,255,0.3)',
                                borderTopColor: '#22C55E',
                                animation: 'spin 0.8s linear infinite',
                            }} />
                            <span className="text-xs font-semibold" style={{ color: '#fff' }}>
                                Saqlanmoqda...
                            </span>
                        </div>
                    </div>
                )}

                {/* Icon + badge row */}
                <div className="flex items-start justify-between mb-4">
                    <div
                        className="flex items-center justify-center w-14 h-14 rounded-2xl"
                        style={{ background: isDark ? 'rgba(250,204,21,0.14)' : '#FEF3C7' }}
                    >
                        <LuCog size={28} style={{ color: accentColor }} />
                    </div>

                    <span
                        className="text-base font-bold px-4 py-1.5 rounded-full"
                        style={isWorking
                            ? {
                                background: isDark ? 'rgba(34,197,94,0.14)' : '#DCFCE7',
                                color: isDark ? '#86EFAC' : '#166534',
                              }
                            : {
                                background: isDark ? 'rgba(148,163,184,0.15)' : '#F1F5F9',
                                color: subtitleColor,
                              }}
                    >
                        {isWorking ? '🟢 Ishlayapti' : '⚪ Bo\'sh'}
                    </span>
                </div>

                {/* Name */}
                <h3 className="font-extrabold text-2xl mb-1 leading-tight" style={{ color: textColor }}>
                    {machine.name}
                </h3>

                {machine.summary && (
                    <p className="text-base mb-4 leading-relaxed line-clamp-2" style={{ color: subtitleColor }}>
                        {machine.summary}
                    </p>
                )}

                {/* Current run info */}
                {isWorking ? (
                    <div
                        className="mt-4 pt-4 flex flex-col gap-2"
                        style={{ borderTop: `1px solid ${isDark ? 'rgba(34,197,94,0.2)' : '#BBF7D0'}` }}
                    >
                        <div className="flex items-center gap-2">
                            <LuActivity size={16} style={{ color: '#22C55E', flexShrink: 0 }} />
                            <span className="text-base font-semibold" style={{ color: isDark ? '#86EFAC' : '#166534' }}>
                                {machine.currentRun.productName}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <LuClock size={15} style={{ color: subtitleColor, flexShrink: 0 }} />
                            <span className="text-sm" style={{ color: subtitleColor }}>
                                {formatStartedAt(machine.currentRun.startedAt)}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div
                        className="mt-4 pt-4"
                        style={{ borderTop: `1px solid ${cardBorder}` }}
                    >
                        <span className="text-base" style={{ color: subtitleColor }}>Hozir ishlamayapti</span>
                    </div>
                )}
            </div>
        </button>
    );
}

/* ── Skeleton ── */
function SkeletonCard({ isDark, cardBg, cardBorder }) {
    const sh = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
    return (
        <div className="rounded-3xl border overflow-hidden" style={{ background: cardBg, borderColor: cardBorder }}>
            <div style={{ height: 6, background: sh }} />
            <div className="p-6 flex flex-col gap-4">
                <div className="flex justify-between">
                    <div style={{ width: 56, height: 56, borderRadius: 16, background: sh }} />
                    <div style={{ width: 100, height: 32, borderRadius: 999, background: sh }} />
                </div>
                <div style={{ height: 22, borderRadius: 8, background: sh, width: '60%' }} />
                <div style={{ height: 16, borderRadius: 6, background: sh, width: '85%' }} />
                <div style={{ height: 16, borderRadius: 6, background: sh, width: '50%' }} />
            </div>
        </div>
    );
}

/* ── Spin animation ── */
const spinStyle = `
@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
`;

// Inject style
if (typeof document !== 'undefined') {
    const styleId = 'worker-machines-animation';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = spinStyle;
        document.head.appendChild(style);
    }
}
