import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    LuArrowRight, LuBoxes, LuClock3, LuHistory,
    LuLogIn, LuWarehouse,
    LuChevronLeft, LuChevronRight, LuPackage, LuTriangleAlert,
} from 'react-icons/lu';
import { useAppTheme } from '../../../theme/tokens';
import { useGetProductStocksQuery } from '../../../store/services/productStock.api';
import { useGetWarehousesQuery } from '../../../store/services/warehouse.api';
import { formatNumber } from '../../ui/number-format';

const PAGE_SIZE = 20;

export default function StaffDashboard() {
    const { isDark } = useAppTheme();
    const [page, setPage] = useState(0);

    const panel   = isDark ? 'border-white/10 bg-[#141C2B]' : 'border-slate-200 bg-white';
    const muted   = isDark ? 'text-slate-400' : 'text-slate-500';
    const head    = isDark ? 'text-white' : 'text-slate-900';
    const divider = isDark ? 'divide-slate-700/50' : 'divide-slate-100';
    const rowBg   = isDark ? 'hover:bg-slate-800/50' : 'hover:bg-amber-50/40';

    const { data: warehouses = [] } = useGetWarehousesQuery('PRODUCT');
    const warehouseName = useMemo(
        () => Object.fromEntries(warehouses.map((w) => [w.id, w.name])),
        [warehouses],
    );

    const { data: stocksData, isFetching } = useGetProductStocksQuery({
        lowStock: true,
        page,
        size: PAGE_SIZE,
    });

    const stocks     = stocksData?.items      ?? [];
    const pagination = stocksData?.pagination ?? {};

    const quickLinks = [
        { label: 'Buyurtmalar', path: '/staff/orders',    icon: LuBoxes,     badge: 'bg-amber-400/10 text-amber-500 border-amber-400/20'       },
        { label: 'Kirim',       path: '/staff/income',    icon: LuLogIn,     badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
        { label: 'Ombor',       path: '/staff/warehouse', icon: LuWarehouse, badge: 'bg-sky-500/10 text-sky-500 border-sky-500/20'             },
        { label: 'Tarix',       path: '/staff/history',   icon: LuHistory,   badge: 'bg-slate-500/10 text-slate-500 border-slate-500/20'       },
    ];

    return (
        <div className="flex w-full flex-col gap-4 py-2">

            <div className={`relative overflow-hidden rounded-2xl border px-5 py-4 shadow-md ${panel}`}>
                <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-amber-400/6 to-transparent" />
                <div className="relative flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="mb-1 text-xs font-bold uppercase tracking-wider text-amber-500">Ombor boshqaruvi</p>
                        <h1 className={`text-xl font-bold ${head}`}>Xayrli kun, omborchi!</h1>
                        <p className={`mt-0.5 text-xs ${muted}`}>Minimal chiziqdan past yoki teng qolgan mahsulotlar.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold ${isDark ? 'border-rose-400/20 bg-rose-500/10 text-rose-400' : 'border-rose-200 bg-rose-50 text-rose-600'}`}>
                            <LuTriangleAlert size={14} /> {pagination.totalElements ?? 0} ta kam qoldiq
                        </span>
                        <div className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm ${isDark ? 'border-amber-400/20 bg-amber-400/10' : 'border-amber-200 bg-amber-50'}`}>
                            <LuClock3 className="text-amber-500 shrink-0" size={16} />
                            <span className={`font-semibold ${head}`}>
                                {new Date().toLocaleDateString('uz-UZ', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {quickLinks.map(({ label, path, icon: Icon, badge }) => (
                    <Link
                        key={path}
                        to={path}
                        className={`group flex items-center gap-3 rounded-2xl border p-4 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${panel}`}
                    >
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors ${badge}`}>
                            <Icon size={18} />
                        </span>
                        <span className={`font-semibold text-sm ${head}`}>{label}</span>
                        <LuArrowRight size={14} className={`ml-auto shrink-0 transition-transform group-hover:translate-x-0.5 ${muted}`} />
                    </Link>
                ))}
            </div>

            <div className={`rounded-2xl border shadow-md overflow-hidden ${panel}`}>
                <div className={`flex items-center justify-between border-b px-5 py-3.5 ${isDark ? 'border-slate-700/60' : 'border-slate-100'}`}>
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
                            <LuTriangleAlert size={15} />
                        </span>
                        <div>
                            <p className={`text-sm font-bold ${head}`}>Kam qolgan mahsulotlar</p>
                            <p className={`text-xs ${muted}`}>Qoldiq minimal chiziqqa teng yoki past</p>
                        </div>
                    </div>
                    <Link to="/staff/warehouse" className="flex items-center gap-1 text-xs font-semibold text-amber-500 hover:text-amber-600">
                        Barcha qoldiqlar <LuArrowRight size={12} />
                    </Link>
                </div>

                {isFetching ? (
                    <div className={`flex flex-col items-center gap-3 py-20 ${muted}`}>
                        <svg className="h-7 w-7 animate-spin text-amber-400" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                        </svg>
                        <span className="text-sm">Yuklanmoqda...</span>
                    </div>
                ) : stocks.length === 0 ? (
                    <div className={`flex flex-col items-center gap-2.5 py-20 ${muted}`}>
                        <LuPackage size={36} strokeWidth={1.5} />
                        <p className="text-sm font-medium">Kam qolgan mahsulot yo‘q</p>
                    </div>
                ) : (
                    <>
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className={`text-left text-xs font-semibold uppercase tracking-wide ${muted} ${isDark ? 'bg-slate-900/20' : 'bg-slate-50/60'}`}>
                                        <th className="px-5 py-2.5">Mahsulot</th>
                                        <th className="px-5 py-2.5 hidden sm:table-cell">Barcode</th>
                                        <th className="px-5 py-2.5 hidden lg:table-cell">Ombor</th>
                                        <th className="px-5 py-2.5 text-right">Min. chiziq</th>
                                        <th className="px-5 py-2.5 text-right">Qoldiq</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${divider}`}>
                                    {stocks.map((s) => (
                                        <tr key={`${s.productId}-${s.warehouseId}`} className={`transition-colors ${rowBg}`}>
                                            <td className="px-5 py-3">
                                                <p className={`font-semibold ${head}`}>{s.productName}</p>
                                                <p className={`text-xs ${muted}`}>
                                                    {[s.productArticle, s.productSize, s.brand?.name].filter(Boolean).join(' · ') || '—'}
                                                </p>
                                            </td>
                                            <td className={`px-5 py-3 hidden sm:table-cell font-mono text-xs ${muted}`}>{s.productBarcode || '—'}</td>
                                            <td className={`px-5 py-3 hidden lg:table-cell text-xs ${muted}`}>
                                                {warehouseName[s.warehouseId] || '—'}
                                            </td>
                                            <td className={`px-5 py-3 text-right text-xs ${muted}`}>
                                                {formatNumber(s.productMinimumLine)} dona
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <span className="rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-bold text-rose-500">
                                                    {formatNumber(s.quantity)} dona
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className={`flex flex-col divide-y md:hidden ${divider}`}>
                            {stocks.map((s) => (
                                <div key={`${s.productId}-${s.warehouseId}`}
                                    className={`flex items-center justify-between gap-3 px-4 py-3.5 ${rowBg}`}>
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
                                            <LuPackage size={16} />
                                        </span>
                                        <div className="min-w-0">
                                            <p className={`truncate font-semibold text-sm ${head}`}>{s.productName}</p>
                                            <p className={`text-xs ${muted}`}>
                                                min {formatNumber(s.productMinimumLine)}
                                                {warehouseName[s.warehouseId] ? ` · ${warehouseName[s.warehouseId]}` : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="shrink-0 rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-bold text-rose-500">
                                        {formatNumber(s.quantity)} dona
                                    </span>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {pagination.totalPages > 1 && (
                    <div className={`flex items-center justify-between gap-3 border-t px-5 py-3.5 ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`}>
                        <p className={`text-xs ${muted}`}>
                            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, pagination.totalElements)} / {pagination.totalElements}
                        </p>
                        <div className="flex items-center gap-1.5">
                            <button type="button" disabled={pagination.first} onClick={() => setPage((p) => p - 1)}
                                className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors disabled:opacity-40 ${isDark ? 'border-slate-700 hover:bg-slate-700' : 'border-slate-200 hover:bg-slate-100'}`}>
                                <LuChevronLeft size={14} />
                            </button>
                            <span className={`px-3 text-sm font-semibold ${head}`}>{page + 1} / {pagination.totalPages}</span>
                            <button type="button" disabled={pagination.last} onClick={() => setPage((p) => p + 1)}
                                className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors disabled:opacity-40 ${isDark ? 'border-slate-700 hover:bg-slate-700' : 'border-slate-200 hover:bg-slate-100'}`}>
                                <LuChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
