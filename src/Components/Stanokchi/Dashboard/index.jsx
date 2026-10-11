import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Link, useNavigate } from 'react-router-dom';
import {
    LuActivity, LuArrowUpRight, LuClock3, LuCog, LuFactory, LuPackage, LuPause,
    LuRefreshCw, LuSearch, LuShieldCheck, LuTrophy, LuX, LuZap,
} from 'react-icons/lu';
import { useAppTheme } from '../../../theme/tokens';
import { useGetMachinesProductionSummaryQuery } from '../../../store/services/machine.api';
import { useStanokchiMode } from '../../../context/StanokchiModeContext';
import { calcDuration, formatApiDateTime, formatDurationSeconds, formatShiftDateTime, getCurrentShift, getUzbekistanTimeParts } from '../shift';
import { formatNumber } from '../../ui/number-format';
import ProductImage from '../../ui/ProductImage';
import WorkerMachines from '../Worker/WorkerMachines';

const productImageUrl = (productId) => (productId ? `/api/v1/products/${productId}/image` : null);
const pad = (n) => String(n).padStart(2, '0');

export default function StanokchiDashboard() {
    const { mode } = useStanokchiMode();
    if (mode === 'worker') return <WorkerMachines />;
    return <HeadDashboard />;
}

/* ── Holatlar ──────────────────────────────────────────────────────────── */
const STATUS = {
    WORKING: { label: 'Ishlayapti', color: '#22C55E', soft: 'rgba(34,197,94,.14)', text: { light: '#166534', dark: '#86EFAC' } },
    DEFECT: { label: 'Brak rejimi', color: '#EF4444', soft: 'rgba(239,68,68,.14)', text: { light: '#991B1B', dark: '#FCA5A5' } },
    IDLE: { label: 'Bo‘sh', color: '#94A3B8', soft: 'rgba(148,163,184,.16)', text: { light: '#475569', dark: '#CBD5E1' } },
};
const statusOf = (s) => STATUS[s] || STATUS.IDLE;
const isActive = (s) => s === 'WORKING' || s === 'DEFECT';

const FILTERS = [
    { key: 'all', label: 'Barchasi' },
    { key: 'active', label: 'Ishlayotgan' },
    { key: 'idle', label: 'Bo‘sh' },
];

/* ── Kichik bloklar ───────────────────────────────────────────────────── */
function StatusPill({ status, isDark, size = 'sm' }) {
    const meta = statusOf(status);
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-bold whitespace-nowrap ${size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'}`} style={{ background: meta.soft, color: isDark ? meta.text.dark : meta.text.light }}>
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: meta.color, animation: status === 'WORKING' ? 'stanokPulse 1.5s infinite' : undefined }} />
            {meta.label}
        </span>
    );
}
StatusPill.propTypes = { status: PropTypes.string, isDark: PropTypes.bool, size: PropTypes.string };

function Ring({ value, size = 64, stroke = 7, color = '#22C55E', track, children }) {
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const v = Math.max(0, Math.min(100, value || 0));
    return (
        <div className="relative shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (c * v) / 100} style={{ transition: 'stroke-dashoffset .6s ease' }} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">{children}</div>
        </div>
    );
}
Ring.propTypes = { value: PropTypes.number, size: PropTypes.number, stroke: PropTypes.number, color: PropTypes.string, track: PropTypes.string, children: PropTypes.node };

function KpiCard({ icon: Icon, label, value, sub, accent, panel, heading, muted, isDark, children }) {
    return (
        <div className={`relative overflow-hidden rounded-2xl border p-4 sm:p-5 shadow-lg ${panel}`}>
            <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-[0.12]" style={{ background: accent }} />
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className={`text-[11px] font-bold uppercase tracking-wider ${muted}`}>{label}</p>
                    <p className={`mt-2 text-2xl sm:text-[28px] font-extrabold leading-tight ${heading}`}>{value}</p>
                    {sub && <p className={`mt-1 text-xs ${muted}`}>{sub}</p>}
                </div>
                {children || (
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: `${accent}1f`, color: accent, border: `1px solid ${accent}${isDark ? '55' : '33'}` }}><Icon size={20} /></span>
                )}
            </div>
        </div>
    );
}
KpiCard.propTypes = { icon: PropTypes.elementType, label: PropTypes.string.isRequired, value: PropTypes.node, sub: PropTypes.node, accent: PropTypes.string, panel: PropTypes.string, heading: PropTypes.string, muted: PropTypes.string, isDark: PropTypes.bool, children: PropTypes.node };

/* ── Asosiy dashboard ──────────────────────────────────────────────────── */
function HeadDashboard() {
    const navigate = useNavigate();
    const { isDark } = useAppTheme();
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [now, setNow] = useState(() => new Date());

    /* Har daqiqa soat va smena progressi yangilanadi */
    useEffect(() => {
        const t = window.setInterval(() => setNow(new Date()), 60_000);
        return () => window.clearInterval(t);
    }, []);

    const shift = useMemo(() => getCurrentShift(now), [now]);
    const shiftProgress = useMemo(() => {
        const { year, month, day, hour, minute } = getUzbekistanTimeParts(now);
        const wall = Date.UTC(year, month - 1, day, hour, minute);
        return Math.max(0, Math.min(100, Math.round(((wall - shift.start.getTime()) / (shift.end.getTime() - shift.start.getTime())) * 100)));
    }, [now, shift]);
    const clock = useMemo(() => { const p = getUzbekistanTimeParts(now); return `${pad(p.hour)}:${pad(p.minute)}`; }, [now]);

    const { data, isLoading, isFetching, error, refetch } = useGetMachinesProductionSummaryQuery(
        { fromDateTime: formatApiDateTime(shift.start), toDateTime: formatApiDateTime(shift.end), page: 0, size: 100, sort: ['name,ASC', 'id,ASC'] },
        { pollingInterval: 60_000 },
    );

    const rows = useMemo(() => data?.items ?? [], [data]);
    const totals = useMemo(() => rows.reduce((acc, m) => {
        acc.total += 1;
        if (m.status === 'WORKING') acc.working += 1; else if (m.status === 'DEFECT') acc.defect += 1; else acc.idle += 1;
        acc.quantity += Number(m.totalQuantity) || 0;
        acc.worked += Number(m.workedDurationSeconds) || 0;
        acc.idleSec += Number(m.idleDurationSeconds) || 0;
        acc.defectSec += Number(m.defectDurationSeconds) || 0;
        return acc;
    }, { total: 0, working: 0, defect: 0, idle: 0, quantity: 0, worked: 0, idleSec: 0, defectSec: 0 }), [rows]);
    const utilization = totals.worked + totals.idleSec + totals.defectSec > 0 ? Math.round(((totals.worked + totals.defectSec) / (totals.worked + totals.idleSec + totals.defectSec)) * 100) : 0;
    const leader = useMemo(() => rows.reduce((best, m) => (Number(m.totalQuantity) > Number(best?.totalQuantity || 0) ? m : best), null), [rows]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return rows.filter((m) => {
            if (filter === 'active' && !isActive(m.status)) return false;
            if (filter === 'idle' && isActive(m.status)) return false;
            if (!q) return true;
            return m.machineName?.toLowerCase().includes(q) || m.currentRun?.productName?.toLowerCase().includes(q);
        });
    }, [rows, search, filter]);

    const refresh = () => { setNow(new Date()); refetch(); };

    const panel = isDark ? 'border-white/10 bg-[#141C2B] shadow-black/20' : 'border-slate-200 bg-white shadow-slate-200/60';
    const heading = isDark ? 'text-white' : 'text-slate-900';
    const muted = isDark ? 'text-slate-400' : 'text-slate-500';
    const line = isDark ? 'border-white/[0.06]' : 'border-slate-100';
    const track = isDark ? 'rgba(255,255,255,.08)' : '#E2E8F0';
    const inputCx = `h-10 w-full rounded-xl border pl-10 pr-10 text-sm outline-none transition-all ${isDark ? 'border-white/10 bg-[#1e293b]/80 text-white placeholder:text-slate-500 focus:border-amber-400' : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-amber-400'}`;

    return (
        <div className="flex w-full flex-col gap-4 sm:gap-5 py-2">
            <style>{`@keyframes stanokPulse { 0%,100% { opacity: 1 } 50% { opacity: .35 } }`}</style>

            {/* ── Sarlavha: smena va progress ── */}
            <section className={`relative overflow-hidden rounded-2xl border shadow-lg ${panel}`}>
                <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg,#FACC15,#F59E0B,#FDE68A)' }} />
                <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2" style={{ background: isDark ? 'radial-gradient(circle at 80% 20%, rgba(250,204,21,.12), transparent 55%)' : 'radial-gradient(circle at 80% 20%, rgba(250,204,21,.18), transparent 55%)' }} />
                <div className="relative grid gap-5 p-4 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
                    <div>
                        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-500"><LuShieldCheck size={14} /> Stanokchi boshqaruvi</div>
                        <h1 className={`text-xl sm:text-2xl md:text-3xl font-bold tracking-tight ${heading}`}>Ishlab chiqarish nazorati</h1>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-slate-900"><LuZap size={12} /> {shift.name}</span>
                            <span className={`text-sm ${muted}`}>{formatShiftDateTime(shift.start)} – {formatShiftDateTime(shift.end)}</span>
                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${isDark ? 'border-white/10 text-slate-200' : 'border-slate-200 text-slate-700'}`}><LuClock3 size={12} className="text-amber-500" /> {clock}</span>
                        </div>
                        <div className="mt-4 max-w-xl">
                            <div className={`mb-1.5 flex items-center justify-between text-xs ${muted}`}><span>Smena jarayoni</span><span className={`font-bold ${heading}`}>{shiftProgress}%</span></div>
                            <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: track }}>
                                <div className="h-full rounded-full" style={{ width: `${shiftProgress}%`, background: 'linear-gradient(90deg,#FACC15,#F59E0B)', transition: 'width .6s ease' }} />
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 lg:flex-col">
                        <button type="button" onClick={refresh} disabled={isFetching} className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 ${isDark ? 'border-white/10 text-slate-200 hover:bg-white/5' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                            <LuRefreshCw size={15} className={isFetching ? 'animate-spin' : ''} /> Yangilash
                        </button>
                        <button type="button" onClick={() => navigate('/stanokchi/machines')} className="flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-900 shadow-lg shadow-amber-400/30 transition-all hover:-translate-y-px hover:bg-amber-300">
                            Stanoklar <LuArrowUpRight size={16} />
                        </button>
                    </div>
                </div>
            </section>

            {/* ── KPI ── */}
            <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                <KpiCard icon={LuFactory} label="Hozir ishlayotganlar" value={isLoading ? '…' : error ? '—' : `${totals.working + totals.defect} / ${totals.total}`} sub={isLoading || error ? undefined : `${totals.idle} ta bo‘sh turibdi`} accent="#22C55E" panel={panel} heading={heading} muted={muted} isDark={isDark}>
                    <Ring value={totals.total ? ((totals.working + totals.defect) / totals.total) * 100 : 0} color="#22C55E" track={track} size={60} stroke={6}>
                        <LuFactory size={18} className="text-emerald-500" />
                    </Ring>
                </KpiCard>
                <KpiCard icon={LuPackage} label="Smenada chiqarildi" value={isLoading ? '…' : error ? '—' : formatNumber(totals.quantity)} sub="dona · barcha stanoklar" accent="#0EA5E9" panel={panel} heading={heading} muted={muted} isDark={isDark} />
                <KpiCard icon={LuActivity} label="Stanoklar bandligi" value={isLoading ? '…' : error ? '—' : `${utilization}%`} sub={isLoading || error ? undefined : `${formatDurationSeconds(totals.worked)} ish vaqti`} accent="#8B5CF6" panel={panel} heading={heading} muted={muted} isDark={isDark}>
                    <Ring value={utilization} color="#8B5CF6" track={track} size={60} stroke={6}>
                        <span className={`text-[11px] font-extrabold ${heading}`}>{utilization}%</span>
                    </Ring>
                </KpiCard>
                <KpiCard icon={LuTrophy} label="Smena yetakchisi" value={isLoading ? '…' : error || !leader || !Number(leader.totalQuantity) ? '—' : leader.machineName} sub={leader && Number(leader.totalQuantity) ? `${formatNumber(leader.totalQuantity)} dona chiqardi` : 'Hali ishlab chiqarish yo‘q'} accent="#F59E0B" panel={panel} heading={heading} muted={muted} isDark={isDark} />
            </section>

            {/* ── Holat taqsimoti ── */}
            {!isLoading && !error && totals.total > 0 && (
                <section className={`rounded-2xl border p-4 sm:p-5 shadow-lg ${panel}`}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className={`text-sm font-bold ${heading}`}>Stanoklar holati</p>
                        <div className="flex flex-wrap gap-4 text-xs">
                            {[['WORKING', totals.working], ['DEFECT', totals.defect], ['IDLE', totals.idle]].map(([k, n]) => (
                                <span key={k} className={`inline-flex items-center gap-1.5 ${muted}`}><span className="h-2.5 w-2.5 rounded-sm" style={{ background: STATUS[k].color }} /> {STATUS[k].label}: <b className={heading}>{n}</b></span>
                            ))}
                        </div>
                    </div>
                    <div className="mt-3 flex h-3 w-full overflow-hidden rounded-full" style={{ background: track }}>
                        {[['WORKING', totals.working], ['DEFECT', totals.defect], ['IDLE', totals.idle]].map(([k, n]) => n > 0 && (
                            <div key={k} style={{ width: `${(n / totals.total) * 100}%`, background: STATUS[k].color, transition: 'width .6s ease' }} title={`${STATUS[k].label}: ${n}`} />
                        ))}
                    </div>
                </section>
            )}

            {/* ── Stanoklar ── */}
            <section className={`rounded-2xl border shadow-lg overflow-hidden ${panel}`}>
                <div className={`flex flex-col gap-3 border-b px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between ${line}`}>
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400/10 text-amber-500"><LuCog size={15} /></span>
                        <div>
                            <p className={`text-sm font-bold ${heading}`}>Stanoklar bo‘yicha smena hisoboti</p>
                            <p className={`text-xs ${muted}`}>{isLoading ? 'Yuklanmoqda...' : `${filtered.length} ta stanok ko‘rsatilmoqda`}</p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className={`flex gap-1 rounded-xl p-1 ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                            {FILTERS.map((f) => (
                                <button key={f.key} type="button" onClick={() => setFilter(f.key)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${filter === f.key ? 'bg-amber-400 text-slate-900 shadow-sm' : `${muted} hover:text-amber-500`}`}>{f.label}</button>
                            ))}
                        </div>
                        <div className="relative w-full sm:w-64">
                            <LuSearch size={15} className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 ${muted}`} />
                            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Stanok yoki mahsulot..." className={inputCx} aria-label="Qidirish" />
                            {search && <button type="button" onClick={() => setSearch('')} className={`absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full ${muted} hover:text-amber-500`} aria-label="Tozalash"><LuX size={13} /></button>}
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-44 animate-pulse rounded-2xl" style={{ background: track }} />)}
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center gap-2 py-14"><LuCog size={36} className={muted} /><p className={`text-sm ${muted}`}>Hisobotni yuklab bo‘lmadi. «Yangilash»ni bosing.</p></div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-14"><LuCog size={36} className={`${muted} opacity-40`} /><p className={`text-sm font-medium ${muted}`}>{search || filter !== 'all' ? 'Shart bo‘yicha stanok topilmadi' : 'Hozircha stanoklar yo‘q'}</p></div>
                ) : (
                    <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3" style={{ opacity: isFetching ? 0.65 : 1, transition: 'opacity .15s' }}>
                        {filtered.map((m) => (
                            <MachineCard key={m.machineId} m={m} isDark={isDark} heading={heading} muted={muted} track={track} isLeader={leader?.machineId === m.machineId && Number(m.totalQuantity) > 0} />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

/* ── Stanok kartasi ────────────────────────────────────────────────────── */
function MachineCard({ m, isDark, heading, muted, track, isLeader }) {
    const meta = statusOf(m.status);
    const active = isActive(m.status);
    const run = m.currentRun;
    const products = m.products ?? [];
    const worked = Number(m.workedDurationSeconds) || 0;
    const defect = Number(m.defectDurationSeconds) || 0;
    const idle = Number(m.idleDurationSeconds) || 0;
    const span = worked + defect + idle;
    const load = span > 0 ? Math.round(((worked + defect) / span) * 100) : 0;
    const since = run ? calcDuration(run.startedAt) : null;

    return (
        <Link
            to={`/stanokchi/machines/${m.machineId}`}
            className={`group relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl ${isDark ? 'border-white/10 bg-[#0f172a]/40 hover:border-amber-400/40' : 'border-slate-200 bg-white hover:border-amber-300'}`}
        >
            <div className="h-1 w-full" style={{ background: active ? `linear-gradient(90deg, ${meta.color}, ${meta.color}99)` : track }} />
            <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: meta.soft, color: meta.color }}><LuCog size={16} /></span>
                        <div className="min-w-0">
                            <p className={`truncate font-bold ${heading}`}>{m.machineName}</p>
                            {isLeader && <p className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-500"><LuTrophy size={10} /> Smena yetakchisi</p>}
                        </div>
                    </div>
                    <StatusPill status={m.status} isDark={isDark} />
                </div>

                {active && run ? (
                    <div className={`flex items-center gap-3 rounded-xl p-2.5 ${isDark ? 'bg-white/[0.04]' : 'bg-slate-50'}`}>
                        <ProductImage imageUrl={productImageUrl(run.productId)} version={run.productId} name={run.productName} size={56} radius="xl" iconSize={22} />
                        <div className="min-w-0 flex-1">
                            <p className={`text-[10px] font-bold uppercase tracking-wider ${muted}`}>Hozir chiqarilmoqda</p>
                            <p className={`truncate text-sm font-semibold ${heading}`}>{run.productName}</p>
                            <p className={`truncate text-xs ${muted}`}>{[run.brand?.name, since ? `${since} davomida` : null].filter(Boolean).join(' · ')}</p>
                        </div>
                    </div>
                ) : (
                    <div className={`flex items-center gap-2 rounded-xl border border-dashed p-3 text-xs ${isDark ? 'border-white/10' : 'border-slate-200'} ${muted}`}><LuPause size={13} /> Hozir ishlamayapti</div>
                )}

                <div className="grid grid-cols-3 gap-2">
                    <div>
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${muted}`}>Chiqarildi</p>
                        <p className={`text-xl font-extrabold leading-tight ${Number(m.totalQuantity) > 0 ? heading : muted}`}>{formatNumber(m.totalQuantity || 0)}<span className={`ml-1 text-[11px] font-medium ${muted}`}>dona</span></p>
                    </div>
                    <div>
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${muted}`}>Ish vaqti</p>
                        <p className={`text-sm font-bold leading-tight ${worked > 0 ? (isDark ? 'text-emerald-300' : 'text-emerald-700') : muted}`}>{formatDurationSeconds(worked)}</p>
                    </div>
                    <div>
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${muted}`}>Bo‘sh</p>
                        <p className={`text-sm font-bold leading-tight ${muted}`}>{formatDurationSeconds(idle)}</p>
                    </div>
                </div>

                <div>
                    <div className={`mb-1 flex items-center justify-between text-[11px] ${muted}`}><span>Bandlik</span><span className={`font-bold ${heading}`}>{load}%</span></div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: track }}>
                        <div className="h-full rounded-full" style={{ width: `${load}%`, background: load >= 70 ? '#22C55E' : load >= 35 ? '#F59E0B' : '#94A3B8', transition: 'width .6s ease' }} />
                    </div>
                </div>

                {products.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {products.slice(0, 3).map((p) => (
                            <span key={p.productId} className={`inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${isDark ? 'border-white/10 text-slate-300' : 'border-slate-200 text-slate-600'}`} title={p.productName}>
                                <span className="truncate">{p.productName}</span><b>{formatNumber(p.totalQuantity)}</b>
                            </span>
                        ))}
                        {products.length > 3 && <span className={`text-[11px] ${muted}`}>+{products.length - 3}</span>}
                    </div>
                )}
            </div>
            <span className={`absolute bottom-3 right-3 flex h-7 w-7 items-center justify-center rounded-lg opacity-0 transition-opacity group-hover:opacity-100 ${isDark ? 'bg-amber-400/15 text-amber-400' : 'bg-amber-50 text-amber-600'}`}><LuArrowUpRight size={14} /></span>
        </Link>
    );
}
MachineCard.propTypes = { m: PropTypes.object.isRequired, isDark: PropTypes.bool, heading: PropTypes.string, muted: PropTypes.string, track: PropTypes.string, isLeader: PropTypes.bool };
