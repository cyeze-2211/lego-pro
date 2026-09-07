import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    HStack,
    Heading,
    Table,
    Text,
} from '@chakra-ui/react';
import { LuChevronLeft, LuChevronRight, LuPackage, LuSearch, LuX } from 'react-icons/lu';
import { useGetProductsQuery } from '../../../store/services/product.api';
import { useGetWarehousesQuery } from '../../../store/services/warehouse.api';
import { useGetRawMaterialsQuery } from '../../../store/services/raw.api';
import { BRAND_COLORS, useAppTheme } from '../../../theme/tokens';
import { Alert } from '../../Other/UI/Alert/Alert';
import Create from './__components/Create';
import Edit from './__components/Edit';
import Delete from './__components/Delete';
import RecipeCreate from '../Recipe/__components/RecipeCreate';
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
    const { data: productResult, isLoading, error } = useGetProductsQuery({ name: query || undefined, page, size: PAGE_SIZE });
    const { data: warehouses = [] } = useGetWarehousesQuery('PRODUCT');
    const { data: rawResult } = useGetRawMaterialsQuery({ page: 0, size: 100 });
    const { isDark, pageBg, cardBg, cardBorder, textColor, subtitleColor, accentColor } = useAppTheme();
    const rawMaterials = rawResult?.items || [];
    const products = productResult?.items || [];
    const pagination = productResult?.pagination;
    const totalPages = pagination?.totalPages || 0;
    const tableBg = isDark ? BRAND_COLORS.darkCardBg : cardBg;
    const tableHeaderBg = isDark ? tableBg : '#F8FAFC';
    const tableBorder = isDark ? cardBorder : '#CBD5E1';

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

    return (
        <Box my={2} bg={pageBg} color={textColor} minH="100%">
            <HStack justify="space-between" align="start" flexWrap="wrap" gap={4} mb={4}>
                <Box>
                    <Heading className="text-[35px] font-semibold" color={textColor}>Mahsulotlar</Heading>
                </Box>
                <Create warehouses={warehouses} />
            </HStack>

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
                    <Box position="absolute" left={4} top="50%" transform="translateY(-50%)" color={accentColor} zIndex={1} pointerEvents="none">
                        <LuSearch size={18} />
                    </Box>
                    <FormControl
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Mahsulot nomi bo‘yicha qidiring..."
                        aria-label="Mahsulot qidirish"
                        pl={11}
                        pr={search ? 11 : 4}
                        minH="32px"
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
                            _hover={{ bg: isDark ? 'whiteAlpha.100' : 'gray.100', color: textColor }}
                        >
                            <LuX size={16} />
                        </Button>
                    )}
                </Box>
                <Button type="submit" bg={accentColor} color="black" borderRadius="xl" minH="32px" px={6} flexShrink={0} _hover={{ bg: 'yellow.500', transform: 'translateY(-1px)' }}>
                    <HStack gap={2}><LuSearch size={18} /><span>Qidirish</span></HStack>
                </Button>
            </HStack>

            {isLoading ? (
                <Loading />
            ) : error ? (
                <Box p={8} textAlign="center" color={isDark ? 'red.300' : 'red.600'}>Ma&apos;lumotlarni yuklashda xatolik</Box>
            ) : products.length === 0 ? (
                <EmptyData
                    text={query ? 'Qidiruv bo‘yicha mahsulot topilmadi' : 'Hozircha mahsulotlar yo‘q'}
                    description="Yangi mahsulot qo‘shib katalogni to‘ldiring."
                    action={<Create warehouses={warehouses} />}
                />
            ) : (
                <>
                    <Box overflowX="auto" bg={tableBg} borderWidth="0.5px" borderColor={tableBorder} borderRadius="10px" boxShadow={isDark ? '0 16px 40px rgba(0, 0, 0, 0.22)' : '0 8px 24px rgba(15, 23, 42, 0.10)'}>
                        <Table.Root size="md" interactive bg={tableBg} borderCollapse="collapse">
                            <Table.Header bg={tableHeaderBg}>
                                <Table.Row bg={tableHeaderBg}>
                                    <Table.ColumnHeader textAlign="center" bg={tableHeaderBg} borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor} w="60px">№</Table.ColumnHeader>
                                    <Table.ColumnHeader bg={tableHeaderBg} borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor}>Mahsulot nomi</Table.ColumnHeader>
                                    <Table.ColumnHeader bg={tableHeaderBg} borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor}>Narxi</Table.ColumnHeader>
                                    <Table.ColumnHeader bg={tableHeaderBg} borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor}>Shtrix-kod</Table.ColumnHeader>
                                    <Table.ColumnHeader bg={tableHeaderBg} borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor} textAlign="center">Amallar</Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body bg={tableBg}>
                                {products.map((product, index) => (
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
                                        _hover={{ bg: isDark ? 'rgba(250, 204, 21, 0.06)' : '#FFFBEB' }}
                                    >
                                        <Table.Cell borderWidth="0.5px" borderColor={tableBorder} textAlign="center" color={subtitleColor}>{page * PAGE_SIZE + index + 1}</Table.Cell>
                                        <Table.Cell borderWidth="0.5px" borderColor={tableBorder}><HStack gap={3}><Box p={2} borderRadius="lg" bg={isDark ? 'rgba(250, 204, 21, 0.12)' : '#FEF3C7'} color={accentColor}><LuPackage size={18} /></Box><Text fontWeight="semibold" color={textColor}>{product.name}</Text></HStack></Table.Cell>
                                        <Table.Cell borderWidth="0.5px" borderColor={tableBorder} color={textColor} fontWeight="bold" whiteSpace="nowrap">{formatNumber(product.price)} so‘m</Table.Cell>
                                        <Table.Cell borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor} fontFamily="mono" whiteSpace="nowrap">{product.barcode || '—'}</Table.Cell>
                                        <Table.Cell borderWidth="0.5px" borderColor={tableBorder} onClick={(event) => event.stopPropagation()}><HStack justify="center" gap={1}><RecipeCreate mode="icon" productId={product.id} productName={product.name} rawMaterials={rawMaterials} /><Edit product={product} /><Delete product={product} /></HStack></Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table.Root>
                    </Box>
                    {totalPages > 1 && <HStack justify="center" mt={8} gap={3}><Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((value) => value - 1)}><LuChevronLeft /></Button><Text color={subtitleColor} fontSize="sm">{page + 1} / {totalPages}</Text><Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage((value) => value + 1)}><LuChevronRight /></Button></HStack>}
                </>
            )}
        </Box>
    );
}