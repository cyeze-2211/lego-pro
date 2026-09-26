import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
    LuPlus, LuSearch, LuTrash2, LuPackage, LuSend, LuCheck,
    LuX, LuBarcode, LuArrowLeft,
    LuWarehouse, LuMinus, LuUser, LuStickyNote, LuLock,
    LuChevronDown, LuClipboardList, LuCalendar, LuTag, LuTrendingUp,
} from 'react-icons/lu';
import { useAppTheme } from '../../../theme/tokens';
import { formatNumber } from '../../ui/number-format';
import { Alert } from '../../Other/UI/Alert/Alert';
import { useGetWarehousesQuery } from '../../../store/services/warehouse.api';
import { useGetProductsQuery } from '../../../store/services/product.api';
import { useGetCustomersQuery } from '../../../store/services/customer.api';
import { useCreateSalesOrderMutation, useUpdateSalesOrderMutation, useUpdateSalesOrderPricesMutation, useGetSalesOrdersQuery } from '../../../store/services/salesOrder.api';
import { useAppSelector } from '../../../store/hooks';
import { ROLES } from '../../../app/permissions/roles';

export default function OrderForm({ order, customer, onCancel, onSaved }) {
    const { isDark } = useAppTheme();
    const isEdit = Boolean(order);
    const isCustomerLocked = Boolean(customer);

    const role = useAppSelector((state) => state.auth.role);
    const canEditPrice = role === ROLES.BUXGALTER;

    const [customerId, setCustomerId]         = useState(customer?.id ?? order?.customerId ?? '');
    const [customerSearch, setCustomerSearch] = useState(customer?.name ?? order?.customerName ?? '');
    const [customerOpen, setCustomerOpen]     = useState(false);
    const [summary, setSummary]         = useState(order?.summary ?? '');
    const [warehouseId, setWarehouseId] = useState(order?.items?.[0]?.warehouseId ?? '');
    const [search, setSearch]           = useState('');
    const [open, setOpen]               = useState(false);
    const [expandedOrders, setExpandedOrders] = useState({});
    const [items, setItems]             = useState(() =>
        (order?.items ?? []).map((i) => ({
            id:              i.id,
            productId:      i.productId,
            productName:    i.productName,
            productBarcode: i.productBarcode,
            warehouseId:    i.warehouseId,
            quantity:       i.quantity,
            unitPrice:      i.unitPrice,
        }))
    );
    const customerRef = useRef(null);
    const searchRef   = useRef(null);

    const { data: warehouses = [] }          = useGetWarehousesQuery('PRODUCT');
    const { data: customersResp, isFetching: isCustomerFetching } = useGetCustomersQuery(
        { name: customerSearch || undefined, size: 50 },
        { skip: isCustomerLocked }
    );
    const { data: productsResp, isFetching } = useGetProductsQuery(
        { name: search || undefined, size: 50 },
        { skip: !warehouseId }
    );
    const [createOrder, { isLoading: isCreating }] = useCreateSalesOrderMutation();
    const [updateOrder, { isLoading: isUpdating }] = useUpdateSalesOrderMutation();
    const [updatePrices, { isLoading: isUpdatingPrices }] = useUpdateSalesOrderPricesMutation();
    const isSending = isCreating || isUpdating || isUpdatingPrices;

    // Previous orders for the selected customer (for price reference accordion)
    const prevOrdersCustomerId = customerId || null;
    const { data: prevOrdersData, isFetching: prevOrdersFetching } = useGetSalesOrdersQuery(
        { customerId: prevOrdersCustomerId, status: 'APPROVED', size: 10, sort: ['createdAt,DESC', 'id,DESC'] },
        { skip: !prevOrdersCustomerId }
    );
    const prevOrders = (prevOrdersData?.items ?? []).filter((o) => o.id !== order?.id);

    // Build a map: productId → last used price (from the most recent approved order)
    const lastPriceMap = useMemo(() => {
        const map = {};
        // prevOrders are already sorted DESC by date — first match wins (= most recent)
        for (const o of prevOrders) {
            for (const item of (o.items ?? [])) {
                if (item.productId && !(item.productId in map) && item.unitPrice != null) {
                    map[item.productId] = item.unitPrice;
                }
            }
        }
        return map;
    }, [prevOrders]);

    const customers = customersResp?.items ?? [];
    // product.api transformResponse returns { items, pagination }
    const allProducts = productsResp?.items ?? [];
    // filter client-side by warehouseId (product has warehouseId field)
    const products = warehouseId
        ? allProducts.filter((p) => !p.warehouseId || p.warehouseId === warehouseId)
        : allProducts;

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (customerRef.current && !customerRef.current.contains(event.target)) {
                setCustomerOpen(false);
            }
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
    const rowBg   = isDark ? 'hover:bg-[#1e293b]/60' : 'hover:bg-amber-50/50';
    const badge   = 'bg-[#FACC15]/10 text-[#EAB308] border-[#FACC15]/30';
    const submitBtn = 'bg-[#FACC15] hover:bg-[#EAB308] text-[#0F172A] shadow-[#FACC15]/30';
    const ghostBtn = isDark
        ? 'border-[#334155] text-[#94a3b8] hover:bg-[#1e293b]'
        : 'border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9]';
    const fieldCx = isDark
        ? 'border-[#334155] bg-[#1e293b]/80 text-white placeholder:text-[#64748b] focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20'
        : 'border-[#e2e8f0] bg-white text-[#0f172a] placeholder:text-[#94a3b8] focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20';
    const inputCx = [
        'w-full rounded-xl border px-4 text-sm outline-none transition-all duration-200 h-12',
        fieldCx,
    ].join(' ');
    const textareaCx = [
        'w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all duration-200 min-h-[100px] resize-y',
        fieldCx,
    ].join(' ');
    const stepCx = 'flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-[#0f172a]';

    /* ── helpers ───────────────────────────────────────────────────── */
    const addProduct = useCallback((product, whId) => {
        setItems((prev) => {
            if (prev.find((i) => i.productId === product.id)) return prev;
            // Auto-fill price: last used price for this customer > product default price
            const autoPrice = lastPriceMap[product.id] ?? product.price ?? 0;
            return [...prev, {
                productId:      product.id,
                productName:    product.name,
                productBarcode: product.barcode,
                warehouseId:    whId,
                quantity:       1,
                unitPrice:      autoPrice,
                _fromHistory:   lastPriceMap[product.id] != null,
            }];
        });
        setSearch('');
    }, [lastPriceMap]);

    const selectCustomer = (customer) => {
        setCustomerId(customer.id);
        setCustomerSearch(customer.name);
        setCustomerOpen(false);
    };

    const removeItem = (id) => setItems((p) => p.filter((i) => i.productId !== id));

    const updateQty = (id, val) => {
        const qty = parseInt(val, 10);
        if (isNaN(qty) || qty < 1) return;
        setItems((p) => p.map((i) => i.productId === id ? { ...i, quantity: qty } : i));
    };

    const updatePrice = (id, val) => {
        // Strip spaces (thousand separators) and replace comma with dot
        const raw = String(val).replace(/\s/g, '').replace(',', '.');
        const price = parseFloat(raw);
        if (isNaN(price) || price < 0) return;
        setItems((p) => p.map((i) => i.productId === id ? { ...i, unitPrice: price } : i));
    };

    const formatPriceInput = (val) => {
        if (val === 0 || val === null || val === undefined) return '';
        const [int, dec] = String(val).split('.');
        const formatted = Number(int).toLocaleString('ru-RU').replace(/\u00A0/g, ' ');
        return dec !== undefined ? `${formatted}.${dec}` : formatted;
    };

    const handlePriceInput = (id, e) => {
        const raw = e.target.value.replace(/\s/g, '').replace(',', '.');
        if (raw === '' || /^\d*\.?\d{0,2}$/.test(raw)) {
            const price = raw === '' ? 0 : parseFloat(raw);
            if (!isNaN(price) && price >= 0) {
                setItems((p) => p.map((i) => i.productId === id ? { ...i, unitPrice: price, _priceRaw: raw } : i));
            }
        }
    };

    const stepQty = (id, delta) => {
        setItems((p) => p.map((i) =>
            i.productId === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i
        ));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!customerId || items.length === 0) return;
        const data = {
            customerId,
            summary: summary.trim() || null,
            items: items.map(({ productId, warehouseId: whId, quantity, unitPrice }) => ({
                productId,
                warehouseId: whId,
                quantity: parseInt(quantity, 10),
                unitPrice,
            })),
        };
        try {
            if (isEdit) {
                if (canEditPrice) {
                    await updatePrices({
                        id: order.id,
                        data: {
                            items: items.map(({ id, unitPrice }) => ({ itemId: id, unitPrice })),
                        },
                    }).unwrap();
                    Alert('Narxlar yangilandi', 'success');
                } else {
                    await updateOrder({ id: order.id, data }).unwrap();
                    Alert('Buyurtma yangilandi', 'success');
                }
            } else {
                await createOrder(data).unwrap();
                Alert('Buyurtma yaratildi', 'success');
            }
            onSaved();
        } catch (error) {
            Alert(error?.data?.message || (isEdit ? 'Buyurtmani yangilashda xatolik' : 'Buyurtma yaratishda xatolik'), 'error');
        }
    };

    const totalQty    = items.reduce((s, i) => s + i.quantity, 0);
    const totalAmount = items.reduce((s, i) => s + i.quantity * (i.unitPrice ?? 0), 0);
    const selectedWarehouse = warehouses.find((w) => w.id === warehouseId);

    const toggleOrder = (id) => setExpandedOrders((prev) => ({ ...prev, [id]: !prev[id] }));

    const fmtDate = (v) => {
        if (!v) return '—';
        const d = new Date(v);
        if (isNaN(d)) return '—';
        return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return (
        <div className="flex w-full flex-col gap-4 py-2">

            {/* ── Header ────────────────────────────────────────────────── */}
            <div className={`relative overflow-hidden rounded-2xl border px-5 py-4 shadow-md ${panel}`}>
                <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-amber-400/6 to-transparent" />
                <div className="relative flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${badge}`}>
                            <LuPackage size={20} />
                        </span>
                        <div>
                            <h1 className={`text-xl font-bold tracking-tight leading-tight ${head}`}>
                                {isEdit ? 'Buyurtmani tahrirlash' : 'Yangi buyurtma'}
                            </h1>
                            <p className={`text-sm mt-0.5 ${muted}`}>
                                Mijoz va mahsulotlarni tanlang, miqdorni kiriting
                            </p>
                        </div>
                    </div>
                    <button type="button" onClick={onCancel}
                        className={`flex h-12 shrink-0 items-center gap-2 rounded-xl border px-5 text-sm font-bold transition-colors ${ghostBtn}`}>
                        <LuArrowLeft size={16} /> Buyurtmalar
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className={`rounded-2xl border shadow-md ${panel}`}>

                    {/* ── Mijoz + Ombor ───────────────────────────────── */}
                    <div className="flex flex-col gap-3 px-5 pt-5 sm:flex-row sm:items-end">
                        <div className="relative flex-1" ref={customerRef}>
                            <label className={`mb-1.5 flex items-center gap-2 text-xs font-semibold ${muted}`}>
                                <span className={stepCx}>1</span> <LuUser size={12} /> Mijoz
                            </label>
                            {isCustomerLocked ? (
                                <div className={`flex h-12 items-center gap-3 rounded-xl border px-4 ${isDark ? 'border-[#334155] bg-[#1e293b]/50' : 'border-[#e2e8f0] bg-[#f8fafc]'}`}>
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-400/10 text-amber-500">
                                        <LuUser size={14} />
                                    </span>
                                    <span className={`truncate text-sm font-bold ${head}`}>{customer.name}</span>
                                    {customer.phone && <span className={`shrink-0 text-xs ${muted}`}>{customer.phone}</span>}
                                    <LuLock size={13} className={`ml-auto shrink-0 ${muted}`} />
                                </div>
                            ) : (
                            <div className="relative">
                                <LuSearch className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 ${muted}`} />
                                <input
                                    type="text"
                                    placeholder="Mijoz nomini yozing yoki ro'yxatdan tanlang"
                                    value={customerSearch}
                                    onChange={(e) => { setCustomerSearch(e.target.value); setCustomerId(''); setCustomerOpen(true); }}
                                    onFocus={() => setCustomerOpen(true)}
                                    className={`${inputCx} pl-11 pr-10`}
                                />
                                {customerSearch && (
                                    <button type="button" onClick={() => { setCustomerSearch(''); setCustomerId(''); }}
                                        className={`absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg ${muted} hover:text-[#f43f5e]`}>
                                        <LuX size={15} />
                                    </button>
                                )}
                            </div>

                            )}

                            {/* Mijozlar ro'yxati — sahifani cho'zmaydi, ustidan ochiladi */}
                            {!isCustomerLocked && customerOpen && (
                                <div className={`absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border shadow-xl ${isDark ? 'border-[#334155] bg-[#0f172a]' : 'border-[#e2e8f0] bg-white'}`}>
                                    {isCustomerFetching ? (
                                        <div className={`flex items-center justify-center gap-2 py-6 text-sm ${muted}`}>
                                            <svg className="h-4 w-4 animate-spin text-amber-400" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                                            </svg>
                                            Qidirilmoqda...
                                        </div>
                                    ) : customers.length === 0 ? (
                                        <div className={`py-6 text-center text-sm ${muted}`}>Mijoz topilmadi</div>
                                    ) : (
                                        <div className={`max-h-72 overflow-y-auto divide-y ${divider}`}>
                                            {customers.map((c) => {
                                                const picked = c.id === customerId;
                                                return (
                                                    <button key={c.id} type="button"
                                                        onClick={() => selectCustomer(c)}
                                                        className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors ${isDark ? 'hover:bg-[#1e293b]' : 'hover:bg-amber-50'}`}
                                                    >
                                                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isDark ? 'bg-[#334155]' : 'bg-[#f1f5f9]'}`}>
                                                            <LuUser size={15} className={muted} />
                                                        </span>
                                                        <div className="min-w-0 flex-1">
                                                            <p className={`truncate font-semibold text-sm ${head}`}>{c.name}</p>
                                                            {c.phone && <p className={`truncate text-xs ${muted}`}>{c.phone}</p>}
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

                        <div className="sm:w-72 shrink-0">
                            <label className={`mb-1.5 flex items-center gap-2 text-xs font-semibold ${muted}`}>
                                <span className={stepCx}>2</span> <LuWarehouse size={12} /> Ombor
                            </label>
                            <select
                                value={warehouseId}
                                onChange={(e) => { setWarehouseId(e.target.value); setSearch(''); }}
                                required
                                className={inputCx}
                            >
                                <option value="">Ombor tanlang</option>
                                {warehouses.map((w) => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* ── Mahsulot qo'shish ───────────────────────────── */}
                    <div className="px-5 pt-4">
                        <div className="relative" ref={searchRef}>
                            <label className={`mb-1.5 flex items-center gap-2 text-xs font-semibold ${muted}`}>
                                <span className={stepCx}>3</span> Mahsulot qo&apos;shish
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
                                    ) : products.length === 0 ? (
                                        <div className={`py-6 text-center text-sm ${muted}`}>Mahsulot topilmadi</div>
                                    ) : (
                                        <div className={`max-h-72 overflow-y-auto divide-y ${divider}`}>
                                            {products.map((p) => {
                                                const added = items.some((i) => i.productId === p.id);
                                                return (
                                                    <button key={p.id} type="button"
                                                        onClick={() => !added && addProduct(p, warehouseId)}
                                                        disabled={added}
                                                        className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors ${
                                                            added ? 'cursor-not-allowed opacity-50'
                                                                  : isDark ? 'hover:bg-[#1e293b]' : 'hover:bg-amber-50'
                                                        }`}
                                                    >
                                                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isDark ? 'bg-[#334155]' : 'bg-[#f1f5f9]'}`}>
                                                            <LuPackage size={15} className={muted} />
                                                        </span>
                                                        <div className="min-w-0 flex-1">
                                                            <p className={`truncate font-semibold text-sm ${head}`}>{p.name}</p>
                                                            <p className={`flex items-center gap-1 text-xs ${muted}`}>
                                                                <LuBarcode size={11} />{p.barcode}
                                                                {p.price ? <span className="ml-1">{formatNumber(p.price)} so&apos;m</span> : null}
                                                                {lastPriceMap[p.id] != null && (
                                                                    <span className={`ml-2 flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${isDark ? 'bg-amber-400/10 text-amber-400' : 'bg-amber-50 text-amber-700'}`}>
                                                                        <LuTag size={9} /> Oxirgi: {formatNumber(lastPriceMap[p.id])} so&apos;m
                                                                    </span>
                                                                )}
                                                            </p>
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

                    {/* ── Izoh ────────────────────────────────────────── */}
                    <div className="px-5 pb-5 pt-4">
                        <label className={`mb-1.5 flex items-center gap-2 text-xs font-semibold ${muted}`}>
                            <LuStickyNote size={12} /> Izoh <span className="font-normal">(ixtiyoriy)</span>
                        </label>
                        <textarea
                            rows={3}
                            placeholder="Buyurtma haqida qo'shimcha ma'lumot yozing"
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            className={textareaCx}
                        />
                    </div>

                    {/* ── Tanlanganlar ────────────────────────────────── */}
                    <div className={`flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3.5 ${line}`}>
                        <div className="flex items-center gap-2">
                            <span className={stepCx}>4</span>
                            <h2 className={`text-sm font-bold ${head}`}>Tanlangan mahsulotlar</h2>
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
                        <div className={`flex flex-col items-center gap-3 py-14 ${muted}`}>
                            <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                                <LuPackage size={26} strokeWidth={1.5} />
                            </span>
                            <div className="text-center">
                                <p className="text-sm font-semibold">Hozircha mahsulot qo&apos;shilmagan</p>
                                <p className="text-xs mt-1 opacity-70">Yuqoridagi qidiruvdan kerakli mahsulotni tanlang</p>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className={`text-left text-xs font-semibold uppercase tracking-wide ${muted} ${isDark ? 'bg-[#0f172a]/40' : 'bg-[#f8fafc]'}`}>
                                        <th className="px-5 py-3">Mahsulot</th>
                                        <th className="px-5 py-3 w-44">Barcode</th>
                                        <th className="px-5 py-3 w-52 text-right">Narx (so&apos;m)</th>
                                        <th className="px-5 py-3 w-52">Miqdor</th>
                                        <th className="px-5 py-3 w-44 text-right">Jami</th>
                                        <th className="px-5 py-3 w-12"></th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${divider}`}>
                                    {items.map((item, idx) => {
                                        const lastPrice = lastPriceMap[item.productId];
                                        const hasLastPrice = lastPrice != null;
                                        const priceChanged = hasLastPrice && item.unitPrice !== lastPrice;
                                        return (
                                        <tr key={item.productId} className={`transition-colors ${rowBg}`}>
                                            {/* Product name */}
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                                                        {idx + 1}
                                                    </span>
                                                    <div>
                                                        <p className={`font-semibold leading-tight ${head}`}>{item.productName}</p>
                                                        {hasLastPrice && (
                                                            <p className={`text-xs mt-0.5 flex items-center gap-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                                                <LuTag size={10} />
                                                                Oxirgi: {formatNumber(lastPrice)} so&apos;m
                                                            </p>
                                                        )}
                                                    </div>
                                                    {item._fromHistory && !priceChanged && (
                                                        <span className={`ml-1 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-700'}`}>
                                                            <LuCheck size={9} /> Tarix
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Barcode */}
                                            <td className={`px-5 py-3.5 font-mono text-xs ${muted}`}>
                                                <span className="flex items-center gap-1.5">
                                                    <LuBarcode size={13} />{item.productBarcode || '—'}
                                                </span>
                                            </td>

                                            {/* Price input */}
                                            <td className="px-5 py-3.5">
                                                <div className="flex flex-col items-end gap-1">
                                                    {canEditPrice ? (
                                                        <>
                                                            <div className="relative">
                                                                <input
                                                                    type="text"
                                                                    inputMode="decimal"
                                                                    value={
                                                                        item._priceRaw !== undefined
                                                                            ? (() => {
                                                                                const r = item._priceRaw;
                                                                                if (r === '' || r.endsWith('.')) return r;
                                                                                const [int, dec] = r.split('.');
                                                                                const fmt = Number(int).toLocaleString('ru-RU').replace(/\u00A0/g, ' ');
                                                                                return dec !== undefined ? `${fmt}.${dec}` : fmt;
                                                                            })()
                                                                            : formatPriceInput(item.unitPrice)
                                                                    }
                                                                    onChange={(e) => handlePriceInput(item.productId, e)}
                                                                    aria-label="Narxni tahrirlash"
                                                                    className={`w-40 rounded-xl border px-3 pr-9 h-9 text-right text-sm font-semibold outline-none transition-all duration-200 ${fieldCx}`}
                                                                />
                                                                <span className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs ${muted}`}>
                                                                    so&apos;m
                                                                </span>
                                                            </div>
                                                            {/* Restore last price button */}
                                                            {hasLastPrice && priceChanged && (
                                                                <button
                                                                    type="button"
                                                                    title={`Oxirgi narxga qaytarish: ${formatNumber(lastPrice)} so'm`}
                                                                    onClick={() => setItems((p) => p.map((i) =>
                                                                        i.productId === item.productId
                                                                            ? { ...i, unitPrice: lastPrice, _priceRaw: undefined, _fromHistory: true }
                                                                            : i
                                                                    ))}
                                                                    className={`flex items-center gap-1 text-[10px] font-semibold transition-colors ${isDark ? 'text-amber-400/70 hover:text-amber-400' : 'text-amber-600/70 hover:text-amber-600'}`}
                                                                >
                                                                    ↩ {formatNumber(lastPrice)} so&apos;m ga qaytarish
                                                                </button>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <div className="text-right">
                                                            <p className={`font-bold text-sm ${head}`}>{formatNumber(item.unitPrice ?? 0)} so&apos;m</p>
                                                            {hasLastPrice && priceChanged && (
                                                                <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                                                    Oxirgi: {formatNumber(lastPrice)} so&apos;m
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Qty stepper */}
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <div className={`inline-flex items-center rounded-xl border overflow-hidden ${isDark ? 'border-[#334155]' : 'border-[#e2e8f0]'}`}>
                                                        <button type="button" onClick={() => stepQty(item.productId, -1)}
                                                            aria-label="Kamaytirish"
                                                            className={`flex h-9 w-9 items-center justify-center transition-colors ${isDark ? 'bg-[#1e293b] hover:bg-[#334155] text-[#cbd5e1]' : 'bg-[#f8fafc] hover:bg-[#f1f5f9] text-[#475569]'}`}>
                                                            <LuMinus size={14} />
                                                        </button>
                                                        <input type="number" min={1} value={item.quantity}
                                                            onChange={(e) => updateQty(item.productId, e.target.value)}
                                                            className={`h-9 w-16 border-x text-center text-sm font-bold outline-none ${isDark ? 'border-[#334155] bg-[#0f172a] text-white' : 'border-[#e2e8f0] bg-white text-[#0f172a]'}`}
                                                        />
                                                        <button type="button" onClick={() => stepQty(item.productId, 1)}
                                                            aria-label="Ko'paytirish"
                                                            className={`flex h-9 w-9 items-center justify-center transition-colors ${isDark ? 'bg-[#1e293b] hover:bg-[#334155] text-[#cbd5e1]' : 'bg-[#f8fafc] hover:bg-[#f1f5f9] text-[#475569]'}`}>
                                                            <LuPlus size={14} />
                                                        </button>
                                                    </div>
                                                    <span className={`text-xs font-medium ${muted}`}>dona</span>
                                                </div>
                                            </td>

                                            {/* Line total */}
                                            <td className="px-5 py-3.5 text-right">
                                                <p className={`font-bold text-sm ${head}`}>
                                                    {formatNumber(item.quantity * (item.unitPrice ?? 0))} so&apos;m
                                                </p>
                                                {item.quantity > 1 && (
                                                    <p className={`text-xs mt-0.5 ${muted}`}>
                                                        {item.quantity} × {formatNumber(item.unitPrice ?? 0)}
                                                    </p>
                                                )}
                                            </td>

                                            {/* Delete */}
                                            <td className="px-3 py-3.5 text-right">
                                                <button type="button" onClick={() => removeItem(item.productId)}
                                                    aria-label="O'chirish"
                                                    className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${isDark ? 'text-[#64748b] hover:bg-red-500/10 hover:text-red-400' : 'text-[#94a3b8] hover:bg-red-50 hover:text-red-500'}`}>
                                                    <LuTrash2 size={15} />
                                                </button>
                                            </td>
                                        </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* ── Footer ──────────────────────────────────────── */}
                    <div className={`flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4 ${line}`}>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                            <span className={`text-sm ${muted}`}>
                                Jami: <span className={`font-bold ${head}`}>{items.length} ta mahsulot</span>
                            </span>
                            <span className={`text-sm ${muted}`}>
                                <span className={`font-bold ${head}`}>{totalQty}</span> dona
                            </span>
                            <span className={`text-sm ${muted}`}>
                                Summa: <span className={`font-bold ${head}`}>{formatNumber(totalAmount)} so&apos;m</span>
                            </span>
                            {selectedWarehouse && (
                                <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${muted}`}>
                                    <LuWarehouse size={13} />{selectedWarehouse.name}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button type="button" onClick={onCancel}
                                className={`flex h-12 items-center rounded-xl border px-5 text-sm font-bold transition-colors ${ghostBtn}`}>
                                Bekor qilish
                            </button>
                            <button type="submit"
                                disabled={isSending || items.length === 0 || !customerId}
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
                                        {isEdit ? 'O‘zgarishni saqlash' : 'Buyurtmani yaratish'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </form>

            {/* ── Oldingi buyurtmalar (narx tahlili uchun) — faqat BUXGALTER uchun ── */}
            {customerId && canEditPrice && (
                <div className={`rounded-2xl border shadow-md ${panel}`}>
                    {/* Header */}
                    <div className={`flex items-center justify-between gap-3 px-5 py-4 border-b ${line}`}>
                        <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-amber-500">
                                <LuClipboardList size={17} />
                            </span>
                            <div>
                                <p className={`text-sm font-bold ${head}`}>Oldingi tasdiqlangan buyurtmalar</p>
                                <p className={`text-xs ${muted}`}>Narx tahlili uchun — oxirgi 10 ta</p>
                            </div>
                        </div>
                        {prevOrders.length > 0 && (
                            <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-xs font-bold text-amber-500">
                                {prevOrders.length} ta
                            </span>
                        )}
                    </div>

                    {/* Body */}
                    {prevOrdersFetching ? (
                        <div className={`flex items-center justify-center gap-2 py-10 text-sm ${muted}`}>
                            <svg className="h-4 w-4 animate-spin text-amber-400" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                            </svg>
                            Yuklanmoqda...
                        </div>
                    ) : prevOrders.length === 0 ? (
                        <div className={`flex flex-col items-center gap-2 py-10 ${muted}`}>
                            <LuClipboardList size={30} strokeWidth={1.5} />
                            <p className="text-sm">Bu mijozda hozircha tasdiqlangan buyurtmalar yo&apos;q</p>
                        </div>
                    ) : (
                        <div className={`divide-y ${line}`}>
                            {prevOrders.map((o) => {
                                const isOpen = expandedOrders[o.id];
                                const STATUS_COLOR = {
                                    APPROVED: isDark ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-green-50 text-green-700 border-green-200',
                                    PENDING:  isDark ? 'bg-amber-400/10 text-amber-400 border-amber-400/30' : 'bg-amber-50 text-amber-700 border-amber-200',
                                    REJECTED: isDark ? 'bg-red-500/10 text-red-400 border-red-500/30'    : 'bg-red-50 text-red-700 border-red-200',
                                };
                                const statusCls = STATUS_COLOR[o.status] || STATUS_COLOR.PENDING;

                                return (
                                    <div key={o.id}>
                                        {/* Accordion header row */}
                                        <button
                                            type="button"
                                            onClick={() => toggleOrder(o.id)}
                                            className={`w-full flex flex-wrap items-center gap-3 px-5 py-3.5 text-left transition-colors ${isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-amber-50/50'}`}
                                        >
                                            {/* Date */}
                                            <span className={`flex items-center gap-1.5 text-xs ${muted} w-28 shrink-0`}>
                                                <LuCalendar size={12} />
                                                {fmtDate(o.createdAt)}
                                            </span>

                                            {/* Item count */}
                                            <span className={`flex items-center gap-1.5 text-xs font-semibold ${muted} w-20 shrink-0`}>
                                                <LuPackage size={12} />
                                                {o.items?.length ?? 0} mahsulot
                                            </span>

                                            {/* Total */}
                                            <span className={`flex items-center gap-1.5 text-sm font-bold ${head} flex-1`}>
                                                <LuTrendingUp size={13} className="text-amber-500 shrink-0" />
                                                {formatNumber(o.totalAmount ?? 0)} so&apos;m
                                            </span>

                                            {/* Status badge */}
                                            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${statusCls} shrink-0`}>
                                                {{ APPROVED: 'Tasdiqlangan', PENDING: 'Kutilmoqda', REJECTED: 'Rad etilgan' }[o.status] ?? o.status}
                                            </span>

                                            {/* Summary if any */}
                                            {o.summary && (
                                                <span className={`text-xs italic truncate max-w-[200px] ${muted}`}>{o.summary}</span>
                                            )}

                                            {/* Chevron */}
                                            <LuChevronDown
                                                size={16}
                                                className={`shrink-0 ml-auto transition-transform duration-200 ${muted} ${isOpen ? 'rotate-180' : ''}`}
                                            />
                                        </button>

                                        {/* Accordion body — product table */}
                                        {isOpen && (
                                            <div className={`border-t ${line} ${isDark ? 'bg-[#0f172a]/30' : 'bg-[#f8fafc]'}`}>
                                                {!o.items || o.items.length === 0 ? (
                                                    <p className={`px-5 py-4 text-sm ${muted}`}>Mahsulotlar mavjud emas</p>
                                                ) : (
                                                    <>
                                                        <div className="overflow-x-auto">
                                                            <table className="w-full text-sm">
                                                                <thead>
                                                                    <tr className={`text-xs font-semibold uppercase tracking-wide ${muted}`}>
                                                                        <th className="px-5 py-2.5 text-left">Mahsulot</th>
                                                                        <th className="px-5 py-2.5 text-left w-40">Barcode</th>
                                                                        <th className="px-5 py-2.5 text-right w-36">Narx</th>
                                                                        <th className="px-5 py-2.5 text-right w-24">Miqdor</th>
                                                                        <th className="px-5 py-2.5 text-right w-40">Jami</th>
                                                                        <th className="px-5 py-2.5 text-center w-32">Narxni qo&apos;llash</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className={`divide-y ${isDark ? 'divide-white/[0.05]' : 'divide-[#f1f5f9]'}`}>
                                                                    {o.items.map((item, idx) => {
                                                                        // check if this product is currently in the new order
                                                                        const inCurrent = items.find((ci) => ci.productId === item.productId);
                                                                        return (
                                                                            <tr key={item.id ?? idx} className={`transition-colors ${isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-white'}`}>
                                                                                <td className="px-5 py-2.5">
                                                                                    <div className="flex items-center gap-2.5">
                                                                                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${isDark ? 'bg-[#1e293b]' : 'bg-white border border-[#e2e8f0]'}`}>
                                                                                            <LuPackage size={13} className={muted} />
                                                                                        </span>
                                                                                        <span className={`text-sm font-semibold ${head}`}>{item.productName}</span>
                                                                                    </div>
                                                                                </td>
                                                                                <td className={`px-5 py-2.5 font-mono text-xs ${muted}`}>
                                                                                    <span className="flex items-center gap-1.5">
                                                                                        <LuBarcode size={12} />{item.productBarcode || '—'}
                                                                                    </span>
                                                                                </td>
                                                                                <td className={`px-5 py-2.5 text-right font-bold text-sm whitespace-nowrap`}>
                                                                                    <span className="flex items-center justify-end gap-1.5">
                                                                                        <LuTag size={12} className="text-amber-500 shrink-0" />
                                                                                        <span className={head}>{formatNumber(item.unitPrice ?? 0)}</span>
                                                                                        <span className={`text-xs ${muted}`}>so&apos;m</span>
                                                                                    </span>
                                                                                </td>
                                                                                <td className={`px-5 py-2.5 text-right font-semibold ${muted}`}>
                                                                                    {item.quantity} dona
                                                                                </td>
                                                                                <td className={`px-5 py-2.5 text-right font-bold ${head} whitespace-nowrap`}>
                                                                                    {formatNumber((item.unitPrice ?? 0) * item.quantity)} so&apos;m
                                                                                </td>
                                                                                <td className="px-5 py-2.5 text-center">
                                                                                    {inCurrent ? (
                                                                                        <button
                                                                                            type="button"
                                                                                            title={`Narxni ${formatNumber(item.unitPrice ?? 0)} so'm ga o'rnatish`}
                                                                                            onClick={() => {
                                                                                                setItems((prev) => prev.map((ci) =>
                                                                                                    ci.productId === item.productId
                                                                                                        ? { ...ci, unitPrice: item.unitPrice ?? 0, _priceRaw: undefined }
                                                                                                        : ci
                                                                                                ));
                                                                                                Alert(`${item.productName} narxi ${formatNumber(item.unitPrice ?? 0)} so'm ga o'rnatildi`, 'success');
                                                                                            }}
                                                                                            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-3 py-1.5 text-xs font-bold text-slate-900 transition-all hover:bg-amber-300 hover:-translate-y-px"
                                                                                        >
                                                                                            <LuCheck size={12} /> Qo&apos;llash
                                                                                        </button>
                                                                                    ) : (
                                                                                        <span className={`text-xs ${muted}`}>—</span>
                                                                                    )}
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    })}
                                                                </tbody>
                                                                {/* Totals footer */}
                                                                <tfoot>
                                                                    <tr className={isDark ? 'bg-[#0f172a]/50' : 'bg-white'}>
                                                                        <td colSpan={4} className={`px-5 py-2.5 text-right text-xs font-semibold ${muted}`}>
                                                                            Jami:
                                                                        </td>
                                                                        <td className={`px-5 py-2.5 text-right font-bold text-sm ${head} whitespace-nowrap`}>
                                                                            {formatNumber(o.totalAmount ?? 0)} so&apos;m
                                                                        </td>
                                                                        <td />
                                                                    </tr>
                                                                </tfoot>
                                                            </table>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

OrderForm.propTypes = {
    order: PropTypes.shape({
        id: PropTypes.string.isRequired,
        customerId: PropTypes.string.isRequired,
        customerName: PropTypes.string,
        summary: PropTypes.string,
        items: PropTypes.arrayOf(PropTypes.shape({
            id: PropTypes.string,
            productId: PropTypes.string.isRequired,
            productName: PropTypes.string.isRequired,
            productBarcode: PropTypes.string,
            warehouseId: PropTypes.string.isRequired,
            quantity: PropTypes.number.isRequired,
            unitPrice: PropTypes.number,
        })),
    }),
    customer: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        phone: PropTypes.string,
    }),
    onCancel: PropTypes.func.isRequired,
    onSaved: PropTypes.func.isRequired,
};
