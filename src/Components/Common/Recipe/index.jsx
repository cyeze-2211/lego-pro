import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Badge,
    Box,
    HStack,
    Heading,
    Table,
    Text,
} from '@chakra-ui/react';
import { LuListOrdered, LuUtensils } from 'react-icons/lu';
import { useGetAllRecipesQuery } from '../../../store/services/productRecept.api';
import { useGetRawMaterialsQuery } from '../../../store/services/raw.api';
import { BRAND_COLORS, useAppTheme } from '../../../theme/tokens';
import { Alert } from '../../Other/UI/Alert/Alert';
import Create from './__components/Create';
import Edit from './__components/Edit';
import Delete from './__components/Delete';
import Loading from '../../Other/UI/Loadings/Loading';
import EmptyData from '../../Other/UI/NoData/EmptyData';
import { useInfiniteList } from '../../ui/useInfiniteList';
import InfiniteSentinel from '../../ui/InfiniteSentinel';

const PAGE_SIZE = 12;
const UNIT_LABELS = { GRAM: 'g', KG: 'kg', TON: 't' };

export default function Recipe() {
    const [page, setPage] = useState(0);
    const { data: recipeResult, isLoading, isFetching, error } = useGetAllRecipesQuery({ page, size: PAGE_SIZE });
    const { data: rawResult } = useGetRawMaterialsQuery({ page: 0, size: 100 });
    const { isDark, pageBg, cardBg, cardBorder, textColor, subtitleColor, accentColor } = useAppTheme();
    const { items: recipes, hasMore, sentinelRef, loadingMore, loadMore } = useInfiniteList({
        items: recipeResult?.items,
        pagination: recipeResult?.pagination,
        page,
        setPage,
        isFetching,
        resetKey: JSON.stringify({  }),
    });
    const rawMaterials = rawResult?.items || [];
    const tableBg = isDark ? BRAND_COLORS.darkCardBg : cardBg;
    const tableHeaderBg = isDark ? tableBg : '#F8FAFC';
    const tableBorder = isDark ? cardBorder : '#CBD5E1';

    useEffect(() => {
        if (error) Alert(error?.data?.message || 'Retseptlarni yuklashda xatolik', 'error');
    }, [error]);

    const calculateTotalQuantity = (items) => {
        if (!items || items.length === 0) return '0 g';
        
        // Barcha miqdorlarni grammga o'tkazish
        const totalGrams = items.reduce((sum, item) => {
            let grams = 0;
            switch (item.unit) {
                case 'TON':
                    grams = item.quantity * 1000000;
                    break;
                case 'KG':
                    grams = item.quantity * 1000;
                    break;
                case 'GRAM':
                default:
                    grams = item.quantity;
                    break;
            }
            return sum + grams;
        }, 0);

        // Eng mos birlikka o'tkazish
        if (totalGrams >= 1000000) {
            return `${(totalGrams / 1000000).toFixed(2)} t`;
        } else if (totalGrams >= 1000) {
            return `${(totalGrams / 1000).toFixed(2)} kg`;
        } else {
            return `${totalGrams.toFixed(2)} g`;
        }
    };

    const renderItemsSummary = (recipe) => (
        <HStack gap={2} flexWrap="wrap">
            {recipe.items.map((item) => (
                <Badge
                    key={item.itemId}
                    variant="subtle"
                    borderRadius="full"
                    px={3}
                    py={1}
                    title={`${item.rawMaterialName} — ${item.quantity} ${UNIT_LABELS[item.unit] || item.unit} (${item.stepOrder}-qadam)`}
                    bg={isDark ? 'rgba(250, 204, 21, 0.1)' : '#FEF3C7'}
                    color={isDark ? 'yellow.200' : '#92400E'}
                    whiteSpace="nowrap"
                >
                    {item.stepOrder}. {item.rawMaterialName} — {item.quantity} {UNIT_LABELS[item.unit] || item.unit}
                </Badge>
            ))}
        </HStack>
    );

    return (
        <Box my={2} bg={pageBg} color={textColor} minH="100%">
            <HStack justify="space-between" align="start" flexWrap="wrap" gap={4} mb={4}>
                <Box>
                    <Heading className="text-[35px] font-semibold" color={textColor}>Retseptlar</Heading>
                </Box>
                <Create rawMaterials={rawMaterials} />
            </HStack>

            {(isLoading || (isFetching && recipes.length === 0)) ? (
                <Loading />
            ) : error ? (
                <Box p={8} textAlign="center" color={isDark ? 'red.300' : 'red.600'}>Ma&apos;lumotlarni yuklashda xatolik</Box>
            ) : recipes.length === 0 ? (
                <EmptyData
                    text="Hozircha retseptlar yo‘q"
                    description="Yangi retsept qo‘shib mahsulotlar tarkibini belgilang."
                    action={<Create rawMaterials={rawMaterials} />}
                />
            ) : (
                <>
                    <Box overflowX="auto" bg={tableBg} borderWidth="0.5px" borderColor={tableBorder} borderRadius="10px" boxShadow={isDark ? '0 16px 40px rgba(0, 0, 0, 0.22)' : '0 8px 24px rgba(15, 23, 42, 0.10)'}>
                        <Table.Root size="md" interactive bg={tableBg} borderCollapse="collapse">
                            <Table.Header bg={tableHeaderBg}>
                                <Table.Row bg={tableHeaderBg}>
                                    <Table.ColumnHeader textAlign="center" bg={tableHeaderBg} borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor} w="60px">№</Table.ColumnHeader>
                                    <Table.ColumnHeader bg={tableHeaderBg} borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor}>Retsept</Table.ColumnHeader>
                                    <Table.ColumnHeader bg={tableHeaderBg} borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor}>Tarkibi (xom ashyo)</Table.ColumnHeader>
                                    <Table.ColumnHeader textAlign="center" bg={tableHeaderBg} borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor} w="150px">Umumiy hajm</Table.ColumnHeader>
                                    <Table.ColumnHeader textAlign="center" bg={tableHeaderBg} borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor}>Amallar</Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body bg={tableBg}>
                                {recipes.map((recipe, index) => (
                                    <Table.Row
                                        key={recipe.recipeId}
                                        bg={tableBg}
                                        _hover={{ bg: isDark ? 'rgba(250, 204, 21, 0.06)' : '#FFFBEB' }}
                                    >
                                        <Table.Cell borderWidth="0.5px" borderColor={tableBorder} textAlign="center" color={subtitleColor}>{index + 1}</Table.Cell>
                                        <Table.Cell borderWidth="0.5px" borderColor={tableBorder}>
                                            <HStack gap={3}>
                                                <Box p={2} borderRadius="lg" bg={isDark ? 'rgba(250, 204, 21, 0.12)' : '#FEF3C7'} color={accentColor}><LuUtensils size={18} /></Box>
                                                <Text as={Link} to={`/recipes/${recipe.recipeId}`} fontWeight="semibold" color={textColor} _hover={{ color: accentColor }}>{recipe.name}</Text>
                                            </HStack>
                                        </Table.Cell>
                                        <Table.Cell borderWidth="0.5px" borderColor={tableBorder} maxW="480px">{renderItemsSummary(recipe)}</Table.Cell>
                                        <Table.Cell borderWidth="0.5px" borderColor={tableBorder} textAlign="center">
                                            <Text fontWeight="bold" color={accentColor}>{calculateTotalQuantity(recipe.items)}</Text>
                                        </Table.Cell>
                                        <Table.Cell borderWidth="0.5px" borderColor={tableBorder}>
                                            <HStack justify="center" gap={1}><Edit recipe={recipe} rawMaterials={rawMaterials} /><Delete recipe={recipe} /></HStack>
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table.Root>
                    </Box>
                    <InfiniteSentinel sentinelRef={sentinelRef} hasMore={hasMore} loadingMore={loadingMore} loaded={recipes.length} total={recipeResult?.pagination?.totalElements ?? recipes.length} unit="ta retsept" onLoadMore={loadMore} />
                </>
            )}
        </Box>
    );
}