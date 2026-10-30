import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { LuCheck, LuFilter, LuRotateCcw, LuSearch, LuX } from 'react-icons/lu';
import { useGetProductsQuery } from '../../../store/services/product.api';
import { useGetBrandsQuery } from '../../../store/services/brand.api';
import { useGetProductCategoriesQuery } from '../../../store/services/productCategory.api';
import { useGetProductColorsQuery } from '../../../store/services/productColor.api';
import { BRAND_COLORS } from '../../../theme/tokens';
import ProductImage from '../../ui/ProductImage';
import { ColorDot } from '../../ui/ColorSwatch';

const PAGE_SIZE = 40;
const EMPTY = { brandId: '', categoryId: '', colorId: '' };

/**
 * Stanokni ishga tushirishda mahsulot tanlash: rasm, nom/artikul bo‘yicha qidiruv,
 * brend / kategoriya / rang filtrlari.
 */
export default function StartProductPicker({ selectedId, onSelect, error, isDark, cardBorder, textColor, subtitleColor, accentColor }) {
    const [search, setSearch] = useState('');
    const [query, setQuery] = useState('');
    const [filters, setFilters] = useState(EMPTY);
    const [filtersOpen, setFiltersOpen] = useState(false);

    /* Qidiruvni 300 ms kechiktirish — har bir harfda so‘rov ketmasin */
    useEffect(() => {
        const t = window.setTimeout(() => setQuery(search.trim()), 300);
        return () => window.clearTimeout(t);
    }, [search]);

    const { data: brandsData } = useGetBrandsQuery({ page: 0, size: 200 });
    const { data: categoriesData } = useGetProductCategoriesQuery({ page: 0, size: 200 });
    const { data: colorsData } = useGetProductColorsQuery({ page: 0, size: 200 });
    const brands = brandsData?.items ?? [];
    const categories = categoriesData?.items ?? [];
    const colors = colorsData?.items ?? [];

    const { data, isLoading, isFetching } = useGetProductsQuery({
        query: query || undefined,
        brandId: filters.brandId || undefined,
        categoryId: filters.categoryId || undefined,
        colorId: filters.colorId || undefined,
        page: 0,
        size: PAGE_SIZE,
        sort: ['name,ASC', 'id,ASC'],
    });
    const products = useMemo(() => data?.items ?? [], [data]);
    const total = data?.pagination?.totalElements ?? products.length;
    const selected = products.find((p) => p.id === selectedId);

    const activeCount = Object.values(filters).filter(Boolean).length;
    const hasAny = Boolean(query) || activeCount > 0;
    const reset = () => { setSearch(''); setQuery(''); setFilters(EMPTY); };

    const inputStyle = {
        width: '100%', height: 40, paddingLeft: 36, paddingRight: 12, borderRadius: 10,
        border: `1px solid ${cardBorder}`, background: isDark ? BRAND_COLORS.darkInputBg : BRAND_COLORS.lightInputBg,
        color: textColor, fontSize: 13, outline: 'none',
    };
    const selectStyle = { ...inputStyle, paddingLeft: 10, cursor: 'pointer' };
    const chipStyle = (active) => ({
        display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 12px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer',
        border: `1px solid ${active ? accentColor : cardBorder}`, color: active ? accentColor : subtitleColor,
        background: active ? (isDark ? 'rgb(var(--accent-400) / 0.12)' : 'rgb(var(--accent-warm-100))') : 'transparent',
    });

    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold" style={{ color: subtitleColor }}>
                    Mahsulot tanlang <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <span className="text-xs" style={{ color: subtitleColor }}>{isFetching ? 'Yuklanmoqda...' : `${total} ta mahsulot`}</span>
            </div>

            {/* Qidiruv + filtr tugmasi */}
            <div className="flex gap-2 mb-2">
                <div className="relative flex-1">
                    <LuSearch size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: subtitleColor, pointerEvents: 'none' }} />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Nomi yoki artikuli bo‘yicha qidiring..."
                        style={{ ...inputStyle, paddingRight: search ? 36 : 12 }}
                        autoFocus
                    />
                    {search && (
                        <button type="button" onClick={() => setSearch('')} aria-label="Tozalash"
                            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: subtitleColor, display: 'flex' }}>
                            <LuX size={14} />
                        </button>
                    )}
                </div>
                <button type="button" onClick={() => setFiltersOpen((v) => !v)} style={chipStyle(filtersOpen || activeCount > 0)} aria-expanded={filtersOpen}>
                    <LuFilter size={13} />
                    <span>Filtr</span>
                    {activeCount > 0 && <span style={{ background: accentColor, color: '#0F172A', borderRadius: 999, padding: '0 6px', fontSize: 10, lineHeight: '16px' }}>{activeCount}</span>}
                </button>
                {hasAny && (
                    <button type="button" onClick={reset} style={chipStyle(false)} title="Qidiruv va filtrlarni tozalash">
                        <LuRotateCcw size={13} />
                    </button>
                )}
            </div>

            {filtersOpen && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2 p-2 rounded-xl" style={{ border: `1px solid ${cardBorder}`, background: isDark ? 'rgba(255,255,255,0.02)' : '#FAFAFA' }}>
                    <select value={filters.brandId} onChange={(e) => setFilters((f) => ({ ...f, brandId: e.target.value }))} style={selectStyle} aria-label="Brend">
                        <option value="">Barcha brendlar</option>
                        {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                    <select value={filters.categoryId} onChange={(e) => setFilters((f) => ({ ...f, categoryId: e.target.value }))} style={selectStyle} aria-label="Kategoriya">
                        <option value="">Barcha kategoriyalar</option>
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select value={filters.colorId} onChange={(e) => setFilters((f) => ({ ...f, colorId: e.target.value }))} style={selectStyle} aria-label="Rang">
                        <option value="">Barcha ranglar</option>
                        {colors.map((c) => <option key={c.id} value={c.id}>{c.name}{c.code ? ` (${c.code.toUpperCase()})` : ''}</option>)}
                    </select>
                </div>
            )}

            {/* Tanlangan mahsulot */}
            {selected && (
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl mb-2" style={{ background: isDark ? 'rgba(34,197,94,0.1)' : '#DCFCE7', border: `1px solid ${isDark ? 'rgba(34,197,94,0.3)' : '#BBF7D0'}` }}>
                    <ProductImage imageUrl={selected.imageUrl} version={selected.lastModifiedAt} name={selected.name} size={36} radius="lg" />
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate" style={{ color: textColor }}>{selected.name}</p>
                        <p className="text-xs truncate" style={{ color: subtitleColor }}>{[selected.article, selected.size, selected.brand?.name].filter(Boolean).join(' · ') || 'Tanlandi'}</p>
                    </div>
                    <LuCheck size={16} style={{ color: '#22C55E', flexShrink: 0 }} />
                </div>
            )}

            {/* Ro‘yxat */}
            <div className="overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-1.5"
                style={{ maxHeight: 320, border: `1px solid ${cardBorder}`, borderRadius: 12, padding: 6, background: isDark ? 'rgba(255,255,255,0.02)' : '#FAFAFA', opacity: isFetching && !isLoading ? 0.7 : 1 }}>
                {isLoading ? (
                    <div className="sm:col-span-2 py-8 text-center text-sm" style={{ color: subtitleColor }}>Yuklanmoqda...</div>
                ) : products.length === 0 ? (
                    <div className="sm:col-span-2 py-8 text-center text-sm" style={{ color: subtitleColor }}>
                        {hasAny ? 'Qidiruv bo‘yicha mahsulot topilmadi' : 'Mahsulotlar yo‘q'}
                        {hasAny && <div><button type="button" onClick={reset} className="mt-2 text-xs font-semibold underline" style={{ color: accentColor }}>Filtrlarni tozalash</button></div>}
                    </div>
                ) : (
                    products.map((product) => {
                        const isSelected = selectedId === product.id;
                        const meta = [product.article, product.size].filter(Boolean).join(' · ');
                        return (
                            <button key={product.id} type="button"
                                onClick={() => onSelect(product.id, product)}
                                className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all"
                                style={{
                                    background: isSelected ? (isDark ? 'rgb(var(--accent-400) / 0.15)' : 'rgb(var(--accent-warm-100))') : (isDark ? 'rgba(255,255,255,0.03)' : '#fff'),
                                    border: `1px solid ${isSelected ? (isDark ? 'rgb(var(--accent-400) / 0.5)' : 'rgb(var(--accent-warm-300))') : cardBorder}`,
                                    cursor: 'pointer',
                                }}
                                aria-pressed={isSelected}>
                                <ProductImage imageUrl={product.imageUrl} version={product.lastModifiedAt} name={product.name} size={52} radius="lg" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold truncate" style={{ color: isSelected ? accentColor : textColor }}>{product.name}</p>
                                    {meta && <p className="text-[11px] truncate font-mono" style={{ color: subtitleColor }}>{meta}</p>}
                                    <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                                        {product.color?.name && <span className="inline-flex items-center gap-1 text-[11px] truncate" style={{ color: subtitleColor }}><ColorDot code={product.color.code} size={10} />{product.color.name}</span>}
                                        {product.brand?.name && <span className="text-[11px] truncate" style={{ color: subtitleColor }}>· {product.brand.name}</span>}
                                        {product.category?.name && <span className="text-[11px] truncate hidden sm:inline" style={{ color: subtitleColor }}>· {product.category.name}</span>}
                                    </div>
                                </div>
                                {isSelected && <LuCheck size={16} style={{ color: accentColor, flexShrink: 0 }} />}
                            </button>
                        );
                    })
                )}
            </div>
            {!isLoading && total > products.length && (
                <p className="text-[11px] mt-1" style={{ color: subtitleColor }}>Birinchi {products.length} tasi ko‘rsatildi. Aniqroq topish uchun qidiruv yoki filtrdan foydalaning.</p>
            )}

            {error && <p className="text-xs mt-1.5" style={{ color: '#EF4444' }}>{error}</p>}
        </div>
    );
}

StartProductPicker.propTypes = {
    selectedId: PropTypes.string,
    onSelect: PropTypes.func.isRequired,
    error: PropTypes.string,
    isDark: PropTypes.bool,
    cardBorder: PropTypes.string,
    textColor: PropTypes.string,
    subtitleColor: PropTypes.string,
    accentColor: PropTypes.string,
};
