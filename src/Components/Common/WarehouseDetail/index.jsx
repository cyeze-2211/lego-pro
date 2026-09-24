import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Button, HStack, Table, Text } from '@chakra-ui/react';
import { LuBarcode, LuCalendar, LuChevronLeft, LuChevronRight, LuLayers, LuPackage, LuWarehouse } from 'react-icons/lu';
import { useGetWarehouseByIdQuery } from '../../../store/services/warehouse.api';
import { useGetProductStocksQuery } from '../../../store/services/productStock.api';
import { useGetRawMaterialStocksQuery } from '../../../store/services/rawMaterialStock.api';
import { formatNumber } from '../../ui/number-format';
import EntityDetail, { DetailRow, DetailSection, formatDetailDate } from '../EntityDetail';
import { useAppTheme } from '../../../theme/tokens';

const PAGE_SIZE = 20;
const RAW_UNITS = ['GRAM', 'KG', 'TON'];

const CATEGORY_MAP = {
    PRODUCT: { label: 'Tovar ombori', icon: LuPackage },
    RAW_MATERIAL: { label: 'Xom ashyo ombori', icon: LuLayers },
};

export default function WarehouseDetail() {
    const { id } = useParams();
    const [page, setPage] = useState(0);
    const [unit, setUnit] = useState('KG');
    const { data: warehouse, isLoading, isError } = useGetWarehouseByIdQuery(id, { skip: !id });
    const category = CATEGORY_MAP[warehouse?.category] || { label: warehouse?.category || 'Ombor', icon: LuWarehouse };
    const CategoryIcon = category.icon;
    const isRaw = warehouse?.category === 'RAW_MATERIAL';

    // ombor turiga qarab: mahsulot ombori -> product-stocks, xom ashyo ombori -> raw-material-stocks
    const { data: productStockData, isFetching: productFetching } = useGetProductStocksQuery(
        { warehouseId: id, page, size: PAGE_SIZE },
        { skip: !id || !warehouse || isRaw }
    );
    const { data: rawStockData, isFetching: rawFetching } = useGetRawMaterialStocksQuery(
        { warehouseId: id, unit, page, size: PAGE_SIZE },
        { skip: !id || !warehouse || !isRaw }
    );

    const stockData = isRaw ? rawStockData : productStockData;
    const stocksFetching = isRaw ? rawFetching : productFetching;
    const stocks = stockData?.items ?? [];
    const pagination = stockData?.pagination ?? {};
    const totalPages = pagination.totalPages || 0;
    const totalItems = pagination.totalElements ?? 0;
    const totalQuantity = stocks.reduce((sum, row) => sum + (Number(row.quantity) || 0), 0);

    return <EntityDetail
        title={warehouse?.name || 'Ombor'}
        icon={LuWarehouse}
        backTo="/warehouses"
        backLabel="Omborlar"
        loading={isLoading}
        error={isError || !warehouse}
        accentColorOverride="#2563EB"
        accentSoftBackground="rgba(37, 99, 235, 0.12)"
        accentGradient="linear(to-r, #2563EB, #93C5FD)"
    >
        {({ isDark, textColor, subtitleColor, accentColor, cardBorder, cardBg }) => <>
            <DetailSection title="Ombor ma’lumotlari" icon={LuWarehouse} accentColor={accentColor}>
                <DetailRow label="Nomi" value={warehouse.name} emphasize />
                <DetailRow label="Tavsifi" value={warehouse.summary} />
                <DetailRow label="Turi" value={<span style={{ color: accentColor, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 7 }}><CategoryIcon size={16} />{category.label}</span>} />
                <DetailRow label={isRaw ? 'Xom ashyo turlari' : 'Mahsulot turlari'} value={formatNumber(totalItems)} emphasize />
            </DetailSection>

            <DetailSection title="Tizim ma’lumotlari" icon={LuCalendar} accentColor={accentColor}>
                <DetailRow label="Yaratilgan" value={formatDetailDate(warehouse.createdAt)} />
                <DetailRow label="Yangilangan" value={formatDetailDate(warehouse.lastModifiedAt)} />
            </DetailSection>

            <DetailSection title={isRaw ? 'Ombordagi xom ashyolar' : 'Ombordagi mahsulotlar'} icon={CategoryIcon} accentColor={accentColor} gridColumn={{ base: 'auto', lg: '1 / -1' }}>
                {isRaw && (
                    <HStack gap={1} flexWrap="wrap" mb={1}>
                        <Text color={subtitleColor} fontSize="sm" mr={2}>O‘lchov birligi:</Text>
                        {RAW_UNITS.map((value) => {
                            const isActive = unit === value;
                            return (
                                <Button
                                    key={value}
                                    size="sm"
                                    borderRadius="full"
                                    px={4}
                                    fontWeight="medium"
                                    onClick={() => { setUnit(value); setPage(0); }}
                                    bg={isActive ? accentColor : 'transparent'}
                                    color={isActive ? 'white' : textColor}
                                    borderWidth="1px"
                                    borderColor={isActive ? accentColor : cardBorder}
                                    _hover={{ bg: isActive ? accentColor : (isDark ? 'whiteAlpha.100' : 'gray.50') }}
                                >
                                    {value}
                                </Button>
                            );
                        })}
                    </HStack>
                )}

                {stocksFetching ? (
                    <Text color={subtitleColor} py={6} textAlign="center">Yuklanmoqda...</Text>
                ) : stocks.length === 0 ? (
                    <Text color={subtitleColor} py={6} textAlign="center">Bu omborda hozircha qoldiq yo‘q</Text>
                ) : (
                    <>
                        <Box overflowX="auto" borderWidth="1px" borderColor={cardBorder} borderRadius="xl">
                            <Table.Root size="md" bg={cardBg} borderCollapse="collapse">
                                <Table.Header>
                                    <Table.Row>
                                        <Table.ColumnHeader color={subtitleColor} w="60px" textAlign="center">№</Table.ColumnHeader>
                                        <Table.ColumnHeader color={subtitleColor}>{isRaw ? 'Xom ashyo' : 'Mahsulot'}</Table.ColumnHeader>
                                        <Table.ColumnHeader color={subtitleColor}>{isRaw ? 'Izoh' : 'Shtrix-kod'}</Table.ColumnHeader>
                                        <Table.ColumnHeader color={subtitleColor} textAlign="right">Qoldiq</Table.ColumnHeader>
                                        <Table.ColumnHeader color={subtitleColor}>Yangilangan</Table.ColumnHeader>
                                    </Table.Row>
                                </Table.Header>
                                <Table.Body>
                                    {stocks.map((row, index) => (
                                        <Table.Row key={`${isRaw ? row.rawMaterialId : row.productId}-${row.warehouseId}`} _hover={{ bg: isDark ? 'rgba(37,99,235,.08)' : '#EFF6FF' }}>
                                            <Table.Cell color={subtitleColor} textAlign="center">{page * PAGE_SIZE + index + 1}</Table.Cell>
                                            <Table.Cell color={textColor} fontWeight="semibold">{isRaw ? row.rawMaterialName : row.productName}</Table.Cell>
                                            <Table.Cell color={subtitleColor} maxW="260px">
                                                {isRaw ? (row.rawMaterialSummary || '—') : <HStack gap={2} whiteSpace="nowrap"><LuBarcode size={14} /><span>{row.productBarcode || '—'}</span></HStack>}
                                            </Table.Cell>
                                            <Table.Cell color={textColor} fontWeight="bold" textAlign="right" whiteSpace="nowrap">
                                                {formatNumber(row.quantity)} {isRaw ? (row.unit || unit) : 'dona'}
                                            </Table.Cell>
                                            <Table.Cell color={subtitleColor} whiteSpace="nowrap">{formatDetailDate(row.lastModifiedAt)}</Table.Cell>
                                        </Table.Row>
                                    ))}
                                </Table.Body>
                            </Table.Root>
                        </Box>
                        <HStack justify="space-between" mt={4} flexWrap="wrap" gap={3}>
                            <Text color={subtitleColor} fontSize="sm">
                                Jami {formatNumber(totalItems)} tur · shu sahifada {formatNumber(totalQuantity)} {isRaw ? unit : 'dona'}
                            </Text>
                            {totalPages > 1 && <HStack gap={3}>
                                <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((value) => value - 1)}><LuChevronLeft /></Button>
                                <Text color={subtitleColor} fontSize="sm">{page + 1} / {totalPages}</Text>
                                <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage((value) => value + 1)}><LuChevronRight /></Button>
                            </HStack>}
                        </HStack>
                    </>
                )}
            </DetailSection>
        </>}
    </EntityDetail>;
}