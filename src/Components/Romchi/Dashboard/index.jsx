import { Link } from 'react-router-dom';
import {
    LuArrowLeftRight, LuArrowRight, LuBoxes, LuClipboardList, LuClock3, LuFlame, LuHistory,
    LuLogIn, LuLogOut, LuPackage, LuTruck, LuUsers, LuWarehouse,
} from 'react-icons/lu';
import { useAppTheme } from '../../../theme/tokens';

/* Romchi — savdo + ikkala ombor: buyurtmalar (barcha holatlar), mijozlar, yetkazib beruvchilar,
 * tovar ombori kirim/ko‘chirish/ortish, xom ashyo ombori kirim/chiqim. */
export default function RomchiDashboard() {
    const { isDark } = useAppTheme();

    const panel = isDark ? 'border-white/10 bg-[#141C2B]' : 'border-[#e2e8f0] bg-white';
    const muted = isDark ? 'text-[#94a3b8]' : 'text-[#64748b]';
    const head = isDark ? 'text-white' : 'text-[#0f172a]';
    const line = isDark ? 'border-[#334155]/60' : 'border-[#f1f5f9]';

    const sections = [
        {
            title: 'Savdo',
            icon: LuClipboardList,
            tone: 'bg-amber-400/10 text-amber-500',
            links: [
                { label: 'Buyurtmalar', desc: 'Yaratish, ko‘rish va barcha holatlarni o‘zgartirish', path: '/zayavkachi/orders', icon: LuClipboardList, badge: 'bg-amber-400/10 text-amber-500 border-amber-400/20' },
                { label: 'Buyurtmalarni ortish', desc: 'Skaner bilan tekshirib ombordan chiqarish (chiqim)', path: '/staff/orders', icon: LuBoxes, badge: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
                { label: 'Mijozlar', desc: 'Mijozlar ro‘yxati, balans va buyurtmalari', path: '/zayavkachi/customers', icon: LuUsers, badge: 'bg-sky-500/10 text-sky-500 border-sky-500/20' },
                { label: 'Yetkazib beruvchilar', desc: 'Ta’minotchilar, balans va to‘lovlar', path: '/suppliers', icon: LuTruck, badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
            ],
        },
        {
            title: 'Tovar ombori',
            icon: LuWarehouse,
            tone: 'bg-sky-500/10 text-sky-500',
            links: [
                { label: 'Kirim', desc: 'Qo‘lda kirim, skaner (pistolet) bilan', path: '/staff/income', icon: LuLogIn, badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
                { label: 'Ko‘chirish', desc: 'Bir ombordan boshqasiga o‘tkazish', path: '/staff/transfer', icon: LuArrowLeftRight, badge: 'bg-violet-500/10 text-violet-500 border-violet-500/20' },
                { label: 'Ombor qoldiqlari', desc: 'Tayyor va yarim tayyor mahsulotlar', path: '/staff/warehouse', icon: LuWarehouse, badge: 'bg-sky-500/10 text-sky-500 border-sky-500/20' },
                { label: 'Tarix', desc: 'Kirim, chiqim va ko‘chirishlar', path: '/staff/history', icon: LuHistory, badge: 'bg-slate-500/10 text-slate-500 border-slate-500/20' },
            ],
        },
        {
            title: 'Xom ashyo ombori',
            icon: LuFlame,
            tone: 'bg-orange-400/10 text-orange-500',
            links: [
                { label: 'Kirim', desc: 'Xom ashyo qabul qilish', path: '/raw-staff/income', icon: LuLogIn, badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
                { label: 'Chiqim', desc: 'Xom ashyoni ishlab chiqarishga berish', path: '/raw-staff/outcome', icon: LuLogOut, badge: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
                { label: 'Ombor qoldiqlari', desc: 'Xom ashyo va yarim tayyor mahsulot', path: '/raw-staff/warehouse', icon: LuPackage, badge: 'bg-orange-400/10 text-orange-500 border-orange-400/20' },
                { label: 'Tarix', desc: 'Xom ashyo harakatlari', path: '/raw-staff/history', icon: LuHistory, badge: 'bg-slate-500/10 text-slate-500 border-slate-500/20' },
            ],
        },
    ];

    return (
        <div className="flex w-full flex-col gap-4 py-2">
            <div className={`relative overflow-hidden rounded-2xl border px-4 py-4 sm:px-5 shadow-md ${panel}`}>
                <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-violet-400/6 to-transparent" />
                <div className="relative flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                    <div>
                        <p className="mb-1 text-xs font-bold uppercase tracking-wider text-violet-500">Romchi</p>
                        <h1 className={`text-lg sm:text-xl font-bold ${head}`}>Xayrli kun!</h1>
                        <p className={`mt-0.5 text-xs ${muted}`}>Buyurtmalar, mijozlar, yetkazib beruvchilar va ikkala ombor bitta joyda.</p>
                    </div>
                    <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm w-fit ${isDark ? 'border-violet-400/20 bg-violet-400/10' : 'border-violet-200 bg-violet-50'}`}>
                        <LuClock3 className="text-violet-500 shrink-0" size={15} />
                        <span className={`font-semibold text-xs sm:text-sm ${head}`}>
                            {new Date().toLocaleDateString('uz-UZ', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </span>
                    </div>
                </div>
            </div>

            {sections.map(({ title, icon: SectionIcon, tone, links }) => (
                <div key={title} className={`rounded-2xl border shadow-md ${panel}`}>
                    <div className={`flex items-center gap-2.5 border-b px-4 py-3 sm:px-5 ${line}`}>
                        <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${tone}`}><SectionIcon size={15} /></span>
                        <p className={`text-sm font-bold ${head}`}>{title}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 sm:p-4">
                        {links.map(({ label, desc, path, icon: Icon, badge }) => (
                            <Link key={path} to={path} className={`group flex items-center gap-3 rounded-2xl border p-3 sm:p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${panel}`}>
                                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${badge}`}><Icon size={18} /></span>
                                <div className="min-w-0 flex-1">
                                    <p className={`font-semibold text-sm ${head}`}>{label}</p>
                                    <p className={`mt-0.5 text-xs ${muted}`}>{desc}</p>
                                </div>
                                <LuArrowRight size={14} className={`shrink-0 transition-transform group-hover:translate-x-0.5 ${muted}`} />
                            </Link>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
