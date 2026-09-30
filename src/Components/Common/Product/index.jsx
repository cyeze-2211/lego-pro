import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    HStack,
    Heading,
    Table,
    Text,
    VStack,
    Badge,
} from '@chakra-ui/react';
import {
    LuChevronLeft,
    LuChevronRight,
    LuPackage,
    LuSearch,
    LuX,
    LuTag,
    LuRuler,
    LuWarehouse,
    LuTriangleAlert,
} from 'react-icons/lu';
import { useGetProductsQuery } from '../../../store/services/product.api';
import { useGetWarehousesQuery } from '../../../store/services/warehouse.api';
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

export default function Product() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(0);

    const { data: productResult, isLoading, error } = useGetProductsQuery({
        name: query || undefined,
        page,
        size: PAGE_SIZE,
    });
    const { data: warehouses = [] } = useGetWarehousesQuery('PRODUCT');

    const {
        isDark,
        pageBg,
        cardBg,
        cardBorder,
        textColor,
        subtitleColor,
        accentColor,
    } = useAppTheme();

    const products = productResult?.items || [];
    const pagination = productResult?.pagination;
    const totalPages = pagination?.totalPages || 0;
    const totalElements = pagination?.totalElements ?? 0;

    const tableBg = isDark ? BRAND_COLORS.darkCardBg : cardBg;
    const tableHeaderBg = isDark ? tableBg : '#F8FAFC';
    const tableBorder = isDark ? cardBorder : '#CBD5E1';

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

    const submitSearch = (event) => {
        event.preventDefault();
        setPage(0);
        setQuery(search.trim());
    };

    const clearSearch = () => {
        setSearch('');
        setPage(0);
        setQuery('');
    };

    useEffect(() => {
        if (error) Alert(error?.data?.message || 'Mahsulotlarni yuklashda xatolik', 'error');
    }, [error]);

    // Ombor nomi — warehouseId orqali topamiz
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
                as="form"
                onSubmit={submitSearch}
                w="100%"
                align={{ base: 'stretch', md: 'center' }}
                flexDirection={{ base: 'column', md: 'row' }}
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
                        placeholder="Mahsulot nomi bo‘yicha qidiring..."
                        aria-label="Mahsulot qidirish"
                        pl={11}
                        pr={search ? 11 : 4}
                        minH="40px"
                    />
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
                    type="submit"
                    bg={accentColor}
                    color="black"
                    borderRadius="xl"
                    minH="40px"
                    px={6}
                    flexShrink={0}
                    _hover={{ bg: 'yellow.500', transform: 'translateY(-1px)' }}
                >
                    <HStack gap={2}>
                        <LuSearch size={18} />
                        <span>Qidirish</span>
                    </HStack>
                </Button>
            </HStack>

            {/* ── Content ── */}
            {isLoading ? (
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
                            minW="1150px"
                        >
                            <Table.Header bg={tableHeaderBg}>
                                <Table.Row bg={tableHeaderBg}>
                                    <Table.ColumnHeader {...headerCell} textAlign="center" w="50px">
                                        №
                                    </Table.ColumnHeader>
                                    <Table.ColumnHeader {...headerCell} minW="240px">
                                        Mahsulot
                                    </Table.ColumnHeader>
                                    <Table.ColumnHeader {...headerCell} minW="160px">
                                        Brend
                                    </Table.ColumnHeader>
                                    <Table.ColumnHeader {...headerCell} minW="110px">
                                        O‘lcham
                                    </Table.ColumnHeader>
                                    <Table.ColumnHeader {...headerCell} minW="130px" textAlign="right">
                                        Narxi
                                    </Table.ColumnHeader>
                                    <Table.ColumnHeader {...headerCell} minW="110px" textAlign="right">
                                        Min. qoldiq
                                    </Table.ColumnHeader>
                                    <Table.ColumnHeader {...headerCell} minW="170px">
                                        Ombor
                                    </Table.ColumnHeader>
                                    <Table.ColumnHeader {...headerCell} minW="150px">
                                        Shtrix-kod
                                    </Table.ColumnHeader>
                                    <Table.ColumnHeader {...headerCell} textAlign="center" w="100px">
                                        Amal
                                    </Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body bg={tableBg}>
                                {products.map((product, index) => {
                                    const warehouseName = getWarehouseName(product.warehouseId);
                                    const brand = product.brand;
                                    return (
                                        <Table.Row
                                            key={product.id}
                                            bg={tableBg}
                                            cursor="pointer"
                                            onClick={() => navigate(`/products/${product.id}`)}
                                            onKeyDown={(event) => {
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
                                                {page * PAGE_SIZE + index + 1}
                                            </Table.Cell>

                                            {/* Mahsulot nomi + artikul */}
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
                                                        {product.article ? (
                                                            <Text
                                                                fontSize="10px"
                                                                color={subtitleColor}
                                                                fontFamily="mono"
                                                            >
                                                                {product.article}
                                                            </Text>
                                                        ) : (
                                                            <Text
                                                                fontSize="10px"
                                                                color={subtitleColor}
                                                                fontStyle="italic"
                                                            >
                                                                artikulsiz
                                                            </Text>
                                                        )}
                                                    </VStack>
                                                </HStack>
                                            </Table.Cell>

                                            {/* Brend — obyekt */}
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
                                            >
                                                <HStack justify="center" gap={1}>
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

                    {/* ── Pagination ── */}
                    {totalPages > 1 && (
                        <HStack justify="center" mt={6} gap={3}>
                            <Button
                                size="sm"
                                variant="outline"
                                borderRadius="lg"
                                disabled={page === 0}
                                onClick={() => setPage((value) => value - 1)}
                            >
                                <LuChevronLeft size={14} />
                            </Button>
                            <Text color={subtitleColor} fontSize="sm" fontWeight="medium">
                                {page + 1} / {totalPages}
                            </Text>
                            <Button
                                size="sm"
                                variant="outline"
                                borderRadius="lg"
                                disabled={page >= totalPages - 1}
                                onClick={() => setPage((value) => value + 1)}
                            >
                                <LuChevronRight size={14} />
                            </Button>
                        </HStack>
                    )}
                </>
            )}
        </Box>
    );
}