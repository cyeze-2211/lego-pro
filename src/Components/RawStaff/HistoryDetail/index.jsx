import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
    LuArrowLeft, LuLogIn, LuLogOut, LuCalendar,
    LuFlame, LuHash, LuStickyNote, LuCircleAlert,
} from 'react-icons/lu';
import { useAppTheme } from '../../../theme/tokens';

const fmtDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('uz-UZ', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
};

const fmtQty = (qty, unit) =>
    typeof qty === 'number'
        ? `${qty.toLocaleString('uz-UZ', { maximumFractionDigits: 3 })} ${unit ?? ''}`
        : `${qty ?? '—'} ${unit ?? ''}`;

export default function RawStaffHistoryDetail() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { state } = useLocation();
    const { isDark } = useAppTheme();

    const tx = state?.tx ?? null;

    const panel = isDark ? 'border-white/10 bg-[#141C2B]' : 'border-slate-200 bg-white';
    const muted = isDark ? 'text-slate-400' : 'text-slate-500';
    const head = isDark ? 'text-white' : 'text-slate-900';
    const line = isDark ? 'border-slate-700/50' : 'border-slate-100';

    const backToList = () => navigate('/raw-staff/history');

    if (!tx) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 py-2">
                <LuCircleAlert size={40} className="text-rose-400" />
                <p className={`text-base font-semibold ${head}`}>Ma&apos;lumot topilmadi</p>
                <p className={`text-sm ${muted}`}>ID: <span className="font-mono">{id}</span></p>
                <button type="button" onClick={backToList}
                    className="flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-bold text-slate-900 transition hover:bg-amber-500">
                    <LuArrowLeft size={15} />
                    Tarixga qaytish
                </button>
            </div>
        );
    }

    const isIn = tx.action === 'IN';
    const actionColor = isIn
        ? {
            text: isDark ? 'text-emerald-400' : 'text-emerald-600',
            bg: isDark ? 'bg-emerald-500/10' : 'bg-emerald-50',
            border: isDark ? 'border-emerald-500/25' : 'border-emerald-200',
        }
        : {
            text: isDark ? 'text-rose-400' : 'text-rose-600',
            bg: isDark ? 'bg-rose-500/10' : 'bg-rose-50',
            border: isDark ? 'border-rose-500/25' : 'border-rose-200',
        };

    const infoRows = [
        { icon: LuFlame, label: 'Xom ashyo', value: tx.rawMaterialName ?? '—', emphasis: true },
        {
            icon: LuHash,
            label: 'Miqdor',
            value: (
                <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold border ${actionColor.bg} ${actionColor.text} ${actionColor.border}`}>
                    {isIn ? '+' : '−'}{fmtQty(tx.quantity, tx.unit)}
                </span>
            ),
        },
        { icon: LuCalendar, label: 'Sana', value: fmtDate(tx.createdAt) },
        ...(tx.rawMaterialSummary ? [{ icon: LuStickyNote, label: 'Izoh', value: tx.rawMaterialSummary }] : []),
    ];

    return (
        <div className="flex w-full flex-col gap-4 py-2">
            {/* Hero header */}
            <div className={`relative overflow-hidden rounded-2xl border px-5 py-4 shadow-md ${panel}`}>
                <div className={`absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l ${isIn ? 'from-emerald-400/6' : 'from-rose-400/6'} to-transparent`} />
                <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${actionColor.bg} ${actionColor.text} ${actionColor.border}`}>
                            {isIn ? <LuLogIn size={22} /> : <LuLogOut size={22} />}
                        </span>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className={`text-xl font-bold tracking-tight ${head}`}>{tx.rawMaterialName}</h1>
                                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${actionColor.bg} ${actionColor.text} ${actionColor.border}`}>
                                    {isIn ? <LuLogIn size={11} /> : <LuLogOut size={11} />}
                                    {isIn ? 'Kirim' : 'Chiqim'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button type="button" onClick={backToList}
                        className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors self-start sm:self-auto ${isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                        <LuArrowLeft size={15} />
                        Orqaga
                    </button>
                </div>
            </div>

            {/* Grid layout: Miqdor + Tafsilotlar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              

                {/* Tafsilotlar */}
                <div className={`rounded-2xl border shadow-md overflow-hidden ${panel} md:col-span-3`}>
                    <div className={`border-b px-5 py-3.5 ${line}`}>
                        <p className={`text-sm font-bold ${head}`}>Tafsilotlar</p>
                    </div>
                    <div className="flex flex-col">
                        {infoRows.map(({ icon: Icon, label, value, emphasis }) => (
                            <div key={label} className={`flex items-start justify-between gap-6 px-5 py-3.5 border-b last:border-0 ${line} transition-colors`}>
                                <div className={`flex items-center gap-2 shrink-0 min-w-[120px] ${muted}`}>
                                    <Icon size={14} />
                                    <span className="text-xs font-semibold">{label}</span>
                                </div>
                                <div className={`text-sm text-right ${emphasis ? `font-bold ${head}` : head}`}>{value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Sana card */}
            <div className={`rounded-2xl border px-5 py-4 shadow-md ${panel}`}>
                <div className="flex items-center gap-3">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${isDark ? 'bg-amber-400/10' : 'bg-amber-50'}`}>
                        <LuCalendar size={16} className="text-amber-500" />
                    </span>
                    <div>
                        <p className={`text-xs font-semibold ${muted}`}>Amalga oshirilgan vaqt</p>
                        <p className={`text-sm font-bold mt-0.5 ${head}`}>{fmtDate(tx.createdAt)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
