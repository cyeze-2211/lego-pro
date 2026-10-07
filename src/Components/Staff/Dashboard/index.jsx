import { useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import {
    LuArrowRight, LuBoxes, LuClock3, LuFlame, LuHistory,
    LuLogIn, LuLogOut, LuPackage, LuTriangleAlert, LuWarehouse,
} from 'react-icons/lu';
import { useAppTheme } from '../../../theme/tokens';
import { useGetProductStocksQuery } from '../../../store/services/productStock.api';
import { useGetRawMaterialStocksQuery } from '../../../store/services/rawMaterialStock.api';
import { useGetWarehousesQuery } from '../../../store/services/warehouse.api';
import { Alert } from '../../Other/UI/Alert/Alert';
import { formatNumber } from '../../ui/number-format';

const DASHBOARD_PAGE_SIZE = 5;

const LowStockPanel = ({
    title,
    description,
    items,
    total,
    isLoading,
    error,
    warehouseName,
    isDark,
    to,
    kind,
}) => {
    const muted = isDark ? 'text-slate-400' : 'text-slate-500';
    const head = isDark ? 'text-white' : 'text-slate-900';
    const divider = isDark ? 'divide-slate-700/50' : 'divide-slate-100';
    const rowBg = isDark ? 'hover:bg-slate-800/50' : 'hover:bg-amber-50/40';
    const isRaw = kind === 'raw';

    return (
        <section className={`overflow-hidden rounded-2xl border shadow-md ${isDark ? 'border-white/10 bg-[#141C2B]' : 'border-slate-200 bg-white'}`}>
            <div className={`flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-5 ${isDark ? 'border-slate-700/60' : 'border-slate-100'}`}>
                <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
                        <LuTriangleAlert size={15} />
                    </span>
                    <div className="min-w-0">
                        <h2 className={`truncate text-sm font-bold ${head}`}>{title}</h2>
                        <p className={`hidden text-xs sm:block ${muted}`}>{description}</p>
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    <span className={`rounded-lg px-2 py-1 text-xs font-bold ${isDark ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-50 text-rose-600'}`}>
                        {total}
                    </span>
                    <Link to={to} className="flex items-center gap-1 text-xs font-semibold text-amber-500 hover:text-amber-600">
                        Barchasi <LuArrowRight size={12} />
                    </Link>
                </div>
            </div>

            {error ? (
                <p role="alert" className="px-5 py-8 text-center text-sm text-rose-500">
                    Qoldiqlarni yuklashda xatolik yuz berdi
                </p>
            ) : isLoading ? (
                <div className={`flex items-center justify-center gap-3 py-10 ${muted}`}>
                    <svg className="h-5 w-5 animate-spin text-amber-400" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span className="text-sm">Yuklanmoqda...</span>
                </div>
            ) : items.length === 0 ? (
                <div className={`flex flex-col items-center gap-2 py-10 ${muted}`}>
                    {isRaw ? <LuFlame size={30} /> : <LuPackage size={30} />}
                    <p className="text-sm font-medium">{isRaw ? 'Kam qolgan xom ashyo yo‘q' : 'Kam qolgan mahsulot yo‘q'}</p>
                </div>
            ) : (
                <div className={`divide-y ${divider}`}>
                    {items.map((item) => {
                        const id = isRaw
                            ? `${item.rawMaterialId}-${item.warehouseId}`
                            : `${item.productId}-${item.warehouseId}`;
                        const name = isRaw ? item.rawMaterialName : item.productName;
                        const min = isRaw ? item.rawMaterialMinimumLine : item.productMinimumLine;
                        const quantity = isRaw
                            ? `${formatNumber(item.quantity)} ${item.unit || 'KG'}`
                            : `${formatNumber(item.quantity)} dona`;
                        const subline = isRaw
                            ? `Min ${formatNumber(min)} ${item.unit || 'KG'}`
                            : `Min ${formatNumber(min)} dona`;
                        const warehouse = warehouseName[item.warehouseId];

                        return (
                            <div key={id} className={`flex items-center justify-between gap-3 px-4 py-3 ${rowBg}`}>
                                <div className="flex min-w-0 items-center gap-3">
                                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${isRaw ? 'bg-amber-400/10 text-amber-500' : 'bg-sky-500/10 text-sky-500'}`}>
                                        {isRaw ? <LuFlame size={15} /> : <LuPackage size={15} />}
                                    </span>
                                    <div className="min-w-0">
                                        <p className={`truncate text-sm font-semibold ${head}`}>{name}</p>
                                        <p className={`truncate text-xs ${muted}`}>
                                            {subline}{warehouse ? ` · ${warehouse}` : ''}
                                        </p>
                                    </div>
                                </div>
                                <span className="shrink-0 rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-bold text-rose-500">
                                    {quantity}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
};

LowStockPanel.propTypes = {
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    items: PropTypes.arrayOf(PropTypes.object).isRequired,
    total: PropTypes.number.isRequired,
    isLoading: PropTypes.bool.isRequired,
    error: PropTypes.bool.isRequired,
    warehouseName: PropTypes.objectOf(PropTypes.string).isRequired,
    isDark: PropTypes.bool.isRequired,
    to: PropTypes.string.isRequired,
    kind: PropTypes.oneOf(['raw', 'product']).isRequired,
};

export default function StaffDashboard() {
    const { isDark } = useAppTheme();
    const { data: productWarehouses = [] } = useGetWarehousesQuery('PRODUCT');
    const { data: rawWarehouses = [] } = useGetWarehousesQuery('RAW_MATERIAL');
    const { data: productData, isFetching: isFetchingProducts, isError: productsError } = useGetProductStocksQuery({
        lowStock: true,
        page: 0,
        size: DASHBOARD_PAGE_SIZE,
    });
    const { data: rawData, isFetching: isFetchingRaw, isError: rawError } = useGetRawMaterialStocksQuery({
        lowStock: true,
        unit: 'KG',
        page: 0,
        size: DASHBOARD_PAGE_SIZE,
    });

    const warehouseName = useMemo(
        () => Object.fromEntries([...productWarehouses, ...rawWarehouses].map((warehouse) => [warehouse.id, warehouse.name])),
        [productWarehouses, rawWarehouses],
    );
    const productStocks = productData?.items ?? [];
    const rawStocks = rawData?.items ?? [];
    const productTotal = productData?.pagination?.totalElements ?? 0;
    const rawTotal = rawData?.pagination?.totalElements ?? 0;
    const panel = isDark ? 'border-white/10 bg-[#141C2B]' : 'border-slate-200 bg-white';
    const muted = isDark ? 'text-slate-400' : 'text-slate-500';
    const head = isDark ? 'text-white' : 'text-slate-900';

    useEffect(() => {
        if (productsError) Alert('Mahsulot qoldiqlarini yuklashda xatolik', 'error');
    }, [productsError]);

    useEffect(() => {
        if (rawError) Alert('Xom ashyo qoldiqlarini yuklashda xatolik', 'error');
    }, [rawError]);

    const quickLinks = [
        { label: 'Buyurtmalar', path: '/staff/orders', icon: LuBoxes, badge: 'bg-amber-400/10 text-amber-500 border-amber-400/20' },
        { label: 'Tovar kirimi', path: '/staff/income', icon: LuLogIn, badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
        { label: 'Tovar ombori', path: '/staff/warehouse', icon: LuWarehouse, badge: 'bg-sky-500/10 text-sky-500 border-sky-500/20' },
        { label: 'Tovar tarixi', path: '/staff/history', icon: LuHistory, badge: 'bg-slate-500/10 text-slate-500 border-slate-500/20' },
        { label: 'Xom ashyo kirimi', path: '/raw-staff/income', icon: LuLogIn, badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
        { label: 'Xom ashyo chiqimi', path: '/raw-staff/outcome', icon: LuLogOut, badge: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
        { label: 'Xom ashyo ombori', path: '/raw-staff/warehouse', icon: LuWarehouse, badge: 'bg-amber-400/10 text-amber-500 border-amber-400/20' },
        { label: 'Xom ashyo tarixi', path: '/raw-staff/history', icon: LuHistory, badge: 'bg-slate-500/10 text-slate-500 border-slate-500/20' },
    ];

    return (
        <div className="flex w-full flex-col gap-4 py-2">
            <section className={`relative overflow-hidden rounded-2xl border px-4 py-4 shadow-md sm:px-5 ${panel}`}>
                <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-amber-400/6 to-transparent" />
                <div className="relative flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="mb-1 text-xs font-bold uppercase tracking-wider text-amber-500">Ombor boshqaruvi</p>
                        <h1 className={`text-lg font-bold sm:text-xl ${head}`}>Xayrli kun, omborchi!</h1>
                        <p className={`mt-0.5 text-xs ${muted}`}>Tovar va xom ashyo omborlarining holati.</p>
                    </div>
                    <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs sm:text-sm ${isDark ? 'border-amber-400/20 bg-amber-400/10' : 'border-amber-200 bg-amber-50'}`}>
                        <LuClock3 className="shrink-0 text-amber-500" size={14} />
                        <span className={`font-semibold ${head}`}>
                            {new Date().toLocaleDateString('uz-UZ', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </span>
                    </div>
                </div>
            </section>

            <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {quickLinks.map(({ label, path, icon: Icon, badge }) => (
                    <Link
                        key={path}
                        to={path}
                        className={`group flex items-center gap-2.5 rounded-2xl border p-3 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:p-4 ${panel}`}
                    >
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border sm:h-10 sm:w-10 ${badge}`}>
                            <Icon size={17} />
                        </span>
                        <span className={`text-xs font-semibold leading-tight sm:text-sm ${head}`}>{label}</span>
                        <LuArrowRight size={13} className={`ml-auto shrink-0 transition-transform group-hover:translate-x-0.5 ${muted}`} />
                    </Link>
                ))}
            </section>

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <LowStockPanel
                    title="Kam qolgan mahsulotlar"
                    description="Qoldiq minimal chiziqqa teng yoki past"
                    items={productStocks}
                    total={productTotal}
                    isLoading={isFetchingProducts}
                    error={productsError}
                    warehouseName={warehouseName}
                    isDark={isDark}
                    to="/staff/warehouse"
                    kind="product"
                />
                <LowStockPanel
                    title="Kam qolgan xom ashyolar"
                    description="Qoldiq minimal chiziqqa teng yoki past (KG)"
                    items={rawStocks}
                    total={rawTotal}
                    isLoading={isFetchingRaw}
                    error={rawError}
                    warehouseName={warehouseName}
                    isDark={isDark}
                    to="/raw-staff/warehouse"
                    kind="raw"
                />
            </section>
        </div>
    );
}
