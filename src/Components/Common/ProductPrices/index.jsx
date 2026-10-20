import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import {
    Badge, Box, Button, Dialog, HStack, Heading, Portal, Spinner, Table, Text, VStack,
} from '@chakra-ui/react';
import {
    LuArrowLeft, LuCheck, LuFolder, LuLayers, LuPalette, LuPercent, LuRotateCcw, LuSearch, LuTag, LuX,
    LuSquareCheck, LuSquare, LuMinus, LuPlus, LuEqual, LuSave,
} from 'react-icons/lu';
import { ROLES } from '../../../app/permissions/roles';
import { useAppSelector } from '../../../store/hooks';
import { useGetProductsQuery, useUpdateProductPricesMutation } from '../../../store/services/product.api';
import { useGetBrandsQuery } from '../../../store/services/brand.api';
import { useGetProductCategoriesQuery } from '../../../store/services/productCategory.api';
import { useGetProductColorsQuery } from '../../../store/services/productColor.api';
import { BRAND_COLORS, useAppTheme } from '../../../theme/tokens';
import { Alert } from '../../Other/UI/Alert/Alert';
import Loading from '../../Other/UI/Loadings/Loading';
import EmptyData from '../../Other/UI/NoData/EmptyData';
import FormControl from '../../ui/FormControl';
import FilterCombobox from '../../ui/FilterCombobox';
import FormattedNumberInput from '../../ui/FormattedNumberInput';
import { ColorDot } from '../../ui/ColorSwatch';
import { formatNumber } from '../../ui/number-format';
import { useInfiniteList } from '../../ui/useInfiniteList';
import InfiniteSentinel from '../../ui/InfiniteSentinel';

const PAGE_SIZE = 50;

/* ── Ommaviy o‘zgartirish rejimlari ── */
const MODES = [
    { key: 'add',    label: '+ summa',  hint: 'Har bir narxga qo‘shiladi',           Icon: LuPlus },
    { key: 'sub',    label: '− summa',  hint: 'Har bir narxdan ayiriladi',           Icon: LuMinus },
    { key: 'addPct', label: '+ %',      hint: 'Foizga oshiriladi',                   Icon: LuPercent },
    { key: 'subPct', label: '− %',      hint: 'Foizga kamaytiriladi',                Icon: LuPercent },
    { key: 'set',    label: '= summa',  hint: 'Hammasiga bitta narx qo‘yiladi',      Icon: LuEqual },
];
const ROUNDINGS = [
    { key: 0,    label: 'Yaxlitlamaslik' },
    { key: 100,  label: '100 ga' },
    { key: 1000, label: '1 000 ga' },
];

const toNum = (v) => { const n = Number(String(v ?? '').replace(/\s/g, '').replace(',', '.')); return Number.isFinite(n) ? n : NaN; };
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const applyRounding = (n, step) => (step > 0 ? Math.round(n / step) * step : round2(n));

/** Asl narxdan yangi narxni hisoblaydi; hisoblab bo‘lmasa (narx yo‘q) — null */
function computePrice(base, mode, value, rounding) {
    const v = toNum(value);
    if (!Number.isFinite(v)) return null;
    if (mode === 'set') return v > 0 ? applyRounding(v, rounding) : null;
    const b = Number(base);
    if (!Number.isFinite(b) || b <= 0) return null;
    let next = b;
    if (mode === 'add') next = b + v;
    if (mode === 'sub') next = b - v;
    if (mode === 'addPct') next = b * (1 + v / 100);
    if (mode === 'subPct') next = b * (1 - v / 100);
    next = applyRounding(next, rounding);
    return next > 0 ? next : null;
}

function DeltaChip({ from, to, isDark }) {
    const f = Number(from) || 0; const t = Number(to);
    if (!Number.isFinite(t) || t === f) return null;
    const diff = t - f;
    const pct = f > 0 ? (diff / f) * 100 : null;
    const up = diff > 0;
    return (
        <Text as="span" fontSize="xs" fontWeight="bold" whiteSpace="nowrap"
            color={up ? (isDark ? 'green.300' : 'green.700') : (isDark ? 'red.300' : 'red.600')}>
            {up ? '+' : '−'}{formatNumber(Math.abs(diff))}{pct !== null ? ` (${up ? '+' : '−'}${Math.abs(pct).toFixed(1)}%)` : ''}
        </Text>
    );
}
DeltaChip.propTypes = { from: PropTypes.oneOfType([PropTypes.number, PropTypes.string]), to: PropTypes.oneOfType([PropTypes.number, PropTypes.string]), isDark: PropTypes.bool };

/* Jadval qatori. React.memo — tahrirlanayotgan qator o‘zgarganda qolgan 50+ qator qayta chizilmaydi */
const PriceRow = memo(function PriceRow({ p, raw, changed, invalid, isSel, onDraft, onReset, onToggle, ui }) {
    const { isDark, cell, tableBg, textColor, subtitleColor, accentColor } = ui;
    const next = toNum(raw);
    const rowBg = changed ? (isDark ? 'rgba(250,204,21,.07)' : '#FFFBEB') : isSel ? (isDark ? 'whiteAlpha.50' : '#F8FAFC') : tableBg;
    return (
        <Table.Row bg={rowBg} _hover={{ bg: isDark ? 'rgba(250,204,21,.06)' : '#FFFBEB' }}>
            <Table.Cell {...cell} textAlign="center">
                <Button type="button" variant="ghost" size="xs" minW={0} w="28px" h="28px" p={0} color={isSel ? accentColor : subtitleColor} onClick={() => onToggle(p.id)} aria-label="Belgilash">
                    {isSel ? <LuSquareCheck size={18} /> : <LuSquare size={18} />}
                </Button>
            </Table.Cell>
            <Table.Cell {...cell}>
                <HStack gap={2.5} align="start">
                    {p.color?.code && <Box mt="3px" flexShrink={0}><ColorDot code={p.color.code} size={14} /></Box>}
                    <VStack align="start" gap={0} minW={0}>
                        <Text fontWeight="semibold" color={textColor} fontSize="sm" noOfLines={1}>{p.name}</Text>
                        <HStack gap={2} fontSize="xs" color={subtitleColor} flexWrap="wrap">
                            {p.article && <Text fontFamily="mono">{p.article}</Text>}
                            {p.size && <Text>{p.size}</Text>}
                            {p.color?.name && <Text>{p.color.name}</Text>}
                            {p.barcode && <Text fontFamily="mono">{p.barcode}</Text>}
                        </HStack>
                    </VStack>
                </HStack>
            </Table.Cell>
            <Table.Cell {...cell} color={subtitleColor} fontSize="sm" whiteSpace="nowrap">{p.category?.name ? <HStack gap={1}><LuLayers size={12} /><span>{p.category.name}</span></HStack> : '—'}</Table.Cell>
            <Table.Cell {...cell} color={subtitleColor} fontSize="sm" whiteSpace="nowrap">{p.brand?.name || '—'}</Table.Cell>
            <Table.Cell {...cell} textAlign="right" whiteSpace="nowrap">
                {p.price != null ? <Text fontWeight="semibold" color={textColor}>{formatNumber(p.price)} <Text as="span" fontSize="xs" color={subtitleColor}>so‘m</Text></Text> : <Badge colorPalette="orange" borderRadius="full" px={2}>narx yo‘q</Badge>}
            </Table.Cell>
            <Table.Cell {...cell}>
                <Box position="relative">
                    <FormattedNumberInput
                        value={raw}
                        onChange={(v) => onDraft(p, v)}
                        placeholder={p.price != null ? formatNumber(p.price) : '0'}
                        h="38px" minH="38px" py={0} pr="52px" textAlign="right" fontWeight="bold"
                        borderColor={invalid ? 'red.400' : changed ? accentColor : undefined}
                        aria-label={`Yangi narx: ${p.name}`}
                    />
                    <Text position="absolute" right="12px" top="50%" transform="translateY(-50%)" fontSize="xs" color={subtitleColor} pointerEvents="none">so‘m</Text>
                </Box>
            </Table.Cell>
            <Table.Cell {...cell} textAlign="right" whiteSpace="nowrap">
                <HStack justify="flex-end" gap={2}>
                    {invalid ? <Text fontSize="xs" color={isDark ? 'red.300' : 'red.600'}>0 dan katta bo‘lsin</Text> : <DeltaChip from={p.price} to={changed ? next : null} isDark={isDark} />}
                    {raw !== '' && (
                        <Button type="button" variant="ghost" size="xs" minW={0} w="26px" h="26px" p={0} color={subtitleColor} onClick={() => onReset(p.id)} aria-label="Bekor qilish" title="Asl narxga qaytarish"><LuRotateCcw size={13} /></Button>
                    )}
                </HStack>
            </Table.Cell>
        </Table.Row>
    );
});
PriceRow.propTypes = {
    p: PropTypes.object.isRequired,
    raw: PropTypes.string.isRequired,
    changed: PropTypes.bool.isRequired,
    invalid: PropTypes.bool.isRequired,
    isSel: PropTypes.bool.isRequired,
    onDraft: PropTypes.func.isRequired,
    onReset: PropTypes.func.isRequired,
    onToggle: PropTypes.func.isRequired,
    ui: PropTypes.object.isRequired,
};

export default function ProductPrices() {
    const navigate = useNavigate();
    const role = useAppSelector((state) => state.auth.role);
    const canEdit = role === ROLES.MANAGER || role === ROLES.BUXGALTER;
    const { isDark, pageBg, cardBg, cardBorder, textColor, subtitleColor, accentColor } = useAppTheme();

    /* ── Filtrlar ── */
    const [search, setSearch] = useState('');
    const [query, setQuery] = useState('');
    const [brandId, setBrandId] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [colorId, setColorId] = useState('');
    const [page, setPage] = useState(0);
    useEffect(() => {
        const t = setTimeout(() => { const next = search.trim(); if (next !== query) { setPage(0); setQuery(next); } }, 350);
        return () => clearTimeout(t);
    }, [search, query]);

    const { data: brandsData } = useGetBrandsQuery({ page: 0, size: 200 });
    const { data: categoriesData } = useGetProductCategoriesQuery({ page: 0, size: 200 });
    const { data: colorsData } = useGetProductColorsQuery({ page: 0, size: 200 });
    const brandOptions = useMemo(() => (brandsData?.items ?? []).map((b) => ({ id: b.id, label: b.name })), [brandsData]);
    const categoryOptions = useMemo(() => (categoriesData?.items ?? []).map((c) => ({ id: c.id, label: c.name })), [categoriesData]);
    const colorOptions = useMemo(() => (colorsData?.items ?? []).map((c) => ({ id: c.id, label: c.name, meta: c.code || undefined })), [colorsData]);

    const { data: result, isLoading, isFetching, error } = useGetProductsQuery({
        query: query || undefined,
        brandId: brandId || undefined,
        categoryId: categoryId || undefined,
        colorId: colorId || undefined,
        page,
        size: PAGE_SIZE,
        sort: ['name,ASC', 'id,ASC'],
    });
    const { items: products, hasMore, sentinelRef, loadingMore, loadMore } = useInfiniteList({
        items: result?.items,
        pagination: result?.pagination,
        page,
        setPage,
        isFetching,
        resetKey: JSON.stringify({ query, brandId, categoryId, colorId }),
    });
    useEffect(() => { if (error) Alert(error?.data?.message || 'Mahsulotlarni yuklashda xatolik', 'error'); }, [error]);

    /* ── Tahrir holati: productId → { product, raw } ── */
    const [drafts, setDrafts] = useState({});     // raw — foydalanuvchi kiritgan matn/son
    const [selected, setSelected] = useState(() => new Set());
    const [mode, setMode] = useState('add');
    const [bulkValue, setBulkValue] = useState('');
    const [rounding, setRounding] = useState(1000);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [updatePrices, { isLoading: isSaving }] = useUpdateProductPricesMutation();


    /* O‘zgargan qatorlar: yangi narx > 0 va asl narxdan farq qiladi */
    const changes = useMemo(() => Object.entries(drafts)
        .map(([, d]) => {
            const next = toNum(d.raw);
            const base = Number(d.product?.price);
            if (!Number.isFinite(next) || next <= 0) return null;
            if (Number.isFinite(base) && round2(base) === round2(next)) return null;
            return { product: d.product, from: Number.isFinite(base) ? base : null, to: round2(next) };
        })
        .filter(Boolean), [drafts]);
    const changedIds = useMemo(() => new Set(changes.map((c) => c.product.id)), [changes]);
    const invalidCount = useMemo(() => Object.values(drafts).filter((d) => d.raw !== '' && !(toNum(d.raw) > 0)).length, [drafts]);

    const setDraft = useCallback((product, raw) => setDrafts((prev) => {
        const next = { ...prev };
        if (raw === '' || raw === null || raw === undefined) delete next[product.id];
        else next[product.id] = { product, raw: String(raw) };
        return next;
    }), []);
    const resetDraft = useCallback((id) => setDrafts((prev) => { const n = { ...prev }; delete n[id]; return n; }), []);

    const toggleSelect = useCallback((id) => setSelected((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; }), []);
    const allLoadedSelected = products.length > 0 && products.every((p) => selected.has(p.id));
    const toggleSelectAll = () => setSelected((prev) => {
        if (allLoadedSelected) { const n = new Set(prev); products.forEach((p) => n.delete(p.id)); return n; }
        return new Set([...prev, ...products.map((p) => p.id)]);
    });

    /* Ommaviy qo‘llash: tanlanganlarga, tanlanmagan bo‘lsa — yuklangan barcha qatorlarga */
    const bulkTargets = selected.size > 0 ? products.filter((p) => selected.has(p.id)) : products;
    const bulkPreview = useMemo(() => {
        if (bulkValue === '') return null;
        let ok = 0; let skipped = 0;
        for (const p of bulkTargets) { const n = computePrice(p.price, mode, bulkValue, rounding); if (n === null) skipped += 1; else ok += 1; }
        return { ok, skipped };
    }, [bulkTargets, mode, bulkValue, rounding]);
    const applyBulk = () => {
        if (bulkValue === '' || !(toNum(bulkValue) >= 0)) { Alert('Qiymatni kiriting', 'error'); return; }
        let applied = 0;
        setDrafts((prev) => {
            const next = { ...prev };
            for (const p of bulkTargets) {
                const n = computePrice(p.price, mode, bulkValue, rounding);
                if (n === null) continue;
                next[p.id] = { product: p, raw: String(n) };
                applied += 1;
            }
            return next;
        });
        if (applied === 0) Alert('Hech bir mahsulotga qo‘llanmadi — narxi yo‘q mahsulotlar uchun «= summa» rejimini tanlang', 'warning');
    };
    const clearAll = () => { setDrafts({}); setSelected(new Set()); };

    /* ── Saqlash ── */
    const save = async () => {
        if (changes.length === 0) return;
        try {
            await updatePrices({ items: changes.map((c) => ({ productId: c.product.id, price: c.to })) }).unwrap();
            Alert(`${changes.length} ta mahsulot narxi yangilandi`, 'success');
            setConfirmOpen(false);
            setDrafts({});
            setSelected(new Set());
        } catch (e) {
            Alert(e?.data?.message || 'Narxlarni saqlashda xatolik', 'error');
        }
    };

    const tableBg = isDark ? BRAND_COLORS.darkCardBg : cardBg;
    const tableHeaderBg = isDark ? tableBg : '#F8FAFC';
    const tableBorder = isDark ? cardBorder : '#CBD5E1';
    const cell = useMemo(() => ({ borderWidth: '0.5px', borderColor: tableBorder, verticalAlign: 'middle', px: 3, py: 2 }), [tableBorder]);
    const headerCell = { ...cell, bg: tableHeaderBg, color: subtitleColor, fontSize: 'xs', fontWeight: 'semibold', textTransform: 'uppercase', letterSpacing: 'wider', whiteSpace: 'nowrap' };
    const rowUi = useMemo(() => ({ isDark, cell, tableBg, textColor, subtitleColor, accentColor }), [isDark, cell, tableBg, textColor, subtitleColor, accentColor]);
    const modalBorder = isDark ? cardBorder : '#94A3B8';
    const totalDelta = changes.reduce((s, c) => s + (c.to - (c.from ?? 0)), 0);

    if (!canEdit) {
        return (
            <Box my={2} bg={pageBg} color={textColor} minH="100%">
                <EmptyData text="Ruxsat yo‘q" description="Narxlarni faqat admin va hisobchi o‘zgartira oladi." />
            </Box>
        );
    }

    return (
        <Box my={2} bg={pageBg} color={textColor} minH="100%">
            {/* ── Sarlavha ── */}
            <HStack justify="space-between" align="start" flexWrap="wrap" gap={4} mb={4}>
                <Box>
                    <Heading className="text-[35px] font-semibold" color={textColor}>Narxlarni o‘zgartirish</Heading>
                    <Text color={subtitleColor} fontSize="sm" mt={1}>
                        Jami: {result?.pagination?.totalElements ?? 0} ta mahsulot · Tanlangan: {selected.size} · O‘zgaradi: <Text as="span" fontWeight="bold" color={changes.length ? accentColor : subtitleColor}>{changes.length}</Text>
                    </Text>
                </Box>
                <HStack gap={2} flexWrap="wrap">
                    <Button variant="outline" borderRadius="xl" h="44px" px={4} borderColor={cardBorder} color={textColor} onClick={() => navigate('/products')}>
                        <HStack gap={2}><LuArrowLeft size={16} /><span>Mahsulotlar</span></HStack>
                    </Button>
                    {(changes.length > 0 || selected.size > 0) && (
                        <Button variant="ghost" borderRadius="xl" h="44px" px={4} color={subtitleColor} onClick={clearAll}>
                            <HStack gap={2}><LuRotateCcw size={16} /><span>Tozalash</span></HStack>
                        </Button>
                    )}
                    <Button onClick={() => setConfirmOpen(true)} disabled={changes.length === 0 || invalidCount > 0 || isSaving} bg={accentColor} color="black" borderRadius="xl" h="44px" px={6} fontWeight="semibold" _hover={{ bg: 'yellow.500' }}>
                        <HStack gap={2}><LuSave size={18} /><span>Saqlash{changes.length ? ` (${changes.length})` : ''}</span></HStack>
                    </Button>
                </HStack>
            </HStack>

            {/* ── Filtrlar ── */}
            <HStack w="100%" align={{ base: 'stretch', lg: 'center' }} flexDirection={{ base: 'column', lg: 'row' }} gap={3} mb={3} p={3} bg={cardBg} borderWidth="1px" borderColor={cardBorder} borderRadius="xl" boxShadow={isDark ? 'none' : '0 6px 18px rgba(15, 23, 42, 0.06)'}>
                <Box position="relative" flex="1" w="100%">
                    <Box position="absolute" left={4} top="50%" transform="translateY(-50%)" color={accentColor} zIndex={1} pointerEvents="none"><LuSearch size={18} /></Box>
                    <FormControl value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nomi, artikul yoki shtrix-kod — natija darhol" pl={11} pr={search ? 11 : 4} minH="40px" />
                    {search && (
                        <Button type="button" variant="ghost" size="sm" position="absolute" right={2} top="50%" transform="translateY(-50%)" color={subtitleColor} minW="32px" h="32px" p={0} borderRadius="full" onClick={() => setSearch('')} aria-label="Tozalash"><LuX size={16} /></Button>
                    )}
                </Box>
                <FilterCombobox w={{ base: '100%', lg: '220px' }} h="40px" icon={LuFolder} value={categoryId} onChange={(v) => { setCategoryId(v); setPage(0); }} options={categoryOptions} allLabel="Barcha kategoriyalar" placeholder="Kategoriya..." emptyText="Topilmadi" ariaLabel="Kategoriya" />
                <FilterCombobox w={{ base: '100%', lg: '200px' }} h="40px" icon={LuTag} value={brandId} onChange={(v) => { setBrandId(v); setPage(0); }} options={brandOptions} allLabel="Barcha brendlar" placeholder="Brend..." emptyText="Topilmadi" ariaLabel="Brend" />
                <FilterCombobox w={{ base: '100%', lg: '200px' }} h="40px" icon={LuPalette} value={colorId} onChange={(v) => { setColorId(v); setPage(0); }} options={colorOptions} allLabel="Barcha ranglar" placeholder="Rang..." emptyText="Topilmadi" ariaLabel="Rang" />
                {isFetching && !isLoading && <Spinner size="sm" color={accentColor} flexShrink={0} />}
            </HStack>

            {/* ── Ommaviy o‘zgartirish ── */}
            <Box mb={4} p={3} bg={cardBg} borderWidth="1px" borderColor={isDark ? 'rgba(250,204,21,.35)' : '#FDE68A'} borderRadius="xl">
                <HStack flexWrap="wrap" gap={3} align="end">
                    <Box>
                        <Text fontSize="xs" fontWeight="semibold" color={subtitleColor} mb={1}>Qanday o‘zgartirish</Text>
                        <HStack gap={1} p={1} bg={isDark ? 'whiteAlpha.100' : 'gray.100'} borderRadius="xl" flexWrap="wrap">
                            {MODES.map((m) => (
                                <Button key={m.key} type="button" size="sm" h="34px" px={3} borderRadius="lg" variant="ghost" title={m.hint}
                                    onClick={() => setMode(m.key)}
                                    bg={mode === m.key ? accentColor : 'transparent'} color={mode === m.key ? 'black' : subtitleColor} fontWeight="bold"
                                    _hover={{ bg: mode === m.key ? accentColor : (isDark ? 'whiteAlpha.200' : 'gray.200') }}>
                                    {m.label}
                                </Button>
                            ))}
                        </HStack>
                    </Box>
                    <Box w={{ base: '100%', sm: '180px' }}>
                        <Text fontSize="xs" fontWeight="semibold" color={subtitleColor} mb={1}>{mode.endsWith('Pct') ? 'Foiz (%)' : 'Summa (so‘m)'}</Text>
                        <FormattedNumberInput value={bulkValue} onChange={setBulkValue} placeholder={mode.endsWith('Pct') ? '10' : '20 000'} minH="40px" h="40px" py={0} fontWeight="bold" />
                    </Box>
                    <Box>
                        <Text fontSize="xs" fontWeight="semibold" color={subtitleColor} mb={1}>Yaxlitlash</Text>
                        <FormControl as="select" value={rounding} onChange={(e) => setRounding(Number(e.target.value))} minH="40px" h="40px" py={0} w="160px">
                            {ROUNDINGS.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
                        </FormControl>
                    </Box>
                    <Button type="button" onClick={applyBulk} disabled={bulkValue === '' || bulkTargets.length === 0} bg={isDark ? 'whiteAlpha.200' : '#0F172A'} color="white" borderRadius="xl" h="40px" px={5} fontWeight="semibold" _hover={{ opacity: 0.9 }}>
                        <HStack gap={2}><LuCheck size={16} /><span>Qo‘llash — {selected.size > 0 ? `tanlangan ${selected.size} ta` : `yuklangan ${products.length} ta`}</span></HStack>
                    </Button>
                    {bulkPreview && (
                        <Text fontSize="xs" color={subtitleColor}>
                            {bulkPreview.ok} ta o‘zgaradi{bulkPreview.skipped ? ` · ${bulkPreview.skipped} ta narxi yo‘q (o‘tkazib yuboriladi)` : ''}
                        </Text>
                    )}
                </HStack>
                <Text fontSize="xs" color={subtitleColor} mt={2}>
                    Hisob asl narxdan qilinadi. Qatorlarni belgilab faqat ularga, belgilamasdan — filtr bo‘yicha yuklangan hammasiga qo‘llanadi. Har bir qatorni qo‘lda ham o‘zgartirish mumkin.
                </Text>
            </Box>

            {/* ── Jadval ── */}
            {(isLoading || (isFetching && products.length === 0)) ? <Loading /> : error ? (
                <Box p={8} textAlign="center" color={isDark ? 'red.300' : 'red.600'}>Mahsulotlarni yuklashda xatolik</Box>
            ) : products.length === 0 ? (
                <EmptyData text="Mahsulot topilmadi" description="Filtrni o‘zgartirib ko‘ring." />
            ) : (
                <>
                    <Box overflowX="auto" bg={tableBg} borderWidth="0.5px" borderColor={tableBorder} borderRadius="10px" boxShadow={isDark ? '0 16px 40px rgba(0,0,0,.22)' : '0 8px 24px rgba(15,23,42,.1)'}>
                        <Table.Root size="sm" bg={tableBg} borderCollapse="collapse" minW="900px">
                            <Table.Header bg={tableHeaderBg}>
                                <Table.Row bg={tableHeaderBg}>
                                    <Table.ColumnHeader {...headerCell} w="44px" textAlign="center">
                                        <Button type="button" variant="ghost" size="xs" minW={0} w="28px" h="28px" p={0} color={allLoadedSelected ? accentColor : subtitleColor} onClick={toggleSelectAll} aria-label="Hammasini belgilash" title="Yuklangan hammasini belgilash">
                                            {allLoadedSelected ? <LuSquareCheck size={18} /> : <LuSquare size={18} />}
                                        </Button>
                                    </Table.ColumnHeader>
                                    <Table.ColumnHeader {...headerCell} minW="260px">Mahsulot</Table.ColumnHeader>
                                    <Table.ColumnHeader {...headerCell}>Kategoriya</Table.ColumnHeader>
                                    <Table.ColumnHeader {...headerCell}>Brend</Table.ColumnHeader>
                                    <Table.ColumnHeader {...headerCell} textAlign="right">Hozirgi narx</Table.ColumnHeader>
                                    <Table.ColumnHeader {...headerCell} textAlign="right" w="200px">Yangi narx</Table.ColumnHeader>
                                    <Table.ColumnHeader {...headerCell} textAlign="right" w="170px">Farq</Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body bg={tableBg}>
                                {products.map((p) => {
                                    const raw = drafts[p.id]?.raw ?? '';
                                    return (
                                        <PriceRow
                                            key={p.id}
                                            p={p}
                                            raw={raw}
                                            changed={changedIds.has(p.id)}
                                            invalid={raw !== '' && !(toNum(raw) > 0)}
                                            isSel={selected.has(p.id)}
                                            onDraft={setDraft}
                                            onReset={resetDraft}
                                            onToggle={toggleSelect}
                                            ui={rowUi}
                                        />
                                    );
                                })}
                            </Table.Body>
                        </Table.Root>
                    </Box>
                    <InfiniteSentinel sentinelRef={sentinelRef} hasMore={hasMore} loadingMore={loadingMore} loaded={products.length} total={result?.pagination?.totalElements ?? products.length} unit="ta mahsulot" onLoadMore={loadMore} />
                </>
            )}

            {/* ── Tasdiqlash ── */}
            <Dialog.Root open={confirmOpen} onOpenChange={(e) => !e.open && !isSaving && setConfirmOpen(false)} size="lg" placement="center">
                <Portal>
                    <Dialog.Backdrop backdropFilter="blur(6px)" bg={isDark ? 'blackAlpha.700' : 'blackAlpha.400'} />
                    <Dialog.Positioner>
                        <Dialog.Content bg={cardBg} borderColor={modalBorder} borderWidth="1px" borderRadius="2xl" overflow="hidden" maxW="640px" w="calc(100% - 32px)">
                            <Box position="absolute" top="0" left="0" right="0" h="4px" bg={`linear-gradient(90deg, ${accentColor}, #FDE047)`} />
                            <Dialog.Header color={textColor} fontSize="xl" fontWeight="bold" pt={7} pb={4} borderBottomWidth="1px" borderColor={modalBorder}>
                                Narxlarni saqlash — {changes.length} ta mahsulot
                            </Dialog.Header>
                            <Dialog.CloseTrigger asChild>
                                <Button variant="ghost" color={subtitleColor} size="sm" w="32px" h="32px" p={0} minW={0} position="absolute" top="3" right="3" aria-label="Yopish" disabled={isSaving}><LuX /></Button>
                            </Dialog.CloseTrigger>
                            <Dialog.Body py={4}>
                                <Box maxH="320px" overflowY="auto" borderWidth="1px" borderColor={modalBorder} borderRadius="xl">
                                    {changes.map((c) => (
                                        <HStack key={c.product.id} justify="space-between" px={3} py={2} borderBottomWidth="1px" borderColor={isDark ? cardBorder : '#F1F5F9'} gap={3}>
                                            <Text fontSize="sm" fontWeight="semibold" color={textColor} noOfLines={1} flex="1">{c.product.name}</Text>
                                            <HStack gap={2} flexShrink={0} fontSize="sm">
                                                <Text color={subtitleColor}>{c.from != null ? formatNumber(c.from) : '—'}</Text>
                                                <Text color={subtitleColor}>→</Text>
                                                <Text fontWeight="bold" color={textColor}>{formatNumber(c.to)}</Text>
                                                <DeltaChip from={c.from} to={c.to} isDark={isDark} />
                                            </HStack>
                                        </HStack>
                                    ))}
                                </Box>
                                <Text fontSize="xs" color={subtitleColor} mt={3}>
                                    Jami farq: <Text as="span" fontWeight="bold" color={textColor}>{totalDelta >= 0 ? '+' : '−'}{formatNumber(Math.abs(round2(totalDelta)))} so‘m</Text>.
                                    Yangi narx faqat keyingi zayavkalarga qo‘llanadi — mavjud zayavkalardagi narxlar o‘zgarmaydi. Hammasi birga saqlanadi: xato bo‘lsa birorta ham o‘zgarmaydi.
                                </Text>
                            </Dialog.Body>
                            <Dialog.Footer gap={3} pt={4} pb={6} borderTopWidth="1px" borderColor={modalBorder}>
                                <Button variant="ghost" onClick={() => setConfirmOpen(false)} color={subtitleColor} borderRadius="xl" h="44px" px={5} disabled={isSaving}>Bekor qilish</Button>
                                <Button onClick={save} disabled={isSaving} bg={accentColor} color="black" borderRadius="xl" h="44px" px={8} fontWeight="semibold">
                                    {isSaving ? <HStack gap={2}><Spinner size="sm" /><span>Saqlanmoqda...</span></HStack> : <HStack gap={2}><LuCheck size={18} /><span>Saqlash</span></HStack>}
                                </Button>
                            </Dialog.Footer>
                        </Dialog.Content>
                    </Dialog.Positioner>
                </Portal>
            </Dialog.Root>
        </Box>
    );
}
