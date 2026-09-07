import { useAppTheme } from '../../../theme/tokens';
import {
    LuArrowUpRight,
    LuBoxes,
    LuCircleCheck,
    LuClock3,
    LuCog,
    LuFactory,
    LuPackage,
    LuShieldCheck,
    LuTruck,
    LuUsers,
    LuWallet,
    LuWarehouse,
} from 'react-icons/lu';

const metrics = [
    { label: 'Bugungi ishlab chiqarish', value: '14 850', suffix: 'dona', change: '+12,4%', icon: LuFactory },
    { label: 'Faol stanoklar', value: '28', suffix: 'ta', change: '24 ishlayapti', icon: LuCog },
    { label: 'Ombordagi mahsulotlar', value: '8 420', suffix: 'dona', change: '+6,8%', icon: LuPackage },
    { label: 'Bugungi tushum', value: '48,6 mln', suffix: 'so‘m', change: '+9,2%', icon: LuWallet },
];

const productionLines = [
    { name: 'Ishlab chiqarish liniyasi A', product: 'Plastik idish PL-200', progress: 86, status: 'Ishlayapti' },
    { name: 'Ishlab chiqarish liniyasi B', product: 'Qadoqlash qutisi BX-12', progress: 64, status: 'Ishlayapti' },
    { name: 'Ishlab chiqarish liniyasi C', product: 'Maxsus buyurtma', progress: 38, status: 'Sozlanmoqda' },
];

const warehouseStock = [
    { name: 'Tayyor mahsulotlar', amount: '5 240 dona', tone: 'amber' },
    { name: 'Xom ashyo', amount: '2 180 kg', tone: 'blue' },
    { name: 'Qadoqlash materiallari', amount: '1 000 dona', tone: 'emerald' },
];

const activities = [
    { text: 'PL-200 mahsuloti ishlab chiqarishga chiqarildi', time: '10 daqiqa oldin', icon: LuCircleCheck },
    { text: 'Stanok №12 texnik ko‘rikdan o‘tdi', time: '35 daqiqa oldin', icon: LuCog },
    { text: 'Markaziy omborga yangi xom ashyo qabul qilindi', time: '1 soat oldin', icon: LuWarehouse },
    { text: 'Kunlik jo‘natma hisoboti tayyorlandi', time: '2 soat oldin', icon: LuTruck },
];

export default function Dashboard() {
    const { isDark } = useAppTheme();
    const panel = isDark ? 'border-white/10 bg-[#141C2B] shadow-black/20' : 'border-slate-200 bg-white shadow-slate-200/60';
    const muted = isDark ? 'text-slate-400' : 'text-slate-500';
    const heading = isDark ? 'text-white' : 'text-slate-900';
    const row = isDark ? 'bg-slate-900/45 hover:bg-slate-900/70' : 'bg-slate-50 hover:bg-slate-100';

    return (
        <div className="flex w-full flex-col gap-5 py-2">
            <section className={`relative overflow-hidden rounded-2xl border p-6 shadow-lg md:p-8 ${panel}`}>
                <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-amber-400/10 to-transparent" />
                <div className="relative flex flex-col justify-between gap-5 md:flex-row md:items-center">
                    <div>
                        <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-500"><LuShieldCheck size={15} /> Boshqaruv paneli</div>
                        <h1 className={`text-2xl font-bold tracking-tight md:text-3xl ${heading}`}>Xayrli kun, admin</h1>
                        <p className={`mt-2 max-w-xl text-sm ${muted}`}>Bugungi ishlab chiqarish, ombor va moliyaviy holatni bir joyda kuzating.</p>
                    </div>
                    <div className={`flex w-fit items-center gap-3 rounded-xl border px-4 py-3 ${isDark ? 'border-amber-400/20 bg-amber-400/10' : 'border-amber-200 bg-amber-50'}`}><LuClock3 className="text-amber-500" size={20} /><div><p className={`text-xs ${muted}`}>Bugun</p><p className={`text-sm font-bold ${heading}`}>07 sentyabr, 2026</p></div></div>
                </div>
            </section>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {metrics.map(({ label, value, suffix, change, icon: Icon }) => <div key={label} className={`rounded-2xl border p-5 shadow-lg transition-transform duration-200 hover:-translate-y-0.5 ${panel}`}><div className="flex items-center gap-3"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isDark ? 'bg-amber-400/10 text-amber-300' : 'bg-amber-50 text-amber-600'}`}><Icon size={20} /></span><p className={`text-sm font-medium leading-5 ${muted}`}>{label}</p></div><div className="mt-5 flex items-end justify-between gap-3"><div><span className={`text-2xl font-bold ${heading}`}>{value}</span><span className={`ml-1 text-sm ${muted}`}>{suffix}</span></div><span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-500"><LuArrowUpRight size={13} />{change}</span></div></div>)}
            </section>

            <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.4fr_1fr]">
                <div className={`rounded-2xl border p-5 shadow-lg md:p-6 ${panel}`}>
                    <div className="mb-5 flex items-center justify-between gap-3"><div className="flex items-center gap-3"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${isDark ? 'bg-amber-400/10 text-amber-300' : 'bg-amber-50 text-amber-600'}`}><LuFactory size={19} /></span><div><h2 className={`text-lg font-bold ${heading}`}>Ishlab chiqarish holati</h2><p className={`mt-1 text-xs ${muted}`}>Faol liniyalarning bugungi ko‘rsatkichi</p></div></div><span className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${isDark ? 'bg-amber-400/10 text-amber-300' : 'bg-amber-50 text-amber-700'}`}>3 ta liniya</span></div>
                    <div className="flex flex-col gap-4">{productionLines.map((line) => <div key={line.name} className={`rounded-xl p-4 ${row}`}><div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center"><div><p className={`text-sm font-semibold ${heading}`}>{line.name}</p><p className={`mt-1 text-xs ${muted}`}>{line.product}</p></div><span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${line.status === 'Ishlayapti' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>{line.status}</span></div><div className="mt-4 flex items-center gap-3"><div className={`h-2 flex-1 overflow-hidden rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}><div className="h-full rounded-full bg-amber-400" style={{ width: `${line.progress}%` }} /></div><span className={`w-10 text-right text-xs font-bold ${heading}`}>{line.progress}%</span></div></div>)}</div>
                </div>

                <div className={`rounded-2xl border p-5 shadow-lg md:p-6 ${panel}`}><div className="mb-5 flex items-center justify-between"><div className="flex items-center gap-3"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${isDark ? 'bg-amber-400/10 text-amber-300' : 'bg-amber-50 text-amber-600'}`}><LuWarehouse size={19} /></span><div><h2 className={`text-lg font-bold ${heading}`}>Ombor holati</h2><p className={`mt-1 text-xs ${muted}`}>Asosiy qoldiqlar</p></div></div></div><div className="flex flex-col gap-3">{warehouseStock.map((stock) => <div key={stock.name} className={`flex items-center justify-between rounded-xl p-4 ${row}`}><div className="flex items-center gap-3"><span className={`h-2.5 w-2.5 rounded-full ${stock.tone === 'amber' ? 'bg-amber-400' : stock.tone === 'blue' ? 'bg-sky-400' : 'bg-emerald-400'}`} /><span className={`text-sm font-medium ${heading}`}>{stock.name}</span></div><span className={`text-sm font-bold ${heading}`}>{stock.amount}</span></div>)}</div><button type="button" className="mt-4 flex items-center gap-1 text-sm font-semibold text-amber-500 hover:text-amber-600">Omborni ko‘rish <LuArrowUpRight size={15} /></button></div>
            </section>

            <section className={`rounded-2xl border p-5 shadow-lg md:p-6 ${panel}`}><div className="mb-5 flex items-center justify-between border-b border-slate-200/10 pb-4"><div><h2 className={`text-lg font-bold ${heading}`}>So‘nggi faoliyat</h2><p className={`mt-1 text-xs ${muted}`}>Tizimdagi oxirgi yangilanishlar</p></div><div className="flex items-center gap-2 text-xs font-semibold text-amber-500"><LuUsers size={15} /> Nazorat jurnali</div></div><div className="grid gap-3 md:grid-cols-2">{activities.map(({ text, time, icon: Icon }) => <div key={text} className={`flex items-center gap-3 rounded-xl p-4 ${row}`}><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isDark ? 'bg-amber-400/10 text-amber-300' : 'bg-amber-50 text-amber-600'}`}><Icon size={17} /></span><div className="min-w-0"><p className={`truncate text-sm font-medium ${heading}`}>{text}</p><p className={`mt-1 text-xs ${muted}`}>{time}</p></div></div>)}</div></section>
        </div>
    );
}
