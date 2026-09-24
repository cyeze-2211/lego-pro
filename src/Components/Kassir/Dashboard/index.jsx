import { Link } from 'react-router-dom';
import {
    LuArrowRight, LuClock3, LuWallet,
    LuReceiptText, LuUsers, LuClipboardList,
} from 'react-icons/lu';
import { useAppTheme } from '../../../theme/tokens';

export default function KassirDashboard() {
    const { isDark } = useAppTheme();

    const panel   = isDark ? 'border-white/10 bg-[#141C2B]' : 'border-[#e2e8f0] bg-white';
    const muted   = isDark ? 'text-[#94a3b8]' : 'text-[#64748b]';
    const head    = isDark ? 'text-white' : 'text-[#0f172a]';
    const divider = isDark ? 'divide-[#334155]/50' : 'divide-[#f1f5f9]';
    const line    = isDark ? 'border-[#334155]/60' : 'border-[#f1f5f9]';

    // Mock data - bu yerga real API dan ma'lumot kelib tushadi
    const totalCashboxes = 0;
    const totalExpenses  = 0;
    const totalCustomers = 0;
    const totalOrders    = 0;

    const quickLinks = [
        { label: 'Kassalar',    path: '/kassir/cashboxes', icon: LuWallet,        badge: 'bg-emerald-400/10 text-emerald-500 border-emerald-400/20' },
        { label: 'Mijozlar',    path: '/kassir/customers', icon: LuUsers,         badge: 'bg-[#0ea5e9]/10 text-[#0ea5e9] border-[#0ea5e9]/20' },
        { label: 'Xarajatlar',  path: '/kassir/expenses',  icon: LuReceiptText,   badge: 'bg-rose-400/10 text-rose-500 border-rose-400/20' },
        { label: 'Buyurtmalar', path: '/kassir/orders',    icon: LuClipboardList, badge: 'bg-amber-400/10 text-amber-500 border-amber-400/20' },
    ];

    return (
        <div className="flex w-full flex-col gap-4 py-2">

            {/* Hero */}
            <div className={`relative overflow-hidden rounded-2xl border px-5 py-4 shadow-md ${panel}`}>
                <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-emerald-400/6 to-transparent" />
                <div className="relative flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="mb-1 text-xs font-bold uppercase tracking-wider text-emerald-500">Kassir</p>
                        <h1 className={`text-xl font-bold ${head}`}>Xayrli kun!</h1>
                        <p className={`mt-0.5 text-xs ${muted}`}>Moliyaviy operatsiyalarni boshqaring va kuzatib boring.</p>
                    </div>
                    <div className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm ${isDark ? 'border-emerald-400/20 bg-emerald-400/10' : 'border-emerald-200 bg-emerald-50'}`}>
                        <LuClock3 className="text-emerald-500 shrink-0" size={16} />
                        <span className={`font-semibold ${head}`}>
                            {new Date().toLocaleDateString('uz-UZ', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </span>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                    { label: 'Kassalar',    value: totalCashboxes, icon: LuWallet,        cls: 'bg-emerald-400/10 text-emerald-500' },
                    { label: 'Mijozlar',    value: totalCustomers, icon: LuUsers,         cls: 'bg-[#0ea5e9]/10 text-[#0ea5e9]'     },
                    { label: 'Xarajatlar',  value: totalExpenses,  icon: LuReceiptText,   cls: 'bg-rose-400/10 text-rose-500'       },
                    { label: 'Buyurtmalar', value: totalOrders,    icon: LuClipboardList, cls: 'bg-amber-400/10 text-amber-500'     },
                ].map(({ label, value, icon: Icon, cls }) => (
                    <div key={label} className={`flex flex-col gap-3 rounded-2xl border p-4 shadow-md ${panel}`}>
                        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${cls}`}>
                            <Icon size={17} />
                        </span>
                        <div>
                            <p className={`text-2xl font-bold ${head}`}>{value}</p>
                            <p className={`mt-0.5 text-xs leading-snug ${muted}`}>{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {quickLinks.map(({ label, path, icon: Icon, badge }) => (
                    <Link key={path} to={path}
                        className={`group flex items-center gap-3 rounded-2xl border p-4 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${panel}`}>
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors ${badge}`}>
                            <Icon size={18} />
                        </span>
                        <span className={`font-semibold text-sm ${head}`}>{label}</span>
                        <LuArrowRight size={14} className={`ml-auto shrink-0 transition-transform group-hover:translate-x-0.5 ${muted}`} />
                    </Link>
                ))}
            </div>

            {/* Recent activities */}
            <div className="grid gap-3 md:grid-cols-2">
                {/* Recent expenses */}
                <div className={`rounded-2xl border shadow-md ${panel}`}>
                    <div className={`flex items-center justify-between border-b px-5 py-3.5 ${line}`}>
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-400/10 text-rose-500">
                                <LuReceiptText size={15} />
                            </span>
                            <div>
                                <p className={`text-sm font-bold ${head}`}>So&apos;nggi xarajatlar</p>
                                <p className={`text-xs ${muted}`}>Oxirgi 5 ta xarajat</p>
                            </div>
                        </div>
                        <Link to="/kassir/expenses" className="flex items-center gap-1 text-xs font-semibold text-rose-500 hover:text-rose-600">
                            Barchasi <LuArrowRight size={12} />
                        </Link>
                    </div>
                    <div className={`divide-y ${divider}`}>
                        <p className={`py-8 text-center text-sm ${muted}`}>Xarajatlar topilmadi</p>
                    </div>
                </div>

                {/* Recent orders */}
                <div className={`rounded-2xl border shadow-md ${panel}`}>
                    <div className={`flex items-center justify-between border-b px-5 py-3.5 ${line}`}>
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400/10 text-amber-500">
                                <LuClipboardList size={15} />
                            </span>
                            <div>
                                <p className={`text-sm font-bold ${head}`}>So&apos;nggi buyurtmalar</p>
                                <p className={`text-xs ${muted}`}>Oxirgi 5 ta buyurtma</p>
                            </div>
                        </div>
                        <Link to="/kassir/orders" className="flex items-center gap-1 text-xs font-semibold text-amber-500 hover:text-amber-600">
                            Barchasi <LuArrowRight size={12} />
                        </Link>
                    </div>
                    <div className={`divide-y ${divider}`}>
                        <p className={`py-8 text-center text-sm ${muted}`}>Buyurtmalar topilmadi</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
