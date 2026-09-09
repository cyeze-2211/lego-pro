import { useState } from 'react';
import {
    LuBarcode, LuBoxes, LuSearch, LuWarehouse,
    LuChevronLeft, LuChevronRight, LuPackage, LuX,
} from 'react-icons/lu';
import { useAppTheme } from '../../../theme/tokens';
import { useGetProductStocksQuery } from '../../../store/services/productStock.api';
import { useGetWarehousesQuery } from '../../../store/services/warehouse.api';

const PAGE_SIZE = 20;

export default function StaffStockWarehouse() {
    const { isDark } = useAppTheme();
    const [page, setPage]                       = useState(0);
    const [warehouseFilter, setWarehouseFilter] = useState('');
    const [search, setSearch]                   = useState('');

    const { data: warehouses = [] } = useGetWarehousesQuery('PRODUCT');
    const { data, isFetching }      = useGetProductStocksQuery({
        warehouseId: warehouseFilter || undefined,
        page,
        size: PAGE_SIZE,
    });

    const stocks     = data?.data       ?? [];
    const pagination = data?.pagination ?? {};
    const filtered   = search
        ? stocks.filter((s) =>
              s.productName?.toLowerCase().includes(search.toLowerCase()) ||
              s.productBarcode?.includes(search))
        : stocks;

    /* ── tokens ─────────────────────────────────────────────────────── */
    const panel   = isDark ? 'border-white/10 bg-[#141C2B]' : 'border-slate-200 bg-white';
    const muted   = isDark ? 'text-slate-400' : 'text-slate-500';
    const head    = isDark ? 'text-white' : 'text-slate-900';
    const divider = isDark ? 'divide-slate-700/50' : 'divide-slate-100';
    const rowHov  = isDark ? 'hover:bg-slate-800/50' : 'hover:bg-amber-50/50';
    const inputCx = [
        'w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all duration-200 h-[42px]',
        isDark
            ? 'border-slate-700 bg-slate-800/80 text-white placeholder:text-slate-500 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20'
            : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20',
    ].join(' ');

    return (
        <div className="flex w-full flex-col gap-4 py-2">

            {/* ── Header ──────────────────────────────────────────────── */}
            <div className={`relative overflow-hidden rounded-2xl border px-5 py-4 shadow-md ${panel}`}>
                <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-amber-400/6 to-transparent" />
                <div className="relative flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-amber-400/10 text-amber-500 border-amber-400/20`}>
                            <LuWarehouse size={18} />
                        </span>
                        <div>
                            <h1 className={`text-xl font-bold tracking-tight ${head}`}>Joriy Qoldiqlar</h1>
                            <p className={`text-xs mt-0.5 ${muted}`}>Omborlardagi mahsulot qoldiqlarini kuzating</p>
                        </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold bg-amber-400/10 text-amber-500 border-amber-400/20`}>
                        <LuBoxes size={12} /> {pagination.totalElements ?? 0} qator
                    </span>
                </div>
            </div>

            {/* ── Filters ─────────────────────────────────────────────── */}
            <div className={`rounded-2xl border px-4 py-3.5 shadow-md ${panel}`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">

                    {/* Ombor */}
                    <div className="sm:w-52 shrink-0">
                        <label className={`mb-1.5 flex items-center gap-1.5 text-xs font-semibold ${muted}`}>
                            <LuWarehouse size={11} /> Ombor
                        </label>
                        <select
                            value={warehouseFilter}
                            onChange={(e) => { setWarehouseFilter(e.target.value); setPage(0); }}
                            className={inputCx}
                        >
                            <option value="">Barcha omborlar</option>
                            {warehouses.map((w) => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Qidiruv */}
                    <div className="flex-1">
                        <label className={`mb-1.5 flex items-center gap-1.5 text-xs font-semibold ${muted}`}>
                            <LuSearch size={11} /> Qidiruv
                        </label>
                        <div className="relative">
                            <LuSearch className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 ${muted}`} />
                            <input
                                type="text"
                                placeholder="Mahsulot nomi yoki barcode..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className={`${inputCx} pl-10 pr-9`}
                            />
                            {search && (
                                <button type="button" onClick={() => setSearch('')}
                                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${muted} hover:text-slate-700`}>
                                    <LuX size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Table ───────────────────────────────────────────────── */}
            <div className={`rounded-2xl border shadow-md overflow-hidden ${panel}`}>
                {isFetching ? (
                    <div className={`flex flex-col items-center gap-3 py-20 ${muted}`}>
                        <svg className="h-7 w-7 animate-spin text-amber-400" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                        </svg>
                        <span className="text-sm">Yuklanmoqda...</span>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className={`flex flex-col items-center gap-2.5 py-20 ${muted}`}>
                        <LuPackage size={36} strokeWidth={1.5} />
                        <p className="text-sm font-medium">Ma&apos;lumot topilmadi</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className={`text-left text-xs font-semibold uppercase tracking-wide border-b ${muted} ${isDark ? 'bg-slate-900/30 border-slate-700/60' : 'bg-slate-50/80 border-slate-200'}`}>
                                        <th className="px-5 py-3">#</th>
                                        <th className="px-5 py-3">Mahsulot</th>
                                        <th className="px-5 py-3">Barcode</th>
                                        <th className="px-5 py-3">Oxirgi yangilanish</th>
                                        <th className="px-5 py-3 text-right">Qoldiq</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${divider}`}>
                                    {filtered.map((s, idx) => (
                                        <tr key={`${s.productId}-${s.warehouseId}`} className={`transition-colors ${rowHov}`}>
                                            <td className={`px-5 py-3.5 text-xs ${muted}`}>{page * PAGE_SIZE + idx + 1}</td>
                                            <td className={`px-5 py-3.5 font-semibold ${head}`}>{s.productName}</td>
                                            <td className={`px-5 py-3.5 font-mono text-xs ${muted}`}>
                                                <span className="flex items-center gap-1.5">
                                                    <LuBarcode size={12} />{s.productBarcode}
                                                </span>
                                            </td>
                                            <td className={`px-5 py-3.5 text-xs ${muted}`}>
                                                {s.lastModifiedAt ? new Date(s.lastModifiedAt).toLocaleString('uz-UZ') : '—'}
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <QtyBadge qty={s.quantity} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile */}
                        <div className={`flex flex-col divide-y md:hidden ${divider}`}>
                            {filtered.map((s) => (
                                <div key={`${s.productId}-${s.warehouseId}`}
                                    className={`flex items-center justify-between gap-3 px-4 py-3.5 transition-colors ${rowHov}`}>
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isDark ? 'bg-amber-400/10 text-amber-300' : 'bg-amber-50 text-amber-600'}`}>
                                            <LuPackage size={16} />
                                        </span>
                                        <div className="min-w-0">
                                            <p className={`truncate font-semibold text-sm ${head}`}>{s.productName}</p>
                                            <p className={`text-xs font-mono ${muted}`}>{s.productBarcode}</p>
                                        </div>
                                    </div>
                                    <QtyBadge qty={s.quantity} />
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Pagination */}
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

function QtyBadge({ qty }) {
    const cls = qty > 10
        ? 'bg-emerald-500/10 text-emerald-500'
        : qty > 0
        ? 'bg-amber-500/10 text-amber-500'
        : 'bg-rose-500/10 text-rose-500';
    return (
        <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${cls}`}>
            {qty} dona
        </span>
    );
}
