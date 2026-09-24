// Components/Stanokchi/Worker/WorkerMachineDetail.jsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    LuCog, LuArrowLeft, LuActivity, LuClock, LuHistory,
    LuChevronLeft, LuChevronRight, LuPackage, LuCirclePlus, LuHash,
} from 'react-icons/lu';
import {
    useGetMachineByIdQuery,
} from '../../../store/services/machine.api';
import {
    useCreateStockTransactionMutation,
} from '../../../store/services/productStock.api';
import { useGetMachineOutputsQuery } from '../../../store/services/machineOutput.api';
import { useAppTheme } from '../../../theme/tokens';

const HISTORY_PAGE_SIZE = 10;

const formatDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('uz-UZ', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
};

const calcDuration = (startedAt) => {
    if (!startedAt) return null;
    const diff = Date.now() - new Date(startedAt).getTime();
    if (diff < 0) return null;
    const totalMin = Math.floor(diff / 60000);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return h > 0 ? `${h}s ${m}d` : `${m}d`;
};

export default function WorkerMachineDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isDark, pageBg, cardBg, cardBorder, textColor, subtitleColor, accentColor } = useAppTheme();

    const { data: machine, isLoading: machineLoading } =
        useGetMachineByIdQuery(id, { skip: !id });

    const [historyPage, setHistoryPage] = useState(0);
    const { data: historyResult, isLoading: historyLoading, refetch: refetchHistory } =
        useGetMachineOutputsQuery(
            { machineId: id, page: historyPage, size: HISTORY_PAGE_SIZE },
            { skip: !id }
        );
    const historyItems      = historyResult?.items ?? [];
    const historyTotalPages = historyResult?.pagination?.totalPages || 0;

    const [createStockTransaction, { isLoading: producing }] = useCreateStockTransactionMutation();

    const [toast, setToast] = useState(null);
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    const isWorking = machine?.isWorking && machine?.currentRun;

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

    /* ── Loading ── */
    if (machineLoading) {
        return (
            <div style={{ background: pageBg, minHeight: '100%' }}>
                <Skeleton isDark={isDark} cardBg={cardBg} cardBorder={cardBorder} />
            </div>
        );
    }

    if (!machine) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-5"
                style={{ color: subtitleColor }}>
                <LuCog size={60} style={{ opacity: 0.3 }} />
                <p className="text-2xl font-bold">Stanok topilmadi</p>
                <button
                    onClick={() => navigate('/stanokchi')}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl text-lg font-bold"
                    style={{ background: accentColor, color: '#0F172A', border: 'none', cursor: 'pointer' }}
                >
                    <LuArrowLeft size={20} /> Orqaga
                </button>
            </div>
        );
    }

    return (
        <div style={{ background: pageBg, color: textColor, minHeight: '100%' }}>

            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', top: 90, right: 24, zIndex: 9999,
                    padding: '14px 22px', borderRadius: 14, fontWeight: 700, fontSize: 16,
                    background: toast.type === 'error'
                        ? (isDark ? '#7F1D1D' : '#FEE2E2')
                        : (isDark ? '#14532D' : '#DCFCE7'),
                    color: toast.type === 'error'
                        ? (isDark ? '#FCA5A5' : '#991B1B')
                        : (isDark ? '#86EFAC' : '#166534'),
                    boxShadow: '0 8px 28px rgba(0,0,0,0.18)',
                }}>
                    {toast.message}
                </div>
            )}

            {/* ── Back + title ── */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate('/stanokchi')}
                    className="flex items-center justify-center w-12 h-12 rounded-2xl border transition-all hover:scale-105"
                    style={{ background: cardBg, borderColor: cardBorder, color: textColor, cursor: 'pointer' }}
                    aria-label="Orqaga"
                >
                    <LuArrowLeft size={22} />
                </button>
                <div>
                    <h1 className="text-3xl font-extrabold leading-tight" style={{ color: textColor }}>
                        {machine.name}
                    </h1>
                    {machine.summary && (
                        <p className="text-lg mt-0.5" style={{ color: subtitleColor }}>{machine.summary}</p>
                    )}
                </div>
            </div>

            {/* ── Status card ── */}
            <div
                className="rounded-3xl border p-6 mb-6"
                style={{
                    background: cardBg,
                    borderColor: isWorking
                        ? (isDark ? 'rgba(34,197,94,0.4)' : '#86EFAC')
                        : cardBorder,
                    boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 18px rgba(15,23,42,0.07)',
                }}
            >
                {/* Status row */}
                <div className="flex items-center gap-4 mb-5">
                    <div
                        className="flex items-center justify-center w-16 h-16 rounded-2xl"
                        style={{ background: isDark ? 'rgba(250,204,21,0.14)' : '#FEF3C7' }}
                    >
                        <LuCog size={32} style={{ color: accentColor }} />
                    </div>
                    <div>
                        <p className="text-base font-semibold mb-1" style={{ color: subtitleColor }}>Holati</p>
                        <span
                            className="inline-flex items-center gap-2 text-lg font-extrabold px-4 py-1.5 rounded-full"
                            style={isWorking
                                ? { background: isDark ? 'rgba(34,197,94,0.14)' : '#DCFCE7', color: isDark ? '#86EFAC' : '#166534' }
                                : { background: isDark ? 'rgba(148,163,184,0.15)' : '#F1F5F9', color: subtitleColor }}
                        >
                            {isWorking && (
                                <span style={{
                                    width: 10, height: 10, borderRadius: '50%', background: '#22C55E',
                                    display: 'inline-block', animation: 'stanokPulse 1.5s infinite',
                                }} />
                            )}
                            {isWorking ? 'Ishlayapti' : "Bo'sh"}
                        </span>
                    </div>
                </div>

                {/* Current run details */}
                {isWorking && (
                    <div
                        className="rounded-2xl p-5 flex flex-col gap-3 mb-5"
                        style={{
                            background: isDark ? 'rgba(34,197,94,0.07)' : '#F0FDF4',
                            border: `1px solid ${isDark ? 'rgba(34,197,94,0.2)' : '#BBF7D0'}`,
                        }}
                    >
                        <div className="flex items-center gap-2">
                            <LuActivity size={18} style={{ color: '#22C55E' }} />
                            <span className="text-base font-semibold" style={{ color: isDark ? '#86EFAC' : '#166634' }}>
                                Joriy mahsulot
                            </span>
                        </div>
                        <p className="text-2xl font-extrabold" style={{ color: textColor }}>
                            {machine.currentRun.productName}
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2">
                                <LuClock size={16} style={{ color: subtitleColor }} />
                                <span className="text-base" style={{ color: subtitleColor }}>
                                    Boshlandi: {formatDate(machine.currentRun.startedAt)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <LuClock size={16} style={{ color: '#22C55E' }} />
                                <span className="text-base font-semibold" style={{ color: isDark ? '#86EFAC' : '#166534' }}>
                                    Davomiylik: {calcDuration(machine.currentRun.startedAt)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── QAYD ETISH — faqat stanok ishlaganda, worker uchun yagona action ── */}
                {isWorking ? (
                    <button
                        onClick={handleProduceOne}
                        disabled={producing}
                        className="flex items-center justify-center gap-3 w-full py-5 rounded-2xl font-extrabold text-xl transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                            background: producing
                                ? (isDark ? 'rgba(250,204,21,0.18)' : '#FEF9C3')
                                : 'linear-gradient(135deg,#FACC15,#EAB308)',
                            color: '#0F172A',
                            border: 'none',
                            cursor: producing ? 'not-allowed' : 'pointer',
                            boxShadow: producing ? 'none' : '0 6px 24px rgba(250,204,21,0.35)',
                        }}
                    >
                        <LuCirclePlus size={26} />
                        {producing ? 'Saqlanmoqda...' : '+ 1 dona qayd etish'}
                    </button>
                ) : (
                    <div
                        className="flex items-center justify-center py-5 rounded-2xl text-xl font-bold"
                        style={{
                            background: isDark ? 'rgba(148,163,184,0.08)' : '#F8FAFC',
                            border: `2px dashed ${cardBorder}`,
                            color: subtitleColor,
                        }}
                    >
                        Stanok hozir ishlamayapti
                    </div>
                )}
            </div>

            {/* ── Ishlab chiqarish tarixi ── */}
            <div
                className="rounded-3xl border overflow-hidden"
                style={{
                    background: cardBg,
                    borderColor: cardBorder,
                    boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 18px rgba(15,23,42,0.07)',
                }}
            >
                {/* Header */}
                <div
                    className="flex items-center gap-3 px-6 py-5 border-b"
                    style={{ borderColor: cardBorder }}
                >
                    <LuHistory size={22} style={{ color: accentColor }} />
                    <h2 className="font-extrabold text-xl" style={{ color: textColor }}>
                        Ishlab chiqarish tarixi
                    </h2>
                    {historyResult?.pagination && (
                        <span
                            className="text-sm font-bold px-3 py-1 rounded-full"
                            style={{ background: isDark ? 'rgba(250,204,21,0.12)' : '#FEF3C7', color: accentColor }}
                        >
                            {historyResult.pagination.totalElements} ta
                        </span>
                    )}
                </div>

                {/* Table */}
                {historyLoading ? (
                    <div className="p-6 flex flex-col gap-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} style={{ height: 20, borderRadius: 6, background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)' }} />
                        ))}
                    </div>
                ) : historyItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <LuHistory size={44} style={{ color: subtitleColor, opacity: 0.3 }} />
                        <p className="text-lg font-semibold" style={{ color: subtitleColor }}>
                            Hali ishlab chiqarish tarixi yo&apos;q
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-base border-collapse">
                                <thead>
                                    <tr style={{
                                        background: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
                                        borderBottom: `1px solid ${cardBorder}`,
                                    }}>
                                        {['№', 'Mahsulot', 'Miqdor (dona)', 'Vaqt'].map((h) => (
                                            <th key={h} className="px-5 py-4 text-left font-bold"
                                                style={{ color: subtitleColor, whiteSpace: 'nowrap' }}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {historyItems.map((item, idx) => (
                                        <tr key={item.id} style={{ borderBottom: `1px solid ${cardBorder}` }}>
                                            <td className="px-5 py-4 font-semibold" style={{ color: subtitleColor }}>
                                                {historyPage * HISTORY_PAGE_SIZE + idx + 1}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <LuPackage size={16} style={{ color: accentColor, flexShrink: 0 }} />
                                                    <span className="font-semibold" style={{ color: textColor }}>
                                                        {item.productName}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="inline-flex items-center gap-1.5 font-extrabold text-lg"
                                                    style={{ color: isDark ? '#86EFAC' : '#166634' }}>
                                                    <LuHash size={15} />
                                                    {item.quantity}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap" style={{ color: subtitleColor }}>
                                                {formatDate(item.producedAt)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {historyTotalPages > 1 && (
                            <div className="flex items-center justify-center gap-4 py-5 border-t"
                                style={{ borderColor: cardBorder }}>
                                <button
                                    disabled={historyPage === 0}
                                    onClick={() => setHistoryPage((p) => p - 1)}
                                    className="flex items-center justify-center w-11 h-11 rounded-xl border transition-all disabled:opacity-40"
                                    style={{ background: cardBg, borderColor: cardBorder, color: textColor, cursor: historyPage === 0 ? 'not-allowed' : 'pointer' }}
                                >
                                    <LuChevronLeft size={20} />
                                </button>
                                <span className="text-base font-bold" style={{ color: subtitleColor }}>
                                    {historyPage + 1} / {historyTotalPages}
                                </span>
                                <button
                                    disabled={historyPage >= historyTotalPages - 1}
                                    onClick={() => setHistoryPage((p) => p + 1)}
                                    className="flex items-center justify-center w-11 h-11 rounded-xl border transition-all disabled:opacity-40"
                                    style={{ background: cardBg, borderColor: cardBorder, color: textColor, cursor: historyPage >= historyTotalPages - 1 ? 'not-allowed' : 'pointer' }}
                                >
                                    <LuChevronRight size={20} />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

/* ── Skeleton ── */
function Skeleton({ isDark, cardBg, cardBorder }) {
    const sh = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
    return (
        <div className="flex flex-col gap-6 p-4">
            <div className="flex items-center gap-4">
                <div style={{ width: 48, height: 48, borderRadius: 16, background: sh }} />
                <div style={{ flex: 1, height: 28, borderRadius: 8, background: sh }} />
            </div>
            <div style={{ height: 180, borderRadius: 24, background: sh }} />
            <div style={{ height: 280, borderRadius: 24, background: sh }} />
        </div>
    );
}
