import { Link } from 'react-router-dom';
import {
    LuArrowRight, LuClock3, LuHistory,
    LuLogIn, LuLogOut, LuWarehouse, LuTrendingUp, LuTrendingDown, LuFlame,
} from 'react-icons/lu';
import { useAppTheme } from '../../../theme/tokens';
import { useGetRawMaterialStocksQuery, useGetRawMaterialTransactionsQuery } from '../../../store/services/rawMaterialStock.api';

export default function RawStaffDashboard() {
    const { isDark } = useAppTheme();

    const panel   = isDark ? 'border-white/10 bg-[#141C2B]' : 'border-slate-200 bg-white';
    const muted   = isDark ? 'text-slate-400' : 'text-slate-500';
    const head    = isDark ? 'text-white' : 'text-slate-900';
    const divider = isDark ? 'divide-slate-700/50' : 'divide-slate-100';
    const rowBg   = isDark ? 'hover:bg-slate-800/50' : 'hover:bg-amber-50/40';

    const { data: stocksData } = useGetRawMaterialStocksQuery({ size: 5, unit: 'KG' });
    const { data: inData  }    = useGetRawMaterialTransactionsQuery({ action: 'IN',  size: 5, unit: 'KG' });
    const { data: outData }    = useGetRawMaterialTransactionsQuery({ action: 'OUT', size: 5, unit: 'KG' });

    const stocks     = stocksData?.data  ?? [];
    const totalStock = stocksData?.pagination?.totalElements ?? 0;
    const recentIn   = inData?.data  ?? [];
    const totalIn    = inData?.pagination?.totalElements  ?? 0;
    const recentOut  = outData?.data ?? [];
    const totalOut   = outData?.pagination?.totalElements ?? 0;

    const quickLinks = [
        { label: 'Kirim',  path: '/raw-staff/income',    icon: LuLogIn,    badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
        { label: 'Chiqim', path: '/raw-staff/outcome',   icon: LuLogOut,   badge: 'bg-rose-500/10 text-rose-500 border-rose-500/20'         },
        { label: 'Ombor',  path: '/raw-staff/warehouse', icon: LuWarehouse,badge: 'bg-amber-400/10 text-amber-500 border-amber-400/20'       },
        { label: 'Tarix',  path: '/raw-staff/history',   icon: LuHistory,  badge: 'bg-sky-500/10 text-sky-500 border-sky-500/20'            },
    ];

    return (
        <div className="flex w-full flex-col gap-4 py-2">

            {/* Hero */}
            <div className={`relative overflow-hidden rounded-2xl border px-5 py-4 shadow-md ${panel}`}>
                <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-amber-400/6 to-transparent" />
                <div className="relative flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="mb-1 text-xs font-bold uppercase tracking-wider text-amber-500">Xom ashyo ombori</p>
                        <h1 className={`text-xl font-bold ${head}`}>Xayrli kun, omborchi!</h1>
                        <p className={`mt-0.5 text-xs ${muted}`}>Xom ashyo kirim, chiqim va qoldiqlarini nazorat qiling.</p>
                    </div>
                    <div className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm ${isDark ? 'border-amber-400/20 bg-amber-400/10' : 'border-amber-200 bg-amber-50'}`}>
                        <LuClock3 className="text-amber-500 shrink-0" size={16} />
                        <span className={`font-semibold ${head}`}>
                            {new Date().toLocaleDateString('uz-UZ', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </span>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: 'Xom ashyo turlari', value: totalStock, icon: LuFlame,       cls: 'bg-amber-400/10 text-amber-500'    },
                    { label: 'Jami kirimlar',     value: totalIn,    icon: LuTrendingUp,   cls: 'bg-emerald-500/10 text-emerald-500' },
                    { label: 'Jami chiqimlar',    value: totalOut,   icon: LuTrendingDown, cls: 'bg-rose-500/10 text-rose-500'      },
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

            {/* Recent activity */}
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">

                {/* Recent IN */}
                <div className={`rounded-2xl border shadow-md ${panel}`}>
                    <div className={`flex items-center justify-between border-b px-5 py-3.5 ${isDark ? 'border-slate-700/60' : 'border-slate-100'}`}>
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                                <LuLogIn size={15} />
                            </span>
                            <div>
                                <p className={`text-sm font-bold ${head}`}>So&apos;nggi kirimlar</p>
                                <p className={`text-xs ${muted}`}>Oxirgi 5 ta operatsiya</p>
                            </div>
                        </div>
                        <Link to="/raw-staff/history" className="flex items-center gap-1 text-xs font-semibold text-amber-500 hover:text-amber-600">
                            Barchasi <LuArrowRight size={12} />
                        </Link>
                    </div>
                    <div className={`divide-y ${divider}`}>
                        {recentIn.length === 0 ? (
                            <p className={`py-8 text-center text-sm ${muted}`}>Kirimlar topilmadi</p>
                        ) : recentIn.map((item) => (
                            <div key={item.id} className={`flex items-center justify-between px-5 py-3 transition-colors ${rowBg}`}>
                                <div className="min-w-0">
                                    <p className={`truncate text-sm font-semibold ${head}`}>{item.rawMaterialName}</p>
                                    <p className={`text-xs ${muted}`}>{new Date(item.createdAt).toLocaleString('uz-UZ')}</p>
                                </div>
                                <span className="ml-3 shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-500">
                                    +{item.quantity} {item.unit}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent OUT */}
                <div className={`rounded-2xl border shadow-md ${panel}`}>
                    <div className={`flex items-center justify-between border-b px-5 py-3.5 ${isDark ? 'border-slate-700/60' : 'border-slate-100'}`}>
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
                                <LuLogOut size={15} />
                            </span>
                            <div>
                                <p className={`text-sm font-bold ${head}`}>So&apos;nggi chiqimlar</p>
                                <p className={`text-xs ${muted}`}>Oxirgi 5 ta operatsiya</p>
                            </div>
                        </div>
                        <Link to="/raw-staff/history" className="flex items-center gap-1 text-xs font-semibold text-amber-500 hover:text-amber-600">
                            Barchasi <LuArrowRight size={12} />
                        </Link>
                    </div>
                    <div className={`divide-y ${divider}`}>
                        {recentOut.length === 0 ? (
                            <p className={`py-8 text-center text-sm ${muted}`}>Chiqimlar topilmadi</p>
                        ) : recentOut.map((item) => (
                            <div key={item.id} className={`flex items-center justify-between px-5 py-3 transition-colors ${rowBg}`}>
                                <div className="min-w-0">
                                    <p className={`truncate text-sm font-semibold ${head}`}>{item.rawMaterialName}</p>
                                    <p className={`text-xs ${muted}`}>{new Date(item.createdAt).toLocaleString('uz-UZ')}</p>
                                </div>
                                <span className="ml-3 shrink-0 rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-bold text-rose-500">
                                    -{item.quantity} {item.unit}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Stocks preview */}
            <div className={`rounded-2xl border shadow-md ${panel}`}>
                <div className={`flex items-center justify-between border-b px-5 py-3.5 ${isDark ? 'border-slate-700/60' : 'border-slate-100'}`}>
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400/10 text-amber-500">
                            <LuWarehouse size={15} />
                        </span>
                        <div>
                            <p className={`text-sm font-bold ${head}`}>Joriy qoldiqlar <span className={`font-normal text-xs ${muted}`}>(KG)</span></p>
                            <p className={`text-xs ${muted}`}>Omborlardagi xom ashyolar</p>
                        </div>
                    </div>
                    <Link to="/raw-staff/warehouse" className="flex items-center gap-1 text-xs font-semibold text-amber-500 hover:text-amber-600">
                        Barchasi <LuArrowRight size={12} />
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className={`text-left text-xs font-semibold uppercase tracking-wide ${muted} ${isDark ? 'bg-slate-900/20' : 'bg-slate-50/60'}`}>
                                <th className="px-5 py-2.5">Xom ashyo</th>
                                <th className="px-5 py-2.5 hidden sm:table-cell">Izoh</th>
                                <th className="px-5 py-2.5 text-right">Qoldiq</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${divider}`}>
                            {stocks.length === 0 ? (
                                <tr><td colSpan={3} className={`py-8 text-center text-sm ${muted}`}>Ma&apos;lumot topilmadi</td></tr>
                            ) : stocks.map((s) => (
                                <tr key={`${s.rawMaterialId}-${s.warehouseId}`} className={`transition-colors ${rowBg}`}>
                                    <td className={`px-5 py-3 font-semibold ${head}`}>{s.rawMaterialName}</td>
                                    <td className={`px-5 py-3 hidden sm:table-cell text-xs truncate max-w-xs ${muted}`}>{s.rawMaterialSummary || '—'}</td>
                                    <td className="px-5 py-3 text-right">
                                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${s.quantity > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                            {typeof s.quantity === 'number' ? s.quantity.toLocaleString('uz-UZ', { maximumFractionDigits: 3 }) : s.quantity} {s.unit || 'KG'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
