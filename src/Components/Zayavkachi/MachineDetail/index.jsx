import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    LuCog, LuArrowLeft, LuActivity, LuClock, LuHistory,
    LuChevronLeft, LuChevronRight, LuPackage, LuHash,
    LuCircleAlert, LuWarehouse, LuBoxes, LuCircleCheck,
    LuCircleX, LuTriangleAlert,
} from 'react-icons/lu';
import { useGetMachineByIdQuery, useGetMachineRunsQuery } from '../../../store/services/machine.api';
import { useGetProductStocksQuery } from '../../../store/services/productStock.api';
import { useGetWarehousesQuery } from '../../../store/services/warehouse.api';
import { useAppTheme } from '../../../theme/tokens';
import Loading from '../../Other/UI/Loadings/Loading';

const RUNS_PAGE_SIZE = 10;

const formatDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('uz-UZ', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
};

const calcDuration = (startedAt, endedAt) => {
    if (!startedAt) return null;
    const start = new Date(startedAt);
    const end   = endedAt ? new Date(endedAt) : new Date();
    const diff  = end - start;
    if (diff < 0) return null;
    const totalMin = Math.floor(diff / 60000);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return h > 0 ? `${h}s ${m}d` : `${m}d`;
};

export default function ZayavkachiMachineDetail() {
    const { id }   = useParams();
    const navigate = useNavigate();
    const { isDark } = useAppTheme();

    const [runsPage, setRunsPage] = useState(0);

    /* ── Data ─────────────────────────────────────────────────────────── */
    const { data: machine, isLoading, isError } = useGetMachineByIdQuery(id, {
        skip: !id,
        pollingInterval: 15000,
    });

    const { data: runsResult, isFetching: runsFetching } = useGetMachineRunsQuery(
        { id, page: runsPage, size: RUNS_PAGE_SIZE },
        { skip: !id }
    );
    const runs        = runsResult?.items      ?? [];
    const runsPagination = runsResult?.pagination ?? null;
    const runsTotalPages = runsPagination?.totalPages ?? 0;

    /* ── Omborlar & stock (joriy run mahsuloti bo'yicha) ─────────────── */
    const { data: warehouses = [] } = useGetWarehousesQuery('PRODUCT');

    const currentProductId = machine?.currentRun?.productId ?? null;

    const { data: stockData, isFetching: stockFetching } = useGetProductStocksQuery(
        { productId: currentProductId, page: 0, size: 50 },
        { skip: !currentProductId }
    );
    const stockItems = stockData?.items ?? [];

    /* ── theme ─────────────────────────────────────────────────────────── */
    const panel    = isDark ? 'border-white/10 bg-[#141C2B]' : 'border-[#e2e8f0] bg-white';
    const muted    = isDark ? 'text-[#94a3b8]' : 'text-[#64748b]';
    const head     = isDark ? 'text-white' : 'text-[#0f172a]';
    const divider  = isDark ? 'divide-[#334155]/50' : 'divide-[#f1f5f9]';
    const line     = isDark ? 'border-[#334155]/60' : 'border-[#f1f5f9]';
    const rowBg    = isDark ? 'hover:bg-[#1e293b]/60' : 'hover:bg-amber-50/50';
    const ghostBtn = isDark
        ? 'border-[#334155] text-[#94a3b8] hover:bg-[#1e293b]'
        : 'border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9]';

    const isWorking = machine?.isWorking && machine?.currentRun;

    /* ── States ────────────────────────────────────────────────────────── */
    if (isLoading) {
        return <div className="flex min-h-[60vh] items-center justify-center"><Loading /></div>;
    }

    if (isError || !machine) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-[#f43f5e]">
                <LuCircleAlert size={34} />
                <p className="text-lg">Stanok ma&apos;lumotini yuklashda xatolik</p>
                <button type="button" onClick={() => navigate('/zayavkachi/machines')}
                    className="flex h-12 items-center gap-2 rounded-xl border border-[#f43f5e]/30 px-5 text-sm font-bold">
                    <LuArrowLeft size={16} /> Stanoklarga qaytish
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
                            <LuCog size={20} />
                        </span>
                        <div>
                            <h1 className={`text-xl font-bold tracking-tight leading-tight ${head}`}>
                                {machine.name}
                            </h1>
                            {machine.summary && (
                                <p className={`text-sm mt-0.5 ${muted}`}>{machine.summary}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Status badge */}
                        <span className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
                            isWorking
                                ? isDark ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-green-300 bg-green-50 text-green-700'
                                : isDark ? 'border-[#334155] bg-[#1e293b] text-[#94a3b8]'       : 'border-[#e2e8f0] bg-[#f1f5f9] text-[#64748b]'
                        }`}>
                            {isWorking ? 'Ishlayapti' : "Bo'sh"}
                        </span>
                        <button type="button" onClick={() => navigate('/zayavkachi/machines')}
                            className={`flex h-11 items-center gap-2 rounded-xl border px-5 text-sm font-bold transition-colors ${ghostBtn}`}>
                            <LuArrowLeft size={16} /> Stanoklar
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

                {/* ── Stanok holati (left col) ───────────────────────────── */}
                <div className={`rounded-2xl border shadow-md ${panel}`}>
                    <div className={`flex items-center gap-2 border-b px-5 py-3.5 ${line}`}>
                        <LuCog size={16} className="text-amber-500" />
                        <h2 className={`text-sm font-bold ${head}`}>Holat</h2>
                    </div>

                    <div className="px-5 py-4 flex flex-col gap-4">
                        {/* Working indicator */}
                        <div className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
                            isWorking
                                ? isDark ? 'border border-green-500/20 bg-green-500/8' : 'border border-green-200 bg-green-50'
                                : isDark ? 'border border-[#334155] bg-[#1e293b]/40'    : 'border border-[#e2e8f0] bg-[#f8fafc]'
                        }`}>
                            <span style={{
                                display: 'inline-block', width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                                background: isWorking ? '#22C55E' : (isDark ? '#475569' : '#cbd5e1'),
                                animation: isWorking ? 'machinePulse 1.5s infinite' : 'none',
                            }} />
                            <span className={`font-bold text-sm ${isWorking ? (isDark ? 'text-green-400' : 'text-green-700') : muted}`}>
                                {isWorking ? 'Ishlayapti' : "Bo'sh"}
                            </span>
                        </div>

                        {/* Current run details */}
                        {isWorking && (
                            <div className="flex flex-col gap-3">
                                <div>
                                    <p className={`mb-1 text-xs font-semibold ${muted}`}>
                                        <LuActivity size={11} className="inline mr-1" />
                                        Joriy mahsulot
                                    </p>
                                    <p className={`font-bold text-sm ${head}`}>
                                        {machine.currentRun.productName}
                                    </p>
                                </div>
                                <div>
                                    <p className={`mb-1 text-xs font-semibold ${muted}`}>
                                        <LuClock size={11} className="inline mr-1" />
                                        Boshlangan vaqt
                                    </p>
                                    <p className={`text-sm font-medium ${head}`}>
                                        {formatDate(machine.currentRun.startedAt)}
                                    </p>
                                </div>
                                <div>
                                    <p className={`mb-1 text-xs font-semibold ${muted}`}>
                                        <LuClock size={11} className="inline mr-1" />
                                        Davomiylik
                                    </p>
                                    <p className={`text-sm font-bold ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                                        {calcDuration(machine.currentRun.startedAt, null)}
                                    </p>
                                </div>
                            </div>
                        )}

                        {!isWorking && (
                            <p className={`text-xs ${muted}`}>Hozirda hech qanday mahsulot ishlab chiqarilmayapti.</p>
                        )}
                    </div>
                </div>

                {/* ── Ombor qoldiqlari (right col, 2 spans) ─────────────── */}
                <div className={`lg:col-span-2 rounded-2xl border shadow-md ${panel}`}>
                    <div className={`flex items-center gap-2 border-b px-5 py-3.5 ${line}`}>
                        <LuBoxes size={16} className="text-amber-500" />
                        <h2 className={`text-sm font-bold ${head}`}>
                            Ombordagi qoldiqlar
                            {currentProductId && (
                                <span className={`ml-2 text-xs font-normal ${muted}`}>
                                    — {machine.currentRun?.productName}
                                </span>
                            )}
                        </h2>
                    </div>

                    {!currentProductId ? (
                        <div className={`flex flex-col items-center gap-2 py-12 ${muted}`}>
                            <LuBoxes size={30} strokeWidth={1.5} />
                            <p className="text-sm">Stanok hozir ishlamayapti — qoldiq yo&apos;q</p>
                        </div>
                    ) : stockFetching ? (
                        <div className={`flex items-center justify-center gap-2 py-10 text-sm ${muted}`}>
                            <svg className="h-4 w-4 animate-spin text-amber-400" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                            Qoldiqlar yuklanmoqda...
                        </div>
                    ) : stockItems.length === 0 ? (
                        <div className={`flex flex-col items-center gap-2 py-12 ${muted}`}>
                            <LuWarehouse size={30} strokeWidth={1.5} />
                            <p className="text-sm">Hech bir omborда qoldiq topilmadi</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className={`text-left text-xs font-semibold uppercase tracking-wide ${muted} ${isDark ? 'bg-[#0f172a]/30' : 'bg-[#f8fafc]/80'}`}>
                                        <th className="px-5 py-3">Ombor</th>
                                        <th className="px-5 py-3 w-40 text-right">Qoldiq (dona)</th>
                                        <th className="px-5 py-3 w-44">Oxirgi yangilanish</th>
                                        <th className="px-5 py-3 w-28 text-center">Holat</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${divider}`}>
                                    {stockItems.map((s) => {
                                        const isEmpty = s.quantity <= 0;
                                        const isLow   = s.quantity > 0 && s.quantity <= 5;
                                        const wh = warehouses.find((w) => w.id === s.warehouseId);

                                        return (
                                            <tr key={`${s.productId}-${s.warehouseId}`}
                                                className={`transition-colors ${rowBg}`}>
                                                <td className="px-5 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <LuWarehouse size={14} className={muted} />
                                                        <span className={`font-medium text-sm ${head}`}>
                                                            {wh?.name ?? s.warehouseName ?? s.warehouseId ?? '—'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3 text-right">
                                                    <span className={`font-bold tabular-nums text-sm ${
                                                        isEmpty ? (isDark ? 'text-red-400' : 'text-red-600')
                                                        : isLow  ? (isDark ? 'text-amber-400' : 'text-amber-600')
                                                        : head
                                                    }`}>
                                                        {s.quantity.toLocaleString('uz-UZ')}
                                                    </span>
                                                </td>
                                                <td className={`px-5 py-3 text-xs ${muted}`}>
                                                    <div className="flex items-center gap-1.5">
                                                        <LuClock size={12} />
                                                        {formatDate(s.lastModifiedAt)}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3 text-center">
                                                    {isEmpty ? (
                                                        <div className="flex items-center justify-center gap-1 text-xs font-bold"
                                                            style={{ color: isDark ? '#f87171' : '#dc2626' }}>
                                                            <LuCircleX size={13} /> Bo&apos;sh
                                                        </div>
                                                    ) : isLow ? (
                                                        <div className="flex items-center justify-center gap-1 text-xs font-bold"
                                                            style={{ color: isDark ? '#fbbf24' : '#d97706' }}>
                                                            <LuTriangleAlert size={13} /> Kam
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-center gap-1 text-xs font-bold"
                                                            style={{ color: isDark ? '#86efac' : '#166534' }}>
                                                            <LuCircleCheck size={13} /> Yetarli
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Ishlab chiqarish tarixi ────────────────────────────────── */}
            <div className={`rounded-2xl border shadow-md ${panel}`}>
                <div className={`flex items-center gap-2 border-b px-5 py-3.5 ${line}`}>
                    <LuHistory size={16} className="text-amber-500" />
                    <h2 className={`text-sm font-bold ${head}`}>Ishlab chiqarish tarixi</h2>
                    {runsPagination && (
                        <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-xs font-bold text-amber-500">
                            {runsPagination.totalElements} ta
                        </span>
                    )}
                </div>

                {runsFetching ? (
                    <div className={`flex items-center justify-center gap-2 py-10 text-sm ${muted}`}>
                        <svg className="h-4 w-4 animate-spin text-amber-400" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Yuklanmoqda...
                    </div>
                ) : runs.length === 0 ? (
                    <div className={`flex flex-col items-center gap-2 py-12 ${muted}`}>
                        <LuHistory size={30} strokeWidth={1.5} />
                        <p className="text-sm">Hali ishlab chiqarish tarixi yo&apos;q</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className={`text-left text-xs font-semibold uppercase tracking-wide ${muted} ${isDark ? 'bg-[#0f172a]/30' : 'bg-[#f8fafc]/80'}`}>
                                        <th className="px-5 py-3 w-12">№</th>
                                        <th className="px-5 py-3">Mahsulot</th>
                                        <th className="px-5 py-3 w-40">Boshlandi</th>
                                        <th className="px-5 py-3 w-40">Tugadi</th>
                                        <th className="px-5 py-3 w-32 text-right">Davomiylik</th>
                                        <th className="px-5 py-3 w-36 text-right">Miqdor (dona)</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${divider}`}>
                                    {runs.map((run, idx) => (
                                        <tr key={run.id} className={`transition-colors ${rowBg}`}>
                                            <td className={`px-5 py-3 text-xs ${muted}`}>
                                                {runsPage * RUNS_PAGE_SIZE + idx + 1}
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-2">
                                                    <LuPackage size={14} className="text-amber-500 shrink-0" />
                                                    <span className={`font-semibold ${head}`}>{run.productName}</span>
                                                </div>
                                            </td>
                                            <td className={`px-5 py-3 text-xs ${muted}`}>{formatDate(run.startedAt)}</td>
                                            <td className={`px-5 py-3 text-xs ${muted}`}>
                                                {run.endedAt ? formatDate(run.endedAt) : (
                                                    <span className={`inline-flex items-center gap-1 text-xs font-bold ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                                                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', display: 'inline-block', animation: 'machinePulse 1.5s infinite' }} />
                                                        Davom etmoqda
                                                    </span>
                                                )}
                                            </td>
                                            <td className={`px-5 py-3 text-right text-xs ${muted}`}>
                                                {calcDuration(run.startedAt, run.endedAt) ?? '—'}
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <span className={`inline-flex items-center gap-1 font-bold text-sm ${head}`}>
                                                    <LuHash size={13} className={muted} />
                                                    {(run.producedQuantity ?? run.quantity ?? 0).toLocaleString('uz-UZ')}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {runsTotalPages > 1 && (
                            <div className={`flex items-center justify-between border-t px-5 py-4 ${line}`}>
                                <span className={`text-xs ${muted}`}>
                                    {runsPage * RUNS_PAGE_SIZE + 1}–{Math.min((runsPage + 1) * RUNS_PAGE_SIZE, runsPagination?.totalElements ?? 0)} / {runsPagination?.totalElements ?? 0}
                                </span>
                                <div className="flex items-center gap-2">
                                    <button disabled={runsPage === 0} onClick={() => setRunsPage((p) => p - 1)}
                                        className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${panel}`}>
                                        <LuChevronLeft size={15} className={head} />
                                    </button>
                                    <span className={`text-xs font-semibold ${muted}`}>
                                        {runsPage + 1} / {runsTotalPages}
                                    </span>
                                    <button disabled={runsPage >= runsTotalPages - 1} onClick={() => setRunsPage((p) => p + 1)}
                                        className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${panel}`}>
                                        <LuChevronRight size={15} className={head} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <style>{`
                @keyframes machinePulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }
            `}</style>
        </div>
    );
}
