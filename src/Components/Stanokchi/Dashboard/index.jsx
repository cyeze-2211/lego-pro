/* eslint-disable react/prop-types */
import { useNavigate } from 'react-router-dom';
import { LuArrowUpRight, LuCog, LuFactory, LuLoader, LuShieldCheck } from 'react-icons/lu';
import { useAppTheme } from '../../../theme/tokens';
import { useGetMachinesQuery } from '../../../store/services/machine.api';
import { useStanokchiMode } from '../../../context/StanokchiModeContext';
import WorkerMachines from '../Worker/WorkerMachines';

export default function StanokchiDashboard() {
    const { mode } = useStanokchiMode();

    if (mode === 'worker') return <WorkerMachines />;

    return <HeadDashboard />;
}

function HeadDashboard() {
    const navigate = useNavigate();
    const { isDark } = useAppTheme();
    const { data: result, isLoading, error } = useGetMachinesQuery({ page: 0, size: 100 });
    const machines = result?.items || [];
    const workingMachines = machines.filter((m) => !!m.currentRun && m.status !== 'IDLE').length;
    const panel = isDark
        ? 'border-white/10 bg-[#141C2B] shadow-black/20'
        : 'border-slate-200 bg-white shadow-slate-200/60';
    const heading = isDark ? 'text-white' : 'text-slate-900';
    const muted = isDark ? 'text-slate-400' : 'text-slate-500';

    return (
        <div className="flex w-full flex-col gap-4 sm:gap-5 py-2">
            <section className={`rounded-2xl border p-4 shadow-lg sm:p-6 md:p-8 ${panel}`}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="mb-2 sm:mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-500">
                            <LuShieldCheck size={14} /> Stanokchi boshqaruvi
                        </div>
                        <h1 className={`text-xl sm:text-2xl md:text-3xl font-bold tracking-tight ${heading}`}>
                            Dashboard
                        </h1>
                        <p className={`mt-1.5 sm:mt-2 max-w-xl text-sm ${muted}`}>
                            Stanoklar holatini umumiy ko&apos;rinishda kuzating.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate('/stanokchi/machines')}
                        className="flex w-fit items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 sm:py-3 text-sm font-bold text-slate-900 transition-colors hover:bg-amber-300"
                    >
                        Stanoklarni ko&apos;rish <LuArrowUpRight size={16} />
                    </button>
                </div>
            </section>

            <section className="grid grid-cols-2 gap-3 sm:gap-4">
                <SummaryCard
                    icon={LuCog}
                    label="Jami stanoklar"
                    value={isLoading ? '...' : error ? '-' : machines.length}
                    panel={panel}
                    heading={heading}
                    muted={muted}
                />
                <SummaryCard
                    icon={LuFactory}
                    label="Hozir ishlayotganlar"
                    value={isLoading ? '...' : error ? '-' : workingMachines}
                    panel={panel}
                    heading={heading}
                    muted={muted}
                />
            </section>

            {isLoading && (
                <div className={`flex items-center gap-3 rounded-2xl border p-4 sm:p-5 ${panel}`}>
                    <LuLoader className="animate-spin text-amber-500" size={18} />
                    <span className={`text-sm ${muted}`}>Stanoklar holati yuklanmoqda...</span>
                </div>
            )}
        </div>
    );
}

function SummaryCard({ icon: Icon, label, value, panel, heading, muted }) {
    return (
        <div className={`rounded-2xl border p-4 sm:p-5 shadow-lg ${panel}`}>
            <div className="flex items-center gap-2.5 sm:gap-3">
                <span className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-amber-400/10 text-amber-500">
                    <Icon size={18} />
                </span>
                <p className={`text-xs sm:text-sm font-medium leading-tight ${muted}`}>{label}</p>
            </div>
            <p className={`mt-4 sm:mt-5 text-2xl sm:text-3xl font-bold ${heading}`}>{value}</p>
        </div>
    );
}
