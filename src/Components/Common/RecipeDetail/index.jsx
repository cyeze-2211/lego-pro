import { useParams } from 'react-router-dom';
import { Badge, Box, HStack, Table, Text } from '@chakra-ui/react';
import { LuCalendar, LuUtensils } from 'react-icons/lu';
import { useGetRecipeByIdQuery } from '../../../store/services/productRecept.api';
import { useGetRawMaterialsQuery } from '../../../store/services/raw.api';
import { useAppTheme } from '../../../theme/tokens';
import Edit from '../Recipe/__components/Edit';
import Delete from '../Recipe/__components/Delete';
import EntityDetail, { DetailRow, DetailSection, formatDetailDate } from '../EntityDetail';
import Loading from '../../Other/UI/Loadings/Loading';
import { formatNumber } from '../../ui/number-format';

const UNIT_LABELS = { GRAM: 'g', KG: 'kg', TON: 't' };

export default function RecipeDetail() {
    const { id } = useParams();
    const { data: recipe, isLoading, isError } = useGetRecipeByIdQuery(id, { skip: !id });
    const { data: rawResult } = useGetRawMaterialsQuery({ page: 0, size: 100 });
    const { isDark, cardBg, cardBorder, textColor, subtitleColor, accentColor } = useAppTheme();
    const rawMaterials = rawResult?.items || [];

    return <EntityDetail title={recipe?.name || 'Retsept'} icon={LuUtensils} backTo="/recipes" backLabel="Retseptlar" loading={isLoading} error={isError || !recipe}>
        {() => <>
            <DetailSection title="Retsept ma’lumotlari" icon={LuUtensils}>
                <DetailRow label="Nomi" value={recipe.name} emphasize />
                <DetailRow label="Yaratilgan" value={formatDetailDate(recipe.createdAt)} />
                <DetailRow label="Yangilangan" value={formatDetailDate(recipe.lastModifiedAt)} />
            </DetailSection>
            <DetailSection title="Tarkibi" icon={LuUtensils} gridColumn={{ base: 'auto', lg: '1 / -1' }}>
                <Box overflowX="auto" borderWidth="1px" borderColor={cardBorder} borderRadius="xl">
                    <Table.Root size="md" bg={cardBg} borderCollapse="collapse">
                        <Table.Header><Table.Row><Table.ColumnHeader color={subtitleColor}>Qadam</Table.ColumnHeader><Table.ColumnHeader color={subtitleColor}>Xom ashyo</Table.ColumnHeader><Table.ColumnHeader textAlign="right" color={subtitleColor}>Miqdor</Table.ColumnHeader></Table.Row></Table.Header>
                        <Table.Body>{recipe.items.map((item) => <Table.Row key={item.itemId || item.stepOrder} _hover={{ bg: isDark ? 'rgba(250,204,21,.06)' : '#FFFBEB' }}><Table.Cell><Badge borderRadius="full" bg={isDark ? 'rgba(250,204,21,.12)' : '#FEF3C7'} color={accentColor}>{item.stepOrder}</Badge></Table.Cell><Table.Cell color={textColor} fontWeight="semibold">{item.rawMaterialName}</Table.Cell><Table.Cell textAlign="right" color={textColor} fontWeight="bold">{formatNumber(item.quantity)} {UNIT_LABELS[item.unit] || item.unit}</Table.Cell></Table.Row>)}</Table.Body>
                    </Table.Root>
                </Box>
                <HStack justify="flex-end" mt={4}><Edit recipe={recipe} rawMaterials={rawMaterials} /><Delete recipe={recipe} /></HStack>
            </DetailSection>
        </>}
    </EntityDetail>;
}
