import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    HStack,
    Heading,
    Spinner,
    Table,
    Text,
    VStack,
} from '@chakra-ui/react';
import {
    LuPackage,
    LuSearch,
    LuX,
    LuTag,
    LuRuler,
    LuWarehouse,
    LuCopy,
    LuCheck,
    LuPalette,
    LuFolder,
    LuSlidersHorizontal,
    LuChevronDown,
    LuArrowDownUp,
    LuArrowDown,
    LuArrowUp,
    LuPlus,
} from 'react-icons/lu';
import { useGetProductsQuery, useUpdateProductMutation } from '../../../store/services/product.api';
import { useGetWarehousesQuery } from '../../../store/services/warehouse.api';
import { useGetBrandsQuery } from '../../../store/services/brand.api';
import { useGetProductCategoriesQuery } from '../../../store/services/productCategory.api';
import { useGetProductColorsQuery } from '../../../store/services/productColor.api';
import { BRAND_COLORS, useAppTheme } from '../../../theme/tokens';
import { Alert } from '../../Other/UI/Alert/Alert';
import Create from './__components/Create';
import Edit from './__components/Edit';
import Delete from './__components/Delete';
import Loading from '../../Other/UI/Loadings/Loading';
import EmptyData from '../../Other/UI/NoData/EmptyData';
import FormControl from '../../ui/FormControl';
import { formatNumber } from '../../ui/number-format';

const PAGE_SIZE = 12;
const CLIPBOARD_EVENT = 'product-clipboard-changed';
const SEARCH_DEBOUNCE_MS = 500;
const DEFAULT_SORT = ['createdAt,DESC', 'id,DESC'];
const SORT_FIELDS = [
    ['name', 'Mahsulot nomi'],
    ['price', 'Narxi'],
    ['barcode', 'Shtrix-kod'],
    ['article', 'Artikul'],
    ['size', 'O‘lcham'],
    ['minimumLine', 'Minimal qoldiq'],
    ['piecesPerPack', 'Qadoqdagi dona'],
    ['lowProductAlert', 'Kam qoldiq ogohlantirishi'],
    ['createdAt', 'Yaratilgan vaqt'],
    ['lastModifiedAt', 'O‘zgartirilgan vaqt'],
    ['id', 'ID'],
    ['brand.name', 'Brend nomi'],
    ['category.name', 'Kategoriya nomi'],
    ['color.name', 'Rang nomi'],
];

/* ── Clipboard helpers ── */
const saveToClipboard = (product) => {
    window.__productClipboard = {
        name: product.name || '',
        price: product.price ?? '',
        article: product.article || '',
        size: product.size || '',
        minimumLine:
            product.minimumLine !== null && product.minimumLine !== undefined
                ? product.minimumLine
                : '',
        piecesPerPack:
            product.piecesPerPack !== null && product.piecesPerPack !== undefined
                ? product.piecesPerPack
                : '',
        brandId: product.brand?.id || product.brandId || '',
        colorId: product.color?.id || product.colorId || '',
        categoryId: product.category?.id || product.categoryId || '',
        warehouseId: product.warehouseId || '',
        sourceName: product.name || '',
    };
    window.dispatchEvent(new Event(CLIPBOARD_EVENT));
};

/* ── Copy button ── */
function CopyButton({ product }) {
    const { isDark } = useAppTheme();
    const [done, setDone] = useState(false);

    const handleCopy = (event) => {
        event.stopPropagation();
        saveToClipboard(product);
        setDone(true);
        Alert(`"${product.name}" nusxalandi`, 'success');
        setTimeout(() => setDone(false), 1500);
    };

    const colorIdle = isDark ? 'blue.300' : 'blue.600';
    const colorDone = isDark ? 'green.300' : 'green.600';

    return (
        <Button
            onClick={handleCopy}
            variant="ghost"
            size="sm"
            color={done ? colorDone : colorIdle}
            borderRadius="xl"
            px={3}
            aria-label="Nusxalash"
            title="Nusxalash"
            _hover={{
                bg: isDark ? 'rgba(96, 165, 250, 0.16)' : 'blue.50',
                color: isDark ? 'blue.200' : 'blue.700',
            }}
        >
            {done ? <LuCheck size={16} /> : <LuCopy size={16} />}
        </Button>
    );
}

export default function Product() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [query, setQuery] = useState('');
    const [filters, setFilters] = useState({ brandId: '', categoryId: '', colorId: '' });
    const [sort, setSort] = useState(DEFAULT_SORT);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [page, setPage] = useState(0);
    const [products, setProducts] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const isFirstRender = useRef(true);
    const loadMoreRef = useRef(null);
    const isFetchingNextRef = useRef(false);

    /* ── Debounced qidiruv ── */
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        const handler = setTimeout(() => {
            const next = search.trim();
            setQuery((prev) => {
                if (prev !== next) {
                    setPage(0);
                    setProducts([]);
                    setHasMore(true);
                    return next;
                }
                return prev;
            });
        }, SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(handler);
    }, [search]);

    const {
        currentData: productResult,
        isLoading,
        isFetching,
        error,
        refetch,
    } = useGetProductsQuery({
        query: query || undefined,
        brandId: filters.brandId || undefined,
        categoryId: filters.categoryId || undefined,
        colorId: filters.colorId || undefined,
        page,
        size: PAGE_SIZE,
        sort,
    });

    const { data: warehouses = [] } = useGetWarehousesQuery('PRODUCT');
    const { data: brandsResult, error: brandsError } = useGetBrandsQuery({
        page: 0,
        size: 200,
    });
    const { data: categoriesResult, error: categoriesError } = useGetProductCategoriesQuery({
        page: 0,
        size: 200,
    });
    const { data: colorsResult, error: colorsError } = useGetProductColorsQuery({
        page: 0,
        size: 200,
    });
    const [updateProduct] = useUpdateProductMutation();

    const {
        isDark,
        pageBg,
        cardBg,
        cardBorder,
        textColor,
        subtitleColor,
        accentColor,
    } = useAppTheme();

    const pagination = productResult?.pagination;
    const totalElements = pagination?.totalElements ?? 0;

    const tableBg = isDark ? BRAND_COLORS.darkCardBg : cardBg;
    const tableHeaderBg = isDark ? tableBg : '#F8FAFC';
    const tableBorder = isDark ? cardBorder : '#CBD5E1';

    const isDebouncing = search.trim() !== query;
    const brands = brandsResult?.items ?? [];
    const categories = categoriesResult?.items ?? [];
    const colors = colorsResult?.items ?? [];
    const activeFilterCount = Object.values(filters).filter(Boolean).length;

    const resetList = () => {
        setPage(0);
        setProducts([]);
        setHasMore(true);
        isFetchingNextRef.current = false;
    };

    const resetPageForSort = () => {
        setPage(0);
        setHasMore(true);
        isFetchingNextRef.current = false;
    };

    const applyFilters = (nextFilters) => {
        setFilters(nextFilters);
        resetList();
    };

    const changeSort = (field, direction) => {
        const [activeField, activeDirection] = sort[0]?.split(',') ?? [];
        const nextDirection =
            direction ??
            (activeField === field && activeDirection?.toLowerCase() === 'asc' ? 'desc' : 'asc');
        const normalizedDirection = nextDirection.toUpperCase();
        setSort(
            field === 'id'
                ? [`${field},${normalizedDirection}`]
                : [`${field},${normalizedDirection}`, 'id,DESC'],
        );
        resetPageForSort();
    };

    const updateSortRule = (index, field, direction) => {
        const nextSort = [...sort];
        const [currentField, currentDirection] = nextSort[index].split(',');
        const nextField = field ?? currentField;
        const nextDirection = (direction ?? currentDirection).toUpperCase();
        const duplicateIndex = nextSort.findIndex(
            (rule, ruleIndex) => ruleIndex !== index && rule.split(',')[0] === nextField,
        );
        if (duplicateIndex !== -1) {
            nextSort.splice(duplicateIndex, 1);
        }
        const adjustedIndex = duplicateIndex !== -1 && duplicateIndex < index ? index - 1 : index;
        nextSort[adjustedIndex] = `${nextField},${nextDirection}`;
        setSort(nextSort);
        resetList();
    };

    const addSortRule = () => {
        const usedFields = new Set(sort.map((rule) => rule.split(',')[0]));
        const nextField = SORT_FIELDS.find(([field]) => !usedFields.has(field))?.[0];
        if (!nextField) return;
        setSort((current) => {
            const next = [...current];
            const idIndex = next.findIndex((rule) => rule.split(',')[0] === 'id');
            next.splice(idIndex === -1 ? next.length : idIndex, 0, `${nextField},ASC`);
            return next;
        });
        resetList();
    };

    const removeSortRule = (index) => {
        setSort((current) => current.filter((_, ruleIndex) => ruleIndex !== index));
        resetList();
    };

    /* ── Yangi sahifa kelganda ro'yxatga qo'shamiz ── */
    useEffect(() => {
        if (!productResult?.items) return;

        if (page === 0) {
            setProducts(productResult.items);
        } else {
            setProducts((prev) => {
                const existing = new Set(prev.map((p) => p.id));
                const fresh = productResult.items.filter((p) => !existing.has(p.id));
                return fresh.length ? [...prev, ...fresh] : prev;
            });
        }

        const totalPages = pagination?.totalPages ?? 0;
        if (totalPages > 0) {
            setHasMore(page < totalPages - 1);
        } else {
            setHasMore(productResult.items.length === PAGE_SIZE);
        }

        isFetchingNextRef.current = false;
    }, [productResult, page, pagination]);

    /* ── Infinite scroll ── */
    useEffect(() => {
        const node = loadMoreRef.current;
        if (!node) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (
                    entry.isIntersecting &&
                    hasMore &&
                    !isFetching &&
                    !isFetchingNextRef.current
                ) {
                    isFetchingNextRef.current = true;
                    setPage((p) => p + 1);
                }
            },
            {
                root: null,
                rootMargin: '400px 0px',
                threshold: 0,
            }
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, [hasMore, isFetching, products.length]);

    const cellBorder = {
        borderWidth: '0.5px',
        borderColor: tableBorder,
        verticalAlign: 'middle',
        px: 3,
        py: 2.5,
    };
    const headerCell = {
        ...cellBorder,
        bg: tableHeaderBg,
        color: subtitleColor,
        fontSize: '11px',
        fontWeight: 'semibold',
        textTransform: 'uppercase',
        letterSpacing: 'wider',
    };

    const clearSearch = () => {
        setSearch('');
        setQuery('');
        resetList();
    };

    const clearFilters = () => {
        setFilters({ brandId: '', categoryId: '', colorId: '' });
        setSort(DEFAULT_SORT);
        resetList();
    };

    const sortableHeader = (label, field, minW, textAlign) => {
        const [activeField, activeDirection] = sort[0]?.split(',') ?? [];
        const isActive = activeField === field;
        const justifyContent =
            textAlign === 'right'
                ? 'flex-end'
                : textAlign === 'center'
                  ? 'center'
                  : 'flex-start';
        return (
            <Table.ColumnHeader {...headerCell} minW={minW} textAlign={textAlign}>
                <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    minW={0}
                    w="100%"
                    h="auto"
                    px={0}
                    py={0}
                    fontSize="inherit"
                    fontWeight="inherit"
                    color={isActive ? accentColor : 'inherit'}
                    justifyContent={justifyContent}
                    onClick={() => changeSort(field)}
                    _hover={{ color: accentColor, bg: 'transparent' }}
                    aria-label={`${label} bo‘yicha ${isActive && activeDirection?.toLowerCase() === 'asc' ? 'kamayish' : 'o‘sish'} tartibida saralash`}
                >
                    <HStack gap={1.5}>
                        <Text>{label}</Text>
                        {isActive ? (
                            activeDirection?.toLowerCase() === 'asc' ? (
                                <LuArrowUp size={14} aria-hidden="true" />
                            ) : (
                                <LuArrowDown size={14} aria-hidden="true" />
                            )
                        ) : (
                            <LuArrowDownUp size={12} />
                        )}
                    </HStack>
                </Button>
            </Table.ColumnHeader>
        );
    };

    useEffect(() => {
        if (error) Alert(error?.data?.message || 'Mahsulotlarni yuklashda xatolik', 'error');
    }, [error]);

    useEffect(() => {
        if (brandsError) {
            Alert(brandsError?.data?.message || 'Brendlar ro‘yxatini yuklashda xatolik', 'error');
        }
    }, [brandsError]);

    useEffect(() => {
        if (categoriesError) {
            Alert(
                categoriesError?.data?.message || 'Kategoriyalar ro‘yxatini yuklashda xatolik',
                'error',
            );
        }
    }, [categoriesError]);

    useEffect(() => {
        if (colorsError) {
            Alert(colorsError?.data?.message || 'Ranglar ro‘yxatini yuklashda xatolik', 'error');
        }
    }, [colorsError]);

    const getWarehouseName = (warehouseId) => {
        if (!warehouseId) return null;
        const found = warehouses.find((w) => w.id === warehouseId);
        return found?.name || null;
    };

    return (
        <Box my={2} bg={pageBg} color={textColor} minH="100%">
            {/* ── Header ── */}
            <HStack justify="space-between" align="start" flexWrap="wrap" gap={4} mb={4}>
                <Box>
                    <Heading className="text-[35px] font-semibold" color={textColor}>
                        Mahsulotlar
                    </Heading>
                    <Text color={subtitleColor} fontSize="sm" mt={1}>
                        Jami: {totalElements} ta mahsulot
                    </Text>
                </Box>
                <Create warehouses={warehouses} />
            </HStack>

            {/* ── Search ── */}
            <HStack
                w="100%"
                gap={3}
                mb={4}
                p={3}
                bg={cardBg}
                borderWidth="1px"
                borderColor={cardBorder}
                borderRadius="xl"
                boxShadow={isDark ? 'none' : '0 6px 18px rgba(15, 23, 42, 0.06)'}
            >
                <Box position="relative" flex="1" w="100%">
                    <Box
                        position="absolute"
                        left={4}
                        top="50%"
                        transform="translateY(-50%)"
                        color={accentColor}
                        zIndex={1}
                        pointerEvents="none"
                    >
                        <LuSearch size={18} />
                    </Box>
                    <FormControl
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Mahsulot nomi yoki artikuli bo‘yicha qidiring..."
                        aria-label="Mahsulot qidirish"
                        pl={11}
                        pr={search ? 22 : 4}
                        minH="40px"
                    />

                    {isDebouncing && (
                        <Box
                            position="absolute"
                            right={search ? 11 : 4}
                            top="50%"
                            transform="translateY(-50%)"
                            color={subtitleColor}
                            pointerEvents="none"
                            display="inline-flex"
                            alignItems="center"
                        >
                            <Spinner size="xs" />
                        </Box>
                    )}

                    {search && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            position="absolute"
                            right={2}
                            top="50%"
                            transform="translateY(-50%)"
                            color={subtitleColor}
                            minW="32px"
                            h="32px"
                            p={0}
                            borderRadius="full"
                            aria-label="Qidiruvni tozalash"
                            onClick={clearSearch}
                            _hover={{
                                bg: isDark ? 'whiteAlpha.100' : 'gray.100',
                                color: textColor,
                            }}
                        >
                            <LuX size={16} />
                        </Button>
                    )}
                </Box>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    h="40px"
                    flexShrink={0}
                    onClick={() => setFiltersOpen((open) => !open)}
                    aria-expanded={filtersOpen}
                    borderColor={activeFilterCount ? accentColor : cardBorder}
                    color={activeFilterCount ? accentColor : textColor}
                >
                    <LuSlidersHorizontal size={16} />
                    Filtrlar{activeFilterCount ? ` (${activeFilterCount})` : ''}
                    <LuChevronDown
                        size={15}
                        style={{
                            transform: filtersOpen ? 'rotate(180deg)' : undefined,
                            transition: 'transform 160ms ease',
                        }}
                    />
                </Button>
            </HStack>

            {filtersOpen && (
                <Box
                    id="product-filters"
                    mb={4}
                    p={{ base: 4, md: 6 }}
                    bg={isDark ? tableBg : '#FFFFFF'}
                    borderWidth="1px"
                    borderColor={cardBorder}
                    borderRadius="2xl"
                    boxShadow={
                        isDark
                            ? '0 12px 32px rgba(0, 0, 0, 0.18)'
                            : '0 12px 32px rgba(15, 23, 42, 0.08)'
                    }
                >
                    <HStack justify="space-between" align="center" mb={4} flexWrap="wrap" gap={2}>
                        <HStack gap={3}>
                            <Box
                                p={2.5}
                                borderRadius="xl"
                                bg={isDark ? 'rgba(250, 204, 21, 0.14)' : '#FEF3C7'}
                                color={accentColor}
                                display="inline-flex"
                            >
                                <LuSlidersHorizontal size={19} />
                            </Box>
                            <Box>
                                <Text fontSize="lg" fontWeight="bold" color={textColor}>
                                    Filtrlar va saralash
                                </Text>
                                <Text fontSize="sm" color={subtitleColor}>
                                    Barcha tanlangan filtrlar birgalikda qo‘llanadi
                                </Text>
                            </Box>
                        </HStack>
                        {(activeFilterCount > 0 || sort.join('|') !== DEFAULT_SORT.join('|')) && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={clearFilters}
                                color={accentColor}
                            >
                                Tozalash
                            </Button>
                        )}
                    </HStack>
                    <Box
                        display="grid"
                        gridTemplateColumns={{
                            base: '1fr',
                            sm: 'repeat(2, minmax(0, 1fr))',
                            xl: 'repeat(3, minmax(0, 1fr))',
                        }}
                        gap={4}
                    >
                        {[
                            {
                                key: 'brandId',
                                label: 'Brend',
                                placeholder: 'Barcha brendlar',
                                options: brands,
                            },
                            {
                                key: 'categoryId',
                                label: 'Kategoriya',
                                placeholder: 'Barcha kategoriyalar',
                                options: categories,
                            },
                            {
                                key: 'colorId',
                                label: 'Rang',
                                placeholder: 'Barcha ranglar',
                                options: colors,
                            },
                        ].map(({ key, label, placeholder, options }) => (
                            <Box key={key} minW={0}>
                                <Text
                                    as="label"
                                    htmlFor={`product-filter-${key}`}
                                    fontSize="sm"
                                    fontWeight="semibold"
                                    mb={2}
                                    display="block"
                                >
                                    {label}
                                </Text>
                                <Box
                                    as="select"
                                    id={`product-filter-${key}`}
                                    value={filters[key]}
                                    onChange={(event) =>
                                        applyFilters({ ...filters, [key]: event.target.value })
                                    }
                                    w="100%"
                                    h="46px"
                                    px={4}
                                    borderWidth="1px"
                                    borderColor={cardBorder}
                                    borderRadius="xl"
                                    bg={tableBg}
                                    color={textColor}
                                    fontSize="sm"
                                    outline="none"
                                    transition="border-color 0.16s, box-shadow 0.16s"
                                    _focus={{
                                        borderColor: accentColor,
                                        boxShadow: `0 0 0 1px ${accentColor}`,
                                    }}
                                >
                                    <option value="">{placeholder}</option>
                                    {options.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.name}
                                        </option>
                                    ))}
                                </Box>
                            </Box>
                        ))}
                    </Box>

                </Box>
            )}

            {/* ── Content ── */}
            {(isLoading || isFetching) && products.length === 0 ? (
                <Loading />
            ) : error ? (
                <Box p={8} textAlign="center" color={isDark ? 'red.300' : 'red.600'}>
                    Ma&apos;lumotlarni yuklashda xatolik
                </Box>
            ) : products.length === 0 ? (
                <EmptyData
                    text={query ? 'Qidiruv bo‘yicha mahsulot topilmadi' : 'Hozircha mahsulotlar yo‘q'}
                    description="Yangi mahsulot qo‘shib katalogni to‘ldiring."
                    action={<Create warehouses={warehouses} />}
                />
            ) : (
                <>
                    <Box
                        overflowX="auto"
                        bg={tableBg}
                        borderWidth="0.5px"
                        borderColor={tableBorder}
                        borderRadius="10px"
                        boxShadow={
                            isDark
                                ? '0 16px 40px rgba(0, 0, 0, 0.22)'
                                : '0 8px 24px rgba(15, 23, 42, 0.10)'
                        }
                    >
                        <Table.Root
                            size="sm"
                            interactive
                            bg={tableBg}
                            borderCollapse="collapse"
                            minW="1750px"
                        >
                            <Table.Header bg={tableHeaderBg}>
                                <Table.Row bg={tableHeaderBg}>
                                    <Table.ColumnHeader {...headerCell} textAlign="center" w="50px">
                                        №
                                    </Table.ColumnHeader>
                                    {sortableHeader('Mahsulot', 'name', '240px')}
                                    {sortableHeader('Artikul', 'article', '130px')}
                                    {sortableHeader('Brend', 'brand.name', '160px')}
                                    {sortableHeader('Kategoriya', 'category.name', '140px')}
                                    {sortableHeader('Rang', 'color.name', '130px')}
                                    {sortableHeader('O‘lcham', 'size', '110px')}
                                    {sortableHeader('Narxi', 'price', '130px', 'right')}
                                    {sortableHeader('Min. qoldiq', 'minimumLine', '110px', 'right')}
                                    {sortableHeader('Qadoqdagi dona', 'piecesPerPack', '130px', 'center')}
                                    <Table.ColumnHeader {...headerCell} minW="170px">
                                        Ombor
                                    </Table.ColumnHeader>
                                    {sortableHeader('Shtrix-kod', 'barcode', '150px')}
                                    <Table.ColumnHeader {...headerCell} textAlign="center" w="140px">
                                        Amal
                                    </Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body bg={tableBg}>
                                {products.map((product, index) => {
                                    const warehouseName = getWarehouseName(product.warehouseId);
                                    const brand = product.brand;
                                    const color = product.color;
                                    const category = product.category;
                                    return (
                                        <Table.Row
                                            key={product.id}
                                            bg={tableBg}
                                            cursor="pointer"
                                            onClick={() => navigate(`/products/${product.id}`)}
                                            onKeyDown={(event) => {
                                                if (event.target !== event.currentTarget) return;
                                                if (event.key === 'Enter' || event.key === ' ') {
                                                    event.preventDefault();
                                                    navigate(`/products/${product.id}`);
                                                }
                                            }}
                                            tabIndex={0}
                                            aria-label={`${product.name} tafsilotlarini ochish`}
                                            _hover={{
                                                bg: isDark
                                                    ? 'rgba(250, 204, 21, 0.06)'
                                                    : '#FFFBEB',
                                            }}
                                            transition="background 0.15s"
                                        >
                                            <Table.Cell
                                                {...cellBorder}
                                                textAlign="center"
                                                color={subtitleColor}
                                                fontSize="sm"
                                            >
                                                {index + 1}
                                            </Table.Cell>

                                            <Table.Cell {...cellBorder}>
                                                <HStack gap={2.5}>
                                                    <Box
                                                        p={1.5}
                                                        borderRadius="md"
                                                        bg={
                                                            isDark
                                                                ? 'rgba(250, 204, 21, 0.10)'
                                                                : '#FEF3C7'
                                                        }
                                                        color={accentColor}
                                                        flexShrink={0}
                                                        display="inline-flex"
                                                        alignItems="center"
                                                        justifyContent="center"
                                                    >
                                                        <LuPackage size={14} />
                                                    </Box>
                                                    <VStack
                                                        align="start"
                                                        gap={0}
                                                        lineHeight="1.2"
                                                        minW={0}
                                                    >
                                                        <Text
                                                            fontWeight="semibold"
                                                            fontSize="sm"
                                                            color={textColor}
                                                            noOfLines={1}
                                                        >
                                                            {product.name}
                                                        </Text>
                                                    </VStack>
                                                </HStack>
                                            </Table.Cell>

                                            {/* Artikul */}
                                            <Table.Cell {...cellBorder}>
                                                {product.article ? (
                                                    <Text
                                                        fontSize="sm"
                                                        color={textColor}
                                                        fontFamily="mono"
                                                        noOfLines={1}
                                                    >
                                                        {product.article}
                                                    </Text>
                                                ) : (
                                                    <Text
                                                        fontSize="sm"
                                                        color={subtitleColor}
                                                        fontStyle="italic"
                                                    >
                                                        —
                                                    </Text>
                                                )}
                                            </Table.Cell>

                                            {/* Brend */}
                                            <Table.Cell {...cellBorder}>
                                                {brand?.name ? (
                                                    <HStack gap={1.5}>
                                                        <Box
                                                            p={1}
                                                            borderRadius="md"
                                                            bg={
                                                                isDark
                                                                    ? 'rgba(96, 165, 250, 0.15)'
                                                                    : '#DBEAFE'
                                                            }
                                                            color={
                                                                isDark ? 'blue.300' : 'blue.600'
                                                            }
                                                            display="inline-flex"
                                                            alignItems="center"
                                                            justifyContent="center"
                                                            flexShrink={0}
                                                        >
                                                            <LuTag size={12} />
                                                        </Box>
                                                        <Text
                                                            fontSize="sm"
                                                            color={textColor}
                                                            noOfLines={1}
                                                        >
                                                            {brand.name}
                                                        </Text>
                                                    </HStack>
                                                ) : (
                                                    <Text
                                                        fontSize="sm"
                                                        color={subtitleColor}
                                                        fontStyle="italic"
                                                    >
                                                        brendsiz
                                                    </Text>
                                                )}
                                            </Table.Cell>

                                            {/* Kategoriya */}
                                            <Table.Cell {...cellBorder}>
                                                {category?.name ? (
                                                    <HStack gap={1.5}>
                                                        <Box
                                                            p={1}
                                                            borderRadius="md"
                                                            bg={
                                                                isDark
                                                                    ? 'rgba(168, 85, 247, 0.15)'
                                                                    : '#F3E8FF'
                                                            }
                                                            color={
                                                                isDark ? 'purple.300' : 'purple.600'
                                                            }
                                                            display="inline-flex"
                                                            alignItems="center"
                                                            justifyContent="center"
                                                            flexShrink={0}
                                                        >
                                                            <LuFolder size={12} />
                                                        </Box>
                                                        <Text
                                                            fontSize="sm"
                                                            color={textColor}
                                                            noOfLines={1}
                                                        >
                                                            {category.name}
                                                        </Text>
                                                    </HStack>
                                                ) : (
                                                    <Text
                                                        fontSize="sm"
                                                        color={subtitleColor}
                                                        fontStyle="italic"
                                                    >
                                                        —
                                                    </Text>
                                                )}
                                            </Table.Cell>

                                            {/* Rang */}
                                            <Table.Cell {...cellBorder}>
                                                {color?.name ? (
                                                    <HStack gap={1.5}>
                                                        <Box
                                                            p={1}
                                                            borderRadius="md"
                                                            bg={
                                                                isDark
                                                                    ? 'rgba(236, 72, 153, 0.15)'
                                                                    : '#FCE7F3'
                                                            }
                                                            color={
                                                                isDark ? 'pink.300' : 'pink.600'
                                                            }
                                                            display="inline-flex"
                                                            alignItems="center"
                                                            justifyContent="center"
                                                            flexShrink={0}
                                                        >
                                                            <LuPalette size={12} />
                                                        </Box>
                                                        <Text
                                                            fontSize="sm"
                                                            color={textColor}
                                                            noOfLines={1}
                                                        >
                                                            {color.name}
                                                        </Text>
                                                    </HStack>
                                                ) : (
                                                    <Text
                                                        fontSize="sm"
                                                        color={subtitleColor}
                                                        fontStyle="italic"
                                                    >
                                                        —
                                                    </Text>
                                                )}
                                            </Table.Cell>

                                            {/* O'lcham */}
                                            <Table.Cell {...cellBorder}>
                                                {product.size ? (
                                                    <HStack gap={1.5}>
                                                        <LuRuler
                                                            size={13}
                                                            color={subtitleColor}
                                                            style={{ flexShrink: 0 }}
                                                        />
                                                        <Text
                                                            fontSize="sm"
                                                            color={textColor}
                                                            whiteSpace="nowrap"
                                                        >
                                                            {product.size}
                                                        </Text>
                                                    </HStack>
                                                ) : (
                                                    <Text fontSize="sm" color={subtitleColor}>
                                                        —
                                                    </Text>
                                                )}
                                            </Table.Cell>

                                            {/* Narxi */}
                                            <Table.Cell
                                                {...cellBorder}
                                                textAlign="right"
                                                whiteSpace="nowrap"
                                            >
                                                <Text
                                                    fontWeight="bold"
                                                    fontSize="sm"
                                                    color={textColor}
                                                >
                                                    {formatNumber(product.price)}{' '}
                                                    <Text
                                                        as="span"
                                                        fontSize="xs"
                                                        color={subtitleColor}
                                                        fontWeight="normal"
                                                    >
                                                        so‘m
                                                    </Text>
                                                </Text>
                                            </Table.Cell>

                                            {/* Minimum qoldiq */}
                                            <Table.Cell
                                                {...cellBorder}
                                                textAlign="right"
                                                whiteSpace="nowrap"
                                            >
                                                {product.minimumLine !== null &&
                                                product.minimumLine !== undefined ? (
                                                    <Text
                                                        fontSize="sm"
                                                        color={textColor}
                                                        fontWeight="medium"
                                                    >
                                                        {formatNumber(product.minimumLine)}{' '}
                                                        <Text
                                                            as="span"
                                                            fontSize="xs"
                                                            color={subtitleColor}
                                                            fontWeight="normal"
                                                        >
                                                            dona
                                                        </Text>
                                                    </Text>
                                                ) : (
                                                    <Text fontSize="sm" color={subtitleColor}>
                                                        —
                                                    </Text>
                                                )}
                                            </Table.Cell>

                                            {/* Qadoqdagi dona */}
                                            <Table.Cell {...cellBorder} textAlign="center" whiteSpace="nowrap">
                                                {product.piecesPerPack !== null && product.piecesPerPack !== undefined ? (
                                                    <HStack gap={1.5} justify="center">
                                                        <Box
                                                            p={1}
                                                            borderRadius="md"
                                                            bg={isDark ? 'rgba(99,102,241,0.15)' : '#EEF2FF'}
                                                            color={isDark ? '#A5B4FC' : '#4338CA'}
                                                            display="inline-flex"
                                                            alignItems="center"
                                                            justifyContent="center"
                                                            flexShrink={0}
                                                        >
                                                            <LuPackage size={12} />
                                                        </Box>
                                                        <Text fontSize="sm" color={textColor} fontWeight="medium">
                                                            {product.piecesPerPack}
                                                        </Text>
                                                    </HStack>
                                                ) : (
                                                    <Text fontSize="sm" color={subtitleColor}>—</Text>
                                                )}
                                            </Table.Cell>

                                            {/* Ombor */}
                                            <Table.Cell {...cellBorder}>
                                                {warehouseName ? (
                                                    <HStack gap={1.5}>
                                                        <LuWarehouse
                                                            size={13}
                                                            color={subtitleColor}
                                                            style={{ flexShrink: 0 }}
                                                        />
                                                        <Text
                                                            fontSize="sm"
                                                            color={textColor}
                                                            noOfLines={1}
                                                        >
                                                            {warehouseName}
                                                        </Text>
                                                    </HStack>
                                                ) : (
                                                    <Text
                                                        fontSize="sm"
                                                        color={subtitleColor}
                                                        fontStyle="italic"
                                                    >
                                                        —
                                                    </Text>
                                                )}
                                            </Table.Cell>

                                            {/* Shtrix-kod */}
                                            <Table.Cell {...cellBorder}>
                                                {product.barcode ? (
                                                    <Text
                                                        fontSize="xs"
                                                        color={subtitleColor}
                                                        fontFamily="mono"
                                                        whiteSpace="nowrap"
                                                    >
                                                        {product.barcode}
                                                    </Text>
                                                ) : (
                                                    <Text fontSize="sm" color={subtitleColor}>
                                                        —
                                                    </Text>
                                                )}
                                            </Table.Cell>

                                            {/* Amallar */}
                                            <Table.Cell
                                                {...cellBorder}
                                                textAlign="center"
                                                onClick={(event) => event.stopPropagation()}
                                                onKeyDown={(event) => event.stopPropagation()}
                                            >
                                                <HStack justify="center" gap={1}>
                                                    <CopyButton product={product} />
                                                    <Edit product={product} />
                                                    <Delete product={product} />
                                                </HStack>
                                            </Table.Cell>
                                        </Table.Row>
                                    );
                                })}
                            </Table.Body>
                        </Table.Root>
                    </Box>

                    {/* ── AUTO-LOAD SENTINEL ── */}
                    {hasMore ? (
                        <Box
                            ref={loadMoreRef}
                            display="flex"
                            justifyContent="center"
                            alignItems="center"
                            py={8}
                            minH="60px"
                        >
                            {isFetching ? (
                                <HStack gap={3}>
                                    <Spinner size="sm" color={accentColor} />
                                    <Text color={subtitleColor} fontSize="sm">
                                        Yuklanmoqda...
                                    </Text>
                                </HStack>
                            ) : (
                                <Text color={subtitleColor} fontSize="sm" opacity={0.6}>
                                    ↓ Yana yuklash uchun pastga suring
                                </Text>
                            )}
                        </Box>
                    ) : (
                        products.length > 0 && (
                            <HStack
                                justify="center"
                                align="center"
                                py={6}
                                gap={2}
                                color={subtitleColor}
                            >
                                <LuCheck size={16} />
                                <Text fontSize="sm">
                                    Barcha mahsulotlar yuklandi ({products.length} ta)
                                </Text>
                            </HStack>
                        )
                    )}
                </>
            )}
        </Box>
    );
}