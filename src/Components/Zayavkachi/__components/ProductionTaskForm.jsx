import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
    LuSearch, LuPackage, LuSend, LuCheck, LuX,
    LuStickyNote, LuCog,
} from 'react-icons/lu';
import { useAppTheme } from '../../../theme/tokens';
import { Alert } from '../../Other/UI/Alert/Alert';
import { useGetProductsQuery } from '../../../store/services/product.api';
import { useCreateProductionTaskMutation } from '../../../store/services/productionTask.api';

export default function ProductionTaskForm({ machine, onSent }) {
    const { isDark } = useAppTheme();
    const currentRun = machine.currentRun;

    // stanok hozir ishlab chiqarayotgan mahsulot avtomatik tanlanadi
    const [productId, setProductId]         = useState(currentRun?.productId ?? '');
    const [productName, setProductName]     = useState(currentRun?.productName ?? '');
    const [productSearch, setProductSearch] = useState(currentRun?.productName ?? '');
    const [open, setOpen]                   = useState(false);
    const [note, setNote]                   = useState('');
    const searchRef                         = useRef(null);
    const touchedRef                        = useRef(false);

    const { data: productsResp, isFetching } = useGetProductsQuery({ name: productSearch || undefined, size: 50 });
    const [createTask, { isLoading: isSending }] = useCreateProductionTaskMutation();

    const products = productsResp?.items ?? [];

    // foydalanuvchi maydonga tegmagan bo'lsa, joriy seans o'zgarganda tanlov yangilanadi
    useEffect(() => {
        if (touchedRef.current || !currentRun?.productId) return;
        setProductId(currentRun.productId);
        setProductName(currentRun.productName);
        setProductSearch(currentRun.productName);
    }, [currentRun?.productId, currentRun?.productName]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    /* ── theme tokens ──────────────────────────────────────────────── */
    const panel   = isDark ? 'border-white/10 bg-[#141C2B]' : 'border-[#e2e8f0] bg-white';
    const muted   = isDark ? 'text-[#94a3b8]' : 'text-[#64748b]';
    const head    = isDark ? 'text-white' : 'text-[#0f172a]';
    const divider = isDark ? 'divide-[#334155]/50' : 'divide-[#f1f5f9]';
    const line    = isDark ? 'border-[#334155]/60' : 'border-[#f1f5f9]';
    const badge   = 'bg-[#FACC15]/10 text-[#EAB308] border-[#FACC15]/30';
    const submitBtn = 'bg-[#FACC15] hover:bg-[#EAB308] text-[#0F172A] shadow-[#FACC15]/30';
    const fieldCx = isDark
        ? 'border-[#334155] bg-[#1e293b]/80 text-white placeholder:text-[#64748b] focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20'
        : 'border-[#e2e8f0] bg-white text-[#0f172a] placeholder:text-[#94a3b8] focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20';
    const inputCx = `w-full rounded-xl border px-4 text-sm outline-none transition-all duration-200 h-12 ${fieldCx}`;
    const textareaCx = `w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all duration-200 min-h-[100px] resize-y ${fieldCx}`;
    const stepCx = 'flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-[#0f172a]';

    /* ── helpers ───────────────────────────────────────────────────── */
    const selectProduct = (product) => {
        touchedRef.current = true;
        setProductId(product.id);
        setProductName(product.name);
        setProductSearch(product.name);
        setOpen(false);
    };

    const resetProduct = () => {
        touchedRef.current = true;
        setProductId('');
        setProductName('');
        setProductSearch('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!productId) {
            Alert('Mahsulotni tanlang', 'error');
            return;
        }
        try {
            await createTask({
                machineId: machine.id,
                productId,
                note: note.trim() || null,
            }).unwrap();
            Alert('Topshiriq stanokka yuborildi', 'success');
            touchedRef.current = false;
            setProductId(currentRun?.productId ?? '');
            setProductName(currentRun?.productName ?? '');
            setProductSearch(currentRun?.productName ?? '');
            setNote('');
            if (onSent) onSent();
        } catch (error) {
            Alert(error?.data?.message || 'Topshiriq yuborishda xatolik', 'error');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className={`rounded-2xl border shadow-md ${panel}`}>
                <div className={`flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3.5 ${line}`}>
                    <div className="flex items-center gap-2.5">
                        <span className={`flex h-9 w-9 items-center justify-center rounded-xl border ${badge}`}>
                            <LuSend size={16} />
                        </span>
                        <div>
                            <h2 className={`text-sm font-bold ${head}`}>Topshiriq yuborish</h2>
                            <p className={`text-xs ${muted}`}>Stanokchiga qaysi mahsulot ishlab chiqarilishini bildiring</p>
                        </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold ${badge}`}>
                        <LuCog size={13} /> {machine.name}
                    </span>
                </div>

                <div className="flex flex-col gap-4 p-5">
                    {/* 1 — Mahsulot */}
                    <div className="relative" ref={searchRef}>
                        <label className={`mb-1.5 flex items-center gap-2 text-xs font-semibold ${muted}`}>
                            <span className={stepCx}>1</span> <LuPackage size={12} /> Mahsulot
                        </label>
                        <div className="relative sm:max-w-lg">
                            <LuSearch className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 ${muted}`} />
                            <input
                                type="text"
                                placeholder="Mahsulot nomini yozing yoki ro'yxatdan tanlang"
                                value={productSearch}
                                onChange={(e) => { touchedRef.current = true; setProductSearch(e.target.value); setProductId(''); setOpen(true); }}
                                onFocus={() => setOpen(true)}
                                className={`${inputCx} pl-11 pr-10`}
                            />
                            {productSearch && (
                                <button type="button" onClick={resetProduct}
                                    className={`absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg ${muted} hover:text-[#f43f5e]`}>
                                    <LuX size={15} />
                                </button>
                            )}
                        </div>

                        {/* Ro'yxat sahifani cho'zmaydi, ustidan ochiladi */}
                        {open && (
                            <div className={`absolute left-0 top-full z-20 mt-2 w-full overflow-hidden rounded-xl border shadow-xl sm:max-w-lg ${isDark ? 'border-[#334155] bg-[#0f172a]' : 'border-[#e2e8f0] bg-white'}`}>
                                {isFetching ? (
                                    <div className={`flex items-center justify-center gap-2 py-6 text-sm ${muted}`}>
                                        <svg className="h-4 w-4 animate-spin text-amber-400" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                                        </svg>
                                        Qidirilmoqda...
                                    </div>
                                ) : products.length === 0 ? (
                                    <div className={`py-6 text-center text-sm ${muted}`}>Mahsulot topilmadi</div>
                                ) : (
                                    <div className={`max-h-72 overflow-y-auto divide-y ${divider}`}>
                                        {products.map((p) => {
                                            const picked = p.id === productId;
                                            return (
                                                <button key={p.id} type="button"
                                                    onClick={() => selectProduct(p)}
                                                    className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors ${isDark ? 'hover:bg-[#1e293b]' : 'hover:bg-amber-50'}`}
                                                >
                                                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isDark ? 'bg-[#334155]' : 'bg-[#f1f5f9]'}`}>
                                                        <LuPackage size={15} className={muted} />
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <p className={`truncate font-semibold text-sm ${head}`}>{p.name}</p>
                                                        {p.barcode && <p className={`truncate text-xs ${muted}`}>{p.barcode}</p>}
                                                    </div>
                                                    {picked && (
                                                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-400/10 text-amber-500">
                                                            <LuCheck size={14} />
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

                    {/* 2 — Izoh */}
                    <div>
                        <label className={`mb-1.5 flex items-center gap-2 text-xs font-semibold ${muted}`}>
                            <span className={stepCx}>2</span> <LuStickyNote size={12} /> Izoh <span className="font-normal">(ixtiyoriy)</span>
                        </label>
                        <textarea
                            rows={3}
                            maxLength={2000}
                            placeholder="Stanokchi uchun qo'shimcha ko'rsatma yozing"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className={textareaCx}
                        />
                    </div>
                </div>

                <div className={`flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4 ${line}`}>
                    <span className={`text-sm ${muted}`}>
                        {productId
                            ? <>
                                Tanlandi: <span className={`font-bold ${head}`}>{productName}</span>
                                {productId === currentRun?.productId && (
                                    <span className="ml-2 text-xs">(hozir ishlab chiqarilmoqda)</span>
                                )}
                            </>
                            : 'Mahsulot tanlanmagan'}
                    </span>
                    <button type="submit" disabled={isSending || !productId}
                        className={`flex h-12 items-center gap-2 rounded-xl px-7 text-sm font-bold shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl hover:-translate-y-px ${submitBtn}`}>
                        {isSending ? (
                            <>
                                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                                </svg>
                                Yuborilmoqda...
                            </>
                        ) : (
                            <>
                                <LuSend size={15} /> Stanokka yuborish
                            </>
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
}

ProductionTaskForm.propTypes = {
    machine: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        currentRun: PropTypes.shape({
            productId: PropTypes.string,
            productName: PropTypes.string,
        }),
    }).isRequired,
    onSent: PropTypes.func,
};
