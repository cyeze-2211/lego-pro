import { useState } from 'react';
import {
    LuHistory, LuSearch, LuChevronLeft, LuChevronRight,
    LuLogIn, LuLogOut, LuBarcode, LuX, LuPackage, LuWarehouse,
} from 'react-icons/lu';
import { useAppTheme } from '../../../theme/tokens';
import { useGetStockTransactionsQuery } from '../../../store/services/productStock.api';
import { useGetWarehousesQuery } from '../../../store/services/warehouse.api';

const PAGE_SIZE = 20;

export default function StaffHistory() {
    const { isDark } = useAppTheme();
    const [page, setPage]                       = useState(0);
    const [warehouseFilter, setWarehouseFilter] = useState('');
    const [actionFilter, setActionFilter]       = useState('');
    const [search, setSearch]                   = useState('');

    const { data: warehouses = [] } = useGetWarehousesQuery('PRODUCT');
    const { data, isFetching }      = useGetStockTransactionsQuery({
        warehouseId: warehouseFilter || undefined,
        action:      actionFilter     || undefined,
        page,
        size: PAGE_SIZE,
    });

    const transactions = data?.data       ?? [];
    const pagination   = data?.pagination ?? {};
    const filtered     = search
        ? transactions.filter((t) =>
              t.productName?.toLowerCase().includes(search.toLowerCase()) ||
              t.productBarcode?.includes(search))
        : transactions;

    const hasFilters = warehouseFilter || actionFilter || search;
    const resetFilters = () => { setWarehouseFilter(''); setActionFilter(''); setSearch(''); setPage(0); };

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
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-amber-400/10 text-amber-500 border-amber-400/20">
                            <LuHistory size={18} />
                        </span>
                        <div>
                            <h1 className={`text-xl font-bold tracking-tight ${head}`}>Operatsiyalar Tarixi</h1>
                            <p className={`text-xs mt-0.5 ${muted}`}>Barcha kirim va chiqim operatsiyalari</p>
                        </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold bg-amber-400/10 text-amber-500 border-amber-400/20">
                        {pagination.totalElements ?? 0} yozuv
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

                    {/* Action toggle + reset */}
                    <div className="flex items-end gap-2">
                        <div>
                            <label className={`mb-1.5 block text-xs font-semibold ${muted}`}>Yo&apos;nalish</label>
                            <div className={`flex rounded-xl border overflow-hidden ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                                {[
                                    { value: '',    label: 'Barchasi', cls: isDark ? 'bg-amber-400/10 text-amber-300' : 'bg-amber-50 text-amber-700' },
                                    { value: 'IN',  label: 'Kirim',    cls: 'bg-emerald-500/10 text-emerald-500' },
                                    { value: 'OUT', label: 'Chiqim',   cls: 'bg-rose-500/10 text-rose-500' },
                                ].map(({ value, label, cls }) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => { setActionFilter(value); setPage(0); }}
                                        className={`h-[42px] px-3.5 text-sm font-semibold transition-colors ${
                                            actionFilter === value
                                                ? cls
                                                : isDark
                                                ? 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                                                : 'bg-white text-slate-500 hover:text-slate-700'
                                        }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {hasFilters && (
                            <button
                                type="button"
                                onClick={resetFilters}
                                className={`flex h-[42px] items-center gap-1.5 rounded-xl border px-3 text-sm font-medium transition-colors ${isDark ? 'border-slate-700 bg-slate-800/80 text-slate-400 hover:text-rose-400' : 'border-slate-200 text-slate-500 hover:text-rose-500 hover:bg-rose-50'}`}
                            >
                                <LuX size={13} /> Tozalash
                            </button>
                        )}
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
                        {hasFilters && (
                            <button type="button" onClick={resetFilters}
                                className="text-xs font-semibold text-amber-500 hover:text-amber-600 mt-1">
                                Filtrlarni tozalash
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Desktop */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className={`text-left text-xs font-semibold uppercase tracking-wide border-b ${muted} ${isDark ? 'bg-slate-900/30 border-slate-700/60' : 'bg-slate-50/80 border-slate-200'}`}>
                                        <th className="px-5 py-3">#</th>
                                        <th className="px-5 py-3">Yo&apos;nalish</th>
                                        <th className="px-5 py-3">Mahsulot</th>
                                        <th className="px-5 py-3">Barcode</th>
                                        <th className="px-5 py-3 text-right">Miqdor</th>
                                        <th className="px-5 py-3">Sana</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${divider}`}>
                                    {filtered.map((t, idx) => (
                                        <tr key={t.id} className={`transition-colors ${rowHov}`}>
                                            <td className={`px-5 py-3.5 text-xs ${muted}`}>{page * PAGE_SIZE + idx + 1}</td>
                                            <td className="px-5 py-3.5"><ActionBadge action={t.action} /></td>
                                            <td className={`px-5 py-3.5 font-semibold ${head}`}>{t.productName}</td>
                                            <td className={`px-5 py-3.5 font-mono text-xs ${muted}`}>
                                                <span className="flex items-center gap-1.5">
                                                    <LuBarcode size={12} />{t.productBarcode}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${t.action === 'IN' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                                    {t.action === 'IN' ? '+' : '-'}{t.quantity} dona
                                                </span>
                                            </td>
                                            <td className={`px-5 py-3.5 text-xs ${muted}`}>
                                                {t.createdAt ? new Date(t.createdAt).toLocaleString('uz-UZ') : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile */}
                        <div className={`flex flex-col divide-y md:hidden ${divider}`}>
                            {filtered.map((t) => (
                                <div key={t.id} className={`flex items-center justify-between gap-3 px-4 py-3.5 transition-colors ${rowHov}`}>
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${t.action === 'IN' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                            {t.action === 'IN' ? <LuLogIn size={16} /> : <LuLogOut size={16} />}
                                        </span>
                                        <div className="min-w-0">
                                            <p className={`truncate font-semibold text-sm ${head}`}>{t.productName}</p>
                                            <p className={`text-xs ${muted}`}>
                                                {t.createdAt ? new Date(t.createdAt).toLocaleString('uz-UZ') : '—'}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${t.action === 'IN' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                        {t.action === 'IN' ? '+' : '-'}{t.quantity} dona
                                    </span>
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

function ActionBadge({ action }) {
    const isIn = action === 'IN';
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${isIn ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
            {isIn ? <LuLogIn size={11} /> : <LuLogOut size={11} />}
            {isIn ? 'Kirim' : 'Chiqim'}
        </span>
    );
}
