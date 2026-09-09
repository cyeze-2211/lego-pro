import { useState, useCallback } from 'react';
import {
    LuPlus, LuSearch, LuTrash2, LuPackage, LuSend,
    LuX, LuCircleAlert, LuCircleCheck, LuWarehouse, LuMinus, LuFlame,
} from 'react-icons/lu';
import { useAppTheme } from '../../../theme/tokens';
import { useGetWarehousesQuery } from '../../../store/services/warehouse.api';
import { useGetRawMaterialsQuery } from '../../../store/services/raw.api';
import { useCreateRawMaterialTransactionMutation } from '../../../store/services/rawMaterialStock.api';

const UNITS = ['GRAM', 'KG', 'TON'];

export default function RawTransactionForm({ action }) {
    const { isDark } = useAppTheme();
    const isIn = action === 'IN';

    const [warehouseId, setWarehouseId] = useState('');
    const [search, setSearch]           = useState('');
    const [items, setItems]             = useState([]);  // { rawMaterialId, rawMaterialName, quantity, unit }
    const [toast, setToast]             = useState(null);

    const { data: warehouses = [] }           = useGetWarehousesQuery('RAW_MATERIAL');
    const { data: rawResp, isFetching }       = useGetRawMaterialsQuery(
        { name: search || undefined, size: 50 },
        { skip: !warehouseId }
    );
    const [createTx, { isLoading: isSending }] = useCreateRawMaterialTransactionMutation();

    const rawMaterials = rawResp?.items ?? [];

    /* ── theme ─────────────────────────────────────────────────────────── */
    const panel   = isDark ? 'border-white/10 bg-[#141C2B]' : 'border-slate-200 bg-white';
    const muted   = isDark ? 'text-slate-400' : 'text-slate-500';
    const head    = isDark ? 'text-white' : 'text-slate-900';
    const divider = isDark ? 'divide-slate-700/50' : 'divide-slate-100';
    const rowBg   = isDark ? 'hover:bg-slate-800/60' : 'hover:bg-amber-50/50';
    const badge   = isIn
        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
        : 'bg-rose-500/10 text-rose-500 border-rose-500/20';
    const submitBtn = isIn
        ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
        : 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20';
    const inputCx = [
        'w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all duration-200 h-[42px]',
        isDark
            ? 'border-slate-700 bg-slate-800/80 text-white placeholder:text-slate-500 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20'
            : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20',
    ].join(' ');

    /* ── helpers ─────────────────────────────────────────────────────── */
    const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 3500); };

    const addItem = useCallback((mat) => {
        setItems((prev) => {
            if (prev.find((i) => i.rawMaterialId === mat.id)) return prev;
            return [...prev, { rawMaterialId: mat.id, rawMaterialName: mat.name, quantity: 1, unit: 'KG' }];
        });
        setSearch('');
    }, []);

    const removeItem = (id) => setItems((p) => p.filter((i) => i.rawMaterialId !== id));

    const updateField = (id, field, val) => {
        setItems((p) => p.map((i) => i.rawMaterialId === id ? { ...i, [field]: val } : i));
    };

    const stepQty = (id, delta) => {
        setItems((p) => p.map((i) =>
            i.rawMaterialId === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i
        ));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!warehouseId || items.length === 0) return;
        try {
            await createTx({
                warehouseId,
                action,
                items: items.map(({ rawMaterialId, quantity, unit }) => ({
                    rawMaterialId,
                    quantity: parseInt(quantity, 10),
                    unit,
                })),
            }).unwrap();
            showToast('success', `${isIn ? 'Kirim' : 'Chiqim'} muvaffaqiyatli amalga oshirildi!`);
            setItems([]);
        } catch (err) {
            showToast('error', err?.data?.message || `${isIn ? 'Kirim' : 'Chiqim'} amalga oshmadi.`);
        }
    };

    const selectedWarehouse = warehouses.find((w) => w.id === warehouseId);
    const totalItems = items.length;

    return (
        <div className="flex w-full flex-col gap-4 py-2">

            {/* ── Header ────────────────────────────────────────────────── */}
            <div className={`relative overflow-hidden rounded-2xl border px-5 py-4 shadow-md ${panel}`}>
                <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-amber-400/6 to-transparent" />
                <div className="relative flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-lg ${badge}`}>
                            <LuFlame size={18} />
                        </span>
                        <div>
                            <h1 className={`text-xl font-bold tracking-tight leading-tight ${head}`}>
                                {isIn ? 'Xom ashyo Kirimi' : 'Xom ashyo Chiqimi'}
                            </h1>
                            <p className={`text-xs mt-0.5 ${muted}`}>
                                {isIn ? 'Omborga qabul qilinadigan xom ashyolar' : 'Ombordan chiqariladigan xom ashyolar'}
                            </p>
                        </div>
                    </div>
                    {totalItems > 0 && (
                        <span className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold ${badge}`}>
                            <LuPackage size={12} /> {totalItems} xom ashyo
                        </span>
                    )}
                </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                {/* ── Ombor + Qidiruv ─────────────────────────────────── */}
                <div className={`rounded-2xl border p-4 shadow-md ${panel}`}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">

                        {/* Ombor */}
                        <div className="sm:w-56 shrink-0">
                            <label className={`mb-1.5 flex items-center gap-1.5 text-xs font-semibold ${muted}`}>
                                <LuWarehouse size={12} /> Ombor
                            </label>
                            <select
                                value={warehouseId}
                                onChange={(e) => { setWarehouseId(e.target.value); setSearch(''); setItems([]); }}
                                required
                                className={inputCx}
                            >
                                <option value="">Ombor tanlang</option>
                                {warehouses.map((w) => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Qidiruv */}
                        <div className="flex-1">
                            <label className={`mb-1.5 flex items-center gap-1.5 text-xs font-semibold ${muted}`}>
                                <LuSearch size={12} /> Xom ashyo qidirish
                            </label>
                            <div className="relative">
                                <LuSearch className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 ${muted}`} />
                                <input
                                    type="text"
                                    placeholder={warehouseId ? 'Xom ashyo nomini yozing...' : 'Avval ombor tanlang'}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    disabled={!warehouseId}
                                    className={`${inputCx} pl-10 pr-9 disabled:opacity-50 disabled:cursor-not-allowed`}
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

                    {/* Search dropdown */}
                    {warehouseId && (
                        <div className={`mt-2 overflow-hidden rounded-xl border shadow-xl ${isDark ? 'border-slate-700 bg-[#0f172a]' : 'border-slate-200 bg-white'}`}>
                            {isFetching ? (
                                <div className={`flex items-center justify-center gap-2 py-5 text-sm ${muted}`}>
                                    <svg className="h-4 w-4 animate-spin text-amber-400" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                                    </svg>
                                    Qidirilmoqda...
                                </div>
                            ) : rawMaterials.length === 0 ? (
                                <div className={`py-5 text-center text-sm ${muted}`}>Xom ashyo topilmadi</div>
                            ) : (
                                <div className={`max-h-52 overflow-y-auto divide-y ${divider}`}>
                                    {rawMaterials.map((mat) => {
                                        const added = items.some((i) => i.rawMaterialId === mat.id);
                                        return (
                                            <button key={mat.id} type="button"
                                                onClick={() => !added && addItem(mat)}
                                                disabled={added}
                                                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                                                    added ? 'cursor-not-allowed opacity-50'
                                                          : isDark ? 'hover:bg-slate-800' : 'hover:bg-amber-50'
                                                }`}
                                            >
                                                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                                                    <LuFlame size={14} className={muted} />
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <p className={`truncate font-semibold text-sm ${head}`}>{mat.name}</p>
                                                    {mat.summary && <p className={`text-xs truncate ${muted}`}>{mat.summary}</p>}
                                                </div>
                                                {added ? (
                                                    <span className="shrink-0 rounded-full bg-amber-400/10 px-2 py-0.5 text-xs font-semibold text-amber-500">Qo&apos;shilgan</span>
                                                ) : (
                                                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${badge}`}>
                                                        <LuPlus size={12} />
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Items list ────────────────────────────────────────── */}
                <div className={`rounded-2xl border shadow-md ${panel}`}>
                    <div className={`flex items-center justify-between border-b px-5 py-3.5 ${isDark ? 'border-slate-700/60' : 'border-slate-100'}`}>
                        <div className="flex items-center gap-2">
                            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${isIn ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                                {items.length}
                            </span>
                            <h2 className={`text-sm font-bold ${head}`}>Tanlangan xom ashyolar</h2>
                        </div>
                        {items.length > 0 && (
                            <button type="button" onClick={() => setItems([])}
                                className={`text-xs font-medium transition-colors ${muted} hover:text-rose-500`}>
                                Hammasini tozalash
                            </button>
                        )}
                    </div>

                    {items.length === 0 ? (
                        <div className={`flex flex-col items-center gap-2 py-12 ${muted}`}>
                            <LuFlame size={32} strokeWidth={1.5} />
                            <p className="text-sm font-medium">Xom ashyo tanlanmagan</p>
                            <p className="text-xs">Yuqoridagi qidiruvdan xom ashyo qo&apos;shing</p>
                        </div>
                    ) : (
                        <>
                            {/* Desktop */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className={`text-left text-xs font-semibold uppercase tracking-wide ${muted} ${isDark ? 'bg-slate-900/30' : 'bg-slate-50/80'}`}>
                                            <th className="px-5 py-3">Xom ashyo</th>
                                            <th className="px-5 py-3 text-center w-44">Miqdor</th>
                                            <th className="px-5 py-3 w-28">Birlik</th>
                                            <th className="px-5 py-3 w-12"></th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${divider}`}>
                                        {items.map((item) => (
                                            <tr key={item.rawMaterialId} className={`transition-colors ${rowBg}`}>
                                                <td className={`px-5 py-3.5 font-semibold ${head}`}>{item.rawMaterialName}</td>
                                                <td className="px-5 py-3.5">
                                                    <div className={`inline-flex items-center rounded-xl border overflow-hidden ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                                                        <button type="button" onClick={() => stepQty(item.rawMaterialId, -1)}
                                                            className={`flex h-8 w-8 items-center justify-center transition-colors ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'}`}>
                                                            <LuMinus size={12} />
                                                        </button>
                                                        <input type="number" min={1} value={item.quantity}
                                                            onChange={(e) => {
                                                                const v = parseInt(e.target.value, 10);
                                                                if (!isNaN(v) && v >= 1) updateField(item.rawMaterialId, 'quantity', v);
                                                            }}
                                                            className={`h-8 w-16 border-x text-center text-sm font-bold outline-none ${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-900'}`}
                                                        />
                                                        <button type="button" onClick={() => stepQty(item.rawMaterialId, 1)}
                                                            className={`flex h-8 w-8 items-center justify-center transition-colors ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'}`}>
                                                            <LuPlus size={12} />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    {/* Unit select */}
                                                    <div className={`inline-flex rounded-xl border overflow-hidden ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                                                        {UNITS.map((u) => (
                                                            <button key={u} type="button"
                                                                onClick={() => updateField(item.rawMaterialId, 'unit', u)}
                                                                className={`h-8 px-2.5 text-xs font-bold transition-colors ${
                                                                    item.unit === u
                                                                        ? isIn ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                                                                        : isDark ? 'bg-slate-800 text-slate-400 hover:text-slate-200' : 'bg-slate-50 text-slate-500 hover:text-slate-700'
                                                                }`}>
                                                                {u}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 text-right">
                                                    <button type="button" onClick={() => removeItem(item.rawMaterialId)}
                                                        className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${isDark ? 'text-slate-500 hover:bg-rose-500/10 hover:text-rose-400' : 'text-slate-400 hover:bg-rose-50 hover:text-rose-500'}`}>
                                                        <LuTrash2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile */}
                            <div className={`flex flex-col divide-y md:hidden ${divider}`}>
                                {items.map((item) => (
                                    <div key={item.rawMaterialId} className={`px-4 py-3.5 transition-colors ${rowBg}`}>
                                        <div className="flex items-start justify-between gap-2 mb-3">
                                            <p className={`font-semibold text-sm ${head}`}>{item.rawMaterialName}</p>
                                            <button type="button" onClick={() => removeItem(item.rawMaterialId)}
                                                className={`shrink-0 flex h-7 w-7 items-center justify-center rounded-lg ${isDark ? 'text-slate-500 hover:text-rose-400' : 'text-slate-400 hover:text-rose-500'}`}>
                                                <LuTrash2 size={14} />
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <div className={`inline-flex items-center rounded-xl border overflow-hidden ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                                                <button type="button" onClick={() => stepQty(item.rawMaterialId, -1)}
                                                    className={`flex h-8 w-8 items-center justify-center ${isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-50 hover:bg-slate-100'}`}>
                                                    <LuMinus size={12} />
                                                </button>
                                                <input type="number" min={1} value={item.quantity}
                                                    onChange={(e) => { const v = parseInt(e.target.value, 10); if (!isNaN(v) && v >= 1) updateField(item.rawMaterialId, 'quantity', v); }}
                                                    className={`h-8 w-14 border-x text-center text-sm font-bold outline-none ${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-900'}`}
                                                />
                                                <button type="button" onClick={() => stepQty(item.rawMaterialId, 1)}
                                                    className={`flex h-8 w-8 items-center justify-center ${isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-50 hover:bg-slate-100'}`}>
                                                    <LuPlus size={12} />
                                                </button>
                                            </div>
                                            <div className={`inline-flex rounded-xl border overflow-hidden ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                                                {UNITS.map((u) => (
                                                    <button key={u} type="button"
                                                        onClick={() => updateField(item.rawMaterialId, 'unit', u)}
                                                        className={`h-8 px-2.5 text-xs font-bold transition-colors ${
                                                            item.unit === u
                                                                ? isIn ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                                                                : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-500'
                                                        }`}>
                                                        {u}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Footer */}
                            <div className={`flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3.5 ${isDark ? 'border-slate-700/60' : 'border-slate-100'}`}>
                                <div className="flex items-center gap-4">
                                    <span className={`text-sm ${muted}`}>
                                        Jami: <span className={`font-bold ${head}`}>{items.length} xom ashyo</span>
                                    </span>
                                    {selectedWarehouse && (
                                        <span className={`hidden sm:inline-flex items-center gap-1 text-xs font-medium ${muted}`}>
                                            <LuWarehouse size={12} />{selectedWarehouse.name}
                                        </span>
                                    )}
                                </div>
                                <button type="submit"
                                    disabled={isSending || items.length === 0 || !warehouseId}
                                    className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl hover:-translate-y-px ${submitBtn}`}>
                                    {isSending ? (
                                        <>
                                            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                                            </svg>
                                            Saqlanmoqda...
                                        </>
                                    ) : (
                                        <>
                                            <LuSend size={15} />
                                            {isIn ? 'Kirimni tasdiqlash' : 'Chiqimni tasdiqlash'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </form>

            {/* ── Toast ────────────────────────────────────────────────── */}
            {toast && (
                <div className={`fixed bottom-6 right-4 sm:right-6 z-50 flex items-center gap-3 rounded-2xl border px-4 py-3.5 shadow-2xl ${
                    toast.type === 'success'
                        ? isDark ? 'border-emerald-500/30 bg-[#0d1f17] text-emerald-300' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : isDark ? 'border-rose-500/30 bg-[#1f0d0d] text-rose-300'       : 'border-rose-200 bg-rose-50 text-rose-700'
                }`}>
                    {toast.type === 'success' ? <LuCircleCheck size={18} /> : <LuCircleAlert size={18} />}
                    <span className="text-sm font-semibold max-w-xs">{toast.msg}</span>
                    <button type="button" onClick={() => setToast(null)} className="ml-1 opacity-50 hover:opacity-100">
                        <LuX size={13} />
                    </button>
                </div>
            )}
        </div>
    );
}
