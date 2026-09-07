import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Badge,
    Box,
    Button,
    HStack,
    Heading,
    Table,
    Text,
} from '@chakra-ui/react';
import { LuChevronLeft, LuChevronRight, LuListOrdered, LuUtensils } from 'react-icons/lu';
import { useGetAllRecipesQuery } from '../../../store/services/productRecept.api';
import { useGetProductsQuery } from '../../../store/services/product.api';
import { useGetRawMaterialsQuery } from '../../../store/services/raw.api';
import { BRAND_COLORS, useAppTheme } from '../../../theme/tokens';
import { Alert } from '../../Other/UI/Alert/Alert';
import Create from './__components/Create';
import Edit from './__components/Edit';
import Delete from './__components/Delete';
import Loading from '../../Other/UI/Loadings/Loading';
import EmptyData from '../../Other/UI/NoData/EmptyData';

const PAGE_SIZE = 12;
const UNIT_LABELS = { GRAM: 'g', KG: 'kg', TON: 't' };

export default function Recipe() {
    const [page, setPage] = useState(0);
    const { data: recipeResult, isLoading, error } = useGetAllRecipesQuery({ page, size: PAGE_SIZE });
    const { data: productResult } = useGetProductsQuery({ page: 0, size: 100 });
    const { data: rawResult } = useGetRawMaterialsQuery({ page: 0, size: 100 });
    const { isDark, pageBg, cardBg, cardBorder, textColor, subtitleColor, accentColor } = useAppTheme();
    const recipes = recipeResult?.items || [];
    const pagination = recipeResult?.pagination;
    const totalPages = pagination?.totalPages || 0;
    const products = productResult?.items || [];
    const rawMaterials = rawResult?.items || [];
    const tableBg = isDark ? BRAND_COLORS.darkCardBg : cardBg;
    const tableHeaderBg = isDark ? tableBg : '#F8FAFC';
    const tableBorder = isDark ? cardBorder : '#CBD5E1';

    useEffect(() => {
        if (error) Alert(error?.data?.message || 'Retseptlarni yuklashda xatolik', 'error');
    }, [error]);

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
                <Create products={products} rawMaterials={rawMaterials} />
            </HStack>

            {isLoading ? (
                <Loading />
            ) : error ? (
                <Box p={8} textAlign="center" color={isDark ? 'red.300' : 'red.600'}>Ma&apos;lumotlarni yuklashda xatolik</Box>
            ) : recipes.length === 0 ? (
                <EmptyData
                    text="Hozircha retseptlar yo‘q"
                    description="Yangi retsept qo‘shib mahsulotlar tarkibini belgilang."
                    action={<Create products={products} rawMaterials={rawMaterials} />}
                />
            ) : (
                <>
                    <Box overflowX="auto" bg={tableBg} borderWidth="0.5px" borderColor={tableBorder} borderRadius="10px" boxShadow={isDark ? '0 16px 40px rgba(0, 0, 0, 0.22)' : '0 8px 24px rgba(15, 23, 42, 0.10)'}>
                        <Table.Root size="md" interactive bg={tableBg} borderCollapse="collapse">
                            <Table.Header bg={tableHeaderBg}>
                                <Table.Row bg={tableHeaderBg}>
                                    <Table.ColumnHeader textAlign="center" bg={tableHeaderBg} borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor} w="60px">№</Table.ColumnHeader>
                                    <Table.ColumnHeader bg={tableHeaderBg} borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor}>Mahsulot</Table.ColumnHeader>
                                    <Table.ColumnHeader bg={tableHeaderBg} borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor}>Tarkibi (xom ashyo)</Table.ColumnHeader>
                                    <Table.ColumnHeader textAlign="center" bg={tableHeaderBg} borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor} w="120px">Qatorlar</Table.ColumnHeader>
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
                                        <Table.Cell borderWidth="0.5px" borderColor={tableBorder} textAlign="center" color={subtitleColor}>{page * PAGE_SIZE + index + 1}</Table.Cell>
                                        <Table.Cell borderWidth="0.5px" borderColor={tableBorder}>
                                            <HStack gap={3}>
                                                <Box p={2} borderRadius="lg" bg={isDark ? 'rgba(250, 204, 21, 0.12)' : '#FEF3C7'} color={accentColor}><LuUtensils size={18} /></Box>
                                                <Text as={Link} to={`/recipes/${recipe.productId}`} fontWeight="semibold" color={textColor} _hover={{ color: accentColor }}>{recipe.productName}</Text>
                                            </HStack>
                                        </Table.Cell>
                                        <Table.Cell borderWidth="0.5px" borderColor={tableBorder} maxW="480px">{renderItemsSummary(recipe)}</Table.Cell>
                                        <Table.Cell borderWidth="0.5px" borderColor={tableBorder} textAlign="center">
                                            <HStack gap={1} justify="center" color={subtitleColor}><LuListOrdered size={14} /><span>{recipe.items.length}</span></HStack>
                                        </Table.Cell>
                                        <Table.Cell borderWidth="0.5px" borderColor={tableBorder}>
                                            <HStack justify="center" gap={1}><Edit recipe={recipe} rawMaterials={rawMaterials} /><Delete recipe={recipe} /></HStack>
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table.Root>
                    </Box>
                    {totalPages > 1 && <HStack justify="center" mt={8} gap={3}>
                        <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((value) => value - 1)}><LuChevronLeft /></Button>
                        <Text color={subtitleColor} fontSize="sm">{page + 1} / {totalPages}</Text>
                        <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage((value) => value + 1)}><LuChevronRight /></Button>
                    </HStack>}
                </>
            )}
        </Box>
    );
}
