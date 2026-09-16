import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    LuCalendar, LuLayers, LuPackage, LuWarehouse,
    LuBarcode, LuChevronLeft, LuChevronRight, LuFlame, LuBoxes, LuX,
} from 'react-icons/lu';
import { Box, HStack, Heading, Text } from '@chakra-ui/react';
import { useGetWarehouseByIdQuery } from '../../../store/services/warehouse.api';
import { useGetProductStocksQuery } from '../../../store/services/productStock.api';
import { useGetRawMaterialStocksQuery } from '../../../store/services/rawMaterialStock.api';
import EntityDetail, { DetailRow, DetailSection, formatDetailDate } from '../EntityDetail';
import { useAppTheme } from '../../../theme/tokens';

const CATEGORY_MAP = {
    PRODUCT: { label: 'Tovar ombori', icon: LuPackage },
    RAW_MATERIAL: { label: 'Xom ashyo ombori', icon: LuLayers },
};

const PAGE_SIZE = 20;
const UNITS = ['GRAM', 'KG', 'TON'];

/* ─────────────────────────────────────────────────────────────────────────
   Product stock table (PRODUCT warehouses)
───────────────────────────────────────────────────────────────────────── */
function ProductStockSection({ warehouseId }) {
    const { isDark } = useAppTheme();
    const [page, setPage] = useState(0);

    const { data, isFetching } = useGetProductStocksQuery({
        warehouseId,
        page,
        size: PAGE_SIZE,
    });

    const stocks     = data?.data       ?? [];
    const pagination = data?.pagination ?? {};

    const panel   = isDark ? 'border-white/10 bg-[#141C2B]' : 'border-slate-200 bg-white';
    const muted   = isDark ? 'text-slate-400' : 'text-slate-500';
    const head    = isDark ? 'text-white' : 'text-slate-900';
    const divider = isDark ? 'divide-slate-700/50' : 'divide-slate-100';
    const rowHov  = isDark ? 'hover:bg-slate-800/50' : 'hover:bg-blue-50/50';

    return (
        <Box gridColumn={{ lg: 'span 2' }}>
            <div className={`rounded-2xl border shadow-md overflow-hidden ${panel}`}>

                {/* Header */}
                <div className={`flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`}>
                    <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
                            <LuBoxes size={16} />
                        </span>
                        <div>
                            <h2 className={`text-base font-bold ${head}`}>Joriy qoldiqlar</h2>
                            <p className={`text-xs ${muted}`}>Ushbu omboردagi mahsulot qoldiqlari</p>
                        </div>
                    </div>
                    {pagination.totalElements != null && (
                        <span className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold bg-blue-500/10 text-blue-500 border-blue-500/20">
                            <LuPackage size={12} /> {pagination.totalElements} ta mahsulot
                        </span>
                    )}
                </div>

                {isFetching ? (
                    <div className={`flex items-center justify-center gap-2 py-14 text-sm ${muted}`}>
                        <svg className="h-4 w-4 animate-spin text-blue-400" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                        </svg>
                        Yuklanmoqda...
                    </div>
                ) : stocks.length === 0 ? (
                    <div className={`flex flex-col items-center gap-2.5 py-14 ${muted}`}>
                        <LuPackage size={34} strokeWidth={1.5} />
                        <p className="text-sm font-medium">Qoldiq mavjud emas</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className={`text-left text-xs font-semibold uppercase tracking-wide border-b ${muted} ${isDark ? 'bg-slate-900/30 border-slate-700/60' : 'bg-slate-50/80 border-slate-200'}`}>
                                        <th className="px-5 py-3 w-12">#</th>
                                        <th className="px-5 py-3">Mahsulot</th>
                                        <th className="px-5 py-3">Barcode</th>
                                        <th className="px-5 py-3">Oxirgi yangilanish</th>
                                        <th className="px-5 py-3 text-right">Qoldiq</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${divider}`}>
                                    {stocks.map((s, idx) => (
                                        <tr key={`${s.productId}-${s.warehouseId}`} className={`transition-colors ${rowHov}`}>
                                            <td className={`px-5 py-3.5 text-xs ${muted}`}>{page * PAGE_SIZE + idx + 1}</td>
                                            <td className={`px-5 py-3.5 font-semibold ${head}`}>{s.productName}</td>
                                            <td className={`px-5 py-3.5 font-mono text-xs ${muted}`}>
                                                <span className="flex items-center gap-1.5">
                                                    <LuBarcode size={12} />{s.productBarcode || '—'}
                                                </span>
                                            </td>
                                            <td className={`px-5 py-3.5 text-xs ${muted}`}>
                                                {s.lastModifiedAt ? new Date(s.lastModifiedAt).toLocaleString('uz-UZ') : '—'}
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <ProductQtyBadge qty={s.quantity} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile */}
                        <div className={`flex flex-col divide-y md:hidden ${divider}`}>
                            {stocks.map((s) => (
                                <div key={`${s.productId}-${s.warehouseId}`}
                                    className={`flex items-center justify-between gap-3 px-4 py-3.5 transition-colors ${rowHov}`}>
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isDark ? 'bg-blue-500/10 text-blue-300' : 'bg-blue-50 text-blue-600'}`}>
                                            <LuPackage size={16} />
                                        </span>
                                        <div className="min-w-0">
                                            <p className={`truncate font-semibold text-sm ${head}`}>{s.productName}</p>
                                            <p className={`text-xs font-mono ${muted}`}>{s.productBarcode || '—'}</p>
                                        </div>
                                    </div>
                                    <ProductQtyBadge qty={s.quantity} />
                                </div>
                            ))}
                        </div>

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
                    </>
                )}
            </div>
        </Box>
    );
}

function ProductQtyBadge({ qty }) {
    const cls = qty > 10
        ? 'bg-emerald-500/10 text-emerald-500'
        : qty > 0
        ? 'bg-amber-500/10 text-amber-500'
        : 'bg-rose-500/10 text-rose-500';
    return (
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${cls}`}>
            {(qty ?? 0).toLocaleString('uz-UZ')} dona
        </span>
    );
}

/* ─────────────────────────────────────────────────────────────────────────
   Raw material stock table (RAW_MATERIAL warehouses)
───────────────────────────────────────────────────────────────────────── */
function RawMaterialStockSection({ warehouseId }) {
    const { isDark } = useAppTheme();
    const [page, setPage] = useState(0);
    const [unit, setUnit] = useState('KG');

    const { data, isFetching } = useGetRawMaterialStocksQuery({
        warehouseId,
        unit,
        page,
        size: PAGE_SIZE,
    });

    const stocks     = data?.data       ?? [];
    const pagination = data?.pagination ?? {};

    const panel   = isDark ? 'border-white/10 bg-[#141C2B]' : 'border-slate-200 bg-white';
    const muted   = isDark ? 'text-slate-400' : 'text-slate-500';
    const head    = isDark ? 'text-white' : 'text-slate-900';
    const divider = isDark ? 'divide-slate-700/50' : 'divide-slate-100';
    const rowHov  = isDark ? 'hover:bg-slate-800/50' : 'hover:bg-orange-50/50';

    return (
        <Box gridColumn={{ lg: 'span 2' }}>
            <div className={`rounded-2xl border shadow-md overflow-hidden ${panel}`}>

                {/* Header */}
                <div className={`flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`}>
                    <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
                            <LuFlame size={16} />
                        </span>
                        <div>
                            <h2 className={`text-base font-bold ${head}`}>Joriy qoldiqlar</h2>
                            <p className={`text-xs ${muted}`}>Ushbu omboردagi xom ashyo qoldiqlari</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {pagination.totalElements != null && (
                            <span className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold bg-orange-500/10 text-orange-500 border-orange-500/20">
                                <LuLayers size={12} /> {pagination.totalElements} ta qator
                            </span>
                        )}
                        {/* Unit toggle */}
                        <div className={`flex items-center rounded-xl border overflow-hidden text-xs font-bold ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                            {UNITS.map((u) => (
                                <button
                                    key={u}
                                    type="button"
                                    onClick={() => { setUnit(u); setPage(0); }}
                                    className={`px-3 py-1.5 transition-colors ${
                                        unit === u
                                            ? 'bg-orange-500 text-white'
                                            : isDark
                                            ? 'bg-transparent text-slate-400 hover:bg-slate-700'
                                            : 'bg-transparent text-slate-500 hover:bg-slate-100'
                                    }`}
                                >
                                    {u}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {isFetching ? (
                    <div className={`flex items-center justify-center gap-2 py-14 text-sm ${muted}`}>
                        <svg className="h-4 w-4 animate-spin text-orange-400" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                        </svg>
                        Yuklanmoqda...
                    </div>
                ) : stocks.length === 0 ? (
                    <div className={`flex flex-col items-center gap-2.5 py-14 ${muted}`}>
                        <LuLayers size={34} strokeWidth={1.5} />
                        <p className="text-sm font-medium">Qoldiq mavjud emas</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className={`text-left text-xs font-semibold uppercase tracking-wide border-b ${muted} ${isDark ? 'bg-slate-900/30 border-slate-700/60' : 'bg-slate-50/80 border-slate-200'}`}>
                                        <th className="px-5 py-3 w-12">#</th>
                                        <th className="px-5 py-3">Xom ashyo</th>
                                        <th className="px-5 py-3 hidden lg:table-cell">Izoh</th>
                                        <th className="px-5 py-3">Oxirgi yangilanish</th>
                                        <th className="px-5 py-3 text-right">Qoldiq</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${divider}`}>
                                    {stocks.map((s, idx) => (
                                        <tr key={`${s.rawMaterialId}-${s.warehouseId}`} className={`transition-colors ${rowHov}`}>
                                            <td className={`px-5 py-3.5 text-xs ${muted}`}>{page * PAGE_SIZE + idx + 1}</td>
                                            <td className={`px-5 py-3.5 font-semibold ${head}`}>{s.rawMaterialName}</td>
                                            <td className={`px-5 py-3.5 text-xs hidden lg:table-cell ${muted}`}>{s.rawMaterialSummary || '—'}</td>
                                            <td className={`px-5 py-3.5 text-xs ${muted}`}>
                                                {s.lastModifiedAt ? new Date(s.lastModifiedAt).toLocaleString('uz-UZ') : '—'}
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <RawQtyBadge qty={s.quantity} unit={s.unit || unit} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile */}
                        <div className={`flex flex-col divide-y md:hidden ${divider}`}>
                            {stocks.map((s) => (
                                <div key={`${s.rawMaterialId}-${s.warehouseId}`}
                                    className={`flex items-center justify-between gap-3 px-4 py-3.5 transition-colors ${rowHov}`}>
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isDark ? 'bg-orange-500/10 text-orange-300' : 'bg-orange-50 text-orange-600'}`}>
                                            <LuFlame size={16} />
                                        </span>
                                        <div className="min-w-0">
                                            <p className={`truncate font-semibold text-sm ${head}`}>{s.rawMaterialName}</p>
                                            {s.rawMaterialSummary && <p className={`text-xs truncate ${muted}`}>{s.rawMaterialSummary}</p>}
                                        </div>
                                    </div>
                                    <RawQtyBadge qty={s.quantity} unit={s.unit || unit} />
                                </div>
                            ))}
                        </div>

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
                    </>
                )}
            </div>
        </Box>
    );
}

function RawQtyBadge({ qty, unit }) {
    const cls = qty > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500';
    return (
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${cls}`}>
            {typeof qty === 'number'
                ? qty.toLocaleString('uz-UZ', { maximumFractionDigits: 3 })
                : qty} {unit}
        </span>
    );
}

/* ─────────────────────────────────────────────────────────────────────────
   Main WarehouseDetail component
───────────────────────────────────────────────────────────────────────── */
export default function WarehouseDetail() {
    const { id } = useParams();
    const { data: warehouse, isLoading, isError } = useGetWarehouseByIdQuery(id, { skip: !id });
    const category = CATEGORY_MAP[warehouse?.category] || { label: warehouse?.category || 'Ombor', icon: LuWarehouse };
    const CategoryIcon = category.icon;

    const isProduct    = warehouse?.category === 'PRODUCT';
    const isRawMaterial = warehouse?.category === 'RAW_MATERIAL';

    return <EntityDetail
        title={warehouse?.name || 'Ombor'}
        icon={LuWarehouse}
        backTo="/warehouses"
        backLabel="Omborlar"
        loading={isLoading}
        error={isError || !warehouse}
        accentColorOverride="#2563EB"
        accentSoftBackground="rgba(37, 99, 235, 0.12)"
        accentGradient="linear(to-r, #2563EB, #93C5FD)"
    >
        {({ accentColor }) => <>
            <DetailSection title="Ombor ma'lumotlari" icon={LuWarehouse} accentColor={accentColor}>
                <DetailRow label="Nomi" value={warehouse.name} emphasize />
                <DetailRow label="Tavsifi" value={warehouse.summary} />
                <DetailRow label="Turi" value={<span style={{ color: accentColor, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 7 }}><CategoryIcon size={16} />{category.label}</span>} />
            </DetailSection>

            <DetailSection title="Tizim ma'lumotlari" icon={LuCalendar} accentColor={accentColor}>
                <DetailRow label="Yaratilgan" value={formatDetailDate(warehouse.createdAt)} />
                <DetailRow label="Yangilangan" value={formatDetailDate(warehouse.lastModifiedAt)} />
            </DetailSection>

            {isProduct    && <ProductStockSection    warehouseId={id} />}
            {isRawMaterial && <RawMaterialStockSection warehouseId={id} />}
        </>}
    </EntityDetail>;
}
