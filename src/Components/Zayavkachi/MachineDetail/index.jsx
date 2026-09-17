import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    LuArrowLeft, LuCog, LuCircleAlert, LuActivity, LuPackage,
    LuChevronLeft, LuChevronRight, LuSend, LuUser, LuStickyNote, LuRefreshCw,
} from 'react-icons/lu';
import { useAppTheme } from '../../../theme/tokens';
import { useGetMachineByIdQuery } from '../../../store/services/machine.api';
import { useGetProductionTasksQuery } from '../../../store/services/productionTask.api';
import Loading from '../../Other/UI/Loadings/Loading';
import ProductionTaskForm from '../__components/ProductionTaskForm';
import { TASK_STATUS_LABEL, taskStatusCx } from '../__components/taskStatus';

const PAGE_SIZE = 10;
const STATUSES = ['SENT', 'ACCEPTED'];

// 02:14:37
function formatClock(ms) {
    if (!Number.isFinite(ms) || ms < 0) return '00:00:00';
    const total = Math.floor(ms / 1000);
    const pad = (value) => String(value).padStart(2, '0');
    return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
}

export default function ZayavkachiMachineDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isDark } = useAppTheme();
    const [page, setPage]                 = useState(0);
    const [statusFilter, setStatusFilter] = useState('');
    const [now, setNow]                   = useState(() => Date.now());

    // real-time keyinchalik socket orqali ulanadi — hozircha qo'lda yangilanadi
    const { data: machine, isLoading, isError, refetch: refetchMachine } = useGetMachineByIdQuery(id, { skip: !id });
    const { data: taskData, isFetching: tasksFetching, refetch: refetchTasks } = useGetProductionTasksQuery(
        { machineId: id, status: statusFilter || undefined, page, size: PAGE_SIZE },
        { skip: !id }
    );

    const refreshAll = () => { refetchMachine(); refetchTasks(); };

    const run = machine?.currentRun;
    const isWorking = Boolean(machine?.isWorking && run && !run.endedAt);

    useEffect(() => {
        if (!isWorking) return undefined;
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, [isWorking]);

    /* ── theme ─────────────────────────────────────────────────────── */
    const panel   = isDark ? 'border-white/10 bg-[#141C2B]' : 'border-[#e2e8f0] bg-white';
    const muted   = isDark ? 'text-[#94a3b8]' : 'text-[#64748b]';
    const head    = isDark ? 'text-white' : 'text-[#0f172a]';
    const divider = isDark ? 'divide-[#334155]/50' : 'divide-[#f1f5f9]';
    const line    = isDark ? 'border-[#334155]/60' : 'border-[#f1f5f9]';
    const rowHov  = isDark ? 'hover:bg-[#1e293b]/60' : 'hover:bg-amber-50/50';
    const ghostBtn = isDark
        ? 'border-[#334155] text-[#94a3b8] hover:bg-[#1e293b]'
        : 'border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9]';

    const backToList = () => navigate('/zayavkachi/machines');

    if (isLoading) {
        return <div className="flex min-h-[60vh] items-center justify-center"><Loading /></div>;
    }

    if (isError || !machine) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-[#f43f5e]">
                <LuCircleAlert size={34} />
                <p className="text-lg">Stanokni yuklashda xatolik</p>
                <button type="button" onClick={backToList}
                    className="flex h-12 items-center gap-2 rounded-xl border border-[#f43f5e]/30 px-5 text-sm font-bold">
                    <LuArrowLeft size={16} /> Stanoklar ro&apos;yxatiga qaytish
                </button>
            </div>
        );
    }

    const tasks      = taskData?.items      ?? [];
    const pagination = taskData?.pagination ?? {};
    const elapsed    = run?.startedAt ? now - new Date(run.startedAt).getTime() : 0;

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
                            <h1 className={`text-xl font-bold tracking-tight leading-tight ${head}`}>{machine.name}</h1>
                            <p className={`text-sm mt-0.5 ${muted}`}>{machine.summary || 'Stanokka ishlab chiqarish topshirig‘ini yuboring'}</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-bold ${
                            machine.isWorking
                                ? 'border-[#10b981]/20 bg-[#10b981]/10 text-[#10b981]'
                                : isDark ? 'border-[#334155] bg-[#1e293b] text-[#94a3b8]' : 'border-[#e2e8f0] bg-[#f1f5f9] text-[#64748b]'
                        }`}>
                            <span className={`h-2 w-2 rounded-full ${machine.isWorking ? 'animate-pulse bg-[#10b981]' : 'bg-[#94a3b8]'}`} />
                            {machine.isWorking ? 'Ishlayapti' : 'Bo‘sh'}
                        </span>
                        <button type="button" onClick={refreshAll}
                            className={`flex h-12 items-center gap-2 rounded-xl border px-5 text-sm font-bold transition-colors ${ghostBtn}`}>
                            <LuRefreshCw size={16} className={tasksFetching ? 'animate-spin' : ''} /> Yangilash
                        </button>
                        <button type="button" onClick={backToList}
                            className={`flex h-12 items-center gap-2 rounded-xl border px-5 text-sm font-bold transition-colors ${ghostBtn}`}>
                            <LuArrowLeft size={16} /> Stanoklar
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Hozir nima ishlab chiqarilmoqda ───────────────────────── */}
            <div className={`rounded-2xl border shadow-md ${panel}`}>
                <div className={`flex items-center gap-2.5 border-b px-5 py-3.5 ${line}`}>
                    <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${isWorking ? 'bg-[#10b981]/10 text-[#10b981]' : 'bg-amber-400/10 text-amber-500'}`}>
                        <LuActivity size={16} />
                    </span>
                    <div>
                        <h2 className={`text-sm font-bold ${head}`}>Hozir nima ishlab chiqarilmoqda</h2>
                        <p className={`text-xs ${muted}`}>Yangilash uchun o&apos;ngdagi tugmani bosing</p>
                    </div>
                </div>
                {isWorking ? (
                    <div className="grid grid-cols-1 gap-4 px-5 py-4 sm:grid-cols-3">
                        <div>
                            <p className={`mb-1 flex items-center gap-1.5 text-xs font-semibold ${muted}`}><LuPackage size={12} /> Mahsulot</p>
                            <p className={`text-sm font-bold ${head}`}>{run.productName}</p>
                        </div>
                        <div>
                            <p className={`mb-1 text-xs font-semibold ${muted}`}>Boshlangan</p>
                            <p className={`text-sm font-bold ${head}`}>{new Date(run.startedAt).toLocaleString('uz-UZ')}</p>
                        </div>
                        <div>
                            <p className={`mb-1 text-xs font-semibold ${muted}`}>Sarflangan vaqt</p>
                            <p className="font-mono text-lg font-bold text-[#10b981]">{formatClock(elapsed)}</p>
                        </div>
                    </div>
                ) : (
                    <div className={`flex flex-col items-center gap-2 py-10 ${muted}`}>
                        <LuCog size={32} strokeWidth={1.5} />
                        <p className="text-sm font-semibold">Stanok hozir bo&apos;sh</p>
                        <p className="text-xs">Quyidagi forma orqali topshiriq yuboring</p>
                    </div>
                )}
            </div>

            {/* ── Topshiriq yuborish ────────────────────────────────────── */}
            <ProductionTaskForm machine={machine} onSent={refreshAll} />

            {/* ── Yuborilgan topshiriqlar ───────────────────────────────── */}
            <div className={`rounded-2xl border shadow-md ${panel}`}>
                <div className={`flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3.5 ${line}`}>
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/10 text-amber-500">
                            <LuSend size={16} />
                        </span>
                        <div>
                            <h2 className={`text-sm font-bold ${head}`}>Yuborilgan topshiriqlar</h2>
                            <p className={`text-xs ${muted}`}>Stanokchi qabul qilganda holat o&apos;zgaradi</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        {[{ value: '', label: 'Barchasi' }, ...STATUSES.map((s) => ({ value: s, label: TASK_STATUS_LABEL[s] }))].map((option) => {
                            const active = statusFilter === option.value;
                            return (
                                <button key={option.value || 'all'} type="button"
                                    onClick={() => { setStatusFilter(option.value); setPage(0); }}
                                    className={`h-9 rounded-xl border px-3.5 text-xs font-bold transition-colors ${
                                        active
                                            ? 'border-[#FACC15] bg-[#FACC15] text-[#0F172A]'
                                            : ghostBtn
                                    }`}>
                                    {option.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {tasksFetching && tasks.length === 0 ? (
                    <div className={`flex items-center justify-center gap-2 py-12 text-sm ${muted}`}>
                        <svg className="h-4 w-4 animate-spin text-amber-400" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                        </svg>
                        Yuklanmoqda...
                    </div>
                ) : tasks.length === 0 ? (
                    <div className={`flex flex-col items-center gap-2 py-12 ${muted}`}>
                        <LuSend size={32} strokeWidth={1.5} />
                        <p className="text-sm font-semibold">Topshiriqlar topilmadi</p>
                        <p className="text-xs">Yuqoridagi forma orqali birinchi topshiriqni yuboring</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className={`text-left text-xs font-semibold uppercase tracking-wide ${muted} ${isDark ? 'bg-[#0f172a]/30' : 'bg-[#f8fafc]/80'}`}>
                                    <th className="px-5 py-3 w-14">№</th>
                                    <th className="px-5 py-3">Mahsulot</th>
                                    <th className="px-5 py-3">Izoh</th>
                                    <th className="px-5 py-3 w-40">Holati</th>
                                    <th className="px-5 py-3 w-44">Yuborilgan</th>
                                    <th className="px-5 py-3 w-52">Qabul qilingan</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${divider}`}>
                                {tasks.map((task, idx) => (
                                    <tr key={task.id} className={`transition-colors ${rowHov}`}>
                                        <td className={`px-5 py-3 text-xs ${muted}`}>{page * PAGE_SIZE + idx + 1}</td>
                                        <td className="px-5 py-3">
                                            <span className={`font-semibold ${head}`}>{task.productName}</span>
                                        </td>
                                        <td className={`px-5 py-3 text-xs ${muted}`}>
                                            {task.note
                                                ? <span className="flex items-center gap-1.5"><LuStickyNote size={13} /><span className="block max-w-xs truncate">{task.note}</span></span>
                                                : '—'}
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${taskStatusCx(task.status)}`}>
                                                {TASK_STATUS_LABEL[task.status] ?? task.status}
                                            </span>
                                        </td>
                                        <td className={`px-5 py-3 text-xs ${muted}`}>
                                            {task.createdAt ? new Date(task.createdAt).toLocaleString('uz-UZ') : '—'}
                                        </td>
                                        <td className={`px-5 py-3 text-xs ${muted}`}>
                                            {task.acceptedAt ? (
                                                <span className="flex items-center gap-1.5">
                                                    <LuUser size={13} />
                                                    <span>{task.acceptedBy || '—'} · {new Date(task.acceptedAt).toLocaleString('uz-UZ')}</span>
                                                </span>
                                            ) : 'Kutilmoqda'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {pagination.totalPages > 1 && (
                    <div className={`flex items-center justify-between gap-3 border-t px-5 py-3.5 ${line}`}>
                        <p className={`text-xs ${muted}`}>
                            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, pagination.totalElements)} / {pagination.totalElements}
                        </p>
                        <div className="flex items-center gap-1.5">
                            <button type="button" disabled={pagination.first} onClick={() => setPage((p) => p - 1)}
                                className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors disabled:opacity-40 ${isDark ? 'border-[#334155] hover:bg-[#334155]' : 'border-[#e2e8f0] hover:bg-[#f1f5f9]'}`}>
                                <LuChevronLeft size={14} />
                            </button>
                            <span className={`px-3 text-sm font-semibold ${head}`}>{page + 1} / {pagination.totalPages}</span>
                            <button type="button" disabled={pagination.last} onClick={() => setPage((p) => p + 1)}
                                className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors disabled:opacity-40 ${isDark ? 'border-[#334155] hover:bg-[#334155]' : 'border-[#e2e8f0] hover:bg-[#f1f5f9]'}`}>
                                <LuChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
