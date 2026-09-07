import { useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { Badge, Box, HStack, Table, Text, VStack } from '@chakra-ui/react';
import { LuBarcode, LuCalendar, LuPackage, LuWarehouse } from 'react-icons/lu';
import { useGetProductByIdQuery } from '../../../store/services/product.api';
import { useGetWarehousesQuery } from '../../../store/services/warehouse.api';
import { useGetProductRecipeQuery } from '../../../store/services/productRecept.api';
import { useGetRawMaterialsQuery } from '../../../store/services/raw.api';
import { useAppTheme } from '../../../theme/tokens';
import { Alert } from '../../Other/UI/Alert/Alert';
import RecipeCreate from '../Recipe/__components/RecipeCreate';
import RecipeEdit from '../Recipe/__components/Edit';
import RecipeDelete from '../Recipe/__components/Delete';
import EntityDetail, { DetailRow, DetailSection, formatDetailDate } from '../EntityDetail';
import Loading from '../../Other/UI/Loadings/Loading';
import { formatNumber } from '../../ui/number-format';

const UNIT_LABELS = { GRAM: 'g', KG: 'kg', TON: 't' };

export default function ProductDetail() {
    const { id } = useParams();
    const { pathname } = useLocation();
    const isRecipeRoute = pathname.startsWith('/recipes/');
    const { data: product, isLoading, isError, error } = useGetProductByIdQuery(id, { skip: !id });
    const { data: recipe, error: recipeError, isLoading: recipeLoading } = useGetProductRecipeQuery(id, { skip: !id });
    const { data: warehouses = [] } = useGetWarehousesQuery('PRODUCT');
    const { data: rawResult } = useGetRawMaterialsQuery({ page: 0, size: 100 });
    const { isDark, cardBg, cardBorder, textColor, subtitleColor, accentColor } = useAppTheme();
    const rawMaterials = rawResult?.items || [];
    const warehouse = warehouses.find((item) => item.id === product?.warehouseId);
    const recipeNotFound = recipeError?.status === 404;

    useEffect(() => {
        if (error) Alert(error?.data?.message || 'Mahsulotni yuklashda xatolik', 'error');
    }, [error]);

    return <EntityDetail title={product?.name || 'Mahsulot'} icon={LuPackage} backTo={isRecipeRoute ? '/recipes' : '/products'} backLabel={isRecipeRoute ? 'Retseptlar' : 'Mahsulotlar'} loading={isLoading} error={isError || !product}>
        {() => <>
            <DetailSection title="Mahsulot ma’lumotlari" icon={LuPackage}>
                <DetailRow label="Narxi" value={`${formatNumber(product.price)} so‘m`} emphasize />
                <DetailRow label="Shtrix-kod" value={<HStack gap={2}><LuBarcode size={16} /><span>{product.barcode || '—'}</span></HStack>} />
                <DetailRow label="Ombor" value={<HStack gap={2}><LuWarehouse size={16} /><span>{warehouse?.name || '—'}</span></HStack>} />
                <DetailRow label="Holati" value={<Badge borderRadius="full" px={3} py={1} colorScheme={product.deletedAt ? 'red' : 'green'}>{product.deletedAt ? 'O‘chirilgan' : 'Faol'}</Badge>} />
            </DetailSection>
            <DetailSection title="Tizim ma’lumotlari" icon={LuCalendar}>
                <DetailRow label="Yaratilgan" value={formatDetailDate(product.createdAt)} />
                <DetailRow label="Yangilangan" value={formatDetailDate(product.lastModifiedAt)} />
                {product.deletedAt && <DetailRow label="O‘chirilgan" value={formatDetailDate(product.deletedAt)} />}
            </DetailSection>
            <DetailSection title="Retsept tarkibi" icon={LuPackage} gridColumn={{ base: 'auto', lg: '1 / -1' }}>
                {recipeLoading ? <Loading /> : recipe ? <Box overflowX="auto" borderWidth="1px" borderColor={cardBorder} borderRadius="xl"><Table.Root size="md" bg={cardBg} borderCollapse="collapse"><Table.Header><Table.Row><Table.ColumnHeader color={subtitleColor}>Qadam</Table.ColumnHeader><Table.ColumnHeader color={subtitleColor}>Xom ashyo</Table.ColumnHeader><Table.ColumnHeader textAlign="right" color={subtitleColor}>Miqdor</Table.ColumnHeader></Table.Row></Table.Header><Table.Body>{recipe.items.map((item) => <Table.Row key={item.itemId} _hover={{ bg: isDark ? 'rgba(250,204,21,.06)' : '#FFFBEB' }}><Table.Cell><Badge borderRadius="full" bg={isDark ? 'rgba(250,204,21,.12)' : '#FEF3C7'} color={accentColor}>{item.stepOrder}</Badge></Table.Cell><Table.Cell color={textColor} fontWeight="semibold">{item.rawMaterialName}</Table.Cell><Table.Cell textAlign="right" color={textColor} fontWeight="bold">{formatNumber(item.quantity)} {UNIT_LABELS[item.unit] || item.unit}</Table.Cell></Table.Row>)}</Table.Body></Table.Root></Box> : recipeNotFound ? <VStack py={5} gap={3}><Text color={subtitleColor}>Bu mahsulot uchun retsept mavjud emas.</Text><RecipeCreate productId={product.id} rawMaterials={rawMaterials} /></VStack> : <Text color={subtitleColor}>Retseptni yuklashda xatolik.</Text>}
                {recipe && <HStack justify="flex-end" mt={4}><RecipeEdit recipe={recipe} rawMaterials={rawMaterials} /><RecipeDelete recipe={recipe} /></HStack>}
            </DetailSection>
        </>}
    </EntityDetail>;
}
