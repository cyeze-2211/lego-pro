import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Badge, Box, HStack, Table, Text } from '@chakra-ui/react';
import { LuCalendar, LuListOrdered, LuPackage, LuUtensils } from 'react-icons/lu';
import { useGetRecipeByIdQuery } from '../../../store/services/productRecept.api';
import { useGetRawMaterialsQuery } from '../../../store/services/raw.api';
import { useAppTheme } from '../../../theme/tokens';
import { Alert } from '../../Other/UI/Alert/Alert';
import RecipeEdit from '../Recipe/__components/Edit';
import RecipeDelete from '../Recipe/__components/Delete';
import EntityDetail, { DetailRow, DetailSection, formatDetailDate } from '../EntityDetail';
import { formatNumber } from '../../ui/number-format';

const UNIT_LABELS = { GRAM: 'g', KG: 'kg', TON: 't' };

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

export default function RecipeDetail() {
    const { id } = useParams();
    const { data: recipe, isLoading, isError, error } = useGetRecipeByIdQuery(id, { skip: !id });
    const { data: rawResult } = useGetRawMaterialsQuery({ page: 0, size: 100 });
    const { isDark, cardBg, cardBorder, textColor, subtitleColor, accentColor } = useAppTheme();
    const rawMaterials = rawResult?.items || [];

    useEffect(() => {
        if (error) Alert(error?.data?.message || 'Retseptni yuklashda xatolik', 'error');
    }, [error]);

    return (
        <EntityDetail
            title={recipe?.name || 'Retsept'}
            icon={LuUtensils}
            backTo="/recipes"
            backLabel="Retseptlar"
            loading={isLoading}
            error={isError || !recipe}
        >
            {() => (
                <>
                    <DetailSection title="Retsept ma'lumotlari" icon={LuUtensils}>
                        <DetailRow label="Nomi" value={recipe.name} emphasize />
                        <DetailRow
                            label="Qadamlar soni"
                            value={
                                <HStack gap={2}>
                                    <LuListOrdered size={16} />
                                    <span>{recipe.items?.length ?? 0}</span>
                                </HStack>
                            }
                        />
                    </DetailSection>

                    <DetailSection title="Tizim ma'lumotlari" icon={LuCalendar}>
                        <DetailRow label="Yaratilgan" value={formatDetailDate(recipe.createdAt)} />
                        <DetailRow label="Yangilangan" value={formatDetailDate(recipe.lastModifiedAt)} />
                    </DetailSection>

                    <DetailSection
                        title="Retsept tarkibi"
                        icon={LuPackage}
                        gridColumn={{ base: 'auto', lg: '1 / -1' }}
                    >
                        {recipe.items?.length ? (
                            <>
                                <Box
                                    overflowX="auto"
                                    borderWidth="1px"
                                    borderColor={cardBorder}
                                    borderRadius="xl"
                                >
                                    <Table.Root size="md" bg={cardBg} borderCollapse="collapse">
                                        <Table.Header>
                                            <Table.Row>
                                                <Table.ColumnHeader color={subtitleColor}>
                                                    Qadam
                                                </Table.ColumnHeader>
                                                <Table.ColumnHeader color={subtitleColor}>
                                                    Xom ashyo
                                                </Table.ColumnHeader>
                                                <Table.ColumnHeader textAlign="right" color={subtitleColor}>
                                                    Miqdor
                                                </Table.ColumnHeader>
                                            </Table.Row>
                                        </Table.Header>
                                        <Table.Body>
                                            {recipe.items.map((item) => (
                                                <Table.Row
                                                    key={item.itemId}
                                                    _hover={{
                                                        bg: isDark ? 'rgba(250,204,21,.06)' : '#FFFBEB',
                                                    }}
                                                >
                                                    <Table.Cell>
                                                        <Badge
                                                            borderRadius="full"
                                                            bg={
                                                                isDark
                                                                    ? 'rgba(250,204,21,.12)'
                                                                    : '#FEF3C7'
                                                            }
                                                            color={accentColor}
                                                        >
                                                            {item.stepOrder}
                                                        </Badge>
                                                    </Table.Cell>
                                                    <Table.Cell color={textColor} fontWeight="semibold">
                                                        {item.rawMaterialName}
                                                    </Table.Cell>
                                                    <Table.Cell
                                                        textAlign="right"
                                                        color={textColor}
                                                        fontWeight="bold"
                                                    >
                                                        {formatNumber(item.quantity)}{' '}
                                                        {UNIT_LABELS[item.unit] || item.unit}
                                                    </Table.Cell>
                                                </Table.Row>
                                            ))}
                                        </Table.Body>
                                    </Table.Root>
                                </Box>

                                {/* Umumiy hajm */}
                                <Box
                                    mt={4}
                                    p={4}
                                    borderRadius="xl"
                                    bg={isDark ? 'rgba(250,204,21,.08)' : '#FEF3C7'}
                                    borderWidth="1px"
                                    borderColor={isDark ? 'rgba(250,204,21,.2)' : '#FDE68A'}
                                >
                                    <HStack justify="space-between" align="center">
                                        <Text fontSize="sm" fontWeight="semibold" color={subtitleColor}>
                                            Umumiy hajm:
                                        </Text>
                                        <Text fontSize="2xl" fontWeight="bold" color={accentColor}>
                                            {calculateTotalQuantity(recipe.items)}
                                        </Text>
                                    </HStack>
                                </Box>
                            </>
                        ) : (
                            <Text color={subtitleColor}>Bu retseptda hozircha qatorlar yo&apos;q.</Text>
                        )}

                        <HStack justify="flex-end" mt={4}>
                            <RecipeEdit recipe={recipe} rawMaterials={rawMaterials} />
                            <RecipeDelete recipe={recipe} />
                        </HStack>
                    </DetailSection>
                </>
            )}
        </EntityDetail>
    );
}
