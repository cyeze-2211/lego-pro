import { useEffect, useState } from 'react';
import { Box, Button, HStack, Heading, Table, Text } from '@chakra-ui/react';
import { Layers3 } from 'lucide-react';
import { LuGift, LuSearch, LuX } from 'react-icons/lu';
import { useGetProductCategoriesQuery } from '../../../store/services/productCategory.api';
import { BRAND_COLORS, useAppTheme } from '../../../theme/tokens';
import { Alert } from '../../Other/UI/Alert/Alert';
import Loading from '../../Other/UI/Loadings/Loading';
import EmptyData from '../../Other/UI/NoData/EmptyData';
import FormControl from '../../ui/FormControl';
import { formatNumber } from '../../ui/number-format';
import Create from './__components/Create';
import Edit from './__components/Edit';
import Delete from './__components/Delete';
import { useInfiniteList } from '../../ui/useInfiniteList';
import InfiniteSentinel from '../../ui/InfiniteSentinel';

const PAGE_SIZE = 20;

export default function ProductCategory() {
    const [search, setSearch] = useState('');
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(0);
    const { data: result, isLoading, isFetching, error } = useGetProductCategoriesQuery({
        name: query || undefined,
        page,
        size: PAGE_SIZE,
    });
    const { isDark, pageBg, cardBg, cardBorder, textColor, subtitleColor, accentColor } = useAppTheme();

    const { items: categories, hasMore, sentinelRef, loadingMore, loadMore } = useInfiniteList({
        items: result?.items,
        pagination: result?.pagination,
        page,
        setPage,
        isFetching,
        resetKey: JSON.stringify({ name: query || undefined }),
    });
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
        if (error) Alert(error?.data?.message || 'Kategoriyalarni yuklashda xatolik', 'error');
    }, [error]);

    return (
        <Box my={2} bg={pageBg} color={textColor} minH="100%">
            <HStack justify="space-between" align="start" flexWrap="wrap" gap={4} mb={4}>
                <Heading className="text-[35px] font-semibold" color={textColor}>Mahsulot kategoriyalari</Heading>
                <Create />
            </HStack>

            <HStack as="form" onSubmit={submitSearch} w="100%" align={{ base: 'stretch', md: 'center' }} flexDirection={{ base: 'column', md: 'row' }} gap={3} mb={4} p={3} bg={cardBg} borderWidth="1px" borderColor={cardBorder} borderRadius="xl" boxShadow={isDark ? 'none' : '0 6px 18px rgba(15, 23, 42, 0.06)'}>
                <Box position="relative" flex="1" w="100%">
                    <Box position="absolute" left={4} top="50%" transform="translateY(-50%)" color={accentColor} zIndex={1} pointerEvents="none"><LuSearch size={18} /></Box>
                    <FormControl value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Kategoriya nomi bo‘yicha qidiring..." aria-label="Kategoriya qidirish" pl={11} pr={search ? 11 : 4} minH="32px" />
                    {search && (
                        <Button type="button" variant="ghost" size="sm" position="absolute" right={2} top="50%" transform="translateY(-50%)" color={subtitleColor} minW="32px" h="32px" p={0} borderRadius="full" aria-label="Qidiruvni tozalash" onClick={clearSearch} _hover={{ bg: isDark ? 'whiteAlpha.100' : 'gray.100', color: textColor }}>
                            <LuX size={16} />
                        </Button>
                    )}
                </Box>
                <Button type="submit" bg={accentColor} color="black" borderRadius="xl" minH="32px" px={6} flexShrink={0} _hover={{ bg: 'yellow.500', transform: 'translateY(-1px)' }}>
                    <HStack gap={2}><LuSearch size={18} /><span>Qidirish</span></HStack>
                </Button>
            </HStack>

            {isLoading ? <Loading /> : error ? (
                <Box p={8} textAlign="center" color={isDark ? 'red.300' : 'red.600'}>Kategoriyalarni yuklashda xatolik</Box>
            ) : categories.length === 0 ? (
                <EmptyData text={query ? 'Qidiruv bo‘yicha kategoriya topilmadi' : 'Hozircha kategoriyalar yo‘q'} description={query ? 'Boshqa nom bilan qidirib ko‘ring.' : 'Yangi kategoriya qo‘shib boshlang.'} action={!query && <Create />} />
            ) : (
                <>
                    <Box overflowX="auto" bg={tableBg} borderWidth="0.5px" borderColor={tableBorder} borderRadius="10px" boxShadow={isDark ? '0 16px 40px rgba(0, 0, 0, 0.22)' : '0 8px 24px rgba(15, 23, 42, 0.10)'}>
                        <Table.Root size="md" interactive bg={tableBg} borderCollapse="collapse">
                            <Table.Header bg={tableHeaderBg}>
                                <Table.Row bg={tableHeaderBg}>
                                    {['№', 'Kategoriya nomi', 'Bonus narx (1 dona)', 'Yaratilgan sana', 'Yangilangan sana', 'Amallar'].map((label) => (
                                        <Table.ColumnHeader key={label} textAlign={label === '№' || label === 'Amallar' ? 'center' : label.startsWith('Bonus') ? 'right' : undefined} bg={tableHeaderBg} borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor}>{label}</Table.ColumnHeader>
                                    ))}
                                </Table.Row>
                            </Table.Header>
                            <Table.Body bg={tableBg}>
                                {categories.map((category, index) => (
                                    <Table.Row key={category.id} bg={tableBg} _hover={{ bg: isDark ? 'rgba(250, 204, 21, 0.06)' : '#FFFBEB' }}>
                                        <Table.Cell textAlign="center" color={subtitleColor} borderWidth="0.5px" borderColor={tableBorder}>{index + 1}</Table.Cell>
                                        <Table.Cell borderWidth="0.5px" borderColor={tableBorder}>
                                            <HStack gap={3}>
                                                <Box p={2} borderRadius="lg" bg={isDark ? 'rgba(250,204,21,.12)' : '#FEF3C7'} color={accentColor}><Layers3 size={18} /></Box>
                                                <Text fontWeight="semibold" color={textColor}>{category.name}</Text>
                                            </HStack>
                                        </Table.Cell>
                                        <Table.Cell textAlign="right" whiteSpace="nowrap" borderWidth="0.5px" borderColor={tableBorder}>
                                            {Number(category.bonusPrice) > 0 ? (
                                                <HStack gap={1.5} justify="flex-end">
                                                    <Box p={1} borderRadius="md" bg={isDark ? 'rgba(16, 185, 129, 0.15)' : '#D1FAE5'} color={isDark ? 'green.300' : 'green.600'} display="inline-flex"><LuGift size={12} /></Box>
                                                    <Text fontWeight="bold" fontSize="sm" color={textColor}>{formatNumber(category.bonusPrice)} <Text as="span" fontSize="xs" color={subtitleColor} fontWeight="normal">so‘m</Text></Text>
                                                </HStack>
                                            ) : (
                                                <Text fontSize="sm" color={subtitleColor}>—</Text>
                                            )}
                                        </Table.Cell>
                                        <Table.Cell color={subtitleColor} borderWidth="0.5px" borderColor={tableBorder}>{category.createdAt ? new Date(category.createdAt).toLocaleString() : '—'}</Table.Cell>
                                        <Table.Cell color={subtitleColor} borderWidth="0.5px" borderColor={tableBorder}>{category.lastModifiedAt ? new Date(category.lastModifiedAt).toLocaleString() : '—'}</Table.Cell>
                                        <Table.Cell borderWidth="0.5px" borderColor={tableBorder}>
                                            <HStack justify="center" gap={1}><Edit category={category} /><Delete category={category} /></HStack>
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table.Root>
                    </Box>
                    <InfiniteSentinel sentinelRef={sentinelRef} hasMore={hasMore} loadingMore={loadingMore} loaded={categories.length} total={result?.pagination?.totalElements ?? categories.length} unit="ta kategoriya" onLoadMore={loadMore} />
                </>
            )}
        </Box>
    );
}
