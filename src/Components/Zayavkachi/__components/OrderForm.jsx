import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
    LuPlus, LuSearch, LuTrash2, LuPackage, LuSend, LuCheck,
    LuX, LuBarcode, LuArrowLeft,
    LuWarehouse, LuMinus, LuUser, LuStickyNote, LuLock,
    LuChevronDown, LuClipboardList, LuCalendar, LuTag, LuTrendingUp,
    LuBoxes, LuArrowDownWideNarrow, LuSlidersHorizontal, LuRotateCcw, LuHash,
} from 'react-icons/lu';
import { useAppTheme } from '../../../theme/tokens';
import { formatNumber } from '../../ui/number-format';
import { Alert } from '../../Other/UI/Alert/Alert';
import { useGetWarehousesQuery } from '../../../store/services/warehouse.api';
import { useGetProductsQuery } from '../../../store/services/product.api';
import { useGetProductStocksQuery } from '../../../store/services/productStock.api';
import { useGetProductCategoriesQuery } from '../../../store/services/productCategory.api';
import { useGetProductColorsQuery } from '../../../store/services/productColor.api';
import { useGetCustomersQuery } from '../../../store/services/customer.api';
import { useCreateSalesOrderMutation, useUpdateSalesOrderMutation, useUpdateSalesOrderPricesMutation, useGetSalesOrdersQuery } from '../../../store/services/salesOrder.api';
import { useAppSelector } from '../../../store/hooks';
import { ROLES } from '../../../app/permissions/roles';
import CustomerCreate from '../../Common/Customer/__components/Create';

const STOCK_PAGE_SIZE = 20;

const SORTS = [
    { key: 'recent',  label: 'Oxirgi o‘zgargan',       sort: ['lastModifiedAt,DESC', 'id,DESC'] },
    { key: 'qtyDesc', label: 'Qoldiq: ko‘pdan kamga', sort: ['quantity,DESC', 'id,DESC'] },
    { key: 'qtyAsc',  label: 'Qoldiq: kamdan ko‘pga', sort: ['quantity,ASC', 'id,ASC'] },
];

const EMPTY_FILTERS = {
    name: '', article: '', productSize: '', brandId: '', categoryId: '', colorId: '',
    lowStock: false, priceFrom: '', priceTo: '', sortKey: 'recent',
};

function useDebouncedValue(value, delay = 350) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
}

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
    const [open, setOpen]               = useState(false);
    const [filters, setFilters]         = useState(EMPTY_FILTERS);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [stockPage, setStockPage]     = useState(0);
    const [allStocks, setAllStocks]     = useState([]);
    const [hasMoreStocks, setHasMoreStocks] = useState(true);
    const [brandMap, setBrandMap]       = useState({});
    const [stockCache, setStockCache]   = useState({});
    const debouncedFilters = useDebouncedValue(filters, 350);
    const [expandedOrders, setExpandedOrders] = useState({});
    const [items, setItems]             = useState(() => {
        const groupedItems = new Map();
        for (const item of order?.items ?? []) {
            const packQuantity = Number(item.quantity);
            const enteredQuantity = Number(item.enteredQuantity);
            const piecesPerPack = Number(
                item.productPiecesPerPack
                ?? item.piecesPerPack
                ?? (item.unit === 'PACK' && enteredQuantity > 0
                    ? packQuantity / enteredQuantity
                    : 0)
            ) || null;
            const key = `${item.productId}-${item.warehouseId}`;
            const existing = groupedItems.get(key) ?? {
                id: item.id,
                productId: item.productId,
                productName: item.productName,
                productArticle: item.productArticle,
                productBarcode: item.productBarcode,
                warehouseId: item.warehouseId,
                piecesPerPack,
                packs: 0,
                pieces: 0,
                quantity: 0,
                unit: 'PIECE',
                enteredQuantity: 0,
                unitPrice: item.unitPrice,
            };
            if (!existing.piecesPerPack && piecesPerPack) {
                existing.piecesPerPack = piecesPerPack;
            }
            if (item.unit === 'PACK') {
                existing.packs += enteredQuantity || (
                    piecesPerPack ? packQuantity / piecesPerPack : 0
                );
            } else {
                existing.pieces += enteredQuantity || packQuantity;
            }
            existing.quantity = existing.packs * (piecesPerPack ?? 0) + existing.pieces;
            existing.enteredQuantity = existing.quantity;
            groupedItems.set(key, existing);
        }
        return [...groupedItems.values()];
    });
    const customerRef       = useRef(null);
    const searchRef         = useRef(null);
    const searchInputRef    = useRef(null);
    const loadMoreRef       = useRef(null);
    const isFetchingNextRef = useRef(false);

    const { data: warehouses = [] }          = useGetWarehousesQuery('PRODUCT');
    const { data: categoriesResp } = useGetProductCategoriesQuery(
        { page: 0, size: 200 },
        { skip: !open }
    );
    const { data: colorsResp } = useGetProductColorsQuery(
        { page: 0, size: 200 },
        { skip: !open }
    );
    const { data: customersResp, isFetching: isCustomerFetching } = useGetCustomersQuery(
        { name: customerSearch || undefined, size: 50 },
        { skip: isCustomerLocked }
    );

    const df = debouncedFilters;
    const term = df.name.trim();
    const isBarcodeTerm = /^\d{8,}$/.test(term);
    const sortParam = SORTS.find((x) => x.key === df.sortKey)?.sort;

    const { data: stocksResp, isFetching } = useGetProductStocksQuery(
        {
            warehouseId,
            name:        isBarcodeTerm ? undefined : (term || undefined),
            barcode:     isBarcodeTerm ? term : undefined,
            article:     df.article.trim() || undefined,
            productSize: df.productSize.trim() || undefined,
            brandId:     df.brandId || undefined,
            categoryId:  df.categoryId || undefined,
            colorId:     df.colorId || undefined,
            lowStock:    df.lowStock || undefined,
            priceFrom:   df.priceFrom !== '' ? Number(df.priceFrom) : undefined,
            priceTo:     df.priceTo !== '' ? Number(df.priceTo) : undefined,
            page: stockPage,
            size: STOCK_PAGE_SIZE,
            sort: sortParam,
        },
        { skip: !warehouseId || !open }
    );

    const { data: productsResp } = useGetProductsQuery(
        { size: 200 },
        { skip: !warehouseId }
    );
    const {
        data: productSearchResp,
        isFetching: isProductSearchFetching,
        isError: isProductSearchError,
    } = useGetProductsQuery(
        {
            query: term || undefined,
            categoryId: df.categoryId || undefined,
            colorId: df.colorId || undefined,
            page: 0,
            size: 200,
        },
        { skip: !warehouseId || !open }
    );
    const isSearchingProducts = isFetching || isProductSearchFetching;

    const [createOrder, { isLoading: isCreating }] = useCreateSalesOrderMutation();
    const [updateOrder, { isLoading: isUpdating }] = useUpdateSalesOrderMutation();
    const [updatePrices, { isLoading: isUpdatingPrices }] = useUpdateSalesOrderPricesMutation();
    const isSending = isCreating || isUpdating || isUpdatingPrices;

    const prevOrdersCustomerId = customerId || null;
    const { data: prevOrdersData, isFetching: prevOrdersFetching } = useGetSalesOrdersQuery(
        { customerId: prevOrdersCustomerId, status: 'APPROVED', size: 10, sort: ['createdAt,DESC', 'id,DESC'] },
        { skip: !prevOrdersCustomerId }
    );
    const prevOrders = (prevOrdersData?.items ?? []).filter((o) => o.id !== order?.id);

    const lastPriceMap = useMemo(() => {
        const map = {};
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

    const productPriceMap = useMemo(() => {
        const map = {};
        for (const p of (productsResp?.items ?? [])) map[p.id] = p.price;
        return map;
    }, [productsResp]);
    const selectableProducts = useMemo(() => {
        const stocksByProduct = new Map(allStocks.map((stock) => [stock.productId, stock]));
        const products = productSearchResp?.items ?? [];
        const catalogProducts = products
            .filter((product) => {
                const productSize = product.size ?? product.productSize;
                const brandId = product.brand?.id ?? product.brandId;
                const categoryId = product.category?.id ?? product.categoryId;
                const colorId = product.color?.id ?? product.colorId;
                return (!df.productSize.trim() || String(productSize ?? '').toLowerCase().includes(df.productSize.trim().toLowerCase()))
                    && (!df.brandId || brandId === df.brandId)
                    && (!df.categoryId || categoryId === df.categoryId)
                    && (!df.colorId || colorId === df.colorId);
            })
            .map((product) => {
                const stock = stocksByProduct.get(product.id);
                return {
                    ...(stock ?? {}),
                    productId: product.id,
                    productName: product.name ?? stock?.productName,
                    productArticle: product.article ?? stock?.productArticle,
                    productBarcode: product.barcode ?? stock?.productBarcode,
                    productSize: product.size ?? product.productSize ?? stock?.productSize,
                    productPiecesPerPack: product.piecesPerPack ?? stock?.productPiecesPerPack,
                    productMinimumLine: product.minimumLine ?? stock?.productMinimumLine,
                    brand: product.brand ?? stock?.brand,
                    warehouseId,
                    quantity: stock?.quantity ?? stockCache[product.id] ?? 0,
                    price: product.price ?? stock?.price,
                };
            });
        const catalogIds = new Set(catalogProducts.map((product) => product.productId));
        return [
            ...catalogProducts,
            ...allStocks.filter((stock) => !catalogIds.has(stock.productId)),
        ];
    }, [allStocks, productSearchResp, df.productSize, df.brandId, df.categoryId, df.colorId, stockCache, warehouseId]);

    const stockPagination = stocksResp?.pagination ?? null;

    /* ── Reset при смене фильтров/склада ── */
    useEffect(() => {
        setAllStocks([]);
        setStockPage(0);
        setHasMoreStocks(true);
        isFetchingNextRef.current = false;
    }, [warehouseId, debouncedFilters.name, debouncedFilters.lowStock, debouncedFilters.sortKey,
        debouncedFilters.article, debouncedFilters.productSize, debouncedFilters.brandId,
        debouncedFilters.categoryId, debouncedFilters.colorId,
        debouncedFilters.priceFrom, debouncedFilters.priceTo]);

    /* ── Накопление страниц ── */
    useEffect(() => {
        if (!stocksResp?.items) return;

        if (stockPage === 0) {
            setAllStocks(stocksResp.items);
        } else {
            setAllStocks((prev) => {
                const seen = new Set(prev.map((s) => `${s.productId}-${s.warehouseId}`));
                const fresh = stocksResp.items.filter(
                    (s) => !seen.has(`${s.productId}-${s.warehouseId}`)
                );
                return fresh.length ? [...prev, ...fresh] : prev;
            });
        }

        const totalPages = stockPagination?.totalPages ?? 0;
        if (totalPages > 0) {
            setHasMoreStocks(stockPage < totalPages - 1);
        } else {
            setHasMoreStocks(stocksResp.items.length === STOCK_PAGE_SIZE);
        }
        isFetchingNextRef.current = false;
    }, [stocksResp, stockPage, stockPagination]);

    /* ── Кэш брендов и остатков ── */
    useEffect(() => {
        if (!allStocks.length) return;
        setBrandMap((prev) => {
            let changed = false;
            const next = { ...prev };
            for (const st of allStocks) {
                if (st.brand?.id && !next[st.brand.id]) { next[st.brand.id] = st.brand; changed = true; }
            }
            return changed ? next : prev;
        });
        setStockCache((prev) => {
            const next = { ...prev };
            for (const st of allStocks) next[st.productId] = st.quantity;
            return next;
        });
    }, [allStocks]);

    /* ── Infinite scroll в dropdown ── */
    useEffect(() => {
        if (!open) return;
        const node = loadMoreRef.current;
        if (!node) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (
                    entry.isIntersecting &&
                    hasMoreStocks &&
                    !isFetching &&
                    !isFetchingNextRef.current
                ) {
                    isFetchingNextRef.current = true;
                    setStockPage((p) => p + 1);
                }
            },
            { root: null, rootMargin: '150px 0px', threshold: 0 }
        );
        observer.observe(node);
        return () => observer.disconnect();
    }, [open, hasMoreStocks, isFetching, allStocks.length]);

    const stockMap = stockCache;
    const brandOptions = useMemo(
        () => Object.values(brandMap).sort((x, y) => String(x.name).localeCompare(String(y.name), 'uz')),
        [brandMap]
    );

    const advancedCount =
        (filters.article.trim() ? 1 : 0) + (filters.productSize.trim() ? 1 : 0) +
        (filters.brandId ? 1 : 0) + (filters.categoryId ? 1 : 0) +
        (filters.colorId ? 1 : 0) + (filters.lowStock ? 1 : 0) +
        (filters.priceFrom !== '' ? 1 : 0) + (filters.priceTo !== '' ? 1 : 0);
    const hasAnyFilter = advancedCount > 0 || filters.name.trim() !== '' || filters.sortKey !== 'recent';

    const patchFilters = (patch) => { setFilters((p) => ({ ...p, ...patch })); setStockPage(0); };
    const resetFilters = () => { setFilters(EMPTY_FILTERS); setStockPage(0); };
    const categories = categoriesResp?.items ?? [];
    const colors = colorsResp?.items ?? [];

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

    useEffect(() => {
        if (open && searchInputRef.current) searchInputRef.current.focus();
    }, [open]);

    /* ── theme tokens ── */
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

    const miniCx = `h-9 w-full rounded-lg border px-3 text-xs outline-none transition-all duration-200 ${fieldCx}`;
    const stockTone = (qty, isLow) => {
        if (qty <= 0) return isDark ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-red-50 text-red-600 border-red-200';
        if (isLow) return isDark ? 'bg-amber-400/10 text-amber-400 border-amber-400/30' : 'bg-amber-50 text-amber-700 border-amber-200';
        return isDark ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-green-50 text-green-700 border-green-200';
    };

    /* ── helpers ── */
    const addProduct = useCallback((stock, whId) => {
        setStockCache((previous) => ({
            ...previous,
            [stock.productId]: stock.quantity ?? 0,
        }));
        setItems((prev) => {
            if (prev.find((i) => i.productId === stock.productId)) return prev;
            const autoPrice = lastPriceMap[stock.productId] ?? stock.price ?? productPriceMap[stock.productId] ?? 0;
            return [...prev, {
                productId:       stock.productId,
                productName:     stock.productName,
                productArticle:  stock.productArticle,
                productBarcode:  stock.productBarcode,
                piecesPerPack:   stock.productPiecesPerPack ?? null,
                warehouseId:     whId,
                quantity:        1,
                enteredQuantity: 1,
                unit:            'PIECE',
                packs:           0,
                pieces:          1,
                unitPrice:       autoPrice,
                _fromHistory:    lastPriceMap[stock.productId] != null,
            }];
        });
    }, [lastPriceMap, productPriceMap]);

    const selectCustomer = (customer) => {
        setCustomerId(customer.id);
        setCustomerSearch(customer.name);
        setCustomerOpen(false);
    };

    const removeItem = (id) => setItems((p) => p.filter((i) => i.productId !== id));

    const updateQty = (id, val) => {
        const qty = Number(val);
        if (!Number.isInteger(qty) || qty < 0) return;
        setItems((p) => p.map((i) => {
            if (i.productId !== id) return i;
            const quantity = (i.packs ?? 0) * (i.piecesPerPack ?? 0) + qty;
            return { ...i, pieces: qty, quantity, enteredQuantity: quantity, unit: 'PIECE' };
        }));
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
        setItems((p) => p.map((i) => {
            if (i.productId !== id) return i;
            const pieces = Math.max(0, (i.pieces ?? 0) + delta);
            const quantity = (i.packs ?? 0) * (i.piecesPerPack ?? 0) + pieces;
            return { ...i, pieces, quantity, enteredQuantity: quantity, unit: 'PIECE' };
        }));
    };

    const updatePacks = (id, val) => {
        const packs = Number(val);
        if (!Number.isInteger(packs) || packs < 0) return;
        setItems((p) => p.map((i) => {
            if (i.productId !== id) return i;
            const quantity = packs * (i.piecesPerPack ?? 0) + (i.pieces ?? 0);
            return {
                ...i,
                packs,
                quantity,
                enteredQuantity: quantity,
                unit: 'PIECE',
            };
        }));
    };

    const stepPacks = (id, delta) => {
        setItems((p) => p.map((i) => {
            if (i.productId !== id) return i;
            const packs = Math.max(0, (i.packs ?? 0) + delta);
            const quantity = packs * (i.piecesPerPack ?? 0) + (i.pieces ?? 0);
            return {
                ...i,
                packs,
                quantity,
                enteredQuantity: quantity,
                unit: 'PIECE',
            };
        }));
    };

    const handleWarehouseChange = (value) => {
        setWarehouseId(value);
        setFilters(EMPTY_FILTERS);
        setStockPage(0);
        setStockCache({});
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!customerId || items.length === 0) return;
        if (items.some((item) => (
            !Number.isInteger(item.packs)
            || !Number.isInteger(item.pieces)
            || item.packs < 0
            || item.pieces < 0
            || (item.packs > 0 && !(item.piecesPerPack > 0))
            || (item.packs === 0 && item.pieces === 0)
        ))) {
            Alert('Har bir mahsulot uchun musbat miqdor va to‘g‘ri qadoq sonini kiriting', 'error');
            return;
        }
        const data = {
            customerId,
            summary: summary.trim() || null,
            items: items.flatMap(({ productId, warehouseId: whId, packs, pieces, unitPrice }) => {
                const lines = [];
                if (packs > 0) {
                    lines.push({ productId, warehouseId: whId, quantity: packs, unit: 'PACK', unitPrice });
                }
                if (pieces > 0) {
                    lines.push({ productId, warehouseId: whId, quantity: pieces, unit: 'PIECE', unitPrice });
                }
                return lines;
            }),
        };
        const createData = {
            customerId,
            summary: summary.trim() || null,
            items: items.flatMap(({ productId, warehouseId: whId, packs, pieces }) => {
                const lines = [];
                if (packs > 0) {
                    lines.push({ productId, warehouseId: whId, quantity: packs, unit: 'PACK' });
                }
                if (pieces > 0) {
                    lines.push({ productId, warehouseId: whId, quantity: pieces, unit: 'PIECE' });
                }
                return lines;
            }),
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
                await createOrder(createData).unwrap();
                Alert('Buyurtma yaratildi', 'success');
            }
            onSaved();
        } catch (error) {
            Alert(error?.data?.message || (isEdit ? 'Buyurtmani yangilashda xatolik' : 'Buyurtma yaratishda xatolik'), 'error');
        }
    };

    const getItemQuantity = (item) =>
        (Number(item.packs) || 0) * (Number(item.piecesPerPack) || 0) + (Number(item.pieces) || 0);
    const getItemAmount = (item) => getItemQuantity(item) * (Number(item.unitPrice) || 0);
    const getPackAmount = (item) =>
        (Number(item.packs) || 0) * (Number(item.piecesPerPack) || 0) * (Number(item.unitPrice) || 0);
    const totalQty    = items.reduce((sum, item) => sum + getItemQuantity(item), 0);
    const totalAmount = items.reduce((sum, item) => sum + getItemAmount(item), 0);
    const selectedWarehouse = warehouses.find((w) => w.id === warehouseId);

    const toggleOrder = (id) => setExpandedOrders((prev) => ({ ...prev, [id]: !prev[id] }));

    const fmtDate = (v) => {
        if (!v) return '—';
        const d = new Date(v);
        if (isNaN(d)) return '—';
        return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const spinner = (
        <svg className="h-4 w-4 animate-spin text-amber-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
    );

    const formatQuantityBreakdown = (item) => {
        const quantities = [];
        if (item.packs > 0) quantities.push(`${item.packs} pachka`);
        if (item.pieces > 0) quantities.push(`${item.pieces} dona`);
        return quantities.join(' + ');
    };

    return (
        <div className="flex w-full flex-col gap-4 py-2">

            {/* ── Header ── */}
            <div className={`relative overflow-hidden rounded-2xl border px-4 py-3.5 sm:px-5 sm:py-4 shadow-md ${panel}`}>
                <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-amber-400/6 to-transparent" />
                <div className="relative flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <span className={`flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl border ${badge}`}>
                            <LuPackage size={18} />
                        </span>
                        <div>
                            <h1 className={`text-lg sm:text-xl font-bold tracking-tight leading-tight ${head}`}>
                                {isEdit ? 'Buyurtmani tahrirlash' : 'Yangi buyurtma'}
                            </h1>
                            <p className={`text-xs sm:text-sm mt-0.5 ${muted}`}>
                                Mijoz va mahsulotlarni tanlang, miqdorni kiriting
                            </p>
                        </div>
                    </div>
                    <button type="button" onClick={onCancel}
                        className={`flex h-10 sm:h-12 w-full sm:w-auto shrink-0 items-center justify-center gap-2 rounded-xl border px-4 sm:px-5 text-sm font-bold transition-colors ${ghostBtn}`}>
                        <LuArrowLeft size={15} /> Buyurtmalar
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className={`rounded-2xl border shadow-md ${panel}`}>

                    {/* ── Mijoz + Ombor (рядом) ── */}
                    <div className="grid grid-cols-1 gap-4 p-4 sm:p-5 lg:grid-cols-[1fr_280px]">
                        {/* Mijoz */}
                        <div className="relative" ref={customerRef}>
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
                                <div className="flex items-center gap-2">
                                    <CustomerCreate
                                        compact
                                        onBeforeOpen={() => setCustomerOpen(false)}
                                        onCreated={(created) => {
                                            if (created?.id) selectCustomer(created);
                                        }}
                                    />
                                    <div className="relative flex-1">
                                        <LuSearch className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 ${muted}`} />
                                        <input
                                            type="text"
                                            placeholder="Mijoz nomini yozing yoki tanlang"
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
                                </div>
                            )}

                            {!isCustomerLocked && customerOpen && (
                                <div className={`absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border shadow-xl ${isDark ? 'border-[#334155] bg-[#0f172a]' : 'border-[#e2e8f0] bg-white'}`}>
                                    {isCustomerFetching ? (
                                        <div className={`flex items-center justify-center gap-2 py-6 text-sm ${muted}`}>
                                            {spinner} Qidirilmoqda...
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

                        {/* Ombor — компактный рядом */}
                        <div>
                            <label className={`mb-1.5 flex items-center gap-2 text-xs font-semibold ${muted}`}>
                                <span className={stepCx}>2</span> <LuWarehouse size={12} /> Ombor
                            </label>
                            <select
                                value={warehouseId}
                                onChange={(e) => handleWarehouseChange(e.target.value)}
                                required
                                className={inputCx}
                            >
                                <option value="">Tanlang</option>
                                {warehouses.map((w) => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* ── Mahsulot qo'shish (stock dropdown) ── */}
                    <div className="px-4 pb-4 sm:px-5 sm:pb-4">
                        <div className="relative" ref={searchRef}>
                            <label className={`mb-1.5 flex items-center gap-2 text-xs font-semibold ${muted}`}>
                                <span className={stepCx}>3</span> Mahsulot qo&apos;shish
                            </label>

                            <button
                                type="button"
                                disabled={!warehouseId}
                                onClick={() => setOpen((v) => !v)}
                                className={`${inputCx} flex items-center gap-3 text-left disabled:opacity-50 disabled:cursor-not-allowed ${open ? '!border-amber-400 ring-2 ring-amber-400/20' : ''}`}
                            >
                                <LuBoxes size={16} className={muted} />
                                <span className={`flex-1 truncate ${muted}`}>
                                    {warehouseId ? 'Ombordagi yoki katalogdagi mahsulotlardan tanlang' : 'Avval ombor tanlang'}
                                </span>
                                {warehouseId && stockPagination && (
                                    <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${badge}`}>
                                        {stockPagination.totalElements} ta
                                    </span>
                                )}
                                <LuChevronDown size={16} className={`shrink-0 transition-transform duration-200 ${muted} ${open ? 'rotate-180' : ''}`} />
                            </button>

                            {open && warehouseId && (
                                <div className={`absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border shadow-2xl ${isDark ? 'border-[#334155] bg-[#0f172a]' : 'border-[#e2e8f0] bg-white'}`}>

                                    {/* Search + filters */}
                                    <div className={`border-b p-3 ${line}`}>
                                        <div className="flex items-center gap-2">
                                            <div className="relative flex-1">
                                                <LuSearch className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 ${muted}`} />
                                                <input
                                                    ref={searchInputRef}
                                                    type="text"
                                                    placeholder="Nomi, artikul yoki barcode (skaner) bo‘yicha qidiring"
                                                    value={filters.name}
                                                    onChange={(e) => patchFilters({ name: e.target.value })}
                                                    className={`w-full rounded-xl border pl-10 pr-9 h-10 text-sm outline-none transition-all duration-200 ${fieldCx}`}
                                                />
                                                {filters.name && (
                                                    <button type="button" onClick={() => patchFilters({ name: '' })}
                                                        className={`absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md ${muted} hover:text-[#f43f5e]`}>
                                                        <LuX size={14} />
                                                    </button>
                                                )}
                                            </div>
                                            <button type="button" onClick={() => setFiltersOpen((v) => !v)}
                                                className={`relative flex h-10 shrink-0 items-center gap-2 rounded-xl border px-3.5 text-xs font-bold transition-colors ${
                                                    filtersOpen || advancedCount > 0
                                                        ? 'border-amber-400 bg-amber-400/10 text-amber-500'
                                                        : ghostBtn
                                                }`}>
                                                <LuSlidersHorizontal size={14} /> Filtrlar
                                                {advancedCount > 0 && (
                                                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-[#0f172a]">
                                                        {advancedCount}
                                                    </span>
                                                )}
                                            </button>
                                        </div>

                                        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                                            <button type="button"
                                                onClick={() => patchFilters({ lowStock: !filters.lowStock })}
                                                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                                                    filters.lowStock
                                                        ? 'border-amber-400 bg-amber-400 text-[#0f172a]'
                                                        : isDark ? 'border-[#334155] text-[#94a3b8] hover:bg-[#1e293b]' : 'border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]'
                                                }`}>
                                                <LuBoxes size={12} /> Kam qolganlar
                                            </button>

                                            <div className="flex items-center gap-2">
                                                {hasAnyFilter && (
                                                    <button type="button" onClick={resetFilters}
                                                        className={`flex items-center gap-1 text-xs font-semibold transition-colors ${muted} hover:text-[#f43f5e]`}>
                                                        <LuRotateCcw size={12} /> Tozalash
                                                    </button>
                                                )}
                                                <label className={`flex items-center gap-1.5 text-xs font-semibold ${muted}`}>
                                                    <LuArrowDownWideNarrow size={13} />
                                                    <select
                                                        value={filters.sortKey}
                                                        onChange={(e) => patchFilters({ sortKey: e.target.value })}
                                                        className={`h-8 rounded-lg border px-2 text-xs font-semibold outline-none ${fieldCx}`}
                                                    >
                                                        {SORTS.map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}
                                                    </select>
                                                </label>
                                            </div>
                                        </div>

                                        {filtersOpen && (
                                            <div className={`mt-3 grid grid-cols-2 gap-2.5 rounded-xl border p-3 sm:grid-cols-4 ${isDark ? 'border-[#334155] bg-[#1e293b]/40' : 'border-[#e2e8f0] bg-[#f8fafc]'}`}>

                                                <label className="flex flex-col gap-1">
                                                    <span className={`text-[10px] font-bold uppercase tracking-wide ${muted}`}>O&apos;lcham</span>
                                                    <input type="text" placeholder="1 kg" value={filters.productSize}
                                                        onChange={(e) => patchFilters({ productSize: e.target.value })} className={miniCx} />
                                                </label>
                                                <label className="flex flex-col gap-1 col-span-2">
                                                    <span className={`text-[10px] font-bold uppercase tracking-wide ${muted}`}>Brend</span>
                                                    <select value={filters.brandId}
                                                        onChange={(e) => patchFilters({ brandId: e.target.value })} className={miniCx}>
                                                        <option value="">Barcha brendlar</option>
                                                        {brandOptions.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                                                    </select>
                                                </label>
                                                <label className="flex flex-col gap-1 col-span-2">
                                                    <span className={`text-[10px] font-bold uppercase tracking-wide ${muted}`}>Mahsulot kategoriyasi</span>
                                                    <select value={filters.categoryId}
                                                        onChange={(e) => patchFilters({ categoryId: e.target.value })} className={miniCx}>
                                                        <option value="">Barcha kategoriyalar</option>
                                                        {categories.map((category) => (
                                                            <option key={category.id} value={category.id}>{category.name}</option>
                                                        ))}
                                                    </select>
                                                </label>
                                                <label className="flex flex-col gap-1 col-span-2">
                                                    <span className={`text-[10px] font-bold uppercase tracking-wide ${muted}`}>Rang</span>
                                                    <select value={filters.colorId}
                                                        onChange={(e) => patchFilters({ colorId: e.target.value })} className={miniCx}>
                                                        <option value="">Barcha ranglar</option>
                                                        {colors.map((color) => (
                                                            <option key={color.id} value={color.id}>{color.name}</option>
                                                        ))}
                                                    </select>
                                                </label>
                                                <label className="flex flex-col gap-1 col-span-2">
                                                    <span className={`text-[10px] font-bold uppercase tracking-wide ${muted}`}>Narx (so&apos;m)</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <input type="text" inputMode="numeric" placeholder="dan" value={filters.priceFrom}
                                                            onChange={(e) => patchFilters({ priceFrom: e.target.value.replace(/[^\d]/g, '') })} className={miniCx} />
                                                        <span className={muted}>–</span>
                                                        <input type="text" inputMode="numeric" placeholder="gacha" value={filters.priceTo}
                                                            onChange={(e) => patchFilters({ priceTo: e.target.value.replace(/[^\d]/g, '') })} className={miniCx} />
                                                    </div>
                                                </label>
                                            </div>
                                        )}
                                    </div>

                                    {/* Products list — infinite scroll */}
                                    {isSearchingProducts && selectableProducts.length === 0 ? (
                                        <div className={`flex items-center justify-center gap-2 py-10 text-sm ${muted}`}>
                                            {spinner} Mahsulotlar yuklanmoqda...
                                        </div>
                                    ) : selectableProducts.length === 0 ? (
                                        <div className={`flex flex-col items-center gap-2 py-10 ${muted}`}>
                                            <LuPackage size={28} strokeWidth={1.5} />
                                            <p className="text-sm">
                                                {isProductSearchError
                                                    ? 'Mahsulotlar ro‘yxatini yuklashda xatolik'
                                                    : hasAnyFilter ? 'Filtr bo‘yicha mahsulot topilmadi' : 'Mahsulot topilmadi'}
                                            </p>
                                            {hasAnyFilter && (
                                                <button type="button" onClick={resetFilters}
                                                    className="text-xs font-bold text-amber-500 hover:underline">
                                                    Filtrlarni tozalash
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className={`max-h-[420px] overflow-y-auto divide-y ${divider}`}>
                                            {selectableProducts.map((st) => {
                                                const added = items.some((i) => i.productId === st.productId);
                                                const empty = st.quantity <= 0;
                                                const isLow = st.productMinimumLine > 0 && st.quantity <= st.productMinimumLine;
                                                const blocked = added;
                                                const lastPrice = lastPriceMap[st.productId];
                                                const defPrice = st.price ?? productPriceMap[st.productId];
                                                return (
                                                    <button key={`${st.productId}-${st.warehouseId}`} type="button"
                                                        onClick={() => !blocked && addProduct(st, warehouseId)}
                                                        disabled={blocked}
                                                        className={`group flex w-full items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 text-left text-sm transition-colors ${
                                                            blocked ? 'cursor-not-allowed opacity-50'
                                                                    : isDark ? 'hover:bg-[#1e293b]' : 'hover:bg-amber-50'
                                                        }`}
                                                    >
                                                        <span className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl ${isDark ? 'bg-[#334155]' : 'bg-[#f1f5f9]'}`}>
                                                            <LuPackage size={15} className={muted} />
                                                        </span>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="flex flex-wrap items-center gap-1.5">
                                                                <span className={`truncate font-semibold text-sm ${head}`}>{st.productName}</span>
                                                                {st.productSize && (
                                                                    <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${isDark ? 'bg-white/5 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                                                                        {st.productSize}
                                                                    </span>
                                                                )}
                                                                {st.brand?.name && (
                                                                    <span className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${badge}`}>
                                                                        {st.brand.name}
                                                                    </span>
                                                                )}
                                                            </p>
                                                            <p className={`mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] ${muted}`}>
                                                                {st.productArticle && <span className="font-mono">{st.productArticle}</span>}
                                                                <span className="hidden sm:flex items-center gap-1"><LuBarcode size={11} />{st.productBarcode || '—'}</span>
                                                                {defPrice ? <span>{formatNumber(defPrice)} so&apos;m</span> : null}
                                                                {lastPrice != null && (
                                                                    <span className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${isDark ? 'bg-amber-400/10 text-amber-400' : 'bg-amber-50 text-amber-700'}`}>
                                                                        <LuTag size={9} /> Oxirgi: {formatNumber(lastPrice)}
                                                                    </span>
                                                                )}
                                                            </p>
                                                        </div>

                                                        <div className="flex shrink-0 flex-col items-end gap-0.5">
                                                            <span className={`rounded-full border px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] font-bold ${stockTone(st.quantity, isLow)}`}>
                                                                {empty ? '0 · Buyurtma mumkin' : `${formatNumber(st.quantity)} dona`}
                                                            </span>
                                                            {isLow && !empty && (
                                                                <span className="hidden sm:block text-[10px] font-semibold text-amber-500">
                                                                    min {formatNumber(st.productMinimumLine)}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {added ? (
                                                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-400/10 text-amber-500">
                                                                <LuCheck size={14} />
                                                            </span>
                                                        ) : (
                                                            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all group-hover:scale-110 ${badge}`}>
                                                                <LuPlus size={14} />
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}

                                            {/* Infinite scroll sentinel */}
                                            {hasMoreStocks && (
                                                <div
                                                    ref={loadMoreRef}
                                                    className={`flex items-center justify-center gap-2 py-4 text-xs ${muted}`}
                                                >
                                                    {isFetching ? (
                                                        <>
                                                            {spinner}
                                                            <span>Yuklanmoqda...</span>
                                                        </>
                                                    ) : (
                                                        <span className="opacity-60">↓ Yana yuklash uchun pastga suring</span>
                                                    )}
                                                </div>
                                            )}
                                            {!hasMoreStocks && selectableProducts.length > 0 && (
                                                <div className={`flex items-center justify-center gap-2 py-3 text-xs ${muted}`}>
                                                    <LuCheck size={12} className={isDark ? 'text-green-400' : 'text-green-600'} />
                                                    <span>{selectableProducts.length} ta mahsulot</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Footer */}
                                    <div className={`flex items-center justify-between gap-2 border-t px-3 py-2.5 ${line} ${isDark ? 'bg-[#0f172a]/60' : 'bg-[#f8fafc]'}`}>
                                        <span className={`text-xs ${muted}`}>
                                            {stockPagination ? `Jami ${stockPagination.totalElements} ta mahsulot` : '—'}
                                        </span>
                                        <button type="button" onClick={() => setOpen(false)}
                                            className="flex h-8 items-center rounded-lg bg-amber-400 px-4 text-xs font-bold text-[#0f172a] transition-colors hover:bg-amber-300">
                                            Tayyor{items.length > 0 ? ` (${items.length})` : ''}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Izoh ── */}
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5">
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

                    {/* ── Tanlanganlar ── */}
                    <div className={`flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 sm:px-5 sm:py-3.5 ${line}`}>
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
                                <p className="text-xs mt-1 opacity-70">Yuqoridagi ro&apos;yxatdan kerakli mahsulotni tanlang</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Desktop table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className={`text-left text-xs font-semibold uppercase tracking-wide ${muted} ${isDark ? 'bg-[#0f172a]/40' : 'bg-[#f8fafc]'}`}>
                                            <th className="px-5 py-3 min-w-[280px]">Mahsulot</th>
                                            <th className="px-5 py-3 w-52 text-right">Narx (so&apos;m)</th>
                                            <th className="px-5 py-3 w-36">Qadoq</th>
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
                                            const stockQty = stockMap[item.productId];
                                            const overStock = stockQty != null && item.quantity > stockQty;
                                            return (
                                            <tr key={item.productId} className={`transition-colors ${rowBg}`}>
                                                {/* Mahsulot + Artikul + Barcode merged */}
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-start gap-3">
                                                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                                                            {idx + 1}
                                                        </span>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <p className={`font-semibold leading-tight ${head}`}>{item.productName}</p>
                                                                {item._fromHistory && !priceChanged && (
                                                                    <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-700'}`}>
                                                                        <LuCheck size={9} /> Tarix
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {/* Artikul + Barcode под названием */}
                                                            <div className={`mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs ${muted}`}>
                                                                {item.productArticle && (
                                                                    <span className="inline-flex items-center gap-1 font-mono">
                                                                        <LuHash size={10} />
                                                                        {item.productArticle}
                                                                    </span>
                                                                )}
                                                                {item.productBarcode && (
                                                                    <span className="inline-flex items-center gap-1">
                                                                        <LuBarcode size={10} />
                                                                        {item.productBarcode}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {/* Oxirgi narx + qoldiq */}
                                                            {hasLastPrice && (
                                                                <p className={`text-xs mt-0.5 flex items-center gap-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                                                    <LuTag size={10} />
                                                                    Oxirgi: {formatNumber(lastPrice)} so&apos;m
                                                                </p>
                                                            )}
                                                            {stockQty != null && (
                                                                <p className={`text-xs mt-0.5 flex items-center gap-1 font-semibold ${overStock ? 'text-red-500' : muted}`}>
                                                                    <LuBoxes size={10} />
                                                                    Omborda: {formatNumber(stockQty)} dona{overStock ? ' — yetarli emas!' : ''}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Narx */}
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

                                                {/* Qadoq */}
                                                <td className="px-5 py-3.5">
                                                    <div className="flex flex-col gap-1">
                                                            <div className={`inline-flex items-center overflow-hidden rounded-xl border ${isDark ? 'border-[#334155]' : 'border-[#e2e8f0]'}`}>
                                                                <button type="button" onClick={() => stepPacks(item.productId, -1)}
                                                                    aria-label="Qadoqni kamaytirish"
                                                                    className={`flex h-9 w-9 items-center justify-center transition-colors ${isDark ? 'bg-[#1e293b] hover:bg-[#334155] text-[#cbd5e1]' : 'bg-[#f8fafc] hover:bg-[#f1f5f9] text-[#475569]'}`}>
                                                                    <LuMinus size={14} />
                                                                </button>
                                                                <input type="number" min={0} step={1} value={item.packs ?? 0}
                                                                    onChange={(e) => updatePacks(item.productId, e.target.value)}
                                                                    aria-label={`Qadoq soni, ${item.productName}`}
                                                                    className={`h-9 w-14 border-x text-center text-sm font-bold outline-none ${isDark ? 'border-[#334155] bg-[#0f172a] text-white' : 'border-[#e2e8f0] bg-white text-[#0f172a]'}`}
                                                                />
                                                                <button type="button" onClick={() => stepPacks(item.productId, 1)}
                                                                    aria-label="Qadoqni ko'paytirish"
                                                                    className={`flex h-9 w-9 items-center justify-center transition-colors ${isDark ? 'bg-[#1e293b] hover:bg-[#334155] text-[#cbd5e1]' : 'bg-[#f8fafc] hover:bg-[#f1f5f9] text-[#475569]'}`}>
                                                                    <LuPlus size={14} />
                                                                </button>
                                                            </div>
                                                            {item.packs > 0 && item.piecesPerPack > 0 && (
                                                                <span className={`text-[10px] ${muted}`}>
                                                                    Pachkalar jami: {formatNumber(getPackAmount(item))} so&apos;m
                                                                </span>
                                                            )}
                                                    </div>
                                                </td>

                                                {/* Miqdor */}
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`inline-flex items-center rounded-xl border overflow-hidden ${overStock ? 'border-red-400' : isDark ? 'border-[#334155]' : 'border-[#e2e8f0]'}`}>
                                                            <button type="button" onClick={() => stepQty(item.productId, -1)}
                                                                aria-label="Kamaytirish"
                                                                className={`flex h-9 w-9 items-center justify-center transition-colors ${isDark ? 'bg-[#1e293b] hover:bg-[#334155] text-[#cbd5e1]' : 'bg-[#f8fafc] hover:bg-[#f1f5f9] text-[#475569]'}`}>
                                                                <LuMinus size={14} />
                                                            </button>
                                                            <input type="number" min={0} step={1} value={item.pieces}
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

                                                {/* Jami */}
                                                <td className="px-5 py-3.5 text-right">
                                                    <p className={`font-bold text-sm ${head}`}>
                                                        {formatNumber(getItemAmount(item))} so&apos;m
                                                    </p>
                                                    {getItemQuantity(item) > 1 && (
                                                        <p className={`text-xs mt-0.5 ${muted}`}>
                                                            {getItemQuantity(item)} × {formatNumber(item.unitPrice ?? 0)}
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

                            {/* Mobile card list */}
                            <div className={`flex flex-col divide-y md:hidden ${divider}`}>
                                {items.map((item, idx) => {
                                    const lastPrice = lastPriceMap[item.productId];
                                    const hasLastPrice = lastPrice != null;
                                    const priceChanged = hasLastPrice && item.unitPrice !== lastPrice;
                                    const stockQty = stockMap[item.productId];
                                    const overStock = stockQty != null && item.quantity > stockQty;
                                    return (
                                        <div key={item.productId} className={`px-4 py-3.5 transition-colors ${rowBg}`}>
                                            <div className="flex items-start gap-2.5 mb-3">
                                                <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                                                    {idx + 1}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`font-semibold text-sm leading-tight ${head}`}>{item.productName}</p>
                                                    {item.productArticle && (
                                                        <p className={`text-xs font-mono mt-0.5 ${muted}`}>{item.productArticle}</p>
                                                    )}
                                                    {item.productBarcode && (
                                                        <p className={`text-xs font-mono mt-0.5 ${muted} flex items-center gap-1`}>
                                                            <LuBarcode size={10} />{item.productBarcode}
                                                        </p>
                                                    )}
                                                    {hasLastPrice && (
                                                        <p className={`text-xs mt-0.5 flex items-center gap-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                                            <LuTag size={9} /> Oxirgi: {formatNumber(lastPrice)} so&apos;m
                                                        </p>
                                                    )}
                                                    {stockQty != null && (
                                                        <p className={`text-xs mt-0.5 flex items-center gap-1 font-semibold ${overStock ? 'text-red-500' : muted}`}>
                                                            <LuBoxes size={9} />
                                                            Omborda: {formatNumber(stockQty)} dona{overStock ? ' — yetarli emas!' : ''}
                                                        </p>
                                                    )}
                                                </div>
                                                <button type="button" onClick={() => removeItem(item.productId)}
                                                    aria-label="O'chirish"
                                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors ${isDark ? 'text-[#64748b] hover:bg-red-500/10 hover:text-red-400' : 'text-[#94a3b8] hover:bg-red-50 hover:text-red-500'}`}>
                                                    <LuTrash2 size={15} />
                                                </button>
                                            </div>

                                            <div className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 mb-2.5 ${isDark ? 'border-[#334155] bg-[#1e293b]/40' : 'border-[#e2e8f0] bg-[#f8fafc]'}`}>
                                                <span className={`text-xs font-semibold ${muted}`}>Narx</span>
                                                {canEditPrice ? (
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
                                                            className={`w-36 rounded-lg border px-3 pr-9 h-8 text-right text-sm font-semibold outline-none transition-all duration-200 ${fieldCx}`}
                                                        />
                                                        <span className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs ${muted}`}>
                                                            so&apos;m
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className={`font-bold text-sm ${head}`}>
                                                        {formatNumber(item.unitPrice ?? 0)} so&apos;m
                                                    </span>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 mb-2.5">
                                                <div className={`flex flex-col gap-1.5 rounded-xl border px-3 py-2.5 ${overStock ? (isDark ? 'border-red-400/40 bg-red-500/5' : 'border-red-200 bg-red-50/50') : isDark ? 'border-[#334155] bg-[#1e293b]/40' : 'border-[#e2e8f0] bg-[#f8fafc]'}`}>
                                                    <span className={`text-[11px] font-semibold ${muted}`}>Dona</span>
                                                    <div className={`inline-flex items-center rounded-lg border overflow-hidden w-full ${overStock ? 'border-red-400' : isDark ? 'border-[#334155]' : 'border-[#e2e8f0]'}`}>
                                                        <button type="button" onClick={() => stepQty(item.productId, -1)}
                                                            aria-label="Kamaytirish"
                                                            className={`flex h-8 w-8 shrink-0 items-center justify-center transition-colors ${isDark ? 'bg-[#1e293b] hover:bg-[#334155] text-[#cbd5e1]' : 'bg-white hover:bg-[#f1f5f9] text-[#475569]'}`}>
                                                            <LuMinus size={13} />
                                                        </button>
                                                        <input type="number" min={0} step={1} value={item.pieces}
                                                            onChange={(e) => updateQty(item.productId, e.target.value)}
                                                            className={`h-8 flex-1 min-w-0 border-x text-center text-sm font-bold outline-none ${isDark ? 'border-[#334155] bg-[#0f172a] text-white' : 'border-[#e2e8f0] bg-white text-[#0f172a]'}`}
                                                        />
                                                        <button type="button" onClick={() => stepQty(item.productId, 1)}
                                                            aria-label="Ko'paytirish"
                                                            className={`flex h-8 w-8 shrink-0 items-center justify-center transition-colors ${isDark ? 'bg-[#1e293b] hover:bg-[#334155] text-[#cbd5e1]' : 'bg-white hover:bg-[#f1f5f9] text-[#475569]'}`}>
                                                            <LuPlus size={13} />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className={`flex flex-col gap-1.5 rounded-xl border px-3 py-2.5 ${isDark ? 'border-[#334155] bg-[#1e293b]/40' : 'border-[#e2e8f0] bg-[#f8fafc]'}`}>
                                                    <span className={`text-[11px] font-semibold ${muted}`}>
                                                        Pachka {item.piecesPerPack ? `(1=${item.piecesPerPack}d)` : ''}
                                                    </span>
                                                    <div className="flex flex-col gap-1">
                                                            <div className={`inline-flex items-center rounded-lg border overflow-hidden w-full ${isDark ? 'border-[#334155]' : 'border-[#e2e8f0]'}`}>
                                                                <button type="button" onClick={() => stepPacks(item.productId, -1)}
                                                                    aria-label="Qadoqni kamaytirish"
                                                                    className={`flex h-8 w-8 shrink-0 items-center justify-center transition-colors ${isDark ? 'bg-[#1e293b] hover:bg-[#334155] text-[#cbd5e1]' : 'bg-white hover:bg-[#f1f5f9] text-[#475569]'}`}>
                                                                    <LuMinus size={13} />
                                                                </button>
                                                                <input type="number" min={0} step={1} value={item.packs ?? 0}
                                                                    onChange={(e) => updatePacks(item.productId, e.target.value)}
                                                                    aria-label={`Qadoq soni, ${item.productName}`}
                                                                    className={`h-8 flex-1 min-w-0 border-x text-center text-sm font-bold outline-none ${isDark ? 'border-[#334155] bg-[#0f172a] text-white' : 'border-[#e2e8f0] bg-white text-[#0f172a]'}`}
                                                                />
                                                                <button type="button" onClick={() => stepPacks(item.productId, 1)}
                                                                    aria-label="Qadoqni ko'paytirish"
                                                                    className={`flex h-8 w-8 shrink-0 items-center justify-center transition-colors ${isDark ? 'bg-[#1e293b] hover:bg-[#334155] text-[#cbd5e1]' : 'bg-white hover:bg-[#f1f5f9] text-[#475569]'}`}>
                                                                    <LuPlus size={13} />
                                                                </button>
                                                            </div>
                                                            <span className={`text-[10px] ${muted}`}>
                                                                Buyurtma: {formatQuantityBreakdown(item)}
                                                            </span>
                                                            {item.packs > 0 && item.piecesPerPack > 0 && (
                                                                <span className={`text-[10px] ${muted}`}>
                                                                    Pachkalar jami: {formatNumber(getPackAmount(item))} so&apos;m
                                                                </span>
                                                            )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                {item._fromHistory && !priceChanged && (
                                                    <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-700'}`}>
                                                        <LuCheck size={9} /> Tarixdan narx
                                                    </span>
                                                )}
                                                {canEditPrice && hasLastPrice && priceChanged && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setItems((p) => p.map((i) =>
                                                            i.productId === item.productId
                                                                ? { ...i, unitPrice: lastPrice, _priceRaw: undefined, _fromHistory: true }
                                                                : i
                                                        ))}
                                                        className={`flex items-center gap-1 text-[10px] font-semibold transition-colors ${isDark ? 'text-amber-400/70 hover:text-amber-400' : 'text-amber-600/70 hover:text-amber-600'}`}
                                                    >
                                                        ↩ {formatNumber(lastPrice)} so&apos;m
                                                    </button>
                                                )}
                                                <span className={`ml-auto font-bold text-sm ${head}`}>
                                                    {formatNumber(getItemAmount(item))} so&apos;m
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {/* ── Footer ── */}
                    <div className={`flex flex-col gap-3 border-t px-4 py-3.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-5 sm:py-4 ${line}`}>
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
                                className={`flex h-11 sm:h-12 flex-1 sm:flex-none items-center justify-center rounded-xl border px-4 sm:px-5 text-sm font-bold transition-colors ${ghostBtn}`}>
                                Bekor qilish
                            </button>
                            <button type="submit"
                                disabled={isSending || items.length === 0 || !customerId}
                                className={`flex h-11 sm:h-12 flex-1 sm:flex-none items-center justify-center gap-2 rounded-xl px-5 sm:px-7 text-sm font-bold shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl hover:-translate-y-px ${submitBtn}`}>
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

                    {prevOrdersFetching ? (
                        <div className={`flex items-center justify-center gap-2 py-10 text-sm ${muted}`}>
                            {spinner}
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
                                        <button
                                            type="button"
                                            onClick={() => toggleOrder(o.id)}
                                            className={`w-full flex flex-wrap items-center gap-3 px-5 py-3.5 text-left transition-colors ${isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-amber-50/50'}`}
                                        >
                                            <span className={`flex items-center gap-1.5 text-xs ${muted} w-28 shrink-0`}>
                                                <LuCalendar size={12} />
                                                {fmtDate(o.createdAt)}
                                            </span>

                                            <span className={`flex items-center gap-1.5 text-xs font-semibold ${muted} w-20 shrink-0`}>
                                                <LuPackage size={12} />
                                                {o.items?.length ?? 0} mahsulot
                                            </span>

                                            <span className={`flex items-center gap-1.5 text-sm font-bold ${head} flex-1`}>
                                                <LuTrendingUp size={13} className="text-amber-500 shrink-0" />
                                                {formatNumber(o.totalAmount ?? 0)} so&apos;m
                                            </span>

                                            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${statusCls} shrink-0`}>
                                                {{ APPROVED: 'Tasdiqlangan', PENDING: 'Kutilmoqda', REJECTED: 'Rad etilgan' }[o.status] ?? o.status}
                                            </span>

                                            {o.summary && (
                                                <span className={`text-xs italic truncate max-w-[200px] ${muted}`}>{o.summary}</span>
                                            )}

                                            <LuChevronDown
                                                size={16}
                                                className={`shrink-0 ml-auto transition-transform duration-200 ${muted} ${isOpen ? 'rotate-180' : ''}`}
                                            />
                                        </button>

                                        {isOpen && (
                                            <div className={`border-t ${line} ${isDark ? 'bg-[#0f172a]/30' : 'bg-[#f8fafc]'}`}>
                                                {!o.items || o.items.length === 0 ? (
                                                    <p className={`px-5 py-4 text-sm ${muted}`}>Mahsulotlar mavjud emas</p>
                                                ) : (
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-sm">
                                                            <thead>
                                                                <tr className={`text-xs font-semibold uppercase tracking-wide ${muted}`}>
                                                                    <th className="px-5 py-2.5 text-left">Mahsulot</th>
                                                                    <th className="px-5 py-2.5 text-right w-36">Narx</th>
                                                                    <th className="px-5 py-2.5 text-right w-24">Miqdor</th>
                                                                    <th className="px-5 py-2.5 text-right w-40">Jami</th>
                                                                    <th className="px-5 py-2.5 text-center w-32">Narxni qo&apos;llash</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className={`divide-y ${isDark ? 'divide-white/[0.05]' : 'divide-[#f1f5f9]'}`}>
                                                                {o.items.map((item, idx) => {
                                                                    const inCurrent = items.find((ci) => ci.productId === item.productId);
                                                                    return (
                                                                        <tr key={item.id ?? idx} className={`transition-colors ${isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-white'}`}>
                                                                            <td className="px-5 py-2.5">
                                                                                <div className="flex items-center gap-2.5">
                                                                                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${isDark ? 'bg-[#1e293b]' : 'bg-white border border-[#e2e8f0]'}`}>
                                                                                        <LuPackage size={13} className={muted} />
                                                                                    </span>
                                                                                    <div className="min-w-0">
                                                                                        <span className={`text-sm font-semibold ${head}`}>{item.productName}</span>
                                                                                        {(item.productArticle || item.productBarcode) && (
                                                                                            <div className={`mt-0.5 flex flex-wrap items-center gap-x-2 text-[10px] ${muted}`}>
                                                                                                {item.productArticle && (
                                                                                                    <span className="font-mono inline-flex items-center gap-1">
                                                                                                        <LuHash size={9} />{item.productArticle}
                                                                                                    </span>
                                                                                                )}
                                                                                                {item.productBarcode && (
                                                                                                    <span className="font-mono inline-flex items-center gap-1">
                                                                                                        <LuBarcode size={9} />{item.productBarcode}
                                                                                                    </span>
                                                                                                )}
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-5 py-2.5 text-right font-bold text-sm whitespace-nowrap">
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
                                                            <tfoot>
                                                                <tr className={isDark ? 'bg-[#0f172a]/50' : 'bg-white'}>
                                                                    <td colSpan={3} className={`px-5 py-2.5 text-right text-xs font-semibold ${muted}`}>
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