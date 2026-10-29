import { Link } from 'react-router-dom';
import {
    LuArrowRight, LuClock3, LuCog, LuEye, LuFlaskConical, LuPackage,
    LuReceiptText, LuTruck, LuWallet, LuWarehouse,
} from 'react-icons/lu';
import { useAppTheme } from '../../../theme/tokens';

export default function XimikDashboard() {
    const { isDark } = useAppTheme();

    const panel = isDark ? 'border-white/10 bg-[#141C2B]' : 'border-[#e2e8f0] bg-white';
    const muted = isDark ? 'text-[#94a3b8]' : 'text-[#64748b]';
    const head = isDark ? 'text-white' : 'text-[#0f172a]';
    const line = isDark ? 'border-[#334155]/60' : 'border-[#f1f5f9]';

    const workLinks = [
        { label: 'Retseptlar', desc: 'Retseptlarni ko‘rish, yaratish va tahrirlash', path: '/recipes', icon: LuFlaskConical, badge: 'bg-teal-400/10 text-teal-500 border-teal-400/20' },
        { label: 'Xom ashyo', desc: 'Xom ashyo katalogi va tafsilotlari', path: '/raw', icon: LuPackage, badge: 'bg-amber-400/10 text-amber-500 border-amber-400/20' },
        { label: 'Stanoklar', desc: 'Stanoklar ro‘yxati va ish seanslari', path: '/machines', icon: LuCog, badge: 'bg-[#0ea5e9]/10 text-[#0ea5e9] border-[#0ea5e9]/20', readOnly: true },
        { label: 'Tovar ombori qoldiqlari', desc: 'Tayyor mahsulot qoldiqlari', path: '/ximik/warehouse', icon: LuWarehouse, badge: 'bg-violet-400/10 text-violet-500 border-violet-400/20', readOnly: true },
        { label: 'Xom ashyo ombori qoldiqlari', desc: 'Xom ashyo qoldiqlari (ko‘rish)', path: '/ximik/raw-warehouse', icon: LuPackage, badge: 'bg-amber-400/10 text-amber-500 border-amber-400/20', readOnly: true },
    ];

    const financeLinks = [
        { label: 'Yetkazib beruvchilar', desc: 'Balans, to‘lovlar va balansni to‘ldirish', path: '/suppliers', icon: LuTruck },
        { label: 'Xarajatlar', desc: 'Xarajatlar ro‘yxati va filtrlar', path: '/expenses', icon: LuReceiptText },
        { label: 'Kassalar', desc: 'Kassa qoldiqlari va kirim-chiqimlar', path: '/cashboxes', icon: LuWallet },
    ];

    return (
        <div className="flex w-full flex-col gap-4 py-2">
            {/* Hero */}
            <div className={`relative overflow-hidden rounded-2xl border px-4 py-4 sm:px-5 shadow-md ${panel}`}>
                <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-teal-400/6 to-transparent" />
                <div className="relative flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                    <div>
                        <p className="mb-1 text-xs font-bold uppercase tracking-wider text-teal-500">Ximik (texnolog)</p>
                        <h1 className={`text-lg sm:text-xl font-bold ${head}`}>Xayrli kun!</h1>
                        <p className={`mt-0.5 text-xs ${muted}`}>Retseptlar va xom ashyo bilan ishlang, ishlab chiqarish holatini kuzating.</p>
                    </div>
                    <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm w-fit ${isDark ? 'border-teal-400/20 bg-teal-400/10' : 'border-teal-200 bg-teal-50'}`}>
                        <LuClock3 className="text-teal-500 shrink-0" size={15} />
                        <span className={`font-semibold text-xs sm:text-sm ${head}`}>
                            {new Date().toLocaleDateString('uz-UZ', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </span>
                    </div>
                </div>
            </div>

            {/* Ish bo‘limlari */}
            <div className={`rounded-2xl border shadow-md ${panel}`}>
                <div className={`flex items-center gap-2.5 border-b px-4 py-3 sm:px-5 ${line}`}>
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-400/10 text-teal-500"><LuFlaskConical size={15} /></span>
                    <p className={`text-sm font-bold ${head}`}>Ishlab chiqarish</p>
                </div>
                <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 sm:p-4">
                    {workLinks.map(({ label, desc, path, icon: Icon, badge, readOnly }) => (
                        <Link key={path} to={path} className={`group flex items-center gap-3 rounded-2xl border p-3 sm:p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${panel}`}>
                            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${badge}`}><Icon size={18} /></span>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <p className={`font-semibold text-sm ${head}`}>{label}</p>
                                    {readOnly && <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${isDark ? 'border-white/10 text-slate-400' : 'border-[#e2e8f0] text-slate-500'}`}><LuEye size={10} /> ko‘rish</span>}
                                </div>
                                <p className={`mt-0.5 text-xs ${muted}`}>{desc}</p>
                            </div>
                            <LuArrowRight size={14} className={`shrink-0 transition-transform group-hover:translate-x-0.5 ${muted}`} />
                        </Link>
                    ))}
                </div>
            </div>

            {/* Moliya (faqat ko‘rish) */}
            <div className={`rounded-2xl border shadow-md ${panel}`}>
                <div className={`flex items-center justify-between gap-2 border-b px-4 py-3 sm:px-5 ${line}`}>
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-500"><LuWallet size={15} /></span>
                        <p className={`text-sm font-bold ${head}`}>Moliya</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${isDark ? 'border-white/10 text-slate-400' : 'border-[#e2e8f0] text-slate-500'}`}><LuEye size={11} /> Faqat ko‘rish rejimi</span>
                </div>
                <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-3 sm:p-4">
                    {financeLinks.map(({ label, desc, path, icon: Icon }) => (
                        <Link key={path} to={path} className={`group flex items-center gap-3 rounded-2xl border p-3 sm:p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${panel}`}>
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-500"><Icon size={18} /></span>
                            <div className="min-w-0 flex-1">
                                <p className={`font-semibold text-sm ${head}`}>{label}</p>
                                <p className={`mt-0.5 text-xs ${muted}`}>{desc}</p>
                            </div>
                            <LuArrowRight size={14} className={`shrink-0 transition-transform group-hover:translate-x-0.5 ${muted}`} />
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
