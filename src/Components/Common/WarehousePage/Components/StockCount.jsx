import PropTypes from 'prop-types';
import { HStack, Text } from '@chakra-ui/react';
import { Layers, Package } from 'lucide-react';
import { useGetProductStocksQuery } from '../../../../store/services/productStock.api';
import { useGetRawMaterialStocksQuery } from '../../../../store/services/rawMaterialStock.api';

// Ombordagi qoldiq turlari sonini ko'rsatadi:
// tovar ombori -> /product-stocks, xom ashyo ombori -> /raw-material-stocks
export default function StockCount({ warehouseId, category }) {
    const isRaw = category === 'RAW_MATERIAL';

    const { data: productData } = useGetProductStocksQuery(
        { warehouseId, page: 0, size: 1 },
        { skip: isRaw }
    );
    const { data: rawData } = useGetRawMaterialStocksQuery(
        { warehouseId, unit: 'KG', page: 0, size: 1 },
        { skip: !isRaw }
    );

    const total = (isRaw ? rawData : productData)?.pagination?.totalElements;
    const Icon = isRaw ? Layers : Package;

    return (
        <HStack>
            <Icon size={14} />
            <Text>
                {total === undefined
                    ? '—'
                    : `${total} xil ${isRaw ? 'xom ashyo' : 'mahsulot'}`}
            </Text>
        </HStack>
    );
}

StockCount.propTypes = {
    warehouseId: PropTypes.string.isRequired,
    category: PropTypes.string,
};
