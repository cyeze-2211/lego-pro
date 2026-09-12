import { useState, useRef, useEffect, useCallback } from 'react';
import {
    LuPlus, LuSearch, LuTrash2, LuPackage, LuSend, LuCheck,
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
    const [open, setOpen]               = useState(false);
    const [items, setItems]             = useState([]);  // { rawMaterialId, rawMaterialName, quantity, unit }
    const [toast, setToast]             = useState(null);
    const searchRef                     = useRef(null);

    const { data: warehouses = [] }           = useGetWarehousesQuery('RAW_MATERIAL');
    const { data: rawResp, isFetching }       = useGetRawMaterialsQuery(
        { name: search || undefined, size: 50 },
        { skip: !warehouseId }
    );
    const [createTx, { isLoading: isSending }] = useCreateRawMaterialTransactionMutation();

    const rawMaterials = rawResp?.items ?? [];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    /* ── theme ─────────────────────────────────────────────────────────── */
    const panel   = isDark ? 'border-white/10 bg-[#141C2B]' : 'border-[#e2e8f0] bg-white';
    const muted   = isDark ? 'text-[#94a3b8]' : 'text-[#64748b]';
    const head    = isDark ? 'text-white' : 'text-[#0f172a]';
    const divider = isDark ? 'divide-[#334155]/50' : 'divide-[#f1f5f9]';
    const line    = isDark ? 'border-[#334155]/60' : 'border-[#f1f5f9]';
    const rowBg   = isDark ? 'hover:bg-[#1e293b]/60' : 'hover:bg-amber-50/50';
    const badge   = isIn
        ? 'bg-[#FACC15]/10 text-[#EAB308] border-[#FACC15]/30'
        : 'bg-[#f43f5e]/10 text-[#f43f5e] border-[#f43f5e]/20';
    const submitBtn = isIn
        ? 'bg-[#FACC15] hover:bg-[#EAB308] text-[#0F172A] shadow-[#FACC15]/30'
        : 'bg-[#f43f5e] hover:bg-[#e11d48] text-white shadow-[#f43f5e]/20';
    const inputCx = [
        'w-full rounded-xl border px-4 text-sm outline-none transition-all duration-200 h-12',
        isDark
            ? 'border-[#334155] bg-[#1e293b]/80 text-white placeholder:text-[#64748b] focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20'
            : 'border-[#e2e8f0] bg-white text-[#0f172a] placeholder:text-[#94a3b8] focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20',
    ].join(' ');
    const stepCx = 'flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-[#0f172a]';

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
                        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${badge}`}>
                            <LuFlame size={20} />
                        </span>
                        <div>
                            <h1 className={`text-xl font-bold tracking-tight leading-tight ${head}`}>
                                {isIn ? 'Xom ashyo Kirimi' : 'Xom ashyo Chiqimi'}
                            </h1>
                            <p className={`text-sm mt-0.5 ${muted}`}>
                                {isIn
                                    ? 'Omborga qabul qilingan xom ashyolarni kiriting'
                                    : 'Ombordan chiqarilgan xom ashyolarni kiriting'}
                            </p>
                        </div>
                    </div>
                    <div className='flex gap-2'>
                          {totalItems > 0 && (
                        <span className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-bold ${badge}`}>
                            <LuPackage size={14} /> {totalItems} ta tanlandi
                        </span>
                    )}
                     <button type="submit"
                                    disabled={isSending || items.length === 0 || !warehouseId}
                                    className={`flex h-12 items-center gap-2 rounded-xl px-7 text-sm font-bold shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl hover:-translate-y-px ${submitBtn}`}>
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
                  
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className={`rounded-2xl border shadow-md ${panel}`}>

                    {/* ── Ombor + Qidiruv ─────────────────────────────── */}
                    <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-end">

                        <div className="sm:w-64 shrink-0">
                            <label className={`mb-1.5 flex items-center gap-2 text-xs font-semibold ${muted}`}>
                                <span className={stepCx}>1</span> Ombor
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

                        <div className="relative flex-1" ref={searchRef}>
                            <label className={`mb-1.5 flex items-center gap-2 text-xs font-semibold ${muted}`}>
                                <span className={stepCx}>2</span> Xom ashyo qo&apos;shish
                            </label>
                            <div className="relative">
                                <LuSearch className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 ${muted}`} />
                                <input
                                    type="text"
                                    placeholder={warehouseId ? "Nomini yozing yoki ro'yxatdan tanlang" : 'Avval ombor tanlang'}
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
                                    onFocus={() => setOpen(true)}
                                    disabled={!warehouseId}
                                    className={`${inputCx} pl-11 pr-10 disabled:opacity-50 disabled:cursor-not-allowed`}
                                />
                                {search && (
                                    <button type="button" onClick={() => setSearch('')}
                                        className={`absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg ${muted} hover:text-[#f43f5e]`}>
                                        <LuX size={15} />
                                    </button>
                                )}
                            </div>

                            {/* Qidiruv natijalari — sahifani cho'zmaydi, ustidan ochiladi */}
                            {open && warehouseId && (
                                <div className={`absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-xl border shadow-xl ${isDark ? 'border-[#334155] bg-[#0f172a]' : 'border-[#e2e8f0] bg-white'}`}>
                                    {isFetching ? (
                                        <div className={`flex items-center justify-center gap-2 py-6 text-sm ${muted}`}>
                                            <svg className="h-4 w-4 animate-spin text-amber-400" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                                            </svg>
                                            Qidirilmoqda...
                                        </div>
                                    ) : rawMaterials.length === 0 ? (
                                        <div className={`py-6 text-center text-sm ${muted}`}>Xom ashyo topilmadi</div>
                                    ) : (
                                        <div className={`max-h-72 overflow-y-auto divide-y ${divider}`}>
                                            {rawMaterials.map((mat) => {
                                                const added = items.some((i) => i.rawMaterialId === mat.id);
                                                return (
                                                    <button key={mat.id} type="button"
                                                        onClick={() => !added && addItem(mat)}
                                                        disabled={added}
                                                        className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors ${
                                                            added ? 'cursor-not-allowed opacity-50'
                                                                  : isDark ? 'hover:bg-[#1e293b]' : 'hover:bg-amber-50'
                                                        }`}
                                                    >
                                                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isDark ? 'bg-[#334155]' : 'bg-[#f1f5f9]'}`}>
                                                            <LuFlame size={15} className={muted} />
                                                        </span>
                                                        <div className="min-w-0 flex-1">
                                                            <p className={`truncate font-semibold text-sm ${head}`}>{mat.name}</p>
                                                            {mat.summary && <p className={`text-xs truncate ${muted}`}>{mat.summary}</p>}
                                                        </div>
                                                        {added ? (
                                                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-400/10 text-amber-500">
                                                                <LuCheck size={14} />
                                                            </span>
                                                        ) : (
                                                            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${badge}`}>
                                                                <LuPlus size={14} />
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
                    </div>

                    {/* ── Tanlanganlar ────────────────────────────────── */}
                    <div className={`flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3.5 ${line}`}>
                        <div className="flex items-center gap-2">
                            <span className={stepCx}>3</span>
                            <h2 className={`text-sm font-bold ${head}`}>Tanlangan xom ashyolar</h2>
                            {items.length > 0 && (
                                <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${badge}`}>{items.length}</span>
                            )}
                        </div>
                        {items.length > 0 && (
                            <button type="button" onClick={() => setItems([])}
                                className={`text-xs font-semibold transition-colors ${muted} hover:text-[#f43f5e]`}>
                                Hammasini tozalash
                            </button>
                        )}
                    </div>

                    {items.length === 0 ? (
                        <div className={`flex flex-col items-center gap-2 py-12 ${muted}`}>
                            <LuFlame size={34} strokeWidth={1.5} />
                            <p className="text-sm font-semibold">Hozircha xom ashyo qo&apos;shilmagan</p>
                            <p className="text-xs">Yuqoridagi qidiruvdan kerakli xom ashyoni tanlang</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className={`text-left text-xs font-semibold uppercase tracking-wide ${muted} ${isDark ? 'bg-[#0f172a]/30' : 'bg-[#f8fafc]/80'}`}>
                                            <th className="px-5 py-3">Xom ashyo</th>
                                            <th className="px-5 py-3 w-52">Miqdor</th>
                                            <th className="px-5 py-3 w-64">O&apos;lchov birligi</th>
                                            <th className="px-5 py-3 w-16"></th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${divider}`}>
                                        {items.map((item, idx) => (
                                            <tr key={item.rawMaterialId} className={`transition-colors ${rowBg}`}>
                                                <td className="px-5 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <span className={`w-4 shrink-0 text-xs font-bold ${muted}`}>{idx + 1}</span>
                                                        <span className={`font-semibold ${head}`}>{item.rawMaterialName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <div className={`inline-flex items-center rounded-xl border overflow-hidden ${isDark ? 'border-[#334155]' : 'border-[#e2e8f0]'}`}>
                                                        <button type="button" onClick={() => stepQty(item.rawMaterialId, -1)}
                                                            aria-label="Kamaytirish"
                                                            className={`flex h-11 w-11 items-center justify-center transition-colors ${isDark ? 'bg-[#1e293b] hover:bg-[#334155] text-[#cbd5e1]' : 'bg-[#f8fafc] hover:bg-[#f1f5f9] text-[#475569]'}`}>
                                                            <LuMinus size={15} />
                                                        </button>
                                                        <input type="number" min={1} value={item.quantity}
                                                            onChange={(e) => {
                                                                const v = parseInt(e.target.value, 10);
                                                                if (!isNaN(v) && v >= 1) updateField(item.rawMaterialId, 'quantity', v);
                                                            }}
                                                            className={`h-11 w-20 border-x text-center text-base font-bold outline-none ${isDark ? 'border-[#334155] bg-[#0f172a] text-white' : 'border-[#e2e8f0] bg-white text-[#0f172a]'}`}
                                                        />
                                                        <button type="button" onClick={() => stepQty(item.rawMaterialId, 1)}
                                                            aria-label="Ko'paytirish"
                                                            className={`flex h-11 w-11 items-center justify-center transition-colors ${isDark ? 'bg-[#1e293b] hover:bg-[#334155] text-[#cbd5e1]' : 'bg-[#f8fafc] hover:bg-[#f1f5f9] text-[#475569]'}`}>
                                                            <LuPlus size={15} />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <div className={`inline-flex rounded-xl border overflow-hidden ${isDark ? 'border-[#334155]' : 'border-[#e2e8f0]'}`}>
                                                        {UNITS.map((u) => (
                                                            <button key={u} type="button"
                                                                onClick={() => updateField(item.rawMaterialId, 'unit', u)}
                                                                className={`h-11 px-4 text-xs font-bold transition-colors ${
                                                                    item.unit === u
                                                                        ? isIn ? 'bg-[#FACC15] text-[#0F172A]' : 'bg-[#f43f5e] text-white'
                                                                        : isDark ? 'bg-[#1e293b] text-[#94a3b8] hover:text-[#e2e8f0]' : 'bg-[#f8fafc] text-[#64748b] hover:text-[#334155]'
                                                                }`}>
                                                                {u}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3 text-right">
                                                    <button type="button" onClick={() => removeItem(item.rawMaterialId)}
                                                        aria-label="O'chirish"
                                                        className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${isDark ? 'text-[#64748b] hover:bg-[#f43f5e]/10 hover:text-[#fb7185]' : 'text-[#94a3b8] hover:bg-[#fff1f2] hover:text-[#f43f5e]'}`}>
                                                        <LuTrash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                        </>
                    )}
                </div>
            </form>

            {/* ── Toast ────────────────────────────────────────────────── */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border px-4 py-3.5 shadow-2xl ${
                    toast.type === 'success'
                        ? isDark ? 'border-[#10b981]/30 bg-[#0d1f17] text-[#6ee7b7]' : 'border-[#a7f3d0] bg-[#ecfdf5] text-[#047857]'
                        : isDark ? 'border-[#f43f5e]/30 bg-[#1f0d0d] text-[#fda4af]'       : 'border-[#fecdd3] bg-[#fff1f2] text-[#be123c]'
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
