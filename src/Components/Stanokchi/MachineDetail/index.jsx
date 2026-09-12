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
} from 'react-icons/lu';
import {
    useGetMachineByIdQuery,
    useStartMachineProductionMutation,
    useStopMachineProductionMutation,
    useGetMachineRunsQuery,
} from '../../../store/services/machine.api';
import { useGetProductsQuery } from '../../../store/services/product.api';
import { useAppTheme, BRAND_COLORS } from '../../../theme/tokens';

const RUNS_PAGE_SIZE = 10;

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

export default function StanokchiMachineDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isDark, pageBg, cardBg, cardBorder, textColor, subtitleColor, accentColor } = useAppTheme();

    // Stanok ma'lumotlari
    const { data: machine, isLoading: machineLoading, refetch: refetchMachine } =
        useGetMachineByIdQuery(id, { skip: !id, pollingInterval: 15000 });

    // Ishlab chiqarish tarixi
    const [runsPage, setRunsPage] = useState(0);
    const { data: runsResult, isLoading: runsLoading, refetch: refetchRuns } =
        useGetMachineRunsQuery(
            { id, page: runsPage, size: RUNS_PAGE_SIZE },
            { skip: !id }
        );
    const runs = runsResult?.items || [];
    const runsPagination = runsResult?.pagination;
    const runsTotalPages = runsPagination?.totalPages || 0;

    // Start mutation
    const [startProduction, { isLoading: starting }] = useStartMachineProductionMutation();
    const [stopProduction, { isLoading: stopping }] = useStopMachineProductionMutation();

    // Mahsulotlar (start modal uchun)
    const [showStartModal, setShowStartModal] = useState(false);
    const [productSearch, setProductSearch] = useState('');
    const [productQuery, setProductQuery] = useState('');
    const [selectedProductId, setSelectedProductId] = useState('');
    const [startError, setStartError] = useState('');

    const { data: productsResult, isLoading: productsLoading } = useGetProductsQuery(
        { name: productQuery || undefined, page: 0, size: 30 },
        { skip: !showStartModal }
    );
    const products = productsResult?.items || [];

    // Toast state
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    // Stop handler
    const handleStop = async () => {
        if (stopping) return;
        try {
            await stopProduction(id).unwrap();
            showToast("Ishlab chiqarish to'xtatildi");
            refetchMachine();
            refetchRuns();
        } catch (err) {
            const msg = err?.data?.message || "To'xtatishda xatolik yuz berdi";
            showToast(msg, 'error');
        }
    };

    // Start handler
    const handleStartSubmit = async (e) => {
        e.preventDefault();
        if (!selectedProductId) {
            setStartError('Mahsulot tanlang');
            return;
        }
        try {
            await startProduction({ id, productId: selectedProductId }).unwrap();
            showToast('Ishlab chiqarish boshlandi');
            setShowStartModal(false);
            setSelectedProductId('');
            setProductSearch('');
            setProductQuery('');
            setStartError('');
            refetchMachine();
            refetchRuns();
        } catch (err) {
            const msg = err?.data?.message || 'Boshlashda xatolik yuz berdi';
            showToast(msg, 'error');
        }
    };

    const openStartModal = () => {
        setShowStartModal(true);
        setSelectedProductId('');
        setProductSearch('');
        setProductQuery('');
        setStartError('');
    };

    const closeStartModal = () => {
        setShowStartModal(false);
        setSelectedProductId('');
        setProductSearch('');
        setProductQuery('');
        setStartError('');
    };

    // ESC bilan modal yopish
    useEffect(() => {
        if (!showStartModal) return;
        const onKey = (e) => { if (e.key === 'Escape') closeStartModal(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [showStartModal]);

    const isWorking = machine?.isWorking && machine?.currentRun;

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
                <button
                    onClick={() => navigate('/stanokchi')}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                    style={{ background: accentColor, color: '#0F172A', border: 'none', cursor: 'pointer' }}
                >
                    <LuArrowLeft size={15} /> Orqaga
                </button>
            </div>
        );
    }

    return (
        <div style={{ background: pageBg, color: textColor, minHeight: '100%' }}>

            {/* Toast */}
            {toast && (
                <div
                    style={{
                        position: 'fixed',
                        top: 90,
                        right: 24,
                        zIndex: 9999,
                        padding: '12px 20px',
                        borderRadius: 12,
                        fontWeight: 600,
                        fontSize: 14,
                        background: toast.type === 'error'
                            ? (isDark ? '#7F1D1D' : '#FEE2E2')
                            : (isDark ? '#14532D' : '#DCFCE7'),
                        color: toast.type === 'error'
                            ? (isDark ? '#FCA5A5' : '#991B1B')
                            : (isDark ? '#86EFAC' : '#166534'),
                        boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                        transition: 'all 0.3s',
                    }}
                >
                    {toast.message}
                </div>
            )}

            {/* Back button + title */}
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={() => navigate('/stanokchi')}
                    className="flex items-center justify-center w-9 h-9 rounded-xl border transition-all hover:scale-105"
                    style={{
                        background: cardBg,
                        borderColor: cardBorder,
                        color: textColor,
                        cursor: 'pointer',
                    }}
                    aria-label="Orqaga"
                >
                    <LuArrowLeft size={17} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold leading-tight" style={{ color: textColor }}>
                        {machine.name}
                    </h1>
                    {machine.summary && (
                        <p className="text-sm mt-0.5" style={{ color: subtitleColor }}>
                            {machine.summary}
                        </p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">

                {/* Stanok holati kartasi */}
                <div
                    className="lg:col-span-1 rounded-2xl border p-5 flex flex-col gap-4"
                    style={{
                        background: cardBg,
                        borderColor: isWorking
                            ? (isDark ? 'rgba(34,197,94,0.35)' : '#86EFAC')
                            : cardBorder,
                        boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.25)' : '0 4px 16px rgba(15,23,42,0.07)',
                    }}
                >
                    {/* Status indicator */}
                    <div className="flex items-center gap-3">
                        <div
                            className="flex items-center justify-center w-12 h-12 rounded-xl"
                            style={{ background: isDark ? 'rgba(250,204,21,0.12)' : '#FEF3C7' }}
                        >
                            <LuCog size={24} style={{ color: accentColor }} />
                        </div>
                        <div>
                            <p className="text-xs font-medium mb-0.5" style={{ color: subtitleColor }}>
                                Holati
                            </p>
                            <span
                                className="inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1 rounded-full"
                                style={
                                    isWorking
                                        ? {
                                              background: isDark ? 'rgba(34,197,94,0.14)' : '#DCFCE7',
                                              color: isDark ? '#86EFAC' : '#166534',
                                          }
                                        : {
                                              background: isDark ? 'rgba(148,163,184,0.15)' : '#F1F5F9',
                                              color: subtitleColor,
                                          }
                                }
                            >
                                {isWorking && (
                                    <span
                                        style={{
                                            width: 7, height: 7, borderRadius: '50%',
                                            background: '#22C55E',
                                            display: 'inline-block',
                                            animation: 'pulse 1.5s infinite',
                                        }}
                                    />
                                )}
                                {isWorking ? 'Ishlayapti' : "Bo'sh"}
                            </span>
                        </div>
                    </div>

                    {/* Joriy seans */}
                    {isWorking && (
                        <div
                            className="rounded-xl p-3 flex flex-col gap-2"
                            style={{
                                background: isDark ? 'rgba(34,197,94,0.07)' : '#F0FDF4',
                                border: `1px solid ${isDark ? 'rgba(34,197,94,0.2)' : '#BBF7D0'}`,
                            }}
                        >
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

                    {/* Start / Stop knopkalar */}
                    <div className="flex flex-col gap-2 mt-auto">
                        {!isWorking ? (
                            <button
                                onClick={openStartModal}
                                disabled={starting}
                                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                                style={{
                                    background: 'linear-gradient(135deg, #22C55E, #16A34A)',
                                    color: '#fff',
                                    border: 'none',
                                    cursor: starting ? 'not-allowed' : 'pointer',
                                }}
                            >
                                <LuPlay size={16} />
                                Ishlab chiqarishni boshlash
                            </button>
                        ) : (
                            <button
                                onClick={handleStop}
                                disabled={stopping}
                                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                                style={{
                                    background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                                    color: '#fff',
                                    border: 'none',
                                    cursor: stopping ? 'not-allowed' : 'pointer',
                                }}
                            >
                                <LuSquare size={16} />
                                {stopping ? "To'xtatilmoqda..." : "Ishlab chiqarishni to'xtatish"}
                            </button>
                        )}
                    </div>
                </div>

                {/* Ishlab chiqarish tarixi */}
                <div
                    className="lg:col-span-2 rounded-2xl border overflow-hidden"
                    style={{
                        background: cardBg,
                        borderColor: cardBorder,
                        boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.25)' : '0 4px 16px rgba(15,23,42,0.07)',
                    }}
                >
                    <div
                        className="flex items-center gap-2 px-5 py-4 border-b"
                        style={{ borderColor: cardBorder }}
                    >
                        <LuHistory size={18} style={{ color: accentColor }} />
                        <h2 className="font-bold text-base" style={{ color: textColor }}>
                            Ishlab chiqarish tarixi
                        </h2>
                        {runsPagination && (
                            <span
                                className="ml-auto text-xs px-2.5 py-0.5 rounded-full font-medium"
                                style={{
                                    background: isDark ? 'rgba(250,204,21,0.12)' : '#FEF3C7',
                                    color: accentColor,
                                }}
                            >
                                {runsPagination.totalElements} ta
                            </span>
                        )}
                    </div>

                    {runsLoading ? (
                        <div className="p-5 flex flex-col gap-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <RunSkeleton key={i} isDark={isDark} />
                            ))}
                        </div>
                    ) : runs.length === 0 ? (
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
                                        <tr
                                            style={{
                                                background: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
                                                borderBottom: `1px solid ${cardBorder}`,
                                            }}
                                        >
                                            {['№', 'Mahsulot', 'Boshlangan', 'Tugatilgan', 'Davomiylik'].map((h) => (
                                                <th
                                                    key={h}
                                                    className="px-4 py-3 text-left font-semibold"
                                                    style={{ color: subtitleColor, whiteSpace: 'nowrap' }}
                                                >
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {runs.map((run, idx) => {
                                            const active = !run.endedAt;
                                            return (
                                                <tr
                                                    key={run.runId}
                                                    style={{
                                                        borderBottom: `1px solid ${cardBorder}`,
                                                        background: active
                                                            ? (isDark ? 'rgba(34,197,94,0.05)' : '#F0FDF4')
                                                            : 'transparent',
                                                    }}
                                                >
                                                    <td className="px-4 py-3" style={{ color: subtitleColor }}>
                                                        {runsPage * RUNS_PAGE_SIZE + idx + 1}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <LuPackage size={14} style={{ color: accentColor, flexShrink: 0 }} />
                                                            <span className="font-medium" style={{ color: textColor }}>
                                                                {run.productName}
                                                            </span>
                                                            {active && (
                                                                <span
                                                                    className="text-xs px-2 py-0.5 rounded-full font-semibold"
                                                                    style={{
                                                                        background: isDark ? 'rgba(34,197,94,0.14)' : '#DCFCE7',
                                                                        color: isDark ? '#86EFAC' : '#166534',
                                                                    }}
                                                                >
                                                                    Aktiv
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: subtitleColor }}>
                                                        {formatDate(run.startedAt)}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: subtitleColor }}>
                                                        {run.endedAt ? formatDate(run.endedAt) : (
                                                            <span style={{ color: '#22C55E', fontWeight: 600 }}>
                                                                Davom etmoqda
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: subtitleColor }}>
                                                        {calcDuration(run.startedAt, run.endedAt) || '—'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Runs pagination */}
                            {runsTotalPages > 1 && (
                                <div
                                    className="flex items-center justify-center gap-3 py-4 border-t"
                                    style={{ borderColor: cardBorder }}
                                >
                                    <button
                                        disabled={runsPage === 0}
                                        onClick={() => setRunsPage((p) => p - 1)}
                                        className="flex items-center justify-center w-8 h-8 rounded-lg border transition-all disabled:opacity-40"
                                        style={{
                                            background: cardBg,
                                            borderColor: cardBorder,
                                            color: textColor,
                                            cursor: runsPage === 0 ? 'not-allowed' : 'pointer',
                                        }}
                                    >
                                        <LuChevronLeft size={15} />
                                    </button>
                                    <span className="text-xs" style={{ color: subtitleColor }}>
                                        {runsPage + 1} / {runsTotalPages}
                                    </span>
                                    <button
                                        disabled={runsPage >= runsTotalPages - 1}
                                        onClick={() => setRunsPage((p) => p + 1)}
                                        className="flex items-center justify-center w-8 h-8 rounded-lg border transition-all disabled:opacity-40"
                                        style={{
                                            background: cardBg,
                                            borderColor: cardBorder,
                                            color: textColor,
                                            cursor: runsPage >= runsTotalPages - 1 ? 'not-allowed' : 'pointer',
                                        }}
                                    >
                                        <LuChevronRight size={15} />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* ── Start Modal ──────────────────────────────────────────── */}
            {showStartModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
                    onClick={(e) => { if (e.target === e.currentTarget) closeStartModal(); }}
                >
                    <div
                        className="w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden"
                        style={{
                            background: isDark ? BRAND_COLORS.darkCardBg : '#fff',
                            borderColor: cardBorder,
                        }}
                    >
                        {/* Modal header */}
                        <div
                            className="flex items-center justify-between px-5 py-4 border-b"
                            style={{ borderColor: cardBorder }}
                        >
                            <div className="flex items-center gap-2">
                                <LuPlay size={18} style={{ color: '#22C55E' }} />
                                <h3 className="font-bold text-base" style={{ color: textColor }}>
                                    Ishlab chiqarishni boshlash
                                </h3>
                            </div>
                            <button
                                onClick={closeStartModal}
                                className="flex items-center justify-center w-8 h-8 rounded-lg transition-all hover:opacity-70"
                                style={{
                                    background: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
                                    color: subtitleColor,
                                    border: 'none',
                                    cursor: 'pointer',
                                }}
                                aria-label="Yopish"
                            >
                                <LuX size={16} />
                            </button>
                        </div>

                        {/* Stanok nomi */}
                        <div className="px-5 pt-4">
                            <p className="text-xs font-medium mb-1" style={{ color: subtitleColor }}>
                                Stanok
                            </p>
                            <div
                                className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-4"
                                style={{
                                    background: isDark ? 'rgba(250,204,21,0.08)' : '#FEF3C7',
                                    border: `1px solid ${isDark ? 'rgba(250,204,21,0.2)' : '#FDE68A'}`,
                                }}
                            >
                                <LuCog size={16} style={{ color: accentColor }} />
                                <span className="font-semibold text-sm" style={{ color: textColor }}>
                                    {machine.name}
                                </span>
                            </div>
                        </div>

                        <form onSubmit={handleStartSubmit}>
                            <div className="px-5 pb-5 flex flex-col gap-4">

                                {/* Mahsulot qidirish */}
                                <div>
                                    <label
                                        className="block text-xs font-semibold mb-2"
                                        style={{ color: subtitleColor }}
                                    >
                                        Mahsulot tanlang <span style={{ color: '#EF4444' }}>*</span>
                                    </label>

                                    {/* Search */}
                                    <div className="relative mb-2">
                                        <LuSearch
                                            size={15}
                                            style={{
                                                position: 'absolute',
                                                left: 12,
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                color: subtitleColor,
                                                pointerEvents: 'none',
                                            }}
                                        />
                                        <input
                                            type="text"
                                            value={productSearch}
                                            onChange={(e) => {
                                                setProductSearch(e.target.value);
                                                setProductQuery(e.target.value.trim());
                                            }}
                                            placeholder="Mahsulot nomini kiriting..."
                                            style={{
                                                width: '100%',
                                                paddingLeft: 36,
                                                paddingRight: productSearch ? 36 : 12,
                                                paddingTop: 9,
                                                paddingBottom: 9,
                                                borderRadius: 10,
                                                border: `1px solid ${cardBorder}`,
                                                background: isDark ? BRAND_COLORS.darkInputBg : BRAND_COLORS.lightInputBg,
                                                color: textColor,
                                                fontSize: 13,
                                                outline: 'none',
                                            }}
                                        />
                                        {productSearch && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setProductSearch('');
                                                    setProductQuery('');
                                                }}
                                                style={{
                                                    position: 'absolute',
                                                    right: 10,
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    background: 'transparent',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    color: subtitleColor,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                }}
                                                aria-label="Tozalash"
                                            >
                                                <LuX size={14} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Products list */}
                                    <div
                                        className="overflow-y-auto flex flex-col gap-1"
                                        style={{
                                            maxHeight: 220,
                                            border: `1px solid ${cardBorder}`,
                                            borderRadius: 12,
                                            padding: 6,
                                            background: isDark ? 'rgba(255,255,255,0.02)' : '#FAFAFA',
                                        }}
                                    >
                                        {productsLoading ? (
                                            <div className="py-8 text-center text-sm" style={{ color: subtitleColor }}>
                                                Yuklanmoqda...
                                            </div>
                                        ) : products.length === 0 ? (
                                            <div className="py-8 text-center text-sm" style={{ color: subtitleColor }}>
                                                Mahsulot topilmadi
                                            </div>
                                        ) : (
                                            products.map((product) => {
                                                const selected = selectedProductId === product.id;
                                                return (
                                                    <button
                                                        key={product.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedProductId(product.id);
                                                            setStartError('');
                                                        }}
                                                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all"
                                                        style={{
                                                            background: selected
                                                                ? (isDark ? 'rgba(250,204,21,0.15)' : '#FEF3C7')
                                                                : 'transparent',
                                                            border: selected
                                                                ? `1px solid ${isDark ? 'rgba(250,204,21,0.4)' : '#FDE68A'}`
                                                                : '1px solid transparent',
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        <div
                                                            className="flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0"
                                                            style={{
                                                                background: selected
                                                                    ? (isDark ? 'rgba(250,204,21,0.2)' : '#FDE68A')
                                                                    : (isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9'),
                                                            }}
                                                        >
                                                            <LuPackage size={13} style={{ color: selected ? accentColor : subtitleColor }} />
                                                        </div>
                                                        <span
                                                            className="text-sm font-medium flex-1 truncate"
                                                            style={{ color: selected ? accentColor : textColor }}
                                                        >
                                                            {product.name}
                                                        </span>
                                                        {selected && (
                                                            <span
                                                                className="text-xs font-bold"
                                                                style={{ color: accentColor }}
                                                            >
                                                                ✓
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })
                                        )}
                                    </div>

                                    {startError && (
                                        <p className="text-xs mt-1.5" style={{ color: '#EF4444' }}>
                                            {startError}
                                        </p>
                                    )}
                                </div>

                                {/* Action buttons */}
                                <div className="flex gap-2 mt-1">
                                    <button
                                        type="button"
                                        onClick={closeStartModal}
                                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all hover:opacity-80"
                                        style={{
                                            background: 'transparent',
                                            borderColor: cardBorder,
                                            color: textColor,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Bekor qilish
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={starting || !selectedProductId}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                                        style={{
                                            background: 'linear-gradient(135deg, #22C55E, #16A34A)',
                                            color: '#fff',
                                            border: 'none',
                                            cursor: starting || !selectedProductId ? 'not-allowed' : 'pointer',
                                        }}
                                    >
                                        <LuPlay size={15} />
                                        {starting ? 'Boshlanmoqda...' : 'Boshlash'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* pulse animation */}
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                }
            `}</style>
        </div>
    );
}

/* ── Skeleton ─────────────────────────────────────────────── */
function SkeletonDetail({ isDark, cardBg, cardBorder }) {
    const shimmer = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    return (
        <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3 mb-2">
                <div style={{ width: 36, height: 36, borderRadius: 12, background: shimmer }} />
                <div style={{ height: 24, width: 200, borderRadius: 8, background: shimmer }} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div
                    className="rounded-2xl border p-5"
                    style={{ background: cardBg, borderColor: cardBorder, height: 260 }}
                >
                    {[80, 120, 40, 40].map((w, i) => (
                        <div key={i} style={{ height: 14, width: `${w}%`, borderRadius: 6, background: shimmer, marginBottom: 12 }} />
                    ))}
                </div>
                <div
                    className="lg:col-span-2 rounded-2xl border"
                    style={{ background: cardBg, borderColor: cardBorder, height: 260 }}
                />
            </div>
        </div>
    );
}

function RunSkeleton({ isDark }) {
    const shimmer = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    return (
        <div className="flex gap-4 py-2">
            {[30, 120, 100, 100, 70].map((w, i) => (
                <div key={i} style={{ height: 12, width: w, borderRadius: 5, background: shimmer, flexShrink: 0 }} />
            ))}
        </div>
    );
}
