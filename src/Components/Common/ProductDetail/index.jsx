import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Badge, HStack } from '@chakra-ui/react';
import { LuBarcode, LuCalendar, LuPackage, LuWarehouse } from 'react-icons/lu';
import { useGetProductByIdQuery } from '../../../store/services/product.api';
import { useGetWarehousesQuery } from '../../../store/services/warehouse.api';
import { Alert } from '../../Other/UI/Alert/Alert';
import EntityDetail, { DetailRow, DetailSection, formatDetailDate } from '../EntityDetail';
import { formatNumber } from '../../ui/number-format';

export default function ProductDetail() {
    const { id } = useParams();
    const { data: product, isLoading, isError, error } = useGetProductByIdQuery(id, { skip: !id });
    const { data: warehouses = [] } = useGetWarehousesQuery('PRODUCT');
    const warehouse = warehouses.find((item) => item.id === product?.warehouseId);

    useEffect(() => {
        if (error) Alert(error?.data?.message || 'Mahsulotni yuklashda xatolik', 'error');
    }, [error]);

    return <EntityDetail title={product?.name || 'Mahsulot'} icon={LuPackage} backTo="/products" backLabel="Mahsulotlar" loading={isLoading} error={isError || !product}>
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
        </>}
    </EntityDetail>;
}
